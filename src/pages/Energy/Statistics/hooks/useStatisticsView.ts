import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { childKindOf, getNodePath } from '@/mocks/tree';
import { getChildStats, getNodeStat } from '@/mocks/nodeStats';
import { getDetailTrend, PERIOD_META } from '@/mocks/generation';
import { kwhToCarbon, kwhToHouseholdMonths, kwhToTrees } from '@/utils/eco';
import { usePlantScope } from '@/hooks/usePlantScope';
import { useStatisticsDate } from '@/stores/filterStore';
import { useStatisticsScopeRoute } from '@/hooks/useStatisticsScopeRoute';
import type { PeriodKey } from '@/mocks/generation';
import { aggregateByBasis } from '../utils/statBasis';
import type { StatBasis } from '../utils/statBasis';

/** 하나 전 같은 기간을 셀 때 쓰는 단위 (SFR-007-03) */
const PREVIOUS_UNIT: Record<PeriodKey, 'day' | 'month' | 'year'> = {
  day: 'day',
  month: 'month',
  year: 'year',
};

/**
 * 발전통계 한 화면이 보는 값 한 벌 (SFR-007, SFR-008).
 *
 * 뎁스마다 화면을 따로 두더라도 값을 만드는 셈은 하나여야 한다 — 발전소 화면과 인버터 화면이
 * 저마다 집계하면 같은 자리에 다른 수가 뜨고, 고칠 때도 두 곳을 고쳐야 한다.
 *
 * 조회 뎁스는 주소가 쥔다. 그 걸쇠를 여기서 걸어 두어, 뎁스 화면들이 저마다 챙기지 않게 한다.
 */
export function useStatisticsView() {
  useStatisticsScopeRoute();

  const [period, setPeriod] = useState<PeriodKey>('day');
  // 무엇을 기준으로 묶어 볼지 (SFR-008-04)
  const [basis, setBasis] = useState<StatBasis>('device');
  const [date, setDate] = useStatisticsDate();
  const { node, label } = usePlantScope();

  const stat = useMemo(() => getNodeStat(node, period, date), [node, period, date]);
  const childStats = useMemo(() => getChildStats(node, period, date), [node, period, date]);
  // 지역별·교육청별은 조회 대상 트리와 상관없이 도 전체를 묶어 센다.
  const basisRows = useMemo(() => aggregateByBasis(basis, period, date), [basis, period, date]);

  // 하나 전 같은 기간 — 전일·전월·전년 비교에 쓴다 (SFR-007-03).
  const previous = useMemo(
    () => getNodeStat(node, period, dayjs(date).subtract(1, PREVIOUS_UNIT[period]).toDate()),
    [node, period, date],
  );

  const detail = getDetailTrend(period, date);
  // 도 전체는 조회 대상이 아니다 — 계층 경로도 발전소에서 시작한다.
  const path = getNodePath(node.id).filter((item) => item.kind !== 'root');

  /*
    환경 기여도는 조회 기간의 발전량에서 나온다 — 같은 카드에 선 발전량·발전시간과 잣대를 맞춘다.
    누적으로 두었더니 기간을 바꿔도 셋째 칸만 그대로여서, 세 값이 같은 기준으로 읽히지 않았다.
    계수는 환경부 고시 기준 — CO₂ 0.4594kg/kWh, 30년생 소나무 6.6kgCO₂/년, 4인 가구 350kWh/월.
  */
  const eco = {
    co2SavedKg: kwhToCarbon(stat.generationKwh),
    pineTrees: kwhToTrees(stat.generationKwh),
    households: kwhToHouseholdMonths(stat.generationKwh),
  };

  return {
    node,
    label,
    path,
    childKind: childKindOf(node),
    period,
    setPeriod,
    basis,
    setBasis,
    date,
    setDate,
    meta: PERIOD_META[period],
    stat,
    previous,
    childStats,
    basisRows,
    detail,
    eco,
  };
}

export type StatisticsView = ReturnType<typeof useStatisticsView>;
