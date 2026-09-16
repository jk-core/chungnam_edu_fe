import { useState } from 'react';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { useRootClass } from '@/hooks/useRootClass';
import type { Theme } from '@/stores/themeStore';
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
  /** 화면 밝기 — 시안마다 못 박는다 (2026-09-16 지시) */
  theme: Theme;
  /**
   * 글자 기준을 15px 에서 18px 로 올릴지 (`_global.scss` 의 `.control-draft`).
   *
   * 연령이 높은 사용자를 앞에 둔 시안이라면 화면 전체가 한 단 커져야 한다. 판마다 크기를
   * 따로 키우면 빠뜨린 자리가 생기고 판끼리 비율이 어긋나므로, 뿌리 하나로 올린다.
   */
  isEnlarged: boolean;
}

/**
 * B 는 지표를, C 는 지도를 앞에 세운다.
 *
 * **글자 기준이 둘에서 갈린다.** B 는 `feat/권영서-상황판시안` 의 v1 을 그대로 옮겨 온 것이라
 * 그쪽에서 잰 15px 기준을 지켜야 한다 — 그 시안의 판들은 집계표 430px · 실적표 353px 처럼
 * 높이를 px 로 못 박고 화면 949px 에 맞춰 잰 것이라, 글씨만 18px 로 키우면 고정 높이 박스를
 * 넘겨 표 끝이 잘린다. C 는 처음부터 키운 글씨를 전제로 짠 시안이라 그대로 둔다.
 */
const DRAFTS: Record<DraftKey, Draft> = {
  b: { label: '시안 B · 지표 전면', layout: Kpi, theme: 'dark', isEnlarged: false },
  c: { label: '시안 C · 지도 중심', layout: Terrain, theme: 'light', isEnlarged: true },
};

export function ControlRoomDraft({ draft }: { draft: DraftKey }) {
  const { label, layout: Layout, theme, isEnlarged } = DRAFTS[draft];

  // 빈 문자열은 클래스를 붙이지 않는다 — 시안마다 글자 기준이 갈린다.
  useRootClass(isEnlarged ? 'control-draft' : '');

  const data = useControlRoomData();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <ControlRoomLayout
      scopeLabel={SCOPE_LABEL}
      variantLabel={label}
      theme={theme}
      density={isEnlarged ? undefined : 'compact'}
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
