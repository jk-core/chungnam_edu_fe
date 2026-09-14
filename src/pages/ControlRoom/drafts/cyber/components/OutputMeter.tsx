import { PEAK_OUTPUT } from '@/mocks/generation';
import { formatCapacity, formatNumber, formatPercent, scaleSi } from '@/utils/format';
import { CyberPanel } from './CyberPanel';
import { FixedDigits } from './FixedDigits';
import styles from './OutputMeter.module.scss';

/** 눈금 칸 수 — 피크 대비 채움을 이만큼으로 끊어 계측기의 바 그래프로 읽힌다 */
const TICKS = 28;

interface OutputMeterProps {
  outputKw: number;
  capacityKw: number;
}

/**
 * 현재 총출력 (SFR-004-02).
 *
 * 담는 것은 시안 A 의 `OutputGauge` 와 같다 — 지금 출력, 피크(최대출력) 대비 게이지, 설비용량
 * 대비 비율. A 는 위가 트인 반원 게이지로 그렸지만, 이 판은 300×145 의 좁고 납작한 칸이라
 * 반원을 넣으면 원이 칸을 넘거나 작아진다. 계측 장비의 결에 맞춰 **가로 바 그래프**로 눕힌다 —
 * 납작한 칸의 폭을 그대로 눈금으로 쓰고, 큰 수치를 왼쪽에 세운다.
 */
export function OutputMeter({ outputKw, capacityKw }: OutputMeterProps) {
  const peak = PEAK_OUTPUT.kw > 0 ? PEAK_OUTPUT.kw : 1;
  const peakRatio = Math.max(0, Math.min(1, outputKw / peak));
  const capacityRatio = capacityKw > 0 ? outputKw / capacityKw : 0;

  // 도 전체를 kW 로 두면 자릿수가 길어 칸을 넘는다 — M·G 로 끌어올린 값을 세운다.
  const output = scaleSi(outputKw, 'W');
  const capacity = formatCapacity(capacityKw);
  const lit = Math.round(peakRatio * TICKS);

  return (
    <CyberPanel title="현재 총출력" note={`피크 ${formatPercent(peakRatio, 0)}`}>
      <div className={styles.meter}>
        <p className={styles.meter__value}>
          <FixedDigits text={formatNumber(output.amount, output.fractionDigits)} />
          <span className={styles.meter__unit}>{output.unit}</span>
        </p>

        {/* 피크(최대출력) 대비 눈금 — 채운 칸이 지금 얼마나 내고 있는지를 길이로 읽힌다 */}
        <div
          className={styles.meter__ticks}
          role="img"
          aria-label={`피크 대비 ${formatPercent(peakRatio, 0)}`}
        >
          {Array.from({ length: TICKS }, (_, index) => (
            <span key={index} className={styles.meter__tick} data-on={index < lit ? '' : undefined} />
          ))}
        </div>

        <p className={styles.meter__foot}>
          <span>설비 <strong>{capacity.value}{capacity.unit}</strong></span>
          <span>설비 대비 <strong>{formatPercent(capacityRatio, 1)}</strong></span>
        </p>
      </div>
    </CyberPanel>
  );
}
