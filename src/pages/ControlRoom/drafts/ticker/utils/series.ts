import { getTrend, HOURLY_OUTPUT } from '@/mocks/generation';
import { REGION_TOTAL } from '@/mocks/regions';
import { NOW_HOUR, TODAY } from '@/mocks/today';

/**
 * 차트가 답하는 시간 축.
 * 증권 앱의 종목 화면이 기간 탭(1일·1주·1년)을 두듯, 고른 대상 하나를 세 눈금으로 본다.
 */
export type TickerPeriod = 'hour' | 'day' | 'month';

export const PERIOD_OPTIONS: { value: TickerPeriod; label: string }[] = [
  { value: 'hour', label: '시간대별' },
  { value: 'day', label: '일별' },
  { value: 'month', label: '월별' },
];

export interface TargetSeries {
  labels: string[];
  values: number[];
  /** y축·툴팁에 붙는 단위 */
  unit: string;
  /** 시간대는 출력 곡선(line), 기간은 발전량 막대(bar) */
  shape: 'line' | 'bar';
  /** 무엇을 그린 것인지 — 축 이름과 스크린리더 요약에 쓴다 */
  measure: string;
  /** '지금' 눈금을 그릴 x 자리. 시간대에서만 채운다 */
  nowIndex?: number;
}

/**
 * 자릿수에 맞춰 단위를 k·M·G 로 올린다.
 * `format.ts` 의 `scaleSi` 와 같은 문턱을 써서, 다른 화면과 같은 값이 같은 단위로 적히게 한다.
 */
function pickScale(max: number, suffix: 'W' | 'Wh'): { divider: number; unit: string } {
  if (max >= 1_000_000) return { divider: 1_000_000, unit: `G${suffix}` };
  if (max >= 1_000) return { divider: 1_000, unit: `M${suffix}` };

  return { divider: 1, unit: `k${suffix}` };
}

/**
 * 고른 대상 하나의 발전 시리즈.
 *
 * 목업의 시간대·기간 곡선은 도 전체 한 벌뿐이라(`generation.ts`), 대상의 몫만큼 줄여 쓴다 —
 * `schoolOutput.ts` 가 발전소별 곡선을 만드는 방식과 같다. 몫은 금일 발전량이 도 전체에서
 * 차지하는 비율로 잡는다. 곡선의 모양(정오를 정점으로 하는 종형)은 대상이 달라도 같고 크기만
 * 바뀌므로, 대상별로 없는 값을 지어내지 않는다.
 */
export function buildTargetSeries(todayKwh: number, period: TickerPeriod): TargetSeries {
  const share = REGION_TOTAL.todayKwh > 0 ? todayKwh / REGION_TOTAL.todayKwh : 0;

  if (period === 'hour') {
    // HOURLY_OUTPUT.kw 는 도 전체의 시간대별 출력(kW)이라, 몫을 곱하면 대상의 출력 곡선이 된다.
    const raw = HOURLY_OUTPUT.map((point) => point.kw * share);
    const { divider, unit } = pickScale(Math.max(...raw, 1), 'W');
    const nowIndex = HOURLY_OUTPUT.findIndex((point) => point.hour === Math.floor(NOW_HOUR));

    return {
      labels: HOURLY_OUTPUT.map((point) => `${String(point.hour).padStart(2, '0')}시`),
      values: raw.map((value) => Number((value / divider).toFixed(2))),
      unit,
      shape: 'line',
      measure: '출력',
      nowIndex: nowIndex >= 0 ? nowIndex : undefined,
    };
  }

  const base = getTrend(period === 'day' ? 'day' : 'month', TODAY.toDate());
  const raw = base.map((point) => point.generation * share);
  const { divider, unit } = pickScale(Math.max(...raw, 1), 'Wh');

  return {
    labels: base.map((point) => point.label),
    values: raw.map((value) => Number((value / divider).toFixed(2))),
    unit,
    shape: 'bar',
    measure: '발전량',
  };
}
