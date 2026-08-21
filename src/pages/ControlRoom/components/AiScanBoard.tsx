import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { AiOrbit } from '@/components/common/AiOrbit';
import { Badge, SEVERITY_LABEL, SEVERITY_TONE } from '@/components/common/Badge';
import { formatNumber } from '@/utils/format';
import { ISSUES } from '@/mocks/diagnosis';
import { Sparkline } from '@/components/common/Sparkline';
import styles from './AiScanBoard.module.scss';

/** 화면이 한 박자 나아가는 간격(ms) */
const TICK_MS = 700;

/** 몇 박자마다 새 건을 잡아내는지 */
const HIT_EVERY = 7;

/** 지금까지 훑은 계측값 — 박자마다 이만큼씩 늘어난다 */
const CHECKED_BASE = 1_284_000;
const CHECKED_STEP = 137;

/** 아래에 남겨 두는 직전 건수 */
const TRAIL = 2;

/** 심각도별 소견 수 — 몇 건인지만으로는 지금 손이 얼마나 급한지 알 수 없다 */
const SEVERITY_COUNT = (['critical', 'caution', 'info'] as const)
  .map((severity) => ({ severity, count: ISSUES.filter((issue) => issue.severity === severity).length }))
  .filter((item) => item.count > 0);

/**
 * AI 진단이 관내를 실시간으로 지켜보는 자리 (SFR-011-05, SFR-014-04).
 *
 * 단계별 진행으로 보이지 않게 한다 — 진단은 「스캔이 끝나면 분류」 처럼 차례로 나아가는 일이
 * 아니라, 값이 들어오는 대로 계속 지켜보다 이상한 것이 걸리면 그 자리에서 잡아내는 일이다.
 *
 * 그래서 화면에 두는 것은 진행률이 아니라 **훑은 양과 잡아낸 것** 이다. 계측값 수는 쉬지 않고
 * 오르고, 잡아낸 건이 위에서 밀려 들어오면 앞의 것이 아래로 내려간다.
 * 어느 소견이 와도 판 높이는 그대로다 — 벽에 걸린 화면에서 칸이 들썩이면 옆 판까지 함께 밀린다.
 */
export function AiScanBoard() {
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((at) => at + 1), TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  const checked = CHECKED_BASE + tick * CHECKED_STEP;
  const at = Math.floor(tick / HIT_EVERY);
  const hit = ISSUES[at % ISSUES.length];
  // 직전에 잡은 것들 — 새 건이 들어오면 하나씩 아래로 밀린다.
  const trail = Array.from(
    { length: TRAIL },
    (_, step) => ISSUES[(((at - step - 1) % ISSUES.length) + ISSUES.length) % ISSUES.length],
  );

  return (
    <div className={styles.scan} data-tone={SEVERITY_TONE[hit.severity]}>
      {/* 지켜보는 자리 — 빛이 쉬지 않고 가로지르고 훑은 양이 계속 오른다 */}
      <div className={styles.deck}>
        <span className={styles.deck__sweep} aria-hidden="true" />

        <div className={styles.deck__head}>
          <AiOrbit size={34} active />
          <span className={styles.deck__title}>
            <span className={styles.deck__name}>실시간 이상 감지</span>
            <span className={styles.deck__note}>
              계측값 <strong>{formatNumber(checked)}</strong>건 훑는 중
            </span>
          </span>
          <span className={styles.deck__live}>감시 중</span>
        </div>
      </div>

      <p className={styles.caption}>
        잡아낸 것
        <span className={styles.caption__count}>
          {SEVERITY_COUNT.map(({ severity, count }) => `${SEVERITY_LABEL[severity]} ${count}`).join(' · ')}
        </span>
      </p>

      {/*
        새 건은 자리를 갈아 끼운다.

        나가는 카드를 기다렸다 넣으면(AnimatePresence mode="wait") 판이 0.7초마다 다시
        그려지는 통에 퇴장이 끝나지 않아 카드가 멈춰 선다. 키가 바뀌면 곧바로 새 카드를
        세우고, 위에서 밀려 들어오는 움직임만 남긴다.
      */}
      <div className={styles.hit}>
        <motion.div
          key={hit.id}
          className={styles.hit__card}
          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.3, ease: [0.22, 0.68, 0.32, 1] }}
        >
          <p className={styles.hit__top}>
            <Badge tone={SEVERITY_TONE[hit.severity]} withDot>{SEVERITY_LABEL[hit.severity]}</Badge>
            <span className={styles.hit__category}>{hit.category}</span>
            <span className={styles.hit__at}>{hit.detectedAt.slice(5, 16)}</span>
          </p>

          <p className={styles.hit__where}>
            <span className={styles.hit__place}>{hit.schoolName} · {hit.device}</span>
            {/* 판정의 근거가 된 이레 동안의 흐름 — 문장만 있으면 무엇을 보고 그랬는지 알 수 없다 */}
            <Sparkline
              values={hit.trend}
              width={64}
              height={16}
              tone={hit.severity === 'critical' ? 'critical' : 'caution'}
              animate={false}
            />
            <span className={styles.hit__loss}>
              <strong>−{formatNumber(hit.lossKwh, 1)}</strong>
              kWh/일
            </span>
          </p>

          <p className={styles.hit__body}>{hit.summary}</p>
          <p className={styles.hit__action}>{hit.action}</p>
        </motion.div>
      </div>

      {/* 앞서 잡은 것들. 새 건이 들어오면 한 칸씩 내려간다 */}
      <ul className={styles.trail}>
        {trail.map((issue) => (
          <motion.li
            key={issue.id}
            className={styles.trail__row}
            data-tone={SEVERITY_TONE[issue.severity]}
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.26, ease: [0.22, 0.68, 0.32, 1] }}
          >
            <span className={styles.trail__at}>{issue.detectedAt.slice(11, 16)}</span>
            <span className={styles.trail__place}>{issue.schoolName}</span>
            <span className={styles.trail__category}>{issue.category}</span>
            <span className={styles.trail__loss}>−{formatNumber(issue.lossKwh, 1)}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
