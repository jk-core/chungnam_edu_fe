import styles from '../ControlRoom.module.scss';
import { CumulativeKpi } from './CumulativeKpi';
import { OutputGauge } from './OutputGauge';
import { Panel } from './Panel';
import { RegionOutput } from './RegionOutput';

interface SummaryColumnProps {
  /** 관내 합계 — 지금 출력과 기간별 누적 */
  totals: { outputKw: number; capacityKw: number; todayKwh: number; monthKwh: number; yearKwh: number };
}

/**
 * 왼쪽 열 — 지금 얼마나 내고 있고, 얼마나 쌓였는가.
 *
 * 총량 → 누적 → 시·군별로 한 칸씩 범위를 좁힌다. 관내 전체에서 시작해 아래로만 읽히는
 * 한 줄기라 눈이 오가지 않는다. 발전소 낱개의 실적 순위는 가운데 열 집계표가 맡는다.
 */
export function SummaryColumn({ totals }: SummaryColumnProps) {
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

      <Panel title="시·군별 발전량" note="금일 · kWh" grow>
        <RegionOutput />
      </Panel>
    </div>
  );
}
