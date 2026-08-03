import { PRINCIPLES } from '@/mocks/solarEdu';
import type { EduStats } from '@/mocks/solarEdu';
import { PRINCIPLE_ICONS } from './EduIcons';
import { JourneyFlow } from './JourneyFlow';
import styles from './SolarEdu.module.scss';

interface PrincipleSceneProps {
  stats: EduStats;
}

/**
 * 씬 2 — 전기가 되는 과정 (SFR-005-02).
 * 씬 1에서 본 흐름 그림을 그대로 이어받아, 각 단계가 어떤 물리 현상인지로 넘어간다.
 */
export function PrincipleScene({ stats }: PrincipleSceneProps) {
  return (
    <div className={styles.scene}>
      <JourneyFlow loadRatio={stats.loadRatio} isLive={stats.isLive} />

      <div className={styles.list}>
        {PRINCIPLES.map((principle) => (
          <div key={principle.id} className={styles.term}>
            <p className={styles.term__name}>
              <span className={styles.term__icon}>{PRINCIPLE_ICONS[principle.id]}</span>
              {principle.term}
            </p>
            <p className={styles.term__summary}>{principle.summary}</p>
            <p className={styles.term__body}>{principle.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
