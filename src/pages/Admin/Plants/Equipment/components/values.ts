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
  userId: '',
  userLabel: '',
  plantId: '',
  plantLabel: '',
  name: '',
  rtuCommId: '',
  rtuPort: null,
  inverterProductId: '',
  inverterLabel: '',
  inverterKind: '',
  moduleProductId: '',
  moduleLabel: '',
  azimuth: 180,
  inclineAngle: 20,
  // 빈 숫자 칸은 NaN 이다 — 0 은 「모듈 0장」이라는 뜻이 되어 버린다.
  series1: Number.NaN,
  parallel1: Number.NaN,
  series2: 0,
  parallel2: 0,
  equipmentCapacity: Number.NaN,
  asExpiresAt: NOW.add(AS_YEARS, 'year').format('YYYY-MM-DD'),
  note: '',
  installedAt: NOW.format('YYYY-MM-DD'),
  operatedAt: '',
  rows: [],
  takenSeqs: [],
};

export function userLabelOf(user: ManagedUser): string {
  return `${user.name} · ${user.loginId}`;
}

export function moduleLabelOf(product: ModuleProduct): string {
  return `${product.maker} - ${product.name} (${product.moduleId})`;
}

function toStringRows(strings: StringMaster[]): StringRow[] {
  return strings.map((row) => ({
    id: row.id,
    seq: row.seq,
    name: row.name,
    seriesCount: row.seriesCount,
    parallelCount: row.parallelCount,
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
    userId: target.userId === null ? '' : String(target.userId),
    userLabel: user ? userLabelOf(user) : '',
    plantId: target.plantId,
    plantLabel: plant?.plantName ?? '',
    name: target.name,
    rtuCommId: target.rtuCommId,
    rtuPort: target.rtuPort,
    inverterProductId: target.inverterProductId,
    inverterLabel: describeInverterProduct(inverter),
    inverterKind: inverter?.kind ?? '',
    moduleProductId: target.moduleProductId,
    moduleLabel: module ? moduleLabelOf(module) : '',
    azimuth: target.azimuth,
    inclineAngle: target.inclineAngle,
    series1: target.series1,
    parallel1: target.parallel1,
    series2: target.series2,
    parallel2: target.parallel2,
    equipmentCapacity: target.equipmentCapacity,
    asExpiresAt: target.asExpiresAt,
    note: target.note,
    installedAt: target.installedAt,
    operatedAt: target.operatedAt,
    rows: toStringRows(sources.strings),
    // 편집판이 곧 이 설비의 전체 목록이라 피할 순번이 없다.
    takenSeqs: [],
  };
}
