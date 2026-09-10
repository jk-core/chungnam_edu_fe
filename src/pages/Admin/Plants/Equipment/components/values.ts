import { describeInverterProduct } from '@/mocks/deviceMaster';
import { NOW } from '@/mocks/today';
import type { EquipmentFormValues } from '@/service/equipment/type';
import type { StringRow } from '@/service/string/type';
import type { InverterProduct, ModuleProduct, StringMaster } from '@/interface/deviceMaster';
import type { ManagedUser } from '@/interface/account';
import type { PlantAsset } from '@/interface/asset';
import type { EquipmentRow } from '../hooks/useEquipmentRows';

/** AS 만료일 기본값 — 오늘로부터 다섯 해 */
const AS_YEARS = 5;

export const EMPTY_VALUES: EquipmentFormValues = {
  // 빈 숫자 칸은 NaN 이다 — 0 은 「0번 발전소」·「모듈 0장」이라는 뜻이 되어 버린다.
  userId: Number.NaN,
  userLabel: '',
  powerPlantId: Number.NaN,
  powerPlantLabel: '',
  equipmentName: '',
  rtuCommunicationId: '',
  rtuPort: null,
  inverterId: Number.NaN,
  inverterLabel: '',
  inverterKind: '',
  moduleId: Number.NaN,
  moduleLabel: '',
  azimuth: 180,
  inclinedAngle: 20,
  moduleSerialCount: Number.NaN,
  moduleParallelCount: Number.NaN,
  moduleSerialCountSecond: 0,
  moduleParallelCountSecond: 0,
  equipmentCapacity: Number.NaN,
  asExpiryDate: NOW.add(AS_YEARS, 'year').format('YYYY-MM-DD'),
  etc: '',
  installDate: NOW.format('YYYY-MM-DD'),
  rows: [],
  takenNumbers: [],
};

export function userLabelOf(user: ManagedUser): string {
  return `${user.name} · ${user.loginId}`;
}

export function moduleLabelOf(product: ModuleProduct): string {
  return `${product.maker} - ${product.name} (${product.moduleId})`;
}

function toStringRows(strings: StringMaster[]): StringRow[] {
  return strings.map((row) => ({
    stringId: row.stringId,
    stringNumber: row.seq,
    stringName: row.name,
    moduleSerialCount: row.seriesCount,
    moduleParallelCount: row.parallelCount,
  }));
}

interface Sources {
  users: ManagedUser[];
  plants: PlantAsset[];
  inverters: InverterProduct[];
  modules: ModuleProduct[];
  strings: StringMaster[];
}

export function toFormValues(target: EquipmentRow, sources: Sources): EquipmentFormValues {
  const user = sources.users.find((item) => item.userId === target.userId);
  const plant = sources.plants.find((item) => item.plantId === target.plantId);
  const inverter = sources.inverters.find((item) => item.id === target.inverterProductId);
  const module = sources.modules.find((item) => item.id === target.moduleProductId);

  return {
    userId: target.userId ?? Number.NaN,
    userLabel: user ? userLabelOf(user) : '',
    powerPlantId: plant?.powerPlantId ?? Number.NaN,
    powerPlantLabel: plant?.plantName ?? '',
    equipmentName: target.name,
    rtuCommunicationId: target.rtuCommId,
    rtuPort: target.rtuPort,
    inverterId: inverter?.inverterId ?? Number.NaN,
    inverterLabel: describeInverterProduct(inverter),
    inverterKind: inverter?.kind ?? '',
    moduleId: module?.moduleId ?? Number.NaN,
    moduleLabel: module ? moduleLabelOf(module) : '',
    azimuth: target.azimuth,
    inclinedAngle: target.inclineAngle,
    moduleSerialCount: target.series1,
    moduleParallelCount: target.parallel1,
    moduleSerialCountSecond: target.series2,
    moduleParallelCountSecond: target.parallel2,
    equipmentCapacity: target.equipmentCapacity,
    asExpiryDate: target.asExpiresAt,
    etc: target.note,
    installDate: target.installedAt,
    rows: toStringRows(sources.strings),
    // 편집판이 곧 이 설비의 전체 목록이라 피할 순번이 없다.
    takenNumbers: [],
  };
}
