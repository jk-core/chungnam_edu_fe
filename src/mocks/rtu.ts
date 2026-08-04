import type { Rtu, RtuEvent } from '@/interface/asset';
import type { RtuStatus } from '@/interface/status';
import { SCHOOLS } from './schools';
import { createRandom, hashSeed, pickNumber, pickOne } from './random';
import { NOW, stampAgo } from './today';

const MODELS = ['CN-RTU300', 'CN-RTU300', 'CN-RTU210', 'EW-GW520'];
const FIRMWARES = ['2.4.1', '2.4.1', '2.3.7', '2.2.0'];

function buildEvents(next: () => number, installedAt: string): RtuEvent[] {
  const events: RtuEvent[] = [
    { at: `${installedAt}-01 10:00`, kind: 'install', note: '최초 설치 및 연계 개통' },
  ];

  if (next() > 0.72) {
    events.push({
      at: stampAgo(Math.round(pickNumber(next, 90, 400)), '11:20'),
      kind: 'firmware',
      note: `펌웨어 ${pickOne(next, FIRMWARES)} 업데이트`,
    });
  }

  if (next() > 0.85) {
    events.push({
      at: stampAgo(Math.round(pickNumber(next, 30, 200)), '14:05'),
      kind: 'replace',
      note: '통신 모듈 불량으로 본체 교체',
    });
  }

  if (next() > 0.92) {
    events.push({
      at: stampAgo(Math.round(pickNumber(next, 10, 120)), '09:40'),
      kind: 'relocate',
      note: '옥상 공사로 설치 위치 이설',
    });
  }

  return events.sort((a, b) => a.at.localeCompare(b.at));
}

function buildRtu(index: number): Rtu {
  const school = SCHOOLS[index];
  const next = createRandom(hashSeed(`${school.id}-rtu`));
  // 발전소 일사량계 연계 상태를 수집장치 상태의 근거로 삼는다.
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
    events: buildEvents(next, school.installedAt),
  };
}

export const RTUS: Rtu[] = SCHOOLS.map((_, index) => buildRtu(index));

export const RTU_EVENT_LABEL: Record<RtuEvent['kind'], string> = {
  install: '설치',
  replace: '교체',
  relocate: '이설',
  firmware: '펌웨어',
};

const RTU_BY_PLANT = new Map(RTUS.map((rtu) => [rtu.plantId, rtu]));

/** 발전소에 붙은 수집장치. 수집주기를 알아야 하는 쪽에서 쓴다. */
export function getRtuOf(plantId: string): Rtu | null {
  return RTU_BY_PLANT.get(plantId) ?? null;
}
