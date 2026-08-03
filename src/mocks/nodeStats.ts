import { OPERATION_PENALTY, OPERATION_RANK } from './status';
import { REGION_TOTAL } from './regions';
import { getChildNodes } from './tree';
import { getDetailTrend, getHourlyTrend } from './generation';
import { getInverterById, getInvertersOf } from './equipment';
import type { PeriodKey } from './generation';
import type { ScopeNode } from './tree';

/** 기준 발전성능비 — 각 계층의 PR 을 이 값과 견주어 발전량을 깎거나 올린다. */
const REFERENCE_PR = 0.87;

/** 계층 한 칸의 발전 실적 */
export interface NodeStat {
  node: ScopeNode;
  /** 상세 시점별 발전량(kWh). 일별이면 시간, 월별이면 일, 연도별이면 월 단위. */
  series: number[];
  /** 기준일 하루의 시간대별 발전량(kWh) — 카드 선그래프에 쓴다. */
  hourly: number[];
  /** 기간 합계 발전량(kWh) */
  generationKwh: number;
  /** 같은 일사량에서 기대되는 발전량(kWh) */
  expectedKwh: number;
  /** 등가 발전시간(h) = 발전량 / 설비용량 */
  hours: number;
  peakKwh: number;
  /** 이 계층에 적용된 발전성능비(0~1) */
  pr: number;
}

/** 계층 한 칸이 물고 있는 발전성능비. 인버터 아래는 그 인버터 값을 물려받는다. */
function prOfNode(node: ScopeNode): number {
  if (node.inverterId) return getInverterById(node.inverterId)?.pr ?? REFERENCE_PR;

  if (node.plantId) {
    const list = getInvertersOf(node.plantId);

    return list.length > 0 ? list.reduce((sum, item) => sum + item.pr, 0) / list.length : REFERENCE_PR;
  }

  return REFERENCE_PR;
}

/**
 * 인버터 아래 계층은 자기 상태만큼 더 깎인다.
 * 정상 인버터에 물린 스트링 하나가 죽어 있을 수 있어, 부모 PR 만으로는 그게 드러나지 않는다.
 */
function penaltyOfNode(node: ScopeNode): number {
  if (node.kind !== 'string' && node.kind !== 'channel' && node.kind !== 'junctionBox') return 1;

  return OPERATION_PENALTY[node.status];
}

/** 계층 한 칸의 발전 실적. 도 전체 추이를 그 칸의 설비용량·성능 몫으로 좁힌다. */
export function getNodeStat(node: ScopeNode, period: PeriodKey, date: Date): NodeStat {
  const pr = prOfNode(node);
  const penalty = penaltyOfNode(node);
  const share = node.kind === 'root'
    ? 1
    : (node.capacityKw / REGION_TOTAL.capacityKw) * (pr / REFERENCE_PR) * penalty;

  const scaled = (value: number) => Math.round(value * share * 10) / 10;
  const series = getDetailTrend(period, date).map((point) => scaled(point.generation));
  const hourly = getHourlyTrend(date).map((point) => scaled(point.generation));
  const generationKwh = series.reduce((sum, value) => sum + value, 0);
  const effectivePr = node.kind === 'root' ? REFERENCE_PR : pr * penalty;

  return {
    node,
    series,
    hourly,
    generationKwh,
    expectedKwh: effectivePr > 0 ? generationKwh / effectivePr : 0,
    hours: node.capacityKw > 0 ? generationKwh / node.capacityKw : 0,
    peakKwh: series.length > 0 ? Math.max(...series) : 0,
    pr: effectivePr,
  };
}

/**
 * 자식 계층의 발전 실적.
 * 도 전체 아래에는 발전소가 128개 달려 있어, 그때만 이상 설비를 앞세워 잘라 낸다.
 */
export function getChildStats(node: ScopeNode, period: PeriodKey, date: Date, limit = 12): NodeStat[] {
  const children = getChildNodes(node.id);
  const ordered = node.kind === 'root'
    ? [...children]
      .sort((a, b) => OPERATION_RANK[a.status] - OPERATION_RANK[b.status] || b.capacityKw - a.capacityKw)
      .slice(0, limit)
    : children;

  return ordered.map((child) => getNodeStat(child, period, date));
}
