import { NOW } from '@/mocks/today';
import { PLANT_TYPES } from '@/mocks/schools';
import { REGION_CODES } from '@/mocks/manageCodes';
import type { PlantFormValues } from '@/service/plant/type';
import type { ManagedUser } from '@/interface/account';
import type { PlantAsset } from '@/interface/asset';
import type { Pyranometer } from '@/interface/deviceMaster';

export const EMPTY_VALUES: PlantFormValues = {
  plantName: '',
  plantType: PLANT_TYPES[0],
  regionCode: REGION_CODES[0].regionCode,
  address: '',
  addressDetail: '',
  installedAt: NOW.format('YYYY-MM'),
  rtuEntName: '',
  builderName: '',
  builderPhone: '',
  userId: '',
  userLabel: '',
  irradId: '',
  irradLabel: '',
  etc: '',
};

export function userLabelOf(user: ManagedUser): string {
  return `${user.name} · ${user.loginId}`;
}

export function irradLabelOf(irrad: Pyranometer): string {
  return `${irrad.rtuCommId} · ${irrad.name}`;
}

export function toFormValues(asset: PlantAsset, users: ManagedUser[], irrads: Pyranometer[]): PlantFormValues {
  const user = users.find((item) => item.userId === asset.userId);
  const irrad = irrads.find((item) => item.irradId === asset.irradId);

  return {
    plantName: asset.plantName,
    plantType: asset.plantType,
    regionCode: asset.regionCode,
    address: asset.address,
    addressDetail: asset.addressDetail,
    installedAt: asset.installedAt,
    rtuEntName: asset.rtuEntName,
    builderName: asset.builder.name,
    builderPhone: asset.builder.phone,
    userId: asset.userId === null ? '' : String(asset.userId),
    userLabel: user ? userLabelOf(user) : '',
    irradId: asset.irradId === null ? '' : String(asset.irradId),
    irradLabel: irrad ? irradLabelOf(irrad) : '',
    etc: asset.etc,
  };
}
