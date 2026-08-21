import { createRandom, hashSeed } from '@/mocks/random';
import { HOURLY_OUTPUT } from '@/mocks/generation';
import { REGIONS } from '@/mocks/regions';

/**
 * 시·군별 시간대 출력.
 *
 * 도 전체 곡선은 하나뿐이라 그대로 나누면 열다섯 줄이 전부 같은 모양이 된다 — 그러면 히트맵을
 * 깔아 봐야 "정오에 밝다" 는 말만 열다섯 번 하는 셈이다. 지역마다 구름이 지나간 때를 달리 주어
 * 줄이 서로 갈리게 하되, 하루 합은 그 지역 실적에 맞춰 되돌린다. 다른 화면이 말하는 지역
 * 발전량과 어긋나면 같은 값을 두 가지로 적는 것이 된다.
 */

/*
  구름이 얼마나 깊게, 얼마나 오래 지나가는지.

  옅게 주면 열다섯 줄이 결국 같은 그림이 되어 히트맵을 깐 뜻이 없어진다. 하루 합을 지역 실적으로
  되돌리는 과정에서 눌린 만큼이 다른 시각으로 옮겨 가 차이가 한 번 더 줄어들므로, 눈에 보일
  만큼은 깊게 준다.
*/
const DIP_MIN = 0.28;
const DIP_MAX = 0.62;

/** 구름이 머무는 폭(시간). 좁으면 한 칸만 어두워 잡티처럼 보인다 */
const SPAN_MIN = 2.2;
const SPAN_MAX = 4.6;

export interface RegionHourRow {
  code: string;
  name: string;
  capacityKw: number;
  /** 시각별 출력(kW) — `HOURS` 와 같은 순서 */
  kw: number[];
  /**
   * 시각별 이용률(kW / 설비용량).
   * 히트맵의 밝기는 이 값을 쓴다 — 출력 그대로 칠하면 큰 시·군이 늘 밝아, 잘 돌아서 밝은 것인지
   * 커서 밝은 것인지 가릴 수 없다.
   */
  ratio: number[];
}

/** 곡선이 덮는 시각들 */
export const HOURS: number[] = HOURLY_OUTPUT.map((point) => point.hour);

/** 지역 한 곳의 시간대 곡선 — 도 곡선에 구름 한 덩이를 얹고 하루 합을 맞춘다 */
function rowOf(region: (typeof REGIONS)[number]): RegionHourRow {
  const next = createRandom(hashSeed(region.code));
  const depth = DIP_MIN + next() * (DIP_MAX - DIP_MIN);
  const span = SPAN_MIN + next() * (SPAN_MAX - SPAN_MIN);
  const center = HOURS[0] + next() * (HOURS[HOURS.length - 1] - HOURS[0]);

  const shaped = HOURLY_OUTPUT.map((point) => {
    // 종 모양으로 눌러 구름이 가운데에서 가장 짙고 가장자리로 갈수록 옅어지게 한다.
    const away = (point.hour - center) / span;

    return point.kw * (1 - depth * Math.exp(-(away ** 2)));
  });

  const area = shaped.reduce((sum, kw) => sum + kw, 0);
  const scale = area > 0 ? region.todayKwh / area : 0;
  const kw = shaped.map((value) => Math.round(value * scale * 10) / 10);

  return {
    code: region.code,
    name: region.name,
    capacityKw: region.capacityKw,
    kw,
    ratio: kw.map((value) => (region.capacityKw > 0 ? value / region.capacityKw : 0)),
  };
}

export const REGION_HOURLY: RegionHourRow[] = REGIONS.map(rowOf);

/** 히트맵 밝기를 나누는 분모 — 판 전체에서 가장 잘 돈 한 칸이 가장 밝다 */
export const RATIO_PEAK = REGION_HOURLY.reduce(
  (best, row) => Math.max(best, ...row.ratio),
  0,
);
