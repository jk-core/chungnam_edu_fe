import dayjs from 'dayjs';
import type { Inverter } from '@/interface/equipment';
import type { OperationRaw, RawDataState } from '@/interface/operation';
import { getRtuOf } from './rtu';
import { isProducing } from './status';
import { SUNRISE_HOUR, SUNSET_HOUR } from './generation';
import { createRandom, hashSeed, pickNumber } from './random';

/** 계통 정격 — 단상 220V, 삼상 380V */
const PHASE_VOLT = { single: 220, three: 380 } as const;

const cache = new Map<string, OperationRaw[]>();

/**
 * 인버터 한 대의 하루치 원시 계측 (SFR-010-03 / SFR-009-04).
 * 수집주기는 그 발전소 RTU를 따르고, 해 뜨기 전후로는 값이 0 이 된다.
 * 통신이 끊긴 설비는 줄 자체가 결측으로 남아 "0 발전"과 구분된다.
 */
export function getOperationRaw(inverter: Inverter, date: Date): OperationRaw[] {
  const key = `${inverter.id}-${dayjs(date).format('YYYYMMDD')}`;
  const cached = cache.get(key);

  if (cached) return cached;

  const next = createRandom(hashSeed(key));
  const interval = getRtuOf(inverter.schoolId)?.intervalMinutes ?? 5;
  const start = dayjs(date).startOf('day');
  const count = Math.floor((24 * 60) / interval);
  const live = isProducing(inverter.status);
  const nominalVolt = PHASE_VOLT[inverter.phase];
  const threePhase = inverter.phase === 'three';

  // 누적값은 하루 내내 늘기만 한다 — 시작점을 설비 규모에 맞춰 잡는다.
  let accumWh = Math.round(inverter.capacityKw * 1000 * pickNumber(next, 3800, 4600));

  const rows = Array.from({ length: count }, (_, index) => {
    const at = start.add(index * interval, 'minute');
    const hour = at.hour() + at.minute() / 60;
    const daylight = hour > SUNRISE_HOUR && hour < SUNSET_HOUR;
    // 해가 뜬 동안은 종 모양으로 오르내린다.
    const bell = daylight
      ? Math.sin(((hour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR)) * Math.PI)
      : 0;

    const state: RawDataState = !live
      ? 'missing'
      : next() > 0.995
        ? 'abnormal'
        : 'normal';

    if (state === 'missing') {
      return {
        at: at.format('YYYY-MM-DD HH:mm:ss'),
        state,
        accumWh,
        irradiance: null,
        moduleTemp: null,
        inverterTemp: null,
        dcVolt: null,
        dcAmp: null,
        dcWatt: null,
        acVolt: null,
        acAmp: null,
        acVoltR: null,
        acVoltS: null,
        acVoltT: null,
        acAmpR: null,
        acAmpS: null,
        acAmpT: null,
        acWatt: null,
        frequency: null,
        powerFactor: null,
      } satisfies OperationRaw;
    }

    const irradiance = round(bell * pickNumber(next, 880, 960), 2);
    const dcVolt = daylight ? round(560 + bell * 80 + pickNumber(next, -6, 6), 2) : 0;
    const dcAmp = daylight ? round((inverter.capacityKw * 1000 * bell * inverter.healthFactor) / Math.max(1, dcVolt), 2) : 0;
    const dcWatt = Math.round(dcVolt * dcAmp);
    const acWatt = Math.round(dcWatt * pickNumber(next, 0.972, 0.986));
    // 해가 지면 인버터가 계통에서 떨어진다 — 전압·전류·주파수가 모두 0 으로 떨어진다.
    const acVolt = daylight ? round(nominalVolt * pickNumber(next, 0.975, 1.02), 2) : 0;
    // 삼상은 선간전압이 세 쌍으로 나뉜다. 상마다 조금씩 어긋난다.
    const perPhase = acVolt > 0
      ? round((threePhase ? acWatt / 3 : acWatt) / acVolt, 2)
      : 0;
    // 잡음을 더해도 음수로 내려가지 않게 잡는다 — 계측값에 마이너스 전류는 없다.
    const jitterVolt = () => (acVolt > 0 ? round(acVolt + pickNumber(next, -1.2, 1.2), 2) : 0);
    const jitterAmp = () => (perPhase > 0 ? round(Math.max(0, perPhase + pickNumber(next, -1.1, 1.1)), 2) : 0);

    accumWh += Math.round((acWatt * interval) / 60);

    return {
      at: at.format('YYYY-MM-DD HH:mm:ss'),
      state,
      accumWh,
      irradiance,
      moduleTemp: round(18 + bell * 24 + pickNumber(next, -1.4, 1.4), 1),
      inverterTemp: round(inverter.temperature + bell * 6 + pickNumber(next, -1, 1), 1),
      dcVolt,
      dcAmp,
      dcWatt,
      acVolt: threePhase ? null : acVolt,
      acAmp: threePhase ? null : perPhase,
      acVoltR: threePhase ? jitterVolt() : null,
      acVoltS: threePhase ? jitterVolt() : null,
      acVoltT: threePhase ? jitterVolt() : null,
      acAmpR: threePhase ? jitterAmp() : null,
      acAmpS: threePhase ? jitterAmp() : null,
      acAmpT: threePhase ? jitterAmp() : null,
      acWatt,
      frequency: daylight ? round(60 + pickNumber(next, -0.06, 0.06), 2) : 0,
      powerFactor: daylight ? round(pickNumber(next, 96.4, 99.6), 1) : 0,
    } satisfies OperationRaw;
  });

  cache.set(key, rows);

  return rows;
}

/** 표는 최신이 위로 오는 편이 읽기 쉽다. */
export function sortRawDesc(rows: OperationRaw[]): OperationRaw[] {
  return [...rows].reverse();
}

export const RAW_STATE_LABEL: Record<RawDataState, string> = {
  normal: '정상',
  missing: '결측',
  abnormal: '이상',
};

function round(value: number, digits: number): number {
  const scale = 10 ** digits;

  return Math.round(value * scale) / scale;
}
