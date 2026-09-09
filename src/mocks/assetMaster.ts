import type { ChangeLog } from '@/interface/changeLog';
import type { PlantAsset } from '@/interface/asset';
import { regionCodeOf } from '@/configs/regions';
import { SCHOOLS } from './schools';
import { SEED_USERS } from './accounts';
import { createRandom, hashSeed, pickOne } from './random';
import { stampAgo } from './today';

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
    regionCode: regionCodeOf(school.regionCode),
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
  };
}

export const SEED_ASSETS: PlantAsset[] = SCHOOLS.map((_, index) => buildAsset(index));

const ASSET_BY_ID = new Map(SEED_ASSETS.map((asset) => [asset.plantId, asset]));

export function getSeedAsset(plantId: string): PlantAsset | null {
  return ASSET_BY_ID.get(plantId) ?? null;
}

/** 시드 수정 이력 — 화면에서 새 수정이 이 위에 쌓인다 (SFR-016-06). */
export const SEED_ASSET_CHANGES: ChangeLog[] = [
  {
    id: 'AC-2604',
    targetType: 'powerPlant',
    targetId: SEED_ASSETS[3].plantId,
    targetName: SEED_ASSETS[3].plantName,
    at: stampAgo(6, '15:12'),
    actor: '김도현',
    field: 'RTU 업체',
    // 지금 값과 겹치지 않는 업체를 이전 값으로 둔다 — 같으면 이력이 바뀐 게 없어 보인다.
    before: RTU_MAKERS.find((name) => name !== SEED_ASSETS[3].rtuEntName) ?? RTU_MAKERS[0],
    after: SEED_ASSETS[3].rtuEntName,
  },
  {
    id: 'AC-2603',
    targetType: 'powerPlant',
    targetId: SEED_ASSETS[11].plantId,
    targetName: SEED_ASSETS[11].plantName,
    at: stampAgo(13, '10:44'),
    actor: '김도현',
    field: '시공 업체 연락처',
    before: '041-552-0000',
    after: SEED_ASSETS[11].builder.phone,
  },
  {
    id: 'AC-2602',
    targetType: 'powerPlant',
    targetId: SEED_ASSETS[27].plantId,
    targetName: SEED_ASSETS[27].plantName,
    at: stampAgo(21, '09:03'),
    actor: '박세연',
    field: '주소',
    before: '구주소 표기',
    after: SEED_ASSETS[27].address,
  },
];
