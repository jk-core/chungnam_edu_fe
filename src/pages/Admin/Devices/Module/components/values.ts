import { NUMERIC } from '@/service/module/type';
import type { ModuleFormValues, NumericKey } from '@/service/module/type';
import type { ModuleProduct } from '@/interface/deviceMaster';

// 빈 숫자 칸은 NaN 이다 — 0 은 「전압 0V」라는 뜻이 되어 버린다.
const emptyNumbers = Object.fromEntries(NUMERIC.map(({ key }) => [key, Number.NaN])) as Record<NumericKey, number>;

export const EMPTY_VALUES: ModuleFormValues = {
  name: '',
  maker: '',
  cellType: 'single',
  ...emptyNumbers,
};

export function toFormValues(product: ModuleProduct): ModuleFormValues {
  return {
    name: product.name,
    maker: product.maker,
    cellType: product.cellType,
    wattPerPanel: product.wattPerPanel,
    maxVoltage: product.maxVoltage,
    maxCurrent: product.maxCurrent,
    openVoltage: product.openVoltage,
    shortCurrent: product.shortCurrent,
    voltTempCoeff: product.voltTempCoeff,
    currentTempCoeff: product.currentTempCoeff,
  };
}
