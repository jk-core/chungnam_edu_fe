import { useState } from 'react';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { useControlRoomData } from '@/pages/ControlRoom/useControlRoomData';
import styles from '../WarRoom.module.scss';
import { AlertList } from './AlertList';
import { DayCurve } from './DayCurve';
import { LiveStrip } from './LiveStrip';
import { RegionHeat } from './RegionHeat';
import { RoomHeader } from './RoomHeader';

/**
 * 판 하나를 세운다.
 * 세 켜가 같은 한 벌을 봐야 하므로 조회는 여기서 한 번만 하고 통째로 나눠 준다.
 * 고른 시·군은 히트맵과 경보 줄이 함께 쓰므로 여기에 둔다.
 */
export function WarRoomBoard() {
  const data = useControlRoomData();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className={styles.room}>
      {data.alertTone ? <span className={styles.edge} data-tone={data.alertTone} aria-hidden="true" /> : null}

      <div className={styles.board}>
        <RoomHeader searchSummary={data.searchSummary} onSearch={() => setIsSearchOpen(true)} />

        <LiveStrip data={data} />
        <DayCurve alerts={data.openAlerts} />
        <RegionHeat plants={data.rows} picked={picked} onPick={setPicked} />
        <AlertList alerts={data.openAlerts} picked={picked} />
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
