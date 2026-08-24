import type { School } from '@/interface/energy';
import styles from '../ControlRoom.module.scss';
import { OutputPanel, RegionPanel, YieldPanel } from './panels';

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
  return (
    <div className={styles.col}>
      <OutputPanel totals={totals} />
      <YieldPanel plants={plants} totals={totals} />
      <RegionPanel grow />
    </div>
  );
}
