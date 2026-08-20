import { TODAY } from '@/mocks/today';
import type { School } from '@/interface/energy';
import styles from '../ControlRoom.module.scss';
import { CumulativeKpi } from './CumulativeKpi';
import { LiveTrendChart } from './LiveTrendChart';
import { OpsMetrics } from './OpsMetrics';
import { OutputGauge } from './OutputGauge';
import { Panel } from './Panel';

interface SummaryColumnProps {
  plants: School[];
  /** 관내 합계 — 지금 출력과 기간별 누적 */
  totals: { outputKw: number; capacityKw: number; todayKwh: number; monthKwh: number; yearKwh: number };
  /** 관내 평균 발전시간(h) */
  hours: number;
  /** 계측이 끊긴 개소 수 */
  staleCount: number;
}

/**
 * 왼쪽 열 — 지금 얼마나 내고 있고, 얼마나 쌓였는가.
 *
 * 값 하나짜리 게이지는 작게 두고 남는 높이는 하루 곡선에 준다. 곡선은 가로로 길고 세로로 낮은
 * 그림이라, 좁고 높은 자리에 넣으면 봉우리만 뾰족해지고 시각 눈금이 겹친다.
 */
export function SummaryColumn({ plants, totals, hours, staleCount }: SummaryColumnProps) {
  return (
    <div className={styles.col}>
      <section className={styles.panel} aria-label="현재 총출력">
        <OutputGauge outputKw={totals.outputKw} capacityKw={totals.capacityKw} />
      </section>

      <Panel title="발전실적">
        <CumulativeKpi
          todayKwh={totals.todayKwh}
          monthKwh={totals.monthKwh}
          yearKwh={totals.yearKwh}
          capacityKw={totals.capacityKw}
        />
      </Panel>

      <Panel title="운영지표" note={`${plants.length}개소 기준`}>
        <OpsMetrics schools={plants} hours={hours} staleCount={staleCount} />
      </Panel>

      <Panel title="시간대별 발전량" grow>
        <LiveTrendChart date={TODAY.toDate()} />
      </Panel>
    </div>
  );
}
