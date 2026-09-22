import { useState } from 'react';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { useRootClass } from '@/hooks/useRootClass';
import { SCOPE_LABEL, useControlRoomData } from '../useControlRoomData';
import { Kpi } from './kpi';
import { Terrain } from './terrain';
import type { ComponentType } from 'react';
import type { ControlRoomData } from '../useControlRoomData';

/**
 * 상황판 견줌용 시안 (`/control/b`·`/control/c`).
 *
 * `/control` 의 시안 A 가 요구사항을 모두 담은 최종 시안이고, 이 둘은 **덜 담는 대신 한눈에
 * 들어오는** 쪽을 시험한다. 그래서 A 의 판 일곱을 그대로 가져오지 않는다 — 시안마다 제
 * 물음에 답하는 데 필요한 것만 세운다.
 *
 * 보는 사람의 연령이 높다는 것이 두 시안의 첫 번째 제약이다. 한 화면에 담는 것을 줄이고
 * 그만큼 글자를 키운다 — 정보를 많이 넣을수록 글자는 작아지므로, 무엇을 **빼는가** 가
 * 이 둘의 설계다.
 *
 * 시안 하나가 폴더 하나다. 폴더끼리 서로 부르지 않으므로 고르고 나면 이긴 하나만
 * `/control` 에 옮기고 나머지 폴더를 통째로 지운다.
 *
 * 값과 셈은 `useControlRoomData` 와 `../utils` 한 곳에서만 나온다 — 시안마다 따로 세면
 * 같은 화면을 견주는 자리에서 개소 수가 갈린다.
 */

export type DraftKey = 'b' | 'c';

interface Draft {
  /** 회의 자리에서 "왼쪽 그거" 로 불리지 않도록 붙이는 이름 */
  label: string;
  /** 어느 판이 어디에 서는가 */
  layout: ComponentType<{ data: ControlRoomData }>;
}

/**
 * 시안 둘은 같은 색 위에서 배치로만 갈린다.
 *
 * B 는 지표를, C 는 지도를 앞에 세운다. 색·판 생김새·수치 표현은 둘 다 시안 A 의 것을 그대로
 * 가져다 쓰므로, 나란히 놓고 보면 **무엇을 앞세웠는가** 만 눈에 걸린다.
 */
const DRAFTS: Record<DraftKey, Draft> = {
  b: { label: '시안 B · 지표 전면', layout: Kpi },
  c: { label: '시안 C · 지도 중심', layout: Terrain },
};

export function ControlRoomDraft({ draft }: { draft: DraftKey }) {
  const { label, layout: Layout } = DRAFTS[draft];

  /*
    글자 기준을 15px 에서 18px 로 올린다 (`_global.scss` 의 `.control-draft`).

    연령이 높은 사용자를 앞에 둔 시안들이라 화면 전체가 한 단 커져야 한다. 판마다 크기를
    따로 키우면 빠뜨린 자리가 생기고 판끼리 비율이 어긋나므로, 뿌리 하나로 올린다.
    시안 A 는 이 클래스를 붙이지 않아 종전 크기 그대로다.
  */
  useRootClass('control-draft');

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
