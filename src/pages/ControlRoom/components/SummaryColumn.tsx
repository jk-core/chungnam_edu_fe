import { formatNumber, formatPercent } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from '../ControlRoom.module.scss';
import { getRegionHours } from '../utils/regionHours';
import { CumulativeKpi } from './CumulativeKpi';
import { OutputGauge } from './OutputGauge';
import { Panel } from './Panel';
import { RegionOutput } from './RegionOutput';

interface SummaryColumnProps {
  /** 조회 대상 발전소 — 평균 이용률을 내는 데 쓴다 */
  plants: School[];
  /** 관내 합계 — 지금 출력과 기간별 누적 */
  totals: { outputKw: number; capacityKw: number; todayKwh: number; monthKwh: number; yearKwh: number };
}

/**
 * 왼쪽 열 — 지금 얼마나 내고 있고, 얼마나 쌓였는가.
 *
 * 총량 → 누적 → 시·군별로 한 칸씩 범위를 좁힌다. 관내 전체에서 시작해 아래로만 읽히는
 * 한 줄기라 눈이 오가지 않는다. 발전소 낱개의 실적 순위는 가운데 열 집계표가 맡는다.
 */
export function SummaryColumn({ plants, totals }: SummaryColumnProps) {
  // 목록과 제목 줄이 같은 셈을 나눠 쓴다 — 각자 세면 평균과 목록의 값이 어긋나는 날이 온다.
  const regions = getRegionHours();
  // 개소마다의 이용률을 고르게 평균한다 — 큰 설비가 낮아도 작은 설비 여럿이 끌어올릴 수 있다.
  const utilization = plants.length > 0
    ? plants.reduce((sum, plant) => sum + plant.utilization, 0) / plants.length
    : 0;

  return (
    <div className={styles.col}>
      <section className={styles.panel} aria-label="현재 총출력">
        <OutputGauge outputKw={totals.outputKw} capacityKw={totals.capacityKw} />
      </section>

      <Panel title="발전 실적" note={`평균 이용률 ${formatPercent(utilization, 1)}`}>
        <CumulativeKpi
          todayKwh={totals.todayKwh}
          monthKwh={totals.monthKwh}
          yearKwh={totals.yearKwh}
          capacityKw={totals.capacityKw}
        />
      </Panel>

      <Panel title="지역별 발전시간" note={`${formatNumber(regions.count)}개 지역 · 평균 ${formatNumber(regions.average, 1)}h`} grow>
        <RegionOutput />
      </Panel>
    </div>
  );
}
