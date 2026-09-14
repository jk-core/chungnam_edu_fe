import { useState } from 'react';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import type { RoomSkin } from '@/layouts/ControlRoomLayout';
import { SCOPE_LABEL, useControlRoomData } from '../useControlRoomData';
import { Atlas } from './atlas';
import { Blueprint } from './blueprint';
import { Briefing } from './briefing';
import { Cyber } from './cyber';
import type { ComponentType } from 'react';
import type { ControlRoomData } from '../useControlRoomData';

/**
 * 상황판 시안 (`/control/b` ~ `/control/e`).
 *
 * `/control` 의 시안 A 가 최종 시안이고 이쪽은 견줌용이다 — **들어가는 내용은 넷이 똑같다**.
 * 어느 판에 무엇이 담기는지는 넷이 한 벌을 쓰고, 그것을 **어떻게 그리는가** 는 시안마다 따로
 * 간다. 배치도 색도 판 안의 생김새도 시안이 제 폴더 안에서 끝까지 쥔다.
 *
 * 그래서 시안 하나가 폴더 하나다. 폴더끼리 서로 부르지 않으므로 고르고 나면 이긴 하나만
 * `/control` 에 옮기고 나머지 폴더를 통째로 지운다.
 *
 * 값과 셈은 `useControlRoomData` 와 `../utils` 한 곳에서만 나온다 — 시안마다 따로 세면
 * 같은 화면을 견주는 자리에서 개소 수가 갈린다.
 */

export type DraftKey = 'b' | 'c' | 'd' | 'e';

interface Draft {
  /** 회의 자리에서 "왼쪽 그거" 로 불리지 않도록 붙이는 이름 */
  label: string;
  /** 어느 판이 어디에 서는가 */
  layout: ComponentType<{ data: ControlRoomData }>;
  /** 무슨 색·글꼴·바탕으로 보이는가 */
  skin: RoomSkin;
}

/**
 * 배치와 결은 시안마다 한 짝으로 묶인다.
 *
 * 가로로 눕는 배치에 도면의 결을 얹는 식으로 섞으면 어느 조합을 보고 있는지 회의 자리에서
 * 가려지지 않는다. 넷이 저마다 한 벌씩만 갖고, 이름도 그 한 벌을 가리킨다.
 */
const DRAFTS: Record<DraftKey, Draft> = {
  b: { label: '시안 B · 브리핑 보드', layout: Briefing, skin: 'briefing' },
  c: { label: '시안 C · 아틀라스', layout: Atlas, skin: 'atlas' },
  d: { label: '시안 D · 청사진', layout: Blueprint, skin: 'blueprint' },
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
