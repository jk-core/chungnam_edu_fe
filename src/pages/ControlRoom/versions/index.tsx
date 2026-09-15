import { useState } from 'react';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { SCOPE_LABEL, useControlRoomData } from '../useControlRoomData';
import { DiagnosisStage, KpiStage, MapStage } from './layouts';
import type { ComponentType } from 'react';
import type { ControlRoomData } from '../useControlRoomData';

/**
 * 「한눈에 보는」 상황판 시안 (`/control/v1` ~ `/control/v3`).
 *
 * 글자가 작다는 말에서 나온 갈래다 (SFR-004). 값과 판은 `/control` 것을 그대로 쓰되, 겹치는 판을
 * 덜어 내고 남는 판을 키워 멀리서도 읽히게 한다 — 무엇을 덜고 무엇을 키웠는지는 시안마다 다르다.
 * 고르고 나면 이긴 하나만 `/control` 에 옮기고 나머지는 지운다.
 */

export type VersionKey = 'v1' | 'v2' | 'v3';

interface Version {
  /** 회의 자리에서 "큰 숫자 그거" 로 불리지 않도록 붙이는 이름 */
  label: string;
  layout: ComponentType<{ data: ControlRoomData }>;
}

const VERSIONS: Record<VersionKey, Version> = {
  v1: { label: 'v1 · 지표 전면', layout: KpiStage },
  v2: { label: 'v2 · 지도 전면', layout: MapStage },
  v3: { label: 'v3 · 진단 전면', layout: DiagnosisStage },
};

export function ControlRoomVersion({ version }: { version: VersionKey }) {
  const { label, layout: Layout } = VERSIONS[version];
  const data = useControlRoomData();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <ControlRoomLayout
      scopeLabel={SCOPE_LABEL}
      variantLabel={label}
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

export default ControlRoomVersion;
