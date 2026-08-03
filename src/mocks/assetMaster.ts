import type { AssetChange, ModuleSpec, PlantAsset } from '@/interface/asset';
import { SCHOOLS } from './schools';
import { createRandom, hashSeed, pickOne } from './random';
import { stampAgo } from './today';

const BUILDERS = [
  { name: '한빛솔라건설', phone: '041-552-1100' },
  { name: '대성에너지산업', phone: '042-331-2200' },
  { name: '금강그린텍', phone: '041-856-3300' },
  { name: '서해태양광', phone: '041-664-4400' },
];

const MONITORS = [
  { name: '에너지아이티', phone: '02-6205-1000' },
  { name: '솔라뷰시스템', phone: '031-702-2000' },
  { name: '그린와트', phone: '042-825-3000' },
];

const CUSTOMER_SURNAME = ['김', '이', '박', '최', '정', '한', '오', '서'];
const CUSTOMER_GIVEN = ['민준', '서연', '지후', '현우', '수빈', '예린', '도윤', '하은'];

const INVERTER_MODELS = ['HSI-50KTL', 'SG-33CX', 'DAS-50TL', 'OSI-60KP'];
const MODULE_MODELS = ['HN-455JD', 'QP-460MB', 'LS-450NW'];
const MODULE_WATT: Record<string, number> = { 'HN-455JD': 455, 'QP-460MB': 460, 'LS-450NW': 450 };

/** 모듈 스펙으로 총 설비용량(kW)을 계산한다 (SFR-016-03). */
export function computeCapacity(spec: ModuleSpec): number {
  return Math.round(spec.wattPerPanel * spec.panelCount) / 1000;
}

function buildAsset(schoolIndex: number): PlantAsset {
  const school = SCHOOLS[schoolIndex];
  const next = createRandom(hashSeed(`${school.id}-asset`));
  const moduleModel = pickOne(next, MODULE_MODELS);
  const wattPerPanel = MODULE_WATT[moduleModel];
  // 등록 용량과 스펙 산출값이 맞아떨어지게 장수를 역산한다.
  const panelCount = Math.max(1, Math.round((school.capacityKw * 1000) / wattPerPanel));

  return {
    plantId: school.id,
    plantName: school.name,
    address: school.address,
    installedAt: school.installedAt,
    builder: pickOne(next, BUILDERS),
    monitoring: pickOne(next, MONITORS),
    customer: {
      name: `${pickOne(next, CUSTOMER_SURNAME)}${pickOne(next, CUSTOMER_GIVEN)}`,
      phone: `010-${String(1000 + Math.floor(next() * 9000))}-${String(1000 + Math.floor(next() * 9000))}`,
    },
    inverterModel: pickOne(next, INVERTER_MODELS),
    module: {
      model: moduleModel,
      wattPerPanel,
      panelCount,
      seriesCount: Math.max(1, Math.round(panelCount / Math.max(1, Math.round(school.capacityKw / 3)))),
    },
  };
}

export const SEED_ASSETS: PlantAsset[] = SCHOOLS.map((_, index) => buildAsset(index));

const ASSET_BY_ID = new Map(SEED_ASSETS.map((asset) => [asset.plantId, asset]));

export function getSeedAsset(plantId: string): PlantAsset | null {
  return ASSET_BY_ID.get(plantId) ?? null;
}

/** 시드 수정 이력 — 화면에서 새 수정이 이 위에 쌓인다 (SFR-016-06). */
export const SEED_ASSET_CHANGES: AssetChange[] = [
  {
    id: 'AC-2604',
    plantId: SEED_ASSETS[3].plantId,
    plantName: SEED_ASSETS[3].plantName,
    at: stampAgo(6, '15:12'),
    actor: '김도현',
    field: '모니터링 업체',
    before: '솔라뷰시스템',
    after: SEED_ASSETS[3].monitoring.name,
  },
  {
    id: 'AC-2603',
    plantId: SEED_ASSETS[11].plantId,
    plantName: SEED_ASSETS[11].plantName,
    at: stampAgo(13, '10:44'),
    actor: '김도현',
    field: '시공 업체 연락처',
    before: '041-552-0000',
    after: SEED_ASSETS[11].builder.phone,
  },
  {
    id: 'AC-2602',
    plantId: SEED_ASSETS[27].plantId,
    plantName: SEED_ASSETS[27].plantName,
    at: stampAgo(21, '09:03'),
    actor: '박세연',
    field: '주소',
    before: '구주소 표기',
    after: SEED_ASSETS[27].address,
  },
];
