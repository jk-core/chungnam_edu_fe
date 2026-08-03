import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AiOrbit } from '@/pages/AiDiagnosis/components/AiOrbit';
import { CloseIcon, ExpandIcon } from '@/components/common/Icon';
import { PATH } from '@/routes/routes';
import { PlantPicker } from '@/components/plant/PlantPicker';
import { cn } from '@/utils/cn';
import { RoomClock } from './RoomClock';
import styles from './ControlRoomLayout.module.scss';
import type { ReactNode } from 'react';

interface ControlRoomLayoutProps {
  /** 지금 보고 있는 대상 이름 */
  scopeLabel: string;
  /** 마지막 수집 시각 (YYYY-MM-DD HH:mm) */
  collectedAt: string;
  /** 수집이 지연됐는지 — 상태 스탬프 색이 바뀐다 */
  isStale: boolean;
  children: ReactNode;
}

/**
 * 통합관제 상황판 골격 (SFR-004).
 * 벽면 모니터에 띄우는 화면이라 헤더·LNB·푸터를 두지 않고 화면 폭을 다 쓴다.
 */
export function ControlRoomLayout({ scopeLabel, collectedAt, isStale, children }: ControlRoomLayoutProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement !== null);

    document.addEventListener('fullscreenchange', sync);

    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();

      return;
    }

    void document.documentElement.requestFullscreen().catch(() => {
      // 브라우저가 막으면 그냥 창 모드로 둔다.
    });
  }, []);

  return (
    <div className={styles.room}>
      <header className={styles.bar}>
        <div className={styles.bar__left}>
          <span className={styles.bar__brand}>
            <AiOrbit size={40} active />
            <span>
              <span className={styles.bar__title}>통합관제 상황판</span>
              <span className={styles.bar__scope}>{scopeLabel}</span>
            </span>
          </span>

          <PlantPicker variant="inline" />
        </div>

        <div className={styles.bar__right}>
          <span className={cn(styles.stamp, { [styles['stamp--stale']]: isStale })}>
            <span className={styles.pulse} aria-hidden="true" />
            <span className={styles.stamp__label}>최근 수집</span>
            <span className={styles.stamp__value}>{collectedAt}</span>
          </span>

          <RoomClock />

          <button type="button" className={styles.bar__action} onClick={toggleFullscreen}>
            <ExpandIcon width={16} height={16} />
            {isFullscreen ? '창 모드' : '전체화면'}
          </button>

          <Link to={PATH.HOME} className={styles.bar__action}>
            <CloseIcon width={16} height={16} />
            나가기
          </Link>
        </div>
      </header>

      <div className={styles.room__body}>{children}</div>
    </div>
  );
}
