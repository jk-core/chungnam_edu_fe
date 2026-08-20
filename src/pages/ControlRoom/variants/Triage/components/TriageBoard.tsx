import { useState } from 'react';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { SCOPE_LABEL, useControlRoomData } from '@/pages/ControlRoom/useControlRoomData';
import styles from '../Triage.module.scss';
import { SideColumn } from './SideColumn';
import { TriageColumn } from './TriageColumn';

/**
 * 판 하나를 세운다.
 * 두 열이 같은 한 벌을 봐야 하므로 조회는 여기서 한 번만 하고 통째로 나눠 준다.
 */
export function TriageBoard() {
  const data = useControlRoomData();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <ControlRoomLayout
      scopeLabel={SCOPE_LABEL}
      variantLabel="시안 C · 트리아지 보드"
      alertTone={data.alertTone}
      onSearch={() => setIsSearchOpen(true)}
      searchSummary={data.searchSummary}
    >
      <div className={styles.board}>
        <TriageColumn data={data} />
        <SideColumn data={data} />
      </div>

      <PlantSearchModal
        isOpen={isSearchOpen}
        filters={data.filters}
        onClose={() => setIsSearchOpen(false)}
        onApply={data.setFilters}
      />
    </ControlRoomLayout>
  );
}
