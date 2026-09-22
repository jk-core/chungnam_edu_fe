import { Link } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';
import { CloseIcon, ExpandIcon, MoonIcon, SearchIcon, SunIcon } from '@/components/common/Icon';
import { PATH } from '@/routes/routes';
import { useFullscreen } from '@/hooks/useFullscreen';
import { RoomClock } from './RoomClock';
import { useRoomTheme } from './useRoomTheme';
import styles from './ControlRoomLayout.module.scss';
import type { ReactNode } from 'react';

interface ControlRoomLayoutProps {
  /**
   * 보고 있는 대상 이름 — 이 화면은 늘 도 전체다.
   *
   * 머리에 적지 않는다 (2026-09-04 회의 — 둘째 줄 삭제). 시스템 이름 한 줄만 크게 세우고,
   * 무엇을 보고 있는지는 판마다 제 이름 옆에서 말한다. 보조기술이 읽을 이름으로만 남긴다.
   */
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
  children,
}: ControlRoomLayoutProps) {
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const { theme, toggle: toggleTheme } = useRoomTheme();

  return (
    <div className={styles.room} data-alert={alertTone ?? undefined}>
      {/* 멀리서도 "지금 뭔가 잘못됐다" 가 읽히도록 화면 가장자리가 맥동한다 */}
      {/*
        가장자리 경보 등 — 상시 점멸이 되어 걷어냈다(2026-08-21 회의). 되살릴 때는 이 줄만 풀면 된다.
        {alertTone ? <span className={styles.edge} aria-hidden="true" /> : null}
      */}

      <header className={styles.bar} aria-label={`통합관제 상황판 · ${scopeLabel}`}>
        <div className={styles.bar__left}>
          {/*
            기관 시그니처는 서비스의 다른 화면과 같은 것을 쓴다 (2026-09-07 지시).

            상황판만 제 이름을 따로 적고 있었다 — 「충청남도교육청 통합 태양광(신재생) 관리
            시스템」 은 회의에서 나온 한 줄이지만(2026-09-04 · 조치사항 #7), 같은 시스템의
            화면들이 저마다 다른 이름으로 스스로를 부르면 상황판만 딴 서비스로 보인다.
            이름은 `Logo` 한 곳에서만 적는다.
          */}
          <span className={styles.bar__brand}>
            <Logo size="lg" />
            {variantLabel ? <em className={styles.bar__variant}>{variantLabel}</em> : null}
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

          {/* 어두운 화면이 기본이지만 고를 수 있게 둔다 (2026-09-04 회의) */}
          <button
            type="button"
            className={styles.bar__action}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '밝은 화면으로 전환' : '어두운 화면으로 전환'}
          >
            {theme === 'dark' ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
          </button>

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
