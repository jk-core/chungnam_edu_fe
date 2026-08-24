import type { Rtu } from '@/interface/asset';
import type { RtuStatus } from '@/interface/status';
import { SCHOOLS } from './schools';
import { createRandom, hashSeed, pickNumber, pickOne } from './random';
import { NOW, stampAgo } from './today';

const MODELS = ['CN-RTU300', 'CN-RTU300', 'CN-RTU210', 'EW-GW520'];
const FIRMWARES = ['2.4.1', '2.4.1', '2.3.7', '2.2.0'];

function buildRtu(index: number): Rtu {
  const school = SCHOOLS[index];
  const next = createRandom(hashSeed(`${school.id}-rtu`));
  // 발전소 일사량계 연계 상태를 RTU 상태의 근거로 삼는다.
  const status: RtuStatus = school.status === 'commLost' ? 'disconnected' : school.pyranometerStatus;

  const lastSeenAt = status === 'disconnected'
    ? stampAgo(Math.round(pickNumber(next, 1, 3)), `${String(Math.round(pickNumber(next, 6, 20))).padStart(2, '0')}:40`)
    : NOW.subtract(Math.round(pickNumber(next, 1, 9)), 'minute').format('YYYY-MM-DD HH:mm');

  return {
    id: `RTU-${school.id}`,
    plantId: school.id,
    plantName: school.name,
    model: pickOne(next, MODELS),
    serial: `CNE${String(202100 + index * 7 + Math.round(pickNumber(next, 0, 6)))}`,
    firmware: pickOne(next, FIRMWARES),
    intervalMinutes: next() > 0.2 ? 1 : 5,
    status,
    lastSeenAt,
  };
}

export const RTUS: Rtu[] = SCHOOLS.map((_, index) => buildRtu(index));

const RTU_BY_PLANT = new Map(RTUS.map((rtu) => [rtu.plantId, rtu]));

/** 발전소에 붙은 RTU. 수집주기를 알아야 하는 쪽에서 쓴다. */
export function getRtuOf(plantId: string): Rtu | null {
  return RTU_BY_PLANT.get(plantId) ?? null;
}
