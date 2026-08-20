import type { School } from '@/interface/energy';
import styles from '../ControlRoom.module.scss';
import { CumulativeKpi } from './CumulativeKpi';
import { OpsMetrics } from './OpsMetrics';
import { OutputGauge } from './OutputGauge';
import { Panel } from './Panel';
import { RankingStrip } from './RankingStrip';

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
 * 값 하나짜리 게이지는 작게 두고, 남는 높이는 맨 아래 순위가 가져간다.
 * 총량 → 누적 → 지표 → 「그래서 어디가 잘 냈나」 로 이어지는 한 줄기라 눈이 위에서 아래로만 간다.
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

      <Panel title="금일 실적 순위" note="시·군별 발전시간 상위 3" grow>
        <RankingStrip schools={plants} />
      </Panel>
    </div>
  );
}
