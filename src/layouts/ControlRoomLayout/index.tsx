import { Link } from 'react-router-dom';
import { AiOrbit } from '@/pages/AiDiagnosis/components/AiOrbit';
import { CloseIcon, ExpandIcon } from '@/components/common/Icon';
import { PATH } from '@/routes/routes';
import { cn } from '@/utils/cn';
import { useFullscreen } from '@/hooks/useFullscreen';
import { RoomClock } from './RoomClock';
import styles from './ControlRoomLayout.module.scss';
import type { ReactNode } from 'react';

interface ControlRoomLayoutProps {
  /** 보고 있는 대상 이름 — 이 화면은 늘 도 전체다 */
  scopeLabel: string;
  /** 마지막 수집 시각 (YYYY-MM-DD HH:mm) */
  collectedAt: string;
  /** 수집이 지연됐는지 — 상태 스탬프 색이 바뀐다 */
  isStale: boolean;
  /** 손봐야 할 경보 중 가장 급한 결. 없으면 null — 화면 테두리가 그 색으로 점등한다. */
  alertTone: 'critical' | 'caution' | 'offline' | null;
  children: ReactNode;
}

/**
 * 통합관제 상황판 골격 (SFR-004).
 * 벽면 모니터에 띄우는 화면이라 헤더·LNB·푸터를 두지 않고 화면 폭을 다 쓴다.
 */
export function ControlRoomLayout({
  scopeLabel,
  collectedAt,
  isStale,
  alertTone,
  children,
}: ControlRoomLayoutProps) {
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  return (
    <div className={styles.room}>
      {/* 멀리서도 "지금 뭔가 잘못됐다" 가 읽히도록 화면 가장자리가 맥동한다 */}
      {alertTone ? <span className={styles.edge} data-tone={alertTone} aria-hidden="true" /> : null}

      <header className={styles.bar}>
        <div className={styles.bar__left}>
          <span className={styles.bar__brand}>
            <AiOrbit size={40} active />
            <span>
              <span className={styles.bar__title}>통합관제 상황판</span>
              <span className={styles.bar__scope}>{scopeLabel}</span>
            </span>
          </span>
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
