import { SCHOOL_LEVELS } from '@/mocks/schools';
import { CHUNGNAM_REGIONS } from '@/configs/regions';
import type { PlantFormValues } from '@/service/plant/type';
import type { ManagedUser } from '@/interface/account';
import type { PlantAsset } from '@/interface/asset';
import type { Pyranometer } from '@/interface/deviceMaster';

export const EMPTY_VALUES: PlantFormValues = {
  plantName: '',
  plantType: SCHOOL_LEVELS[0],
  regionCode: CHUNGNAM_REGIONS[0].regionCode,
  address: '',
  addressDetail: '',
  latitude: '',
  longitude: '',
  rtuEntName: '',
  builderName: '',
  builderPhone: '',
  managerEnterpriseName: '',
  managerEnterprisePhone: '',
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
    latitude: String(asset.latitude),
    longitude: String(asset.longitude),
    rtuEntName: asset.rtuEntName,
    builderName: asset.builder.name,
    builderPhone: asset.builder.phone,
    managerEnterpriseName: asset.managerEnterprise.name,
    managerEnterprisePhone: asset.managerEnterprise.phone,
    userId: asset.userId === null ? '' : String(asset.userId),
    userLabel: user ? userLabelOf(user) : '',
    irradId: asset.irradId === null ? '' : String(asset.irradId),
    irradLabel: irrad ? irradLabelOf(irrad) : '',
    etc: asset.etc,
  };
}
