import { CountUp } from '@/components/common/CountUp';
import { PEAK_OUTPUT } from '@/mocks/generation';
import { formatCapacity, formatPercent, scaleSi } from '@/utils/format';
import { Panel } from './Panel';
import styles from './OutputPanel.module.scss';

interface Totals {
  outputKw: number;
  capacityKw: number;
}

/**
 * 현재 총출력 (SFR-004-02).
 *
 * 가로로 납작한 칸이다. A 의 반원 게이지는 세로로 자리를 먹어 이 칸에서는 위아래가 잘리므로
 * 걷어내고, 큰 수치 하나를 왼쪽에 세운 뒤 오른쪽에 가로 막대 두 줄을 편다. 걸어 두고 몇 걸음
 * 떨어져 보는 판이라 「지금 얼마나」 를 한 수치로 먼저 읽히게 하고, 견줄 잣대(최대·설비)는
 * 막대가 받친다. 최대 대비는 호박, 설비 대비는 남색으로 갈라 두 막대가 서로 다른 물음에
 * 답하는 것임을 색으로 알린다.
 */
export function OutputPanel({ totals }: { totals: Totals }) {
  const peak = PEAK_OUTPUT.kw > 0 ? PEAK_OUTPUT.kw : 1;
  const peakRatio = Math.max(0, Math.min(1, totals.outputKw / peak));
  const capacityRatio = totals.capacityKw > 0 ? totals.outputKw / totals.capacityKw : 0;
  const output = scaleSi(totals.outputKw, 'W');
  const capacity = formatCapacity(totals.capacityKw);

  const meters = [
    { id: 'peak', label: '최대 출력 대비', ratio: peakRatio, tone: 'solar' },
    { id: 'capacity', label: '설비용량 대비', ratio: capacityRatio, tone: 'brand' },
  ];

  return (
    <Panel title="현재 총출력">
      <div className={styles.output}>
        <p className={styles.output__now}>
          <span className={styles.output__value}>
            <CountUp value={output.amount} fractionDigits={output.fractionDigits} startOnView={false} />
            <span className={styles.output__unit}>{output.unit}</span>
          </span>
          <span className={styles.output__sub}>
            설비 {capacity.value}
            {capacity.unit}
          </span>
        </p>

        <dl className={styles.output__meters}>
          {meters.map((meter) => (
            <div key={meter.id} className={styles.meter}>
              <dt className={styles.meter__label}>{meter.label}</dt>
              <dd className={styles.meter__value}>{formatPercent(meter.ratio, 1)}</dd>
              <span className={styles.meter__track}>
                <span
                  className={styles.meter__fill}
                  data-tone={meter.tone}
                  style={{ width: `${Math.min(100, meter.ratio * 100)}%` }}
                />
              </span>
            </div>
          ))}
        </dl>
      </div>
    </Panel>
  );
}
