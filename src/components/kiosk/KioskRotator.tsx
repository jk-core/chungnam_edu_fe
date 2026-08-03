import { KIOSK_PANELS } from '@/mocks/kiosk';
import { cn } from '@/utils/cn';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import styles from './Kiosk.module.scss';

const ROTATE_MS = 9000;

/** 설명 패널 자동 순환 (SFR-005-07/08) — 조작 없이 스스로 넘어간다. */
export function KioskRotator() {
  const index = useAutoRefresh(ROTATE_MS, KIOSK_PANELS.length);
  const panel = KIOSK_PANELS[index];

  return (
    <section className={styles.rotator} aria-live="polite">
      <h2 className={styles.rotator__title}>{panel.title}</h2>
      <p className={styles.rotator__body}>{panel.body}</p>

      <div className={styles.rotator__dots} aria-hidden="true">
        {KIOSK_PANELS.map((item, dotIndex) => (
          <span
            key={item.title}
            className={cn(styles.rotator__dot, { [styles['rotator__dot--active']]: dotIndex === index })}
          />
        ))}
      </div>
    </section>
  );
}
