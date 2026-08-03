import dayjs from 'dayjs';
import type { Inverter, JunctionBox, PerformancePoint, StringUnit } from '@/interface/equipment';
import type { OperationStatus, RtuStatus } from '@/interface/status';
import { FAULT_BY_STATUS } from './faultCodes';
import { REGION_TOTAL } from './regions';
import { SCHOOLS } from './schools';
import { countOperation, deriveOperation, isAbnormal, isProducing, OPERATION_RANK } from './status';
import { createRandom, hashSeed, pickNumber } from './random';

export { FAULT_CODES, FAULT_LABELS, getFaultCode } from './faultCodes';

/**
 * 부모 설비 아래 형제 단위(스트링 또는 채널)를 만든다.
 * 부모가 정상이 아니면 그 아래 첫 단위가 원인인 것으로 본다.
 */
function buildUnits(
  next: () => number,
  parentId: string,
  prefix: string,
  namePrefix: string,
  count: number,
  parentStatus: OperationStatus,
  parentCapacityKw: number,
): StringUnit[] {
  const share = Math.round((parentCapacityKw / count) * 10) / 10;

  return Array.from({ length: count }, (_, index) => {
    const roll = next();
    const status: OperationStatus = !isProducing(parentStatus)
      ? parentStatus
      : isAbnormal(parentStatus) && index === 0
        ? parentStatus
        : roll > 0.93
          ? 'degraded'
          : 'running';

    return {
      id: `${parentId}-${prefix}-${index + 1}`,
      name: `${namePrefix} ${index + 1}`,
      status,
      capacityKw: share,
      relativeOutput: !isProducing(status)
        ? 0
        : status === 'running'
          ? pickNumber(next, 0.94, 1.02, 3)
          : pickNumber(next, 0.62, 0.88, 3),
    };
  });
}

/** 센트럴형 인버터 아래 접속반과 그 채널 */
function buildJunctionBoxes(
  next: () => number,
  inverterId: string,
  count: number,
  parentStatus: OperationStatus,
  parentCapacityKw: number,
): JunctionBox[] {
  const share = Math.round((parentCapacityKw / count) * 10) / 10;

  return Array.from({ length: count }, (_, index) => {
    const status: OperationStatus = !isProducing(parentStatus)
      ? parentStatus
      : isAbnormal(parentStatus) && index === 0
        ? parentStatus
        : next() > 0.9
          ? 'degraded'
          : 'running';
    const id = `${inverterId}-jb-${index + 1}`;

    return {
      id,
      name: `접속반 ${String.fromCharCode(65 + index)}`,
      status,
      capacityKw: share,
      channels: buildUnits(next, id, 'ch', 'CH', 2 + Math.floor(next() * 3), status, share),
    };
  });
}

function buildInverters(): Inverter[] {
  const inverters: Inverter[] = [];

  SCHOOLS.forEach((school) => {
    const next = createRandom(hashSeed(school.id));

    for (let index = 0; index < school.inverterCount; index += 1) {
      const id = `${school.id}-inv-${index + 1}`;
      // 발전소 상태는 인버터 한 대에서 비롯된 것으로 본다. 첫 번째 인버터가 그 상태를 물려받는다.
      // 통신단절는 설비 고장이 아니라 수집장치 쪽 문제라, 상태를 물려받지 않고 RTU 축으로 넘긴다.
      const inheritsFault = index === 0 && school.status !== 'commLost';
      const ownStatus: OperationStatus = inheritsFault
        ? school.status
        : next() > 0.92
          ? 'degraded'
          : 'running';
      const rtuStatus: RtuStatus = index === 0 && school.status === 'commLost'
        ? 'disconnected'
        : next() > 0.94
          ? 'abnormal'
          : 'normal';
      const status = deriveOperation(ownStatus, rtuStatus);

      const candidates = FAULT_BY_STATUS[status];
      const faultCode = candidates.length > 0 ? candidates[Math.floor(next() * candidates.length) % candidates.length] : null;
      const capacityKw = Math.round((school.capacityKw / school.inverterCount) * 10) / 10;
      const healthFactor = !isProducing(status)
        ? 0
        : status === 'running'
          ? pickNumber(next, 0.82, 0.94, 3)
          : pickNumber(next, 0.58, 0.79, 3);
      // 하루 발전시간은 건전도에 비례한다 — 맑은 날 정상 설비가 4시간 안팎이 되도록 잡았다.
      const todayHours = Math.round(healthFactor * 4.6 * 10) / 10;
      // 셋 중 하나쯤은 접속반을 거쳐 채널이 물리는 센트럴형으로 둔다.
      // 용량으로 가르면 목업 분포상 한쪽으로 쏠려 계층이 한 종류만 나온다.
      const type: Inverter['type'] = next() > 0.68 ? 'central' : 'string';

      inverters.push({
        id,
        schoolId: school.id,
        name: `인버터 #${index + 1}`,
        type,
        capacityKw,
        status,
        ownStatus,
        rtuStatus,
        faultCode,
        healthFactor,
        cf: !isProducing(status) ? 0 : pickNumber(next, 0.108, 0.176, 4),
        todayKwh: !isProducing(status) ? 0 : Math.round((school.todayKwh / school.inverterCount) * 10) / 10,
        temperature: faultCode === 'F-201' ? pickNumber(next, 64, 72, 1) : pickNumber(next, 38, 56, 1),
        hoursTrend: Array.from(
          { length: 7 },
          (_, day) => Math.round((todayHours + (day - 6) * 0.04 + pickNumber(next, -0.1, 0.1, 2)) * 10) / 10,
        ),
        strings: type === 'string'
          ? buildUnits(next, id, 'str', 'String', 2 + Math.floor(next() * 3), status, capacityKw)
          : [],
        junctionBoxes: type === 'central'
          ? buildJunctionBoxes(next, id, 2 + Math.floor(next() * 2), status, capacityKw)
          : [],
      });
    }
  });

  return inverters;
}

export const INVERTERS: Inverter[] = buildInverters();

const INVERTERS_BY_SCHOOL = INVERTERS.reduce<Record<string, Inverter[]>>((acc, inverter) => {
  (acc[inverter.schoolId] ??= []).push(inverter);

  return acc;
}, {});

const INVERTER_BY_ID = new Map(INVERTERS.map((inverter) => [inverter.id, inverter]));

export function getInverterById(id: string | null): Inverter | null {
  return id ? (INVERTER_BY_ID.get(id) ?? null) : null;
}

/** 발전소에 달린 인버터 전부 */
export function getInvertersOf(schoolId: string): Inverter[] {
  return INVERTERS_BY_SCHOOL[schoolId] ?? [];
}

/** 발전소를 지정하면 그 발전소 인버터만, 지정하지 않으면 이상이 있는 인버터를 앞세워 돌려준다. */
export function getInverters(schoolId: string | null, limit = 12): Inverter[] {
  if (schoolId) return INVERTERS_BY_SCHOOL[schoolId] ?? [];

  return [...INVERTERS].sort((a, b) => OPERATION_RANK[a.status] - OPERATION_RANK[b.status] || b.capacityKw - a.capacityKw).slice(0, limit);
}

export function countInverterStatus(inverters: Inverter[]): Record<OperationStatus, number> {
  return countOperation(inverters);
}

/** 수집장치 연계 상태 집계 (SFR-017-01) */
export function countRtuStatus(inverters: Inverter[]): Record<RtuStatus, number> {
  return inverters.reduce<Record<RtuStatus, number>>(
    (acc, inverter) => ({ ...acc, [inverter.rtuStatus]: acc[inverter.rtuStatus] + 1 }),
    { normal: 0, abnormal: 0, disconnected: 0 },
  );
}

/**
 * 진단 효율 = 실측 DC 전력 / 모델 예측 DC 전력.
 * 발전량은 날씨에 따라 크게 흔들려 추이 판단이 어려워, 진단에서는 이 값을 본다.
 */
export const DIAG_EFFICIENCY_WARN = 85;
export const DIAG_EFFICIENCY_CRITICAL = 50;

/** 설비 하나의 최근 진단 효율 추이(%) */
export function getDiagEfficiencySeries(id: string, status: OperationStatus, days = 7): number[] {
  const next = createRandom(hashSeed(`${id}-diag`));
  const base = status === 'fault' ? 44 : status === 'degraded' ? 74 : 94;

  return Array.from({ length: days }, (_, index) => {
    // 준비중·통신단절는 계측값 자체가 없다.
    if (!isProducing(status)) return 0;

    // 이상 설비는 뒤로 갈수록 더 떨어진다. 정상 설비는 잔잔하게 오간다.
    const drift = status === 'running' ? 0 : -(days - 1 - index) * 0.6;

    return Math.max(0, Math.min(100, Math.round((base - drift + pickNumber(next, -3.5, 3.5, 1)) * 10) / 10));
  });
}

/**
 * 진단 판정 대상. 인버터 타입에 따라 최말단이 다르다.
 * - 스트링형: 스트링까지
 * - 센트럴형: 접속반까지 (채널은 계측값 조회용이라 판정 대상이 아니다)
 */
export function getDiagnosisUnits(inverter: Inverter): { id: string; name: string; status: OperationStatus; capacityKw: number }[] {
  return inverter.type === 'central'
    ? inverter.junctionBoxes.map(({ id, name, status, capacityKw }) => ({ id, name, status, capacityKw }))
    : inverter.strings.map(({ id, name, status, capacityKw }) => ({ id, name, status, capacityKw }));
}

/** 인버터 타입 표기 */
export const INVERTER_TYPE_LABEL: Record<Inverter['type'], string> = {
  string: '스트링형',
  central: '센트럴형',
};

/** 인버터 아래 최말단 단위(스트링 또는 접속반 채널)를 모두 모은다. */
export function leafUnitsOf(inverter: Inverter): StringUnit[] {
  return inverter.type === 'central'
    ? inverter.junctionBoxes.flatMap((box) => box.channels)
    : inverter.strings;
}

export function countStringStatus(inverters: Inverter[]): Record<OperationStatus, number> {
  return countOperation(inverters.flatMap(leafUnitsOf));
}

const performanceCache = new Map<string, PerformancePoint[]>();

/** 상태가 나쁜 설비는 건전도 기준선 자체가 낮다. */
const BASE_HEALTH: Record<OperationStatus, number> = {
  running: 0.87,
  ready: 0.05,
  degraded: 0.78,
  fault: 0.68,
  commLost: 0.2,
};

/**
 * 기간 안의 일자별 성능 지표.
 * 발전시간은 설비용량으로 나눈 값이라, 용량이 다른 설비를 그대로 견줄 수 있다.
 */
export function getPerformanceSeries(schoolId: string | null, start: Date, end: Date): PerformancePoint[] {
  const key = `${schoolId ?? 'all'}-${dayjs(start).format('YYYYMMDD')}-${dayjs(end).format('YYYYMMDD')}`;
  const cached = performanceCache.get(key);

  if (cached) return cached;

  const school = schoolId ? SCHOOLS.find((item) => item.id === schoolId) : null;
  const next = createRandom(hashSeed(key));
  const capacityKw = school ? school.capacityKw : REGION_TOTAL.capacityKw;
  const days = Math.max(1, dayjs(end).diff(dayjs(start), 'day') + 1);
  const baseFactor = school ? BASE_HEALTH[school.status] : BASE_HEALTH.running;

  const points = Array.from({ length: days }, (_, index) => {
    const date = dayjs(start).add(index, 'day');
    const weather = pickNumber(next, 0.55, 1.05, 3);
    // 설비가 얼마나 성한지 — 실측 발전량을 만들 때만 쓰고 밖으로 내보내지 않는다.
    const factor = Math.min(0.98, Math.max(0.05, baseFactor + pickNumber(next, -0.07, 0.05, 3)));
    const expectedKwh = Math.round(capacityKw * 4.2 * weather);
    const actualKwh = Math.round(expectedKwh * factor);

    return {
      date: date.format('YYYY-MM-DD'),
      hours: capacityKw > 0 ? Math.round((actualKwh / capacityKw) * 100) / 100 : 0,
      cf: Math.min(0.24, Math.max(0.01, factor * pickNumber(next, 0.15, 0.2, 4))),
      actualKwh,
      expectedKwh,
    };
  });

  performanceCache.set(key, points);

  return points;
}

export function averagePerformance(points: PerformancePoint[]) {
  if (points.length === 0) return { hours: 0, cf: 0, actualKwh: 0, expectedKwh: 0 };

  return points.reduce(
    (acc, point, index) => {
      const count = index + 1;

      return {
        hours: acc.hours + (point.hours - acc.hours) / count,
        cf: acc.cf + (point.cf - acc.cf) / count,
        actualKwh: acc.actualKwh + point.actualKwh,
        expectedKwh: acc.expectedKwh + point.expectedKwh,
      };
    },
    { hours: 0, cf: 0, actualKwh: 0, expectedKwh: 0 },
  );
}
