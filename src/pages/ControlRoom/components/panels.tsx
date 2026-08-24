import { useState } from 'react';
import { formatNumber, formatPercent } from '@/utils/format';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import type { CollectionStatus } from '@/interface/collection';
import type { School } from '@/interface/energy';
import styles from '../ControlRoom.module.scss';
import { getRegionHours } from '../utils/regionHours';
import { AXIS_OPTIONS } from '../utils/aggregate';
import { AggregationPanel } from './AggregationPanel';
import { AiDiagnosisPanel } from './AiDiagnosisPanel';
import { CumulativeKpi } from './CumulativeKpi';
import { FaultGroups } from './FaultGroups';
import { FaultMap } from './FaultMap';
import { OutputGauge } from './OutputGauge';
import { Panel } from './Panel';
import { RegionOutput } from './RegionOutput';
import type { Axis } from '../utils/aggregate';

/**
 * 상황판이 세우는 판 일곱.
 *
 * 배치만 다른 시안이 여럿이라 판을 각 시안에서 다시 짜면, 제목 한 줄·보조 문구 하나를 고칠 때
 * 여섯 곳을 함께 고쳐야 하고 어느 시안 하나만 옛말로 남는다. 어느 열에 서느냐는 시안이 정하고
 * **판 안에 무엇이 들어가느냐는 여기서만** 정한다 — 그래야 시안끼리 견줄 때 배치만 눈에 걸린다.
 */

interface Totals {
  outputKw: number;
  capacityKw: number;
  todayKwh: number;
  monthKwh: number;
  yearKwh: number;
}

/**
 * 현재 총출력 (SFR-004-02).
 * 게이지가 판 전체를 쓰므로 제목 줄을 두지 않는다 — 눈금 위 큰 숫자가 곧 제목이다.
 */
export function OutputPanel({ totals }: { totals: Totals }) {
  return (
    <section className={styles.panel} aria-label="현재 총출력">
      <OutputGauge outputKw={totals.outputKw} capacityKw={totals.capacityKw} />
    </section>
  );
}

/** 발전 실적 — 오늘·이달·올해로 쌓인 양. */
export function YieldPanel({ plants, totals, grow }: { plants: School[]; totals: Totals; grow?: boolean }) {
  // 개소마다의 이용률을 고르게 평균한다 — 큰 설비가 낮아도 작은 설비 여럿이 끌어올릴 수 있다.
  const utilization = plants.length > 0
    ? plants.reduce((sum, plant) => sum + plant.utilization, 0) / plants.length
    : 0;

  return (
    <Panel title="발전 실적" note={`평균 이용률 ${formatPercent(utilization, 1)}`} grow={grow}>
      <CumulativeKpi
        todayKwh={totals.todayKwh}
        monthKwh={totals.monthKwh}
        yearKwh={totals.yearKwh}
        capacityKw={totals.capacityKw}
      />
    </Panel>
  );
}

/** 지역별 발전시간 (SFR-004-09). */
export function RegionPanel({ grow }: { grow?: boolean }) {
  // 목록과 제목 줄이 같은 셈을 나눠 쓴다 — 각자 세면 평균과 목록의 값이 어긋나는 날이 온다.
  const regions = getRegionHours();

  return (
    <Panel
      title="지역별 발전시간"
      note={`${formatNumber(regions.count)}개 지역 · 평균 ${formatNumber(regions.average, 1)}h`}
      grow={grow}
    >
      <RegionOutput />
    </Panel>
  );
}

/** 관내 발전소 현황 — 지도 (SFR-004-01/14). */
export function MapPanel({
  plants, abnormalCount, grow,
}: { plants: School[]; abnormalCount: number; grow?: boolean }) {
  return (
    <Panel
      title="관내 발전소 현황"
      note={`${formatNumber(plants.length)}개소 · 이상 ${formatNumber(abnormalCount)}개소`}
      grow={grow}
    >
      <FaultMap plants={plants} scope="all" height="100%" selectable tour />
    </Panel>
  );
}

/**
 * 발전 현황 집계 (SFR-004-03 / SFR-004-09).
 * 무엇으로 묶어 볼지는 판 제목 줄에서 고른다 — 고르개가 판 머리에 서므로 자리를 내주는 이쪽이 쥔다.
 */
export function AggregationCard({ plants }: { plants: School[] }) {
  const [axis, setAxis] = useState<Axis>('region');

  return (
    <Panel
      title="발전 현황 집계"
      note={(
        <SegmentedControl
          label="집계 기준"
          size="sm"
          options={AXIS_OPTIONS}
          value={axis}
          onChange={setAxis}
        />
      )}
    >
      {/*
        축을 바꾸면 표를 처음 쪽부터 다시 읽는다.
        쪽 번호를 그대로 두면 셋째 쪽에서 축만 갈려, 열다섯 지역 중 열한째부터 보이기 시작한다.
      */}
      <AggregationPanel key={axis} schools={plants} axis={axis} />
    </Panel>
  );
}

/** AI 진단 — 검출된 고장을 한 건씩 풀어 준다. */
export function AiPanel({ plants, grow }: { plants: School[]; grow?: boolean }) {
  return (
    <Panel title="AI 진단" note={`관내 ${formatNumber(plants.length)}개소`} grow={grow} accent>
      <AiDiagnosisPanel plants={plants} />
    </Panel>
  );
}

/** 장애 발생 현황 (SFR-004-08/14) — 상태별 묶음. */
export function FaultPanel({
  plants, abnormalCount, collection, grow,
}: {
  plants: School[];
  abnormalCount: number;
  collection: Map<string, CollectionStatus>;
  grow?: boolean;
}) {
  return (
    <Panel title="장애 발생 현황" note={`이상 ${formatNumber(abnormalCount)}개소`} grow={grow}>
      <FaultGroups plants={plants} collection={collection} />
    </Panel>
  );
}
