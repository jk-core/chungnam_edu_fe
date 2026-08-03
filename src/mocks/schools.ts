import type { OperationStatus, RtuStatus } from '@/interface/status';
import type { School, SchoolLevel } from '@/interface/energy';
import { REGIONS } from './regions';
import { countOperation, isProducing } from './status';
import { createRandom, pickNumber, pickOne } from './random';

/**
 * 시·군별 지명. 학교 이름과 도로명에 함께 쓴다.
 * 지역과 어긋나는 이름이 나오지 않도록 시·군 안에서만 고른다.
 */
const PLACE_NAMES: Record<string, string[]> = {
  cheonan: ['중앙', '백석', '두정', '병천', '직산', '풍세', '신방', '성정'],
  asan: ['온양', '배방', '탕정', '도고', '송악', '음봉', '선장'],
  seosan: ['성연', '음암', '해미', '고북', '대산', '부석', '지곡'],
  dangjin: ['합덕', '송산', '신평', '우강', '면천', '순성', '고대'],
  nonsan: ['강경', '연무', '은진', '광석', '성동', '노성'],
  gongju: ['유구', '반포', '계룡', '정안', '의당', '이인'],
  boryeong: ['대천', '주교', '웅천', '청소', '남포', '오천'],
  hongseong: ['광천', '홍동', '홍북', '결성', '갈산', '은하'],
  yesan: ['삽교', '덕산', '대흥', '신양', '광시', '고덕'],
  buyeo: ['규암', '외산', '은산', '임천', '홍산', '석성'],
  geumsan: ['진산', '남이', '추부', '부리', '제원', '복수'],
  seocheon: ['장항', '마서', '한산', '비인', '판교', '문산'],
  taean: ['안면', '소원', '원북', '근흥', '이원', '고남'],
  cheongyang: ['정산', '운곡', '대치', '목면', '화성', '남양'],
  gyeryong: ['엄사', '두마', '금암', '계룡', '신도', '향한'],
};

/** 시·군별 하위 행정구역 */
const SUB_AREA: Record<string, string[]> = {
  cheonan: ['동남구', '서북구', '병천면'],
  asan: ['배방읍', '탕정면', '온양동'],
  seosan: ['음암면', '해미면', '동문동'],
  dangjin: ['합덕읍', '송악읍', '신평면'],
  nonsan: ['강경읍', '연무읍', '은진면'],
  gongju: ['유구읍', '계룡면', '반포면'],
  boryeong: ['웅천읍', '주교면', '대천동'],
  hongseong: ['홍북읍', '홍동면', '광천읍'],
  yesan: ['삽교읍', '덕산면', '대흥면'],
  buyeo: ['규암면', '외산면', '은산면'],
  geumsan: ['진산면', '남이면', '추부면'],
  seocheon: ['장항읍', '마서면', '한산면'],
  taean: ['안면읍', '남면', '소원면'],
  cheongyang: ['정산면', '운곡면', '대치면'],
  gyeryong: ['엄사면', '두마면', '신도안면'],
};

const LEVELS: SchoolLevel[] = ['초등학교', '중학교', '고등학교', '특수학교'];

/**
 * 시·군별 마커 흩뿌림 반경(도).
 * 지도에서 마커가 경계 밖으로 나가지 않도록, 좁거나 뾰족한 시·군은 반경을 줄였다.
 */
const SPREAD: Record<string, number> = {
  cheonan: 0.05,
  asan: 0.05,
  seosan: 0.045,
  dangjin: 0.04,
  nonsan: 0.045,
  gongju: 0.05,
  boryeong: 0.03,
  hongseong: 0.045,
  yesan: 0.04,
  buyeo: 0.045,
  // 금산은 남동쪽 끝이 뾰족해 조금만 벗어나도 경계를 넘는다.
  geumsan: 0.012,
  seocheon: 0.025,
  taean: 0.025,
  cheongyang: 0.04,
  gyeryong: 0.015,
};

function pickStatus(next: () => number): OperationStatus {
  const roll = next();

  if (roll > 0.955) return 'fault';
  if (roll > 0.86) return 'degraded';
  if (roll > 0.82) return 'commLost';
  // 설치를 마쳤지만 아직 정상 수집 이력이 없는 신설 설비 (SFR-003-10)
  if (roll > 0.8) return 'ready';

  return 'running';
}

/** 일사량계는 발전설비보다 고장이 적고, 대부분 통신 문제로 끊긴다. */
function pickPyranometerStatus(next: () => number, plantStatus: OperationStatus): RtuStatus {
  if (plantStatus === 'commLost') return 'disconnected';

  const roll = next();

  if (roll > 0.94) return 'disconnected';
  if (roll > 0.88) return 'abnormal';

  return 'normal';
}

function buildSchools(): School[] {
  const next = createRandom(20260728);
  const schools: School[] = [];

  REGIONS.forEach((region) => {
    // 시·군별 실제 학교 수 전부를 만들지 않고, 대표 표본만 생성한다.
    const sampleCount = Math.max(4, Math.round(region.schoolCount * 0.35));
    const places = PLACE_NAMES[region.code];
    const spread = SPREAD[region.code] ?? 0.04;

    for (let index = 0; index < sampleCount; index += 1) {
      // 지명은 순환시키고 학교급은 한 바퀴마다 밀어, (지명 × 학교급) 조합이 겹치지 않게 한다.
      const place = places[index % places.length];
      const level = LEVELS[(index + Math.floor(index / places.length)) % LEVELS.length];
      const capacityKw = pickNumber(next, 42, 186, 1);
      const utilization = pickNumber(next, 0.108, 0.176, 4);
      const todayKwh = pickNumber(next, capacityKw * 3.1, capacityKw * 5.4, 1);
      const status = pickStatus(next);
      const subArea = pickOne(next, SUB_AREA[region.code]);
      const buildingNumber = 1 + Math.floor(next() * 240);

      schools.push({
        id: `${region.code}-${index + 1}`,
        name: `${place}${level}`,
        regionCode: region.code,
        regionName: region.name,
        level,
        address: `충청남도 ${region.name} ${subArea} ${place}로 ${buildingNumber}`,
        capacityKw,
        inverterCount: Math.max(1, Math.round(capacityKw / 48)),
        pyranometerStatus: pickPyranometerStatus(next, status),
        todayKwh: isProducing(status) ? todayKwh : 0,
        monthKwh: pickNumber(next, todayKwh * 24, todayKwh * 29, 0),
        yearKwh: pickNumber(next, capacityKw * 980, capacityKw * 1420, 0),
        utilization,
        status,
        installedAt: `${2016 + Math.floor(next() * 9)}-0${1 + Math.floor(next() * 9)}`,
        // 시·군 중심에서 조금씩 흩뿌려 마커가 한 점에 겹치지 않게 한다.
        location: {
          lng: Math.round((region.center.lng + pickNumber(next, -spread, spread, 4)) * 10000) / 10000,
          // 위도 1도가 경도 1도보다 길어, 같은 거리를 두려면 조금 좁혀야 한다.
          lat: Math.round((region.center.lat + pickNumber(next, -spread * 0.8, spread * 0.8, 4)) * 10000) / 10000,
        },
      });
    }
  });

  return schools;
}

export const SCHOOLS: School[] = buildSchools();

export const SCHOOL_LEVELS = LEVELS;

export const STATUS_COUNT = countOperation(SCHOOLS);

const SCHOOL_BY_ID = new Map(SCHOOLS.map((school) => [school.id, school]));

export function getSchoolById(id: string | null): School | null {
  return id ? (SCHOOL_BY_ID.get(id) ?? null) : null;
}

/** 금일 발전량 기준 상위 학교 */
export function getTopSchools(count: number): School[] {
  return [...SCHOOLS].sort((a, b) => b.todayKwh - a.todayKwh).slice(0, count);
}
