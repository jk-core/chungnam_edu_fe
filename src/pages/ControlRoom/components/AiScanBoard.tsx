import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { AiOrbit } from '@/components/common/AiOrbit';
import { ANALYSIS_STEPS } from '@/mocks/llmDiagnosis';
import { Badge, SEVERITY_LABEL, SEVERITY_TONE } from '@/components/common/Badge';
import { formatNumber } from '@/utils/format';
import { ISSUES } from '@/mocks/diagnosis';
import { Sparkline } from '@/components/common/Sparkline';
import type { AnalysisStage } from '@/interface/diagnosis';
import styles from './AiScanBoard.module.scss';
import type { CSSProperties } from 'react';

/** 대조 항목이 하나씩 켜지는 간격(ms). 이 박자에 맞춰 나머지도 함께 센다 */
const TICK_MS = 700;

/** 몇 박자마다 단계가 넘어가는지 / 소견이 바뀌는지 */
const STAGE_EVERY = 5;
const FINDING_EVERY = 7;

/**
 * 도는 단계.
 * 마지막 「완료」 는 빼고 셋만 돌린다 — 진단은 관내를 계속 훑는 일이라 끝나는 자리가 없다.
 */
const SCAN_STEPS = ANALYSIS_STEPS.filter((step) => step.stage !== 'done');

/**
 * 단계마다 무엇을 대조하는지.
 *
 * 「분석 중」 한마디로는 무엇을 하는 중인지 알 수 없다. 실제로 짚어 보는 것들을 하나씩
 * 켜 보이면, 이 판정이 어디서 나온 것인지가 보는 사람에게 읽힌다.
 */
const CHECKS: Record<AnalysisStage, string[]> = {
  scan: ['결측 구간', '이상치', '계측 지연'],
  classify: ['일사량 대조', '인접 학교 비교', '고장코드 매칭'],
  reason: ['최근 7일 추이', '과거 조치 이력', '권고 문장'],
  done: [],
};

/**
 * AI 진단이 관내를 훑는 중임을 보여 준다 (SFR-011-05, SFR-014-04).
 *
 * 상황판은 지금 무엇이 일어나는지를 보여 주는 화면이라, 진단이 돌고 있다는 사실 자체가
 * 읽혀야 한다. 진행률로 차오르는 막대는 두지 않는다 — 다 차고 나면 멈춘 것처럼 보이고,
 * 실제로도 진단은 한 번 끝나는 일이 아니라 계속 도는 일이다.
 *
 * 위쪽은 지금 무엇을 대조하는 중인지, 아래쪽은 그렇게 해서 잡아낸 소견 한 건이다.
 * 어느 소견이 와도 판 높이는 그대로다 — 벽에 걸린 화면에서 칸이 들썩이면 옆 판까지 함께 밀린다.
 */
export function AiScanBoard() {
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((at) => at + 1), TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  const step = SCAN_STEPS[Math.floor(tick / STAGE_EVERY) % SCAN_STEPS.length];
  const checks = CHECKS[step.stage];
  const checking = tick % checks.length;
  const finding = ISSUES[Math.floor(tick / FINDING_EVERY) % ISSUES.length];

  return (
    <div className={styles.scan} style={{ '--stage': step.color } as CSSProperties}>
      <div className={styles.scan__head}>
        <AiOrbit size={26} active />
        <span className={styles.scan__stage}>
          <span className={styles.scan__label}>{step.label}</span>
          <span className={styles.scan__note}>{step.note}</span>
        </span>
        <span className={styles.scan__live}>진단 중</span>
      </div>

      {/* 빛이 왼쪽에서 오른쪽으로 계속 흐른다 — 차오르는 막대와 달리 끝나는 자리가 없다 */}
      <div className={styles.scan__track} aria-hidden="true">
        <span className={styles.scan__sweep} />
      </div>

      {/* 지금 대조하는 항목만 물들고 나머지는 물러나 있다 */}
      <ul className={styles.checks} aria-label={`${step.label} 대조 항목`}>
        {checks.map((check, index) => (
          <li
            key={check}
            className={styles.checks__item}
            data-state={index === checking ? 'on' : index < checking ? 'done' : undefined}
          >
            {check}
          </li>
        ))}
      </ul>

      <div className={styles.finding}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={finding.id}
            className={styles.finding__card}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.28, ease: [0.22, 0.68, 0.32, 1] }}
          >
            <p className={styles.finding__top}>
              <Badge tone={SEVERITY_TONE[finding.severity]} withDot>
                {SEVERITY_LABEL[finding.severity]}
              </Badge>
              <span className={styles.finding__category}>{finding.category}</span>
              <span className={styles.finding__at}>{finding.detectedAt.slice(5, 16)}</span>
            </p>

            <p className={styles.finding__where}>
              <span className={styles.finding__place}>{finding.schoolName} · {finding.device}</span>
              {/* 판정의 근거가 된 이레 동안의 흐름 — 문장만 있으면 무엇을 보고 그랬는지 알 수 없다 */}
              <Sparkline
                values={finding.trend}
                width={64}
                height={16}
                tone={finding.severity === 'critical' ? 'critical' : 'caution'}
                animate={false}
              />
              <span className={styles.finding__loss}>
                <strong>−{formatNumber(finding.lossKwh, 1)}</strong>
                kWh/일
              </span>
            </p>

            <p className={styles.finding__body}>{finding.summary}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
