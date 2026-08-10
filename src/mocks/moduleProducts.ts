import type { ModuleProduct } from '@/interface/deviceMaster';

/*
  모듈 제품 마스터 (SFR-017-05).

  전에는 `assetMaster.ts` 가 모델명 문자열 셋과 출력 표만 들고 있었다. 인버터 등록에서
  모듈을 고르고 그 스펙으로 설비용량을 산출해야 해서, 제품을 엔티티로 올린다.
  값은 국내 유통되는 단결정 모듈 사양 범위를 따랐다.
*/
export const SEED_MODULES: ModuleProduct[] = [
  {
    id: 'mod-hn455',
    moduleId: 1,
    name: 'HN-455JD',
    maker: '한화큐셀',
    wattPerPanel: 455,
    maxVoltage: 41.6,
    maxCurrent: 10.94,
    openVoltage: 49.7,
    shortCurrent: 11.6,
    voltTempCoeff: -0.27,
    currentTempCoeff: 0.04,
    cellType: 'single',
  },
  {
    id: 'mod-qp460',
    moduleId: 2,
    name: 'QP-460MB',
    maker: '큐피솔라',
    wattPerPanel: 460,
    maxVoltage: 42.1,
    maxCurrent: 10.93,
    openVoltage: 50.2,
    shortCurrent: 11.7,
    voltTempCoeff: -0.28,
    currentTempCoeff: 0.045,
    cellType: 'double',
  },
  {
    id: 'mod-ls450',
    moduleId: 3,
    name: 'LS-450NW',
    maker: '엘에스솔라',
    wattPerPanel: 450,
    maxVoltage: 41.2,
    maxCurrent: 10.93,
    openVoltage: 49.3,
    shortCurrent: 11.5,
    voltTempCoeff: -0.29,
    currentTempCoeff: 0.048,
    cellType: 'single',
  },
];

const BY_NAME = new Map(SEED_MODULES.map((item) => [item.name, item]));

/** 모델명으로 제품을 찾는다 — 발전소 등록 정보가 모델명 문자열을 들고 있어서다. */
export function getModuleByName(name: string): ModuleProduct | null {
  return BY_NAME.get(name) ?? null;
}

/** 셀 종류 표기 */
export const CELL_TYPE_LABEL: Record<ModuleProduct['cellType'], string> = {
  single: '단면',
  double: '양면',
};
