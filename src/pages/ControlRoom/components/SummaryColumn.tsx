import type { School } from '@/interface/energy';
import styles from '../ControlRoom.module.scss';
import { CumulativeKpi } from './CumulativeKpi';
import { OutputGauge } from './OutputGauge';
import { Panel } from './Panel';
import { RankingStrip } from './RankingStrip';
import { RegionOutput } from './RegionOutput';

interface SummaryColumnProps {
  plants: School[];
  /** 관내 합계 — 지금 출력과 기간별 누적 */
  totals: { outputKw: number; capacityKw: number; todayKwh: number; monthKwh: number; yearKwh: number };
}

/**
 * 왼쪽 열 — 지금 얼마나 내고 있고, 얼마나 쌓였는가.
 *
 * 총량 → 누적 → 시·군별 → 상위 발전소로 좁혀 간다. 관내 전체에서 시작해 한 칸씩
 * 범위를 좁히는 한 줄기라 눈이 위에서 아래로만 간다.
 */
export function SummaryColumn({ plants, totals }: SummaryColumnProps) {
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

      <Panel title="시·군별 발전량" note="금일 · kWh">
        <RegionOutput />
      </Panel>

      <Panel title="금일 실적 순위" note="시·군별 발전시간 상위 3" grow>
        <RankingStrip schools={plants} />
      </Panel>
    </div>
  );
}
