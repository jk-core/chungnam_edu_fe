import { motion, useReducedMotion } from 'motion/react';
import { useCountUp } from '@/hooks/useCountUp';
import { formatNumber, formatPercent } from '@/utils/format';
import type { HealthReport } from '@/mocks/diagnosis';
import styles from './HealthGauge.module.scss';

const RADIUS = 92;
// 반원 게이지 — 아래쪽 절반은 비워 두고 위 180°만 쓴다.
const ARC_LENGTH = Math.PI * RADIUS;

interface HealthGaugeProps {
  report: HealthReport;
}

export function HealthGauge({ report }: HealthGaugeProps) {
  const reduceMotion = useReducedMotion();
  const score = useCountUp(report.score, { duration: 1400 });
  const ratio = report.score / 100;
  const delta = report.score - report.previousScore;

  return (
    <div className={styles.gauge}>
      <div className={styles.gauge__dial}>
        <svg viewBox="0 0 220 128" className={styles.gauge__svg} aria-hidden="true">
          <path d={`M 18 110 A ${RADIUS} ${RADIUS} 0 0 1 202 110`} className={styles.gauge__track} fill="none" />
          <motion.path
            key={report.score}
            d={`M 18 110 A ${RADIUS} ${RADIUS} 0 0 1 202 110`}
            className={styles.gauge__fill}
            fill="none"
            strokeDasharray={ARC_LENGTH}
            initial={{ strokeDashoffset: reduceMotion ? ARC_LENGTH * (1 - ratio) : ARC_LENGTH }}
            animate={{ strokeDashoffset: ARC_LENGTH * (1 - ratio) }}
            transition={{ duration: 1.4, ease: [0.22, 0.68, 0.32, 1] }}
          />
        </svg>

        <div className={styles.gauge__readout}>
          <p className={styles.gauge__score}>{formatNumber(score, 0)}</p>
          <p className={styles.gauge__scoreLabel}>종합 진단 점수</p>
          <p className={styles.gauge__delta}>
            지난 주 대비 {delta >= 0 ? '+' : ''}
            {delta}점
          </p>
        </div>
      </div>

      <ul className={styles.gauge__factors}>
        {report.factors.map((factor, index) => (
          <li key={factor.label} className={styles.gauge__factor}>
            <div className={styles.gauge__factorHead}>
              <span className={styles.gauge__factorLabel}>{factor.label}</span>
              <span className={styles.gauge__factorValue}>{formatPercent(factor.value, 0)}</span>
            </div>
            <div className={styles.gauge__factorTrack}>
              <motion.div
                key={`${factor.label}-${factor.value}`}
                className={styles.gauge__factorFill}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: factor.value }}
                transition={{ duration: 0.9, delay: 0.2 + index * 0.08, ease: [0.22, 0.68, 0.32, 1] }}
              />
            </div>
            <p className={styles.gauge__factorNote}>{factor.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
