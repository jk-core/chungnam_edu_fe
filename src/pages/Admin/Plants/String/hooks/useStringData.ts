import { useMemo } from 'react';
import useEquipmentStore, { mergeStrings } from '@/stores/equipmentStore';
import type { StringMaster } from '@/interface/deviceMaster';

/*
  스트링 관리 화면은 서버를 본다 (`useStringList`·`useStringSheet`).
  여기 남은 것은 **설비 폼 안의 「스트링 구조」** 몫이다 — 설비 관리 API 가 아직 없어
  그 화면만 목업 스토어 위에서 돈다.
*/

/** 이력에 적는 스트링 한 조의 생김새 */
export function summarizeString(row: Pick<StringMaster, 'name' | 'seriesCount' | 'parallelCount'>): string {
  return `${row.name} · ${row.seriesCount}직렬 × ${row.parallelCount}병렬`;
}

/**
 * 설비 한 대의 스트링을 순번대로.
 * 저장은 그 설비의 목록을 통째로 갈아 끼우므로 기준이 되는 지금 목록이 필요하다.
 */
export function useStringsOf() {
  const stringCreated = useEquipmentStore((state) => state.stringCreated);
  const stringPatched = useEquipmentStore((state) => state.stringPatched);
  const stringDeleted = useEquipmentStore((state) => state.stringDeleted);

  const all = useMemo(
    () => mergeStrings(stringCreated, stringPatched, stringDeleted),
    [stringCreated, stringPatched, stringDeleted],
  );

  return {
    all,
    listOf: (inverterId: string): StringMaster[] => all
      .filter((row) => row.inverterId === inverterId)
      .sort((a, b) => a.seq - b.seq),
  };
}
