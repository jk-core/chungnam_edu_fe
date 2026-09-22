import type { FileMeta } from '@/service/common';
import type { PlantAsset } from '@/interface/asset';

import { SCHOOLS } from './schools';
import { SEED_USERS } from './accounts';
import { createRandom, hashSeed, pickOne } from './random';

const BUILDERS = [
  { name: '한빛솔라건설', phone: '041-552-1100' },
  { name: '대성에너지산업', phone: '042-331-2200' },
  { name: '금강그린텍', phone: '041-856-3300' },
  { name: '서해태양광', phone: '041-664-4400' },
];

// 아직 담당 업체를 적지 않은 발전소가 실제로 있다 — 빈 칸이 화면에서 어떻게 보이는지도 봐야 한다.
const MANAGERS = [
  { name: '충남에너지관리', phone: '041-577-7010' },
  { name: '', phone: '' },
  { name: '아산태양광유지보수', phone: '041-542-8820' },
  { name: '내포솔라케어', phone: '041-630-9900' },
];

const RTU_MAKERS = ['에이치에너지', '나눔에너지', '해줌', '솔라커넥트'];
const ADDRESS_DETAILS = ['본관 옥상', '체육관 옥상', '급식동 옥상', '별관 옥상', '주차장 캐노피'];

/**
 * 대표이미지 시드.
 *
 * 장수를 0·1·2 로 돌려 가며 심는 것은 **없는 발전소가 실제로 있어야** 빈 상태가 화면에서
 * 어떻게 보이는지 볼 수 있기 때문이다. 파일은 아직 들어오지 않아 화면은 자리표시자로 떨어진다.
 * `fileId` 는 발전소당 하나이고 한 장을 가리키는 것은 `fileSeq` 다 — 계약이 그렇다.
 */
const PHOTO_NAMES = ['전경', '모듈 배열'];

function buildPhotos(plantId: string, count: number): FileMeta[] {
  return PHOTO_NAMES.slice(0, count).map((angle, order) => ({
    fileId: `PF-${plantId}`,
    fileSeq: order + 1,
    fileName: `${angle}.jpg`,
    url: `/image/plant/${plantId}-${order + 1}.jpg`,
  }));
}

/** 담당자로 등록된 계정을 발전소에 이어 준다 — 서버의 `userId` 자리다. */
const OWNER_BY_PLANT = new Map(
  SEED_USERS.flatMap((user) => user.plantIds.map((plantId) => [plantId, user.userId] as const)),
);
function buildAsset(schoolIndex: number): PlantAsset {
  const school = SCHOOLS[schoolIndex];
  const next = createRandom(hashSeed(`${school.id}-asset`));

  return {
    plantId: school.id,
    // 서버 번호는 1부터 이어 붙되, 학교 id 와 섞이지 않게 앞자리를 띄운다.
    powerPlantId: 10000 + schoolIndex + 1,
    plantName: school.name,
    regionCode: school.regionCode,
    address: school.address,
    addressDetail: pickOne(next, ADDRESS_DETAILS),
    latitude: school.location.lat,
    longitude: school.location.lng,
    rtuEntName: pickOne(next, RTU_MAKERS),
    builder: pickOne(next, BUILDERS),
    managerEnterprise: pickOne(next, MANAGERS),
    userId: OWNER_BY_PLANT.get(school.id) ?? null,
    // 일사량계는 학교마다 한 대씩 서 있고, 번호가 학교 순서를 따른다.
    irradId: schoolIndex + 1,
    // 시드는 모두 학교다 — 기관은 화면에서 새로 등록하며 들어온다.
    plantType: school.level,
    etc: '',
    photos: buildPhotos(school.id, schoolIndex % 3),
  };
}

export const SEED_ASSETS: PlantAsset[] = SCHOOLS.map((_, index) => buildAsset(index));

const ASSET_BY_ID = new Map(SEED_ASSETS.map((asset) => [asset.plantId, asset]));

export function getSeedAsset(plantId: string): PlantAsset | null {
  return ASSET_BY_ID.get(plantId) ?? null;
}
