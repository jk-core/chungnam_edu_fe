import type { GeoPoint, Region } from '@/interface/energy';
import { PLANT_SEEDS } from './plantMaster';

/**
 * 충청남도 15개 시·군.
 *
 * 학교 수와 설비용량은 마스터 표(`plantMaster`)를 그대로 합산한다 — 목업 숫자를 따로 두면
 * 「지역별 표의 합」과 「발전소 목록의 합」이 어긋나 어느 쪽이 맞는지 화면에서 알 수 없다.
 * 발전량만 계측에서 오는 값이라, 아래 발전시간을 곱해 만들어 둔다.
 */

/** 시·군 중심 좌표 — 지도에 라벨을 놓는 기준 */
const CENTER: Record<string, GeoPoint> = {
  cheonan: { lng: 127.114, lat: 36.815 },
  asan: { lng: 127.002, lat: 36.79 },
  seosan: { lng: 126.45, lat: 36.785 },
  dangjin: { lng: 126.646, lat: 36.89 },
  nonsan: { lng: 127.099, lat: 36.187 },
  gongju: { lng: 127.119, lat: 36.447 },
  boryeong: { lng: 126.613, lat: 36.333 },
  hongseong: { lng: 126.661, lat: 36.601 },
  yesan: { lng: 126.845, lat: 36.683 },
  buyeo: { lng: 126.91, lat: 36.276 },
  geumsan: { lng: 127.452, lat: 36.132 },
  seocheon: { lng: 126.692, lat: 36.08 },
  taean: { lng: 126.298, lat: 36.746 },
  cheongyang: { lng: 126.802, lat: 36.459 },
  gyeryong: { lng: 127.249, lat: 36.274 },
};

/**
 * 시·군별 금일 발전시간(h) — 설비용량 1kW 가 하루에 낸 발전량(kWh).
 * 서해안이 내륙보다 일사량이 높고, 산지인 금산·청양이 가장 낮다.
 */
export const REGION_HOURS: Record<string, number> = {
  taean: 4.31,
  boryeong: 4.24,
  seocheon: 4.18,
  dangjin: 4.12,
  seosan: 4.09,
  hongseong: 4.02,
  buyeo: 3.96,
  yesan: 3.91,
  gyeryong: 3.86,
  nonsan: 3.82,
  asan: 3.78,
  gongju: 3.74,
  cheonan: 3.69,
  cheongyang: 3.61,
  geumsan: 3.54,
};

/** 한 달 발전량은 금일값에 이 만큼을 곱해 잡는다 — 흐린 날을 덜어 낸 26.4일치. */
const DAYS_IN_MONTH = 26.4;

const NAME_ORDER = ['시', '군'];

function buildRegions(): Region[] {
  const byCode = new Map<string, Region>();

  PLANT_SEEDS.forEach((seed) => {
    const found = byCode.get(seed.regionCode);

    if (found) {
      found.schoolCount += 1;
      found.capacityKw += seed.capacityKw;

      return;
    }

    byCode.set(seed.regionCode, {
      code: seed.regionCode,
      name: seed.regionName,
      schoolCount: 1,
      capacityKw: seed.capacityKw,
      todayKwh: 0,
      monthKwh: 0,
      center: CENTER[seed.regionCode],
    });
  });

  return [...byCode.values()]
    .map((region) => {
      const capacityKw = Math.round(region.capacityKw);
      const todayKwh = Math.round(capacityKw * (REGION_HOURS[region.code] ?? 3.8));

      return { ...region, capacityKw, todayKwh, monthKwh: Math.round(todayKwh * DAYS_IN_MONTH) };
    })
    // 설비용량이 큰 시·군부터 세운다. 시가 군보다 앞서도록 이름 끝 글자를 뒤 순서로 둔다.
    .sort((a, b) => b.capacityKw - a.capacityKw || NAME_ORDER.indexOf(a.name.slice(-1)) - NAME_ORDER.indexOf(b.name.slice(-1)));
}

export const REGIONS: Region[] = buildRegions();

export const REGION_TOTAL = REGIONS.reduce(
  (acc, region) => ({
    schoolCount: acc.schoolCount + region.schoolCount,
    capacityKw: acc.capacityKw + region.capacityKw,
    todayKwh: acc.todayKwh + region.todayKwh,
    monthKwh: acc.monthKwh + region.monthKwh,
  }),
  { schoolCount: 0, capacityKw: 0, todayKwh: 0, monthKwh: 0 },
);

/**
 * 시·군 → 관할 교육지원청 (SFR-008-04).
 * 충청남도교육청은 15개 시·군을 14개 교육지원청이 나눠 맡는다 — 논산시와 계룡시가 한 지원청이다.
 * 그래서 '지역별'과 '교육청별'은 같은 표가 되지 않는다.
 */
const OFFICE_BY_REGION: Record<string, string> = {
  cheonan: '천안',
  asan: '아산',
  seosan: '서산',
  dangjin: '당진',
  nonsan: '논산계룡',
  gyeryong: '논산계룡',
  gongju: '공주',
  boryeong: '보령',
  hongseong: '홍성',
  yesan: '예산',
  buyeo: '부여',
  geumsan: '금산',
  seocheon: '서천',
  taean: '태안',
  cheongyang: '청양',
};

/** 시·군 코드로 교육지원청 이름을 찾는다. */
export function educationOfficeOf(regionCode: string): string {
  return `${OFFICE_BY_REGION[regionCode] ?? '충청남도'}교육지원청`;
}
