import { ANALYSIS_STEPS } from '@/mocks/llmDiagnosis';
import { cn } from '@/utils/cn';
import type { AnalysisStage } from '@/interface/diagnosis';
import styles from './AiAnalysis.module.scss';

const RADIUS = 62;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface AnalyzingProgressProps {
  percent: number;
  stage: AnalysisStage;
}

/**
 * 분석 진행 화면.
 * 게이지는 stroke-dashoffset 을 직접 계산해 그려서 rAF 없이도 값이 맞는다.
 */
export function AnalyzingProgress({ percent, stage }: AnalyzingProgressProps) {
  const currentIndex = ANALYSIS_STEPS.findIndex((step) => step.stage === stage);

  return (
    <div className={styles.progress} role="status" aria-live="polite">
      <div className={styles.gauge}>
        <svg className={styles.gauge__svg} viewBox="0 0 148 148" role="presentation">
          <circle className={styles.gauge__track} cx="74" cy="74" r={RADIUS} />
          <circle
            className={styles.gauge__value}
            cx="74"
            cy="74"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - Math.min(100, percent) / 100)}
          />
        </svg>
        <div className={styles.gauge__label}>
          <span className={styles.gauge__percent}>{Math.round(percent)}</span>
          <span className={styles.gauge__unit}>진행률 %</span>
        </div>
      </div>

      <ol className={styles.steps}>
        {ANALYSIS_STEPS.map((step, index) => {
          const isDone = index < currentIndex || (stage === 'done' && step.stage === 'done');
          const isCurrent = index === currentIndex && !isDone;

          return (
            <li
              key={step.stage}
              className={cn(styles.step, {
                [styles['step--done']]: isDone,
                [styles['step--current']]: isCurrent,
              })}
            >
              <span className={styles.step__mark}>{isDone ? '✓' : index + 1}</span>
              <span className={styles.step__text}>
                <span className={styles.step__label}>
                  {step.label}
                  {isCurrent ? (
                    <span className={styles.step__dots}>
                      <span />
                      <span />
                      <span />
                    </span>
                  ) : null}
                </span>
                <span className={styles.step__note}>{step.note}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
