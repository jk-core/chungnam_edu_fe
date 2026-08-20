import { useEffect, useState } from 'react';
import { AiOrbit } from '@/components/common/AiOrbit';
import { ANALYSIS_STEPS, stageOf } from '@/mocks/llmDiagnosis';
import { formatNumber } from '@/utils/format';
import { ISSUES } from '@/mocks/diagnosis';
import styles from './AiScanBoard.module.scss';
import type { CSSProperties } from 'react';

/** 한 바퀴 도는 데 걸리는 시간(ms) — 다 채우면 잠시 머물렀다 다시 훑는다 */
const SCAN_MS = 20_000;
const HOLD_MS = 4_000;

/** 진행률을 다시 그리는 간격(ms). 눈에는 이어져 보이면서 초당 다섯 번이면 충분하다 */
const TICK_MS = 200;

/** 잡아낸 것 한 건이 머무는 시간(ms) */
const FINDING_MS = 5_000;

/**
 * AI 진단이 관내를 훑는 중임을 보여 준다 (SFR-011-05, SFR-014-04).
 *
 * 상황판은 지금 무엇이 일어나는지를 보여 주는 화면이라, 진단이 돌고 있다는 사실 자체가
 * 읽혀야 한다. 훑기 → 분류 → 추론 세 단계를 진행률과 함께 적고, 그 아래로 방금 잡아낸
 * 소견을 한 건씩 흘려 보낸다.
 *
 * 목업이라 진행률은 스스로 돌지만, 실제 연동에서는 진단 작업의 진행률이 그대로 들어온다.
 */
export function AiScanBoard({ plantCount }: { plantCount: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setElapsed((at) => (at + TICK_MS) % (SCAN_MS + HOLD_MS)),
      TICK_MS,
    );

    return () => window.clearInterval(timer);
  }, []);

  const percent = Math.min(100, Math.round((elapsed / SCAN_MS) * 100));
  const step = ANALYSIS_STEPS.find((item) => item.stage === stageOf(percent)) ?? ANALYSIS_STEPS[0];
  const finding = ISSUES[Math.floor(elapsed / FINDING_MS) % ISSUES.length];

  return (
    <div className={styles.scan} style={{ '--stage': step.color } as CSSProperties}>
      <div className={styles.scan__head}>
        <AiOrbit size={30} active={percent < 100} />
        <span className={styles.scan__stage}>
          <span className={styles.scan__label}>{step.label}</span>
          <span className={styles.scan__note}>
            {percent < 100 ? step.note : `${formatNumber(plantCount)}개소를 훑었습니다`}
          </span>
        </span>
        <span className={styles.scan__percent}>{percent}%</span>
      </div>

      <div
        className={styles.scan__track}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="AI 진단 진행률"
      >
        <span className={styles.scan__fill} style={{ width: `${percent}%` }} />
      </div>

      <div className={styles.finding}>
        <p className={styles.finding__head}>
          <span className={styles.finding__where}>{finding.schoolName} · {finding.device}</span>
          <span className={styles.finding__loss}>−{formatNumber(finding.lossKwh, 1)}kWh/일</span>
        </p>
        <p className={styles.finding__body}>{finding.summary}</p>
      </div>
    </div>
  );
}
