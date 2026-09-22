import { CELL_TYPE } from '@/configs/codes';
import type { ManageSolaModuleDetail } from '@/service/module/type';
import { NUMERIC } from './form';
import type { ModuleFormValues, NumericKey } from './form';

// 빈 숫자 칸은 NaN 이다 — 0 은 「전압 0V」라는 뜻이 되어 버린다.
const emptyNumbers = Object.fromEntries(NUMERIC.map(({ key }) => [key, Number.NaN])) as Record<NumericKey, number>;

export const EMPTY_VALUES: ModuleFormValues = {
  moduleName: '',
  moduleEnterpriseName: '',
  cellTypeCode: CELL_TYPE.CODE.단면,
  ...emptyNumbers,
};

export function toFormValues(target: ManageSolaModuleDetail): ModuleFormValues {
  return {
    moduleName: target.moduleName,
    moduleEnterpriseName: target.moduleEnterpriseName,
    cellTypeCode: target.cellTypeCode,
    pwrMp: target.pwrMp,
    vltMp: target.vltMp,
    curMp: target.curMp,
    vltOc: target.vltOc,
    curSc: target.curSc,
    tempVltCof: target.tempVltCof,
    tempCurCof: target.tempCurCof,
  };
}
