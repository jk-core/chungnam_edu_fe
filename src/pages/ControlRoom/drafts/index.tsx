import { useState } from 'react';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { SCOPE_LABEL, useControlRoomData } from '../useControlRoomData';
import { Cyber, MapFirst, Mirror, Split } from './layouts';
import type { ComponentType } from 'react';
import type { ControlRoomData } from '../useControlRoomData';

/**
 * 상황판 배치 시안 (`/control/b` ~ `/control/d`).
 *
 * `/control` 의 시안 A 가 최종 시안이고 이쪽은 견줌용이다 — 값도 판도 그쪽 것을 그대로 쓰고,
 * **어디에 세우는가** 와 **무슨 색으로 보이는가** 만 갈린다. 고르고 나면 이 폴더를 지운다.
 */

export type DraftKey = 'b' | 'c' | 'd' | 'e';

interface Draft {
  /** 회의 자리에서 "왼쪽 그거" 로 불리지 않도록 붙이는 이름 */
  label: string;
  layout: ComponentType<{ data: ControlRoomData }>;
  /** 색·글꼴을 갈아 끼우는 시안만 갖는다 */
  skin?: 'cyber';
}

const DRAFTS: Record<DraftKey, Draft> = {
  b: { label: '시안 B · 좌우 뒤집기', layout: Mirror },
  c: { label: '시안 C · 지도 선두 + 색 띠', layout: MapFirst },
  d: { label: '시안 D · 두 폭 나눔 + 도면', layout: Split },
  e: { label: '시안 E · 사이버네틱', layout: Cyber, skin: 'cyber' },
};

export function ControlRoomDraft({ draft }: { draft: DraftKey }) {
  const { label, layout: Layout, skin } = DRAFTS[draft];
  const data = useControlRoomData();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <ControlRoomLayout
      scopeLabel={SCOPE_LABEL}
      variantLabel={label}
      alertTone={data.alertTone}
      onSearch={() => setIsSearchOpen(true)}
      searchSummary={data.searchSummary}
      collectedAt={data.collection.latest}
      skin={skin}
    >
      <Layout data={data} />

      <PlantSearchModal
        isOpen={isSearchOpen}
        filters={data.filters}
        onClose={() => setIsSearchOpen(false)}
        onApply={data.setFilters}
      />
    </ControlRoomLayout>
  );
}

export default ControlRoomDraft;
