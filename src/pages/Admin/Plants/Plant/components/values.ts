import { SCHOOL_LEVELS } from '@/mocks/schools';
import { CHUNGNAM_REGIONS } from '@/configs/regions';
import type { PlantFormValues } from '@/service/plant/type';
import type { ManagedUser } from '@/interface/account';
import type { PlantAsset } from '@/interface/asset';
import type { Pyranometer } from '@/interface/deviceMaster';

export const EMPTY_VALUES: PlantFormValues = {
  powerPlantName: '',
  powerPlantType: SCHOOL_LEVELS[0],
  regionCode: CHUNGNAM_REGIONS[0].regionCode,
  address: '',
  addressDetail: '',
  // 빈 숫자 칸은 NaN 이다 — 0 은 적도·본초자오선이라는 뜻이 되어 버린다.
  latitude: Number.NaN,
  longitude: Number.NaN,
  rtuEnterpriseName: '',
  installerName: '',
  installerPhone: '',
  managerEnterpriseName: '',
  managerEnterprisePhone: '',
  userId: Number.NaN,
  userLabel: '',
  irradId: null,
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
    powerPlantName: asset.plantName,
    powerPlantType: asset.plantType,
    regionCode: asset.regionCode,
    address: asset.address,
    addressDetail: asset.addressDetail,
    latitude: asset.latitude,
    longitude: asset.longitude,
    rtuEnterpriseName: asset.rtuEntName,
    installerName: asset.builder.name,
    installerPhone: asset.builder.phone,
    managerEnterpriseName: asset.managerEnterprise.name,
    managerEnterprisePhone: asset.managerEnterprise.phone,
    userId: asset.userId ?? Number.NaN,
    userLabel: user ? userLabelOf(user) : '',
    irradId: asset.irradId,
    irradLabel: irrad ? irradLabelOf(irrad) : '',
    etc: asset.etc,
  };
}
