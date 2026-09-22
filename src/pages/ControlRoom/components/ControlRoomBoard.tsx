import { useState } from 'react';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { SCOPE_LABEL, useControlRoomData } from '../useControlRoomData';
import styles from '../ControlRoom.module.scss';
import { AlertColumn } from './AlertColumn';
import { MapColumn } from './MapColumn';
import { SummaryColumn } from './SummaryColumn';

/**
 * 상황판 본문 (SFR-004).
 *
 * 세 열이 **하나의 목록** 을 나눠 쓴다 — 지도에 찍히는 점, 순위에 서는 학교, 장애 목록의 줄이
 * 모두 같은 조회 조건에서 나온 것이라야 한다. 열마다 따로 불러 오면 같은 화면 안에서 개소 수가
 * 갈리므로, 조회는 여기서 한 번만 하고 결과를 열에 내린다.
 *
 * 열은 저마다 제 몫만 받는다. 데이터 뭉치를 통째로 넘기면 어느 열이 무엇을 쓰는지 알 수 없고,
 * 값 하나를 고칠 때 세 열을 모두 열어 봐야 한다.
 */
export function ControlRoomBoard() {
  const data = useControlRoomData();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <ControlRoomLayout
      scopeLabel={SCOPE_LABEL}
      variantLabel="시안 A · 요구사항 모두 충족한 버전"
      alertTone={data.alertTone}
      onSearch={() => setIsSearchOpen(true)}
      searchSummary={data.searchSummary}
      collectedAt={data.collection.latest}
    >
      <div className={styles.grid}>
        <SummaryColumn plants={data.rows} totals={data.totals} />
        <MapColumn plants={data.rows} abnormalCount={data.abnormalCount} />
        <AlertColumn
          plants={data.rows}
          abnormalCount={data.abnormalCount}
          collection={data.collection.byId}
        />
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
