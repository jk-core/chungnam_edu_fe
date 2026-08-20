import { useState } from 'react';
import { FaultMap } from '@/pages/ControlRoom/components/FaultMap';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { useControlRoomData } from '@/pages/ControlRoom/useControlRoomData';
import styles from '../WarRoom.module.scss';
import { FaultRail } from './FaultRail';
import { OutputRail } from './OutputRail';
import { RankTicker } from './RankTicker';
import { RoomHeader } from './RoomHeader';

/**
 * 판 하나를 세운다.
 * 두 난간과 아래 띠가 같은 한 벌을 봐야 하므로 조회는 여기서 한 번만 하고 통째로 나눠 준다.
 */
export function WarRoomBoard() {
  const data = useControlRoomData();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className={styles.room}>
      {/* 지도는 배경이다. 유리판 뒤에서 계속 살아 있다 */}
      <div className={styles.canvas}>
        <FaultMap plants={data.rows} scope="all" height="100%" selectable />
      </div>

      {data.alertTone ? <span className={styles.edge} data-tone={data.alertTone} aria-hidden="true" /> : null}

      <div className={styles.hud}>
        <RoomHeader searchSummary={data.searchSummary} onSearch={() => setIsSearchOpen(true)} />

        <div className={styles.rails}>
          <OutputRail data={data} />
          <FaultRail data={data} />
        </div>

        <RankTicker plants={data.rows} />
      </div>

      <PlantSearchModal
        isOpen={isSearchOpen}
        filters={data.filters}
        onClose={() => setIsSearchOpen(false)}
        onApply={data.setFilters}
      />
    </div>
  );
}
