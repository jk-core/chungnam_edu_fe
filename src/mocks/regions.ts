import type { Region } from '@/interface/energy';
import { CHUNGNAM_REGIONS } from '@/configs/regions';
import { PLANT_SEEDS } from './plantMaster';

/**
 * 시·군별 집계.
 *
 * 시·군이 무엇무엇인지와 그 좌표는 `configs/regions` 가 갖는다 — 여기서는 숫자만 얹는다.
 * 학교 수와 설비용량은 마스터 표(`plantMaster`)를 그대로 합산한다. 목업 숫자를 따로 두면
 * 「지역별 표의 합」과 「발전소 목록의 합」이 어긋나 어느 쪽이 맞는지 화면에서 알 수 없다.
 * 발전량만 계측에서 오는 값이라, 아래 발전시간을 곱해 만들어 둔다.
 */

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
  return CHUNGNAM_REGIONS
    .map((region) => {
      const seeds = PLANT_SEEDS.filter((seed) => seed.regionCode === region.code);
      const capacityKw = Math.round(seeds.reduce((sum, seed) => sum + seed.capacityKw, 0));
      const todayKwh = Math.round(capacityKw * (REGION_HOURS[region.code] ?? 3.8));

      return {
        code: region.code,
        name: region.name,
        schoolCount: seeds.length,
        capacityKw,
        todayKwh,
        monthKwh: Math.round(todayKwh * DAYS_IN_MONTH),
      };
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
