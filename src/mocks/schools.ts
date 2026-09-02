import type { OperationStatus, RtuStatus } from '@/interface/status';
import type { School, SchoolLevel } from '@/interface/energy';
import { PLANT_SEEDS } from './plantMaster';
import { REGION_HOURS } from './regions';
import { countOperation, isProducing } from './status';
import { createRandom, hashSeed, pickNumber } from './random';
import type { PlantSeed } from './plantMaster';

/**
 * 발전소 목록.
 *
 * 이름·지역·학교급·설비용량·주소·설치년도·좌표는 교육청 마스터 표(`plantMaster`)에서 그대로 온다.
 * 계측에서 와야 할 값(운전상태·발전량·이용률 등)만 여기서 만든다 — 실제 수집이 붙으면 이 파일만
 * 걷어내면 된다.
 *
 * 난수 씨앗은 발전소 id 에서 뽑는다. 순서대로 한 수열을 나눠 쓰면 마스터 표에 한 줄만 끼어들어도
 * 그 뒤 전부의 상태가 바뀌어, 어제 본 화면과 오늘 본 화면이 달라진다.
 */

/** 학교급. 마스터 표의 구분을 그대로 따른다. */
export const SCHOOL_LEVELS: SchoolLevel[] = [
  '유치원',
  '초등학교',
  '중학교',
  '고등학교',
  '특수학교',
  '교육기관',
];

function pickStatus(next: () => number): OperationStatus {
  const roll = next();

  if (roll > 0.955) return 'fault';
  if (roll > 0.86) return 'degraded';
  if (roll > 0.82) return 'commLost';
  // 설치를 마쳤지만 아직 정상 수집 이력이 없는 신설 설비 (SFR-003-10)
  if (roll > 0.8) return 'ready';

  return 'running';
}

/**
 * 상태가 발전량에 남기는 자국.
 *
 * 「주의」는 성능이 떨어졌다는 뜻이고 「경고」는 설비가 상한 것이다. 그런데도 값을 온전히 내면
 * 발전시간 순위 맨 위에 주의 학교가 서서, 같은 줄에서 뱃지와 숫자가 서로를 부정한다 —
 * 실제로 1·3 위가 주의였다. 발전량뿐 아니라 발전시간·이용률이 함께 눌려야 하므로 값을 만들기
 * 전 시간에 곱한다.
 *
 * 준비중·통신단절은 여기서 건드리지 않는다 — 그쪽은 「덜 낸다」 가 아니라 「받은 값이 없다」 라
 * 아래에서 0 으로 떨어뜨린다.
 */
const OUTPUT_DERATE: Record<OperationStatus, [number, number]> = {
  running: [1, 1],
  ready: [1, 1],
  degraded: [0.55, 0.78],
  fault: [0.12, 0.35],
  commLost: [1, 1],
};

/** 일사량계는 발전설비보다 고장이 적고, 대부분 통신 문제로 끊긴다. */
function pickPyranometerStatus(next: () => number, plantStatus: OperationStatus): RtuStatus {
  if (plantStatus === 'commLost') return 'disconnected';

  const roll = next();

  if (roll > 0.94) return 'disconnected';
  if (roll > 0.88) return 'abnormal';

  return 'normal';
}

function toSchool(seed: PlantSeed): School {
  const next = createRandom(hashSeed(seed.id));
  const status = pickStatus(next);
  // 같은 시·군이라도 방위각·그늘·오염도가 달라, 지역 발전시간을 중심으로 흩뿌린다.
  // 성한 설비가 아니면 그만큼 덜 낸다 — 어느 상태든 한 번씩 뽑아야 정상 학교의 값이 흔들리지 않는다.
  const [derateFrom, derateTo] = OUTPUT_DERATE[status];
  const hours = (REGION_HOURS[seed.regionCode] ?? 3.8)
    * pickNumber(next, 0.82, 1.14, 3)
    * pickNumber(next, derateFrom, derateTo, 3);
  const todayKwh = Math.round(seed.capacityKw * hours * 10) / 10;

  return {
    id: seed.id,
    name: seed.name,
    regionCode: seed.regionCode,
    regionName: seed.regionName,
    level: seed.level,
    address: seed.address,
    capacityKw: seed.capacityKw,
    inverterCount: Math.max(1, Math.round(seed.capacityKw / 48)),
    pyranometerStatus: pickPyranometerStatus(next, status),
    todayKwh: isProducing(status) ? todayKwh : 0,
    monthKwh: Math.round(todayKwh * pickNumber(next, 24, 29, 2)),
    yearKwh: Math.round(seed.capacityKw * pickNumber(next, 980, 1420, 1)),
    utilization: Math.round((hours / 24) * 10000) / 10000,
    status,
    location: { lng: seed.lng, lat: seed.lat },
  };
}

export const SCHOOLS: School[] = PLANT_SEEDS.map(toSchool);

export const STATUS_COUNT = countOperation(SCHOOLS);

const SCHOOL_BY_ID = new Map(SCHOOLS.map((school) => [school.id, school]));

export function getSchoolById(id: string | null): School | null {
  return id ? (SCHOOL_BY_ID.get(id) ?? null) : null;
}

/** 금일 발전량 기준 상위 학교 */
export function getTopSchools(count: number): School[] {
  return [...SCHOOLS].sort((a, b) => b.todayKwh - a.todayKwh).slice(0, count);
}
