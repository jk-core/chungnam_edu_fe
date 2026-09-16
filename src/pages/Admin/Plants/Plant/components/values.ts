import { SCHOOL_LEVELS } from '@/mocks/schools';
import { CHUNGNAM_REGIONS } from '@/configs/regions';
import type { FileMeta } from '@/service/common';
import type { PlantFormValues } from '@/service/plant/type';
import type { ManagedUser } from '@/interface/account';
import type { PlantAsset } from '@/interface/asset';
import type { Pyranometer } from '@/interface/deviceMaster';
import type { UploadFile } from '@/components/common/Form';

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

/**
 * 이미 붙어 있는 대표이미지를 첨부판이 읽는 모양으로 옮긴다.
 *
 * `file` 이 없는 것이 「서버에 있는 것」이고, `saved` 가 그 한 장을 가리키는 짝이다 —
 * 저장할 때 이 짝으로 뺄 것을 가려낸다. 크기는 받아 오지 않아 0 이다.
 */
export function toUploadFiles(photos: FileMeta[]): UploadFile[] {
  return photos.map((photo) => ({
    id: `${photo.fileId}-${photo.fileSeq}`,
    name: photo.fileName,
    size: 0,
    type: 'image/jpeg',
    previewUrl: photo.url,
    file: null,
    saved: { fileId: photo.fileId, fileSeq: photo.fileSeq },
  }));
}

/**
 * 첨부판에 남은 것을 등록 정보가 담는 모양으로 되돌린다.
 *
 * **이미 저장된 사진은 `fileSeq` 를 그대로 지킨다.** 남은 순서대로 1부터 다시 세면 앞의 한 장을
 * 뺐을 때 뒤의 것이 그 번호를 물려받아, 나중에 지우려던 장 대신 다른 장을 가리킨다.
 * 새로 고른 것만 쓰이지 않은 번호를 이어 붙인다 — 서버가 매길 번호는 아직 모른다.
 */
export function toPhotos(files: UploadFile[], plantId: string): FileMeta[] {
  const lastSeq = Math.max(0, ...files.map((item) => item.saved?.fileSeq ?? 0));
  let minted = 0;

  return files.map((item) => {
    if (item.saved) {
      return { ...item.saved, fileName: item.name, url: item.previewUrl ?? '' };
    }

    minted += 1;

    return {
      fileId: `PF-${plantId}`,
      fileSeq: lastSeq + minted,
      fileName: item.name,
      url: item.previewUrl ?? '',
    };
  });
}

/** 이력 셀에 적는 사진 목록 — 장수만 적으면 같은 장수로 교체한 것을 놓친다 */
export function photoNames(photos: FileMeta[]): string {
  return photos.map((photo) => photo.fileName).join(', ');
}

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
