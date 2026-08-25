import { useMemo } from 'react';
import { getInvertersOf } from '@/mocks/equipment';
import { getRtuOf } from '@/mocks/rtu';
import { SEED_EQUIPMENT, SEED_INVERTER_PRODUCTS } from '@/mocks/deviceMaster';
import { SEED_MODULES } from '@/mocks/moduleProducts';
import { SEED_PYRANOMETERS } from '@/mocks/pyranometers';
import { useManagedUsers, usePlantAssets } from '@/hooks/usePlantAssets';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { EquipmentMaster } from '@/interface/deviceMaster';
import type { Inverter } from '@/interface/equipment';

/**
 * 표 한 줄 — 운영 쪽 인버터와 등록 쪽 설비 마스터를 미리 붙여 둔다.
 *
 * 둘은 `inverterId` 로 짝이 맞지만 서로 다른 표에 있다. 셀마다 찾아 쓰면 행 수만큼 목록을
 * 훑게 되므로 여기서 한 번만 잇는다. `master` 가 없을 수 있는 것은 운영 데이터에는 있는데
 * 등록이 아직 안 된 설비를 상정한 것이다 — 그때도 행은 세우고 등록 칸만 비운다.
 */
export interface InverterRow {
  inverter: Inverter;
  master: EquipmentMaster | null;
  /** 인버터 제품 표기 — 업체와 모델을 한 줄에 담는다 */
  productLabel: string;
  moduleLabel: string;
  /** 이 인버터가 물고 있는 모듈 장수. MPPT 1·2번을 합한다 */
  panelCount: number;
  /** 아래 달린 스트링 또는 접속반 채널 수 */
  unitCount: number;
}

/**
 * 발전소 정보 화면이 보는 값 한 벌.
 *
 * 등록 정보는 시드가 아니라 스토어 병합본에서 읽는다 — 관리자가 방금 고친 값이 이 화면에도
 * 그대로 보여야 하기 때문이다. 발전량·상태 추이는 담지 않는다. 그쪽은 발전통계와 AI진단이
 * 이미 맡고 있어, 여기서 다시 계산하면 같은 값이 두 화면에서 갈린다.
 */
export function usePlantInfoView() {
  const { plant } = usePlantScope();
  const assets = usePlantAssets();
  const users = useManagedUsers();

  const asset = plant ? assets.find((item) => item.plantId === plant.id) ?? null : null;
  const manager = asset?.userId == null ? null : users.find((user) => user.userId === asset.userId) ?? null;

  const rows = useMemo<InverterRow[]>(() => {
    if (!plant) return [];

    return getInvertersOf(plant.id).map((inverter) => {
      const master = SEED_EQUIPMENT.find((item) => item.inverterId === inverter.id) ?? null;
      const product = SEED_INVERTER_PRODUCTS.find((item) => item.id === master?.inverterProductId);
      const module = SEED_MODULES.find((item) => item.id === master?.moduleProductId);

      return {
        inverter,
        master,
        productLabel: product ? `${product.maker} ${product.name}` : '',
        moduleLabel: module ? `${module.maker} ${module.name}` : '',
        panelCount: master ? master.series1 * master.parallel1 + master.series2 * master.parallel2 : 0,
        unitCount: inverter.type === 'central' ? inverter.junctionBoxes.length : inverter.strings.length,
      };
    });
  }, [plant]);

  return {
    plant,
    asset,
    manager,
    rtu: plant ? getRtuOf(plant.id) : null,
    pyranometer: plant ? SEED_PYRANOMETERS.find((item) => item.plantId === plant.id) ?? null : null,
    rows,
    totals: {
      capacityKw: rows.reduce((sum, row) => sum + row.inverter.capacityKw, 0),
      panelCount: rows.reduce((sum, row) => sum + row.panelCount, 0),
    },
  };
}

export type PlantInfoView = ReturnType<typeof usePlantInfoView>;
