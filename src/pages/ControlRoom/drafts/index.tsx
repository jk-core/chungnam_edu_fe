import { useState } from 'react';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { SCOPE_LABEL, useControlRoomData } from '../useControlRoomData';
import { MapFirst, Matrix, Mirror, Quad, Split } from './layouts';
import type { ComponentType } from 'react';
import type { ControlRoomData } from '../useControlRoomData';

/**
 * 상황판 배치 시안 (`/control/1` ~ `/control/5`).
 *
 * `/control` 이 최종 시안이고 이쪽은 견줌용이다 — 값도 판도 그쪽 것을 그대로 쓰고,
 * **어디에 세우는가** 와 **무슨 색으로 보이는가** 만 갈린다. 고르고 나면 이 폴더를 지운다.
 */

export type DraftKey = '1' | '2' | '3' | '4' | '5';

interface Draft {
  /** 회의 자리에서 "왼쪽 그거" 로 불리지 않도록 붙이는 이름 */
  label: string;
  layout: ComponentType<{ data: ControlRoomData }>;
  /** 화면 전체를 다른 결로 볼 시안만 값을 갖는다 */
  theme?: 'light' | 'dark';
}

const DRAFTS: Record<DraftKey, Draft> = {
  1: { label: '시안 1 · 좌우 뒤집기', layout: Mirror },
  2: { label: '시안 2 · 지도 선두 + 색 띠', layout: MapFirst },
  3: { label: '시안 3 · 두 폭 나눔 + 도면', layout: Split },
  4: { label: '시안 4 · 네 단 + 볕', layout: Quad },
  5: { label: '시안 5 · 격자 + 야간', layout: Matrix, theme: 'dark' },
};

export function ControlRoomDraft({ draft }: { draft: DraftKey }) {
  const { label, layout: Layout, theme } = DRAFTS[draft];
  const data = useControlRoomData();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <ControlRoomLayout
      scopeLabel={SCOPE_LABEL}
      variantLabel={label}
      theme={theme}
      alertTone={data.alertTone}
      onSearch={() => setIsSearchOpen(true)}
      searchSummary={data.searchSummary}
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
