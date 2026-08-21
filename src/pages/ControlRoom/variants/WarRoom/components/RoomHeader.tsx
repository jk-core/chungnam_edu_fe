import { Link } from 'react-router-dom';
import { AiOrbit } from '@/components/common/AiOrbit';
import { CloseIcon, ExpandIcon, SearchIcon } from '@/components/common/Icon';
import { PATH } from '@/routes/routes';
import { RoomClock } from '@/layouts/ControlRoomLayout/RoomClock';
import { SCOPE_LABEL } from '@/pages/ControlRoom/useControlRoomData';
import { useFullscreen } from '@/hooks/useFullscreen';
import styles from '../WarRoom.module.scss';

interface RoomHeaderProps {
  /** 무엇으로 좁혀 놓았는지 한 줄 요약. 조건이 없으면 undefined */
  searchSummary?: string;
  onSearch: () => void;
}

/** 화면 맨 위 — 어디를 보고 있는지, 지금 몇 시인지, 그리고 나가는 길 */
export function RoomHeader({ searchSummary, onSearch }: RoomHeaderProps) {
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  return (
    <header className={styles.top}>
      <span className={styles.brand}>
        <AiOrbit size={38} active />
        <span>
          <span className={styles.brand__title}>통합관제 상황판</span>
          <span className={styles.brand__scope}>
            {SCOPE_LABEL}
            <em className={styles.brand__variant}>시안 B · 타임라인 워룸</em>
          </span>
        </span>
      </span>

      <div className={styles.top__right}>
        <button type="button" className={styles.search} onClick={onSearch}>
          <SearchIcon width={16} height={16} aria-hidden />
          <span>{searchSummary ?? '학교·설비 검색'}</span>
        </button>

        <RoomClock />

        <button type="button" className={styles.action} onClick={toggleFullscreen}>
          <ExpandIcon width={16} height={16} />
          {isFullscreen ? '창 모드' : '전체화면'}
        </button>

        <Link to={PATH.HOME} className={styles.action}>
          <CloseIcon width={16} height={16} />
          나가기
        </Link>
      </div>
    </header>
  );
}
