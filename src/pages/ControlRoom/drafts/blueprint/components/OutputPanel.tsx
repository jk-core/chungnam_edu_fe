import { CountUp } from '@/components/common/CountUp';
import { PEAK_OUTPUT } from '@/mocks/generation';
import { formatCapacity, formatPercent, scaleSi } from '@/utils/format';
import { Panel } from './Panel';
import styles from './OutputPanel.module.scss';

interface Totals {
  outputKw: number;
  capacityKw: number;
}

/** 눈금 자리 — 도면의 치수선처럼 0·25·50·75·100 다섯 곳에 금을 긋는다 */
const TICKS = [0, 25, 50, 75, 100];

/**
 * 현재 총출력 (SFR-004-02) — 청사진 판.
 *
 * 반원 게이지(A)를 걷고 **가로 치수선 게이지**로 바꾼다. 좁은 레일에서는 반원이 폭을 다 먹고도
 * 가운데가 비는데, 가로 선은 판 폭을 그대로 눈금으로 쓴다. 지금 출력을 피크 대비 어디에 있는지
 * 눈금 위 표식 하나로 짚고, 큰 수는 그 위에 고정폭으로 세운다.
 */
export function OutputPanel({ totals }: { totals: Totals }) {
  const peak = PEAK_OUTPUT.kw > 0 ? PEAK_OUTPUT.kw : 1;
  const ratio = Math.max(0, Math.min(1, totals.outputKw / peak));
  const output = scaleSi(totals.outputKw, 'W');
  const capacity = formatCapacity(totals.capacityKw);
  const peakValue = formatCapacity(peak);

  return (
    <Panel title="현재 총출력" note={`피크 대비 ${formatPercent(ratio, 0)}`}>
      <div className={styles.output}>
        <p className={styles.output__value}>
          <CountUp className={styles.output__number} value={output.amount} fractionDigits={output.fractionDigits} startOnView={false} />
          <span className={styles.output__unit}>{output.unit}</span>
        </p>

        {/* 치수선 게이지 — 눈금을 판 폭에 깔고 지금 자리를 표식으로 짚는다 */}
        <div className={styles.gauge}>
          <div className={styles.gauge__track}>
            <span className={styles.gauge__fill} style={{ width: `${ratio * 100}%` }} />
            <span className={styles.gauge__mark} style={{ left: `${ratio * 100}%` }} aria-hidden="true" />
            {TICKS.map((tick) => (
              <span key={tick} className={styles.gauge__tick} style={{ left: `${tick}%` }} aria-hidden="true" />
            ))}
          </div>
          <p className={styles.gauge__scale}>
            <span>0</span>
            <span>피크 {peakValue.value}{peakValue.unit}</span>
          </p>
        </div>

        <p className={styles.output__sub}>
          <span className={styles.output__subLabel}>설비용량</span>
          <span className={styles.output__subValue}>
            {capacity.value}
            <span className={styles.output__subUnit}>{capacity.unit}</span>
          </span>
        </p>
      </div>
    </Panel>
  );
}
