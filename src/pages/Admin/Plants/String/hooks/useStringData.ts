import { useMemo } from 'react';
import { getSchoolById } from '@/mocks/schools';
import { useSelectableEquipment } from '@/pages/Admin/_shared/device/useSelectableEquipment';
import useEquipmentStore, { mergeStrings } from '@/stores/equipmentStore';
import type { StringMaster } from '@/interface/deviceMaster';

/**
 * 표 한 줄 — 스트링을 가진 설비 한 대다 (`SolaStringManagePageInfo`).
 * 스트링은 설비 단위로 한 판씩 다루므로, 목록도 설비마다 한 줄에 갯수만 보여 준다.
 */
export interface StringOwner {
  inverterId: string;
  cid: number;
  plantName: string;
  equipmentName: string;
  stringCount: number;
  panelCount: number;
}

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

/**
 * 스트링 인버터 설비마다 스트링이 몇 조 달렸는지로 목록을 세운다.
 * 스트링 기종이 아닌 인버터는 스트링을 갖지 않으므로 여기 서지 않는다.
 */
export function useStringOwners(): StringOwner[] {
  const equipment = useSelectableEquipment('string');
  const { all } = useStringsOf();

  return useMemo(() => equipment.map((item) => {
    const owned = all.filter((row) => row.inverterId === item.inverterId);

    return {
      inverterId: item.inverterId,
      cid: item.cid,
      plantName: getSchoolById(item.plantId)?.name ?? '소속 미지정',
      equipmentName: item.name,
      stringCount: owned.length,
      panelCount: owned.reduce((sum, row) => sum + row.seriesCount * row.parallelCount, 0),
    };
  }), [all, equipment]);
}
