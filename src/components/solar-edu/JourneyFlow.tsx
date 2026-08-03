import { Fragment } from 'react';
import { JOURNEY_STAGES } from '@/mocks/solarEdu';
import { cn } from '@/utils/cn';
import { JOURNEY_ICONS } from './EduIcons';
import { JOURNEY_ART } from './EduScenery';
import styles from './SolarEdu.module.scss';
import type { CSSProperties } from 'react';

/** 출력이 낮을 때의 흐름 주기(ms) — 느릴수록 전기가 적게 흐른다는 뜻이다. */
const SLOWEST_MS = 1800;
const FASTEST_MS = 420;

interface JourneyFlowProps {
  /** 지금 출력 ÷ 설비용량. 흐름 속도로 옮긴다. */
  loadRatio: number;
  isLive: boolean;
}

/** 햇빛 → 태양전지 → 인버터 → 학교·계통 (SFR-005-02) */
export function JourneyFlow({ loadRatio, isLive }: JourneyFlowProps) {
  const ratio = Math.min(1, Math.max(0, loadRatio));
  const flowMs = Math.round(SLOWEST_MS - (SLOWEST_MS - FASTEST_MS) * ratio);
  const idle = !isLive || ratio <= 0;

  return (
    <div className={styles.journey}>
      {JOURNEY_STAGES.map((stage, index) => (
        <Fragment key={stage.id}>
          {index > 0 ? (
            <span className={styles.flow} aria-hidden="true">
              <span
                className={cn(styles.flow__line, { [styles['flow__line--idle']]: idle })}
                style={{ '--flow-ms': `${flowMs}ms` } as CSSProperties}
              />
            </span>
          ) : null}

          <div className={styles.stage}>
            <span className={styles.stage__art}>{JOURNEY_ART[stage.id]}</span>

            <div className={styles.stage__body}>
              <p className={styles.stage__head}>
                <span className={styles.stage__icon}>{JOURNEY_ICONS[stage.id]}</span>
                <span className={styles.stage__label}>{stage.label}</span>
                <span className={styles.stage__state}>{stage.state}</span>
              </p>
              <p className={styles.stage__detail}>{stage.detail}</p>
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
