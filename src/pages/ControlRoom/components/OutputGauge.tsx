import { motion, useReducedMotion } from 'motion/react';
import { CountUp } from '@/components/common/CountUp';
import { PEAK_OUTPUT } from '@/mocks/generation';
import { formatCapacity, formatNumber, scaleSi } from '@/utils/format';
import styles from './OutputGauge.module.scss';

const RADIUS = 78;
/** 위쪽이 트인 반원 게이지 — 시작·끝 각도를 240도로 잡는다. */
const ARC_LENGTH = Math.PI * RADIUS * (240 / 180);

interface OutputGaugeProps {
  /** 현재 총출력(kW) */
  outputKw: number;
  /** 조회 대상 설비용량(kW) */
  capacityKw: number;
}

/** 원호 위 한 점의 좌표. 240도 호를 아래쪽이 트이게 그린다. */
function pointAt(ratio: number) {
  const angle = (150 + ratio * 240) * (Math.PI / 180);

  return { x: 100 + Math.cos(angle) * RADIUS, y: 100 + Math.sin(angle) * RADIUS };
}

const START = pointAt(0);
const END = pointAt(1);
const ARC_PATH = `M ${START.x} ${START.y} A ${RADIUS} ${RADIUS} 0 1 1 ${END.x} ${END.y}`;

/**
 * 지금 이 순간 총출력 게이지 (SFR-004-02).
 * 피크 출력 대비 얼마나 나오고 있는지를 한눈에 보여 준다.
 */
export function OutputGauge({ outputKw, capacityKw }: OutputGaugeProps) {
  const reduceMotion = useReducedMotion();
  const peak = PEAK_OUTPUT.kw > 0 ? PEAK_OUTPUT.kw : 1;
  const ratio = Math.max(0, Math.min(1, outputKw / peak));
  const offset = ARC_LENGTH * (1 - ratio);
  // 도 전체를 더하면 kW 로는 자릿수가 길어 게이지 안에서 줄이 넘어간다.
  const output = scaleSi(outputKw, 'W');
  const capacity = formatCapacity(capacityKw);

  return (
    <div className={styles.gauge}>
      <svg className={styles.gauge__svg} viewBox="0 0 200 190" role="img" aria-label={`현재 총출력 ${formatNumber(outputKw, 1)}kW`}>
        <path className={styles.gauge__track} d={ARC_PATH} strokeDasharray={ARC_LENGTH} />
        <motion.path
          className={styles.gauge__value}
          d={ARC_PATH}
          strokeDasharray={ARC_LENGTH}
          initial={{ strokeDashoffset: reduceMotion ? offset : ARC_LENGTH }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 0.68, 0.32, 1] }}
        />
      </svg>

      <div className={styles.gauge__center}>
        <p className={styles.gauge__label}>현재 총출력</p>
        <p className={styles.gauge__number}>
          <CountUp value={output.amount} fractionDigits={output.fractionDigits} startOnView={false} />
          <span className={styles.gauge__unit}>{output.unit}</span>
        </p>
        <p className={styles.gauge__sub}>
          설비 {capacity.value}
          {capacity.unit}
        </p>
      </div>
    </div>
  );
}
