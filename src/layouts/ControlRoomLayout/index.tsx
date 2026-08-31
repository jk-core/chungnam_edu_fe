import { Link } from 'react-router-dom';
import { AiOrbit } from '@/components/common/AiOrbit';
import { CloseIcon, ExpandIcon, SearchIcon } from '@/components/common/Icon';
import { PATH } from '@/routes/routes';
import { useFullscreen } from '@/hooks/useFullscreen';
import { RoomClock } from './RoomClock';
import styles from './ControlRoomLayout.module.scss';
import type { ReactNode } from 'react';

interface ControlRoomLayoutProps {
  /** 보고 있는 대상 이름 — 이 화면은 늘 도 전체다 */
  scopeLabel: string;
  /**
   * 어느 시안을 보고 있는지.
   *
   * 시안 여럿을 나란히 놓고 고르는 동안에만 쓴다 — 화면끼리 생김새가 크게 달라
   * 이름표가 없으면 회의 자리에서 "왼쪽 그거" 로만 불리게 된다. 고르고 나면 지운다.
   */
  variantLabel?: string;
  /** 손봐야 할 경보 중 가장 급한 결. 없으면 null — 화면 테두리와 바탕이 그 색으로 점등한다. */
  alertTone: 'critical' | 'caution' | 'offline' | null;
  /** 검색창을 눌렀을 때 — 조회 조건 모달을 연다 (SFR-004-11/12) */
  onSearch: () => void;
  /** 걸어 둔 조건 요약. 없으면 안내 문구를 대신 띄운다 */
  searchSummary?: string;
  /** 화면에 깔린 값이 언제 수집된 것인지 (`YYYY-MM-DD HH:mm`) */
  collectedAt?: string;
  /**
   * 화면의 결. 주지 않으면 서비스 기본 색을 쓴다.
   *
   * 시안을 견주는 동안에만 쓴다 — 판과 값은 그대로 두고 색·글꼴만 갈아 끼워,
   * 무엇 때문에 다르게 읽히는지가 그 하나로 좁혀지게 한다.
   */
  skin?: 'cyber';
  children: ReactNode;
}

/**
 * 통합관제 상황판 골격 (SFR-004).
 * 벽면 모니터에 띄우는 화면이라 헤더·LNB·푸터를 두지 않고 화면 폭을 다 쓴다.
 */
export function ControlRoomLayout({
  scopeLabel,
  variantLabel,
  alertTone,
  onSearch,
  searchSummary,
  collectedAt,
  skin,
  children,
}: ControlRoomLayoutProps) {
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  return (
    /* 결을 화면 전체가 물려받는다 — 바탕과 가장자리가 같은 색으로 함께 점등한다 */
    <div className={styles.room} data-alert={alertTone ?? undefined} data-skin={skin}>
      {/* 멀리서도 "지금 뭔가 잘못됐다" 가 읽히도록 화면 가장자리가 맥동한다 */}
      {/*
        가장자리 경보 등 — 상시 점멸이 되어 걷어냈다(2026-08-21 회의). 되살릴 때는 이 줄만 풀면 된다.
        {alertTone ? <span className={styles.edge} aria-hidden="true" /> : null}
      */}

      <header className={styles.bar}>
        <div className={styles.bar__left}>
          <span className={styles.bar__brand}>
            <AiOrbit size={40} active />
            <span>
              <span className={styles.bar__title}>통합관제 상황판</span>
              <span className={styles.bar__scope}>
                {scopeLabel}
                {variantLabel ? <em className={styles.bar__variant}>{variantLabel}</em> : null}
              </span>
            </span>
          </span>
        </div>

        <div className={styles.bar__right}>
          {/* 조회 조건 (SFR-004-11/12) */}
          <button type="button" className={styles.search} onClick={onSearch}>
            <SearchIcon width={16} height={16} aria-hidden />
            <span className={styles.search__text}>
              {searchSummary ?? '학교·설비 검색'}
            </span>
          </button>

          {/*
            화면에 깔린 값이 언제 기준인지.
            벽시계 옆에 붙여 지금 시각과 곧바로 견주게 한다 — 둘이 벌어져 있으면 그 자체가
            수집이 밀렸다는 신호다 (SFR-004-04/05).
          */}
          <span className={styles.collected}>
            최근 수집
            <strong>{collectedAt}</strong>
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
