import { CountUp } from '@/components/common/CountUp';
import { PEAK_OUTPUT } from '@/mocks/generation';
import { formatCapacity, formatPercent, scaleSi } from '@/utils/format';
import { Panel } from './Panel';
import styles from './OutputPanel.module.scss';

interface OutputPanelProps {
  totals: { outputKw: number; capacityKw: number };
}

/**
 * 현재 총출력 (SFR-004-02) — 아틀라스 판.
 *
 * A 는 위가 트인 반원 게이지로 그렸다. 곡선 눈금은 계기판의 결이라 이 시안의 인쇄면과 다투므로,
 * 여기서는 **곧은 눈금자** 로 바꾼다 — 0 부터 설비용량까지 한 줄로 긋고 지금 출력만큼 채운 뒤,
 * 그동안의 최대출력 자리에 눈금 하나를 세운다. 지금 값이 제 설비의 어디쯤이고 여태 정점과
 * 얼마나 떨어져 있는지가 자와 눈금 하나로 읽힌다.
 *
 * 두 비율을 밑에 나란히 적는다 — 설비용량 대비는 「제 몸집의 몇 할을 쓰고 있나」 이고,
 * 최대출력 대비는 「오늘이 여태 정점에 얼마나 가까운가」 라 물음이 다르다.
 */
export function OutputPanel({ totals }: OutputPanelProps) {
  const { outputKw, capacityKw } = totals;
  const peak = PEAK_OUTPUT.kw > 0 ? PEAK_OUTPUT.kw : 1;
  const capacity = capacityKw > 0 ? capacityKw : 1;

  // 눈금자는 0~설비용량이다. 지금 출력을 채우고, 최대출력 자리에 눈금 하나를 세운다.
  const fillRatio = Math.max(0, Math.min(1, outputKw / capacity));
  const peakRatio = Math.max(0, Math.min(1, peak / capacity));

  const reading = scaleSi(outputKw, 'W');
  const cap = formatCapacity(capacityKw);

  return (
    <Panel title="현재 총출력" note={`설비 ${cap.value}${cap.unit}`}>
      <div className={styles.output}>
        <p className={styles.output__reading}>
          <CountUp
            className={styles.output__amount}
            value={reading.amount}
            fractionDigits={reading.fractionDigits}
            startOnView={false}
          />
          <span className={styles.output__unit}>{reading.unit}</span>
        </p>

        <div className={styles.scale}>
          <span className={styles.scale__rule}>
            <span className={styles.scale__fill} style={{ width: `${fillRatio * 100}%` }} />
            <span className={styles.scale__peak} style={{ left: `${peakRatio * 100}%` }} aria-hidden="true" />
          </span>
          <span className={styles.scale__ends}>
            <span>0</span>
            <span>{`${cap.value}${cap.unit}`}</span>
          </span>
        </div>

        <dl className={styles.figures}>
          <div className={styles.figures__cell}>
            <dt className={styles.figures__label}>설비용량 대비</dt>
            <dd className={styles.figures__value}>{formatPercent(outputKw / capacity, 1)}</dd>
          </div>
          <div className={styles.figures__cell}>
            <dt className={styles.figures__label}>최대출력 대비</dt>
            <dd className={styles.figures__value}>{formatPercent(outputKw / peak, 1)}</dd>
          </div>
        </dl>
      </div>
    </Panel>
  );
}
