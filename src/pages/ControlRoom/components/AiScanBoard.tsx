import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { AiOrbit } from '@/components/common/AiOrbit';
import { ANALYSIS_STEPS } from '@/mocks/llmDiagnosis';
import { formatNumber } from '@/utils/format';
import { ISSUES } from '@/mocks/diagnosis';
import type { School } from '@/interface/energy';
import styles from './AiScanBoard.module.scss';
import type { CSSProperties } from 'react';

/** 훑는 대상이 바뀌는 간격(ms). 이 박자에 맞춰 나머지도 함께 센다 */
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
 * AI 진단이 관내를 훑는 중임을 보여 준다 (SFR-011-05, SFR-014-04).
 *
 * 상황판은 지금 무엇이 일어나는지를 보여 주는 화면이라, 진단이 돌고 있다는 사실 자체가
 * 읽혀야 한다. 진행률로 차오르는 막대는 두지 않는다 — 다 차고 나면 멈춘 것처럼 보이고,
 * 실제로도 진단은 한 번 끝나는 일이 아니라 계속 도는 일이다.
 *
 * 대신 단계와 지금 보고 있는 설비가 계속 바뀌고, 그 아래로 방금 잡아낸 소견이 한 건씩
 * 넘어간다. 어느 소견이 와도 판 높이는 그대로다 — 벽에 걸린 화면에서 칸이 들썩이면
 * 옆 판까지 함께 밀린다.
 */
export function AiScanBoard({ plants }: { plants: School[] }) {
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((at) => at + 1), TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  const step = SCAN_STEPS[Math.floor(tick / STAGE_EVERY) % SCAN_STEPS.length];
  const target = plants.length > 0 ? plants[tick % plants.length] : null;
  const finding = ISSUES[Math.floor(tick / FINDING_EVERY) % ISSUES.length];

  return (
    <div className={styles.scan} style={{ '--stage': step.color } as CSSProperties}>
      <div className={styles.scan__head}>
        <AiOrbit size={30} active />
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

      <p className={styles.scan__target}>
        <span className={styles.scan__targetLabel}>지금 보는 중</span>
        <span className={styles.scan__targetName}>
          {target ? `${target.name} · 인버터 ${formatNumber(target.inverterCount)}대` : '조회 대상 없음'}
        </span>
      </p>

      <div className={styles.finding}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={finding.id}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.28, ease: [0.22, 0.68, 0.32, 1] }}
          >
            <p className={styles.finding__head}>
              <span className={styles.finding__where}>{finding.schoolName} · {finding.device}</span>
              <span className={styles.finding__loss}>−{formatNumber(finding.lossKwh, 1)}kWh/일</span>
            </p>
            <p className={styles.finding__body}>{finding.summary}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
