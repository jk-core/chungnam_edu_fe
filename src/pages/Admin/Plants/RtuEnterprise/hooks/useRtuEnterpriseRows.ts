import { useMemo } from 'react';
import useEquipmentStore, { mergeRtuEnterprises } from '@/stores/equipmentStore';
import type { RtuEnterprise } from '@/interface/deviceMaster';

/**
 * RTU 업체 목록.
 * 목록과 폼이 같은 목록을 봐야 해서 — 폼은 주소의 식별자로 여기서 자기 줄을 찾는다.
 */
export function useRtuEnterpriseRows(): RtuEnterprise[] {
  const rtuEnterpriseCreated = useEquipmentStore((state) => state.rtuEnterpriseCreated);
  const rtuEnterprisePatched = useEquipmentStore((state) => state.rtuEnterprisePatched);
  const rtuEnterpriseDeleted = useEquipmentStore((state) => state.rtuEnterpriseDeleted);

  return useMemo(
    () => mergeRtuEnterprises(rtuEnterpriseCreated, rtuEnterprisePatched, rtuEnterpriseDeleted),
    [rtuEnterpriseCreated, rtuEnterprisePatched, rtuEnterpriseDeleted],
  );
}
