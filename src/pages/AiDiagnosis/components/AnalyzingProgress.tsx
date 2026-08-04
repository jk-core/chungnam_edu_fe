import { ANALYSIS_STEPS } from '@/mocks/llmDiagnosis';
import { CheckIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import type { AnalysisStage } from '@/interface/diagnosis';
import styles from './AiAnalysis.module.scss';
import { AiOrbit } from './AiOrbit';
import type { CSSProperties } from 'react';

const SIZE = 176;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** 단계 롤러 — 현재 단계를 가운데 두고 앞뒤가 살짝 비치게 굴린다. */
const STEP_HEIGHT = 62;
const STEP_GAP = 10;
const STEP_STRIDE = STEP_HEIGHT + STEP_GAP;
const ROLLER_HEIGHT = 148;
const ROLL_OFFSET = ROLLER_HEIGHT / 2 - STEP_HEIGHT / 2;

interface AnalyzingProgressProps {
  percent: number;
  stage: AnalysisStage;
}

/**
 * 분석 진행 화면.
 * 게이지는 stroke-dashoffset 을 직접 계산해 그려서 rAF 없이도 값이 맞는다.
 * 단계가 바뀌면 게이지·숫자·후광이 그 단계 색으로 함께 넘어간다.
 */
export function AnalyzingProgress({ percent, stage }: AnalyzingProgressProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const currentIndex = Math.max(0, ANALYSIS_STEPS.findIndex((step) => step.stage === stage));
  const current = ANALYSIS_STEPS[currentIndex];
  const isDone = stage === 'done';

  const shell = {
    '--ai-stage': current.color,
    '--roll': `${ROLL_OFFSET - currentIndex * STEP_STRIDE}px`,
  } as CSSProperties;

  return (
    <div className={styles.progress} style={shell} role="status" aria-live="polite">
      <div className={styles.gauge}>
        {/* 게이지 뒤에서 도는 후광 — 분석이 살아 있다는 신호 */}
        <span className={styles.gauge__aura} aria-hidden />
        <span className={styles.gauge__sweep} aria-hidden />

        <svg className={styles.gauge__svg} viewBox={`0 0 ${SIZE} ${SIZE}`} role="presentation">
          <circle className={styles.gauge__track} cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} />
          <circle
            className={styles.gauge__value}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - clamped / 100)}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>

        <div className={styles.gauge__label}>
          <span className={styles.gauge__percent}>
            {Math.round(clamped)}
            <small>%</small>
          </span>
          <span className={styles.gauge__unit}>{isDone ? '완료' : '분석 중'}</span>
        </div>
      </div>

      <header className={styles.progress__head}>
        <span className={styles.progress__badge}>
          <AiOrbit size={16} active={!isDone} />
          AI Analysis
        </span>
        <p className={styles.progress__title}>
          {isDone ? 'AI가 진단을 마쳤습니다' : 'AI가 발전 데이터를 분석하고 있습니다'}
        </p>
        <p className={styles.progress__desc}>{current.note}</p>
      </header>

      <div className={styles.roller} style={{ height: ROLLER_HEIGHT }}>
        <ol className={styles.roller__track}>
          {ANALYSIS_STEPS.map((step, index) => {
            const done = index < currentIndex || (isDone && step.stage === 'done');
            const active = index === currentIndex && !done;
            const distance = Math.abs(index - currentIndex);

            return (
              <li
                key={step.stage}
                className={cn(styles.step, {
                  [styles['step--done']]: done,
                  [styles['step--current']]: active,
                })}
                style={{
                  '--step-color': step.color,
                  // 멀어질수록 흐려져 지금 단계만 또렷하게 남는다
                  opacity: distance === 0 ? 1 : distance === 1 ? 0.46 : 0.14,
                  filter: distance === 0 ? 'none' : `blur(${distance === 1 ? 1.1 : 2.2}px)`,
                  height: STEP_HEIGHT,
                } as CSSProperties}
              >
                <span className={styles.step__mark} aria-hidden>
                  {done ? <CheckIcon width={13} height={13} /> : index + 1}
                </span>
                <span className={styles.step__text}>
                  <span className={styles.step__label}>{step.label}</span>
                  <span className={styles.step__note}>{step.note}</span>
                </span>
                <span className={styles.step__state}>{done ? '완료' : active ? '진행 중' : '대기'}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
