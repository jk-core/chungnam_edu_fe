import { CELL_TYPE } from '@/configs/codes';
import { NUMERIC } from '@/service/module/type';
import type { CellTypeCode } from '@/configs/codes';
import type { ModuleFormValues, NumericKey } from '@/service/module/type';
import type { ModuleProduct } from '@/interface/deviceMaster';

/** 목업의 셀 종류 어휘와 서버 코드를 맞바꾼다 */
const CODE_BY_CELL_TYPE: Record<ModuleProduct['cellType'], CellTypeCode> = {
  single: CELL_TYPE.CODE.단면,
  double: CELL_TYPE.CODE.양면,
};

export const cellTypeFromCode = (code: CellTypeCode): ModuleProduct['cellType'] =>
  (code === CELL_TYPE.CODE.양면 ? 'double' : 'single');

// 빈 숫자 칸은 NaN 이다 — 0 은 「전압 0V」라는 뜻이 되어 버린다.
const emptyNumbers = Object.fromEntries(NUMERIC.map(({ key }) => [key, Number.NaN])) as Record<NumericKey, number>;

export const EMPTY_VALUES: ModuleFormValues = {
  moduleName: '',
  moduleEnterpriseName: '',
  cellTypeCode: CELL_TYPE.CODE.단면,
  ...emptyNumbers,
};

export function toFormValues(product: ModuleProduct): ModuleFormValues {
  return {
    moduleName: product.name,
    moduleEnterpriseName: product.maker,
    cellTypeCode: CODE_BY_CELL_TYPE[product.cellType],
    pwrMp: product.wattPerPanel,
    vltMp: product.maxVoltage,
    curMp: product.maxCurrent,
    vltOc: product.openVoltage,
    curSc: product.shortCurrent,
    tempVltCof: product.voltTempCoeff,
    tempCurCof: product.currentTempCoeff,
  };
}
