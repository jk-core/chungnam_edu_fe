import { NOW } from '@/mocks/today';
import type { StringRow } from '@/schemas/stringRow';
import type { StringMaster } from '@/interface/deviceMaster';
import type { ManagedUser } from '@/interface/account';
import type { ManageInverterPage } from '@/service/inverter/type';
import type { PlantAsset } from '@/interface/asset';
import type { SolaModuleDetail } from '@/service/module/type';
import type { EquipmentFormValues } from './form';
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
  inverterTypeCode: null,
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

export function moduleLabelOf(product: SolaModuleDetail): string {
  return `${product.moduleEnterpriseName} - ${product.moduleName} (${product.moduleId})`;
}

/** 목록·검색에 내보내는 인버터 제품 표기. 업체명으로도 찾을 수 있게 한 줄에 함께 담는다. */
export function inverterLabelOf(product: ManageInverterPage | undefined): string {
  return product ? `${product.inverterEnterpriseName} - ${product.inverterName} (${product.inverterId})` : '';
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
  inverters: ManageInverterPage[];
  modules: SolaModuleDetail[];
  strings: StringMaster[];
}

export function toFormValues(target: EquipmentRow, sources: Sources): EquipmentFormValues {
  const user = sources.users.find((item) => item.userId === target.userId);
  const plant = sources.plants.find((item) => item.plantId === target.plantId);
  const inverter = sources.inverters.find((item) => item.inverterId === target.inverterProductId);
  const module = sources.modules.find((item) => item.moduleId === target.moduleProductId);

  return {
    userId: target.userId ?? Number.NaN,
    userLabel: user ? userLabelOf(user) : '',
    powerPlantId: plant?.powerPlantId ?? Number.NaN,
    powerPlantLabel: plant?.plantName ?? '',
    equipmentName: target.name,
    rtuCommunicationId: target.rtuCommId,
    rtuPort: target.rtuPort,
    inverterId: inverter?.inverterId ?? Number.NaN,
    inverterLabel: inverterLabelOf(inverter),
    inverterTypeCode: inverter?.inverterTypeCode ?? null,
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
