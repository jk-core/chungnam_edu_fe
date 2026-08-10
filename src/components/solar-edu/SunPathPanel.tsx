import { cn } from '@/utils/cn';
import type { EduContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { SunPathArt } from './SunPathArt';
import styles from './SolarEdu.module.scss';

interface SunPathPanelProps {
  stats: EduStats;
  large?: boolean;
  content: EduContent['sunPath'];
}

/**
 * 해가 하루 동안 지나가는 길 (SFR-005-03).
 * 왼쪽 그림이 해의 높이가 어떻게 달라지는지 보이고, 오른쪽 글이 그것이 왜 발전량을 가르는지 짚는다.
 */
export function SunPathPanel({ stats, content, large }: SunPathPanelProps) {
  return (
    <section className={cn(styles.panel, { [styles['panel--large']]: large })}>
      <p className={styles.panel__head}>
        {content.head}
        <span className={styles.panel__note}>{content.note}</span>
      </p>

      <div className={styles.split}>
        <div className={styles.split__art}>
          <SunPathArt nowHour={stats.nowHour} />
        </div>

        <div className={styles.split__notes}>
          {content.notes.map((note) => (
            <div key={note.id} className={styles.note}>
              <p className={styles.note__term}>{note.term}</p>
              <p className={styles.note__body}>{note.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
