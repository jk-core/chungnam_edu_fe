import dayjs from 'dayjs';
import type { Channel, ChannelKey, CollectionStatus, RawPoint } from '@/interface/collection';
import { REGION_TOTAL } from './regions';
import { SCHOOLS } from './schools';
import { isProducing } from './status';
import { createRandom, hashSeed, pickNumber } from './random';

/** 수집 주기 — 하루 96건 */
export const INTERVAL_MINUTES = 15;
export const POINTS_PER_DAY = (24 * 60) / INTERVAL_MINUTES;

/**
 * 수집률을 재는 두 기준. 성격이 달라 값도 다르다 — 한곳에 모아 두어 화면마다 갈리지 않게 한다.
 *
 * - 운영 목표: 하루하루 수집이 제대로 도는지 보는 선. 이 위를 '정상' 으로 본다.
 * - 검수 기준: 사업 종료시점에 맞춰야 하는 연동률 (ECR-007-03).
 *   품질 기준(`QUALITY_THRESHOLD`)과 같은 값이라, 이 아래는 AI 학습에서도 빠진다.
 */
export const COLLECT_RATE_TARGET = 0.99;
export const LINK_RATE_TARGET = 0.95;

export const CHANNELS: Channel[] = [
  { key: 'power', label: '발전전력', unit: 'kW', color: 'var(--chart-generation)' },
  { key: 'irradiance', label: '일사량', unit: 'W/m²', color: 'var(--chart-irradiance)' },
  { key: 'dcVoltage', label: '직류전압', unit: 'V', color: 'var(--ok)', normalRange: [520, 780] },
  { key: 'dcCurrent', label: '직류전류', unit: 'A', color: 'var(--caution)' },
  { key: 'moduleTemp', label: '모듈온도', unit: '℃', color: 'var(--critical)', normalRange: [-10, 70] },
  { key: 'acVoltage', label: '계통전압', unit: 'V', color: 'var(--text-muted)', normalRange: [370, 390] },
];

export const CHANNEL_BY_KEY = new Map(CHANNELS.map((channel) => [channel.key, channel]));

const SUNRISE = 5.5;
const SUNSET = 19.6;

/** 정오를 정점으로 하는 일사 곡선(0~1) */
function daylightRatio(hour: number): number {
  if (hour <= SUNRISE || hour >= SUNSET) return 0;

  return Math.max(0, Math.exp(-(((hour - 12.7) / 3.35) ** 2)));
}

const rawCache = new Map<string, RawPoint[]>();

/**
 * 선택한 발전소(없으면 도 전체 합계)의 하루치 15분 주기 계측값.
 * 통신이 끊긴 설비는 오전 한때가 통째로 비고, 그 밖에도 드문 결측을 섞는다.
 */
export function getRawSeries(schoolId: string | null, date: Date): RawPoint[] {
  const key = `${schoolId ?? 'all'}-${dayjs(date).format('YYYY-MM-DD')}`;
  const cached = rawCache.get(key);

  if (cached) return cached;

  const school = schoolId ? SCHOOLS.find((item) => item.id === schoolId) : null;
  const capacityKw = school ? school.capacityKw : REGION_TOTAL.capacityKw;
  const next = createRandom(hashSeed(key));
  // 통신단절 설비는 이 구간 값이 아예 들어오지 않는다.
  const isDown = school?.status === 'commLost' || school?.status === 'ready';
  const outageStart = isDown ? 16 : school?.status === 'fault' ? 40 : -1;
  const outageEnd = outageStart >= 0 ? outageStart + (isDown ? 96 : 10) : -1;

  const points = Array.from({ length: POINTS_PER_DAY }, (_, index) => {
    const hour = (index * INTERVAL_MINUTES) / 60;
    const time = `${String(Math.floor(hour)).padStart(2, '0')}:${String((index * INTERVAL_MINUTES) % 60).padStart(2, '0')}`;
    const isOutage = index >= outageStart && index < outageEnd;
    // 드물게 한 건씩 빠지는 통신 오류
    const isDropout = !isOutage && next() > 0.985;

    if (isOutage || isDropout) {
      return {
        time,
        values: { power: null, irradiance: null, dcVoltage: null, dcCurrent: null, moduleTemp: null, acVoltage: null },
      };
    }

    const bell = daylightRatio(hour);
    const cloud = hour > 14 && hour < 17 ? pickNumber(next, 0.6, 0.85, 3) : pickNumber(next, 0.9, 1, 3);
    const irradiance = Math.round(bell * cloud * 980);
    const power = Math.round(capacityKw * bell * cloud * 0.86 * 10) / 10;
    const dcVoltage = bell > 0 ? pickNumber(next, 596, 712, 1) : 0;
    const moduleTemp = Math.round((12 + irradiance * 0.028 + pickNumber(next, -1.5, 2.5, 1)) * 10) / 10;

    return {
      time,
      values: {
        power,
        irradiance,
        dcVoltage,
        dcCurrent: dcVoltage > 0 ? Math.round(((power * 1000) / dcVoltage) * 10) / 10 : 0,
        moduleTemp,
        acVoltage: pickNumber(next, 375.4, 384.6, 1),
      },
    };
  });

  rawCache.set(key, points);

  return points;
}

/** 채널 하나만 뽑아 [시각, 값] 배열로 만든다. 차트에 그대로 넣는다. */
export function toChannelSeries(points: RawPoint[], channel: ChannelKey): (number | null)[] {
  return points.map((point) => point.values[channel]);
}

/** 여러 설비를 합쳐야 커지는 채널. 인버터 한 대로 좁히면 이 값들만 몫만큼 줄어든다. */
const ADDITIVE_CHANNELS: ChannelKey[] = ['power', 'dcCurrent'];

/**
 * 발전소 계측값을 인버터 한 대 몫으로 줄인다.
 * 전압·온도·일사량은 여러 대를 합친다고 커지는 값이 아니므로 그대로 둔다.
 */
export function scaleToInverter(points: RawPoint[], share: number): RawPoint[] {
  return points.map((point) => ({
    time: point.time,
    values: Object.fromEntries(
      (Object.keys(point.values) as ChannelKey[]).map((key) => {
        const value = point.values[key];

        if (value === null || !ADDITIVE_CHANNELS.includes(key)) return [key, value];

        return [key, Math.round(value * share * 10) / 10];
      }),
    ) as RawPoint['values'],
  }));
}

const statusCache = new Map<string, CollectionStatus[]>();

/** 설비별 수집 현황. 상태가 나쁜 설비일수록 수집률이 떨어진다. */
export function getCollectionStatus(date: Date): CollectionStatus[] {
  const key = dayjs(date).format('YYYY-MM-DD');
  const cached = statusCache.get(key);

  if (cached) return cached;

  const rows = SCHOOLS.map((school) => {
    const next = createRandom(hashSeed(`${school.id}-${key}`));
    const isDown = !isProducing(school.status);
    const missing = isDown
      ? POINTS_PER_DAY
      : school.status === 'fault'
        ? Math.round(pickNumber(next, 8, 26))
        : school.status === 'degraded'
          ? Math.round(pickNumber(next, 1, 7))
          : Math.round(pickNumber(next, 0, 2));
    const lastIndex = POINTS_PER_DAY - 1 - (isDown ? Math.round(pickNumber(next, 40, 70)) : 0);
    const lastHour = Math.floor((lastIndex * INTERVAL_MINUTES) / 60);

    return {
      schoolId: school.id,
      schoolName: school.name,
      regionName: school.regionName,
      rate: (POINTS_PER_DAY - missing) / POINTS_PER_DAY,
      missing,
      expected: POINTS_PER_DAY,
      lastCollectedAt: `${key} ${String(lastHour).padStart(2, '0')}:${String((lastIndex * INTERVAL_MINUTES) % 60).padStart(2, '0')}`,
      delayMinutes: isDown ? Math.round(pickNumber(next, 600, 1080)) : Math.round(pickNumber(next, 0, 18)),
    };
  }).sort((a, b) => a.rate - b.rate);

  statusCache.set(key, rows);

  return rows;
}
