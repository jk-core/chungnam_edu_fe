import { INVERTER_TYPE, PHASE_TYPE } from '@/configs/codes';
import type { ManageInverterDetail } from '@/service/inverter/type';
import type { InverterFormValues } from './form';

export const EMPTY_VALUES: InverterFormValues = {
  inverterEnterpriseName: '',
  inverterName: '',
  // 빈 숫자 칸은 NaN 이다 — 0 은 「용량 0kW」라는 뜻이 되어 버린다.
  inverterCapacity: Number.NaN,
  inverterTypeCode: INVERTER_TYPE.CODE['스트링 인버터'],
  phaseTypeCode: PHASE_TYPE.CODE.삼상,
};

export function toFormValues(target: ManageInverterDetail): InverterFormValues {
  return {
    inverterEnterpriseName: target.inverterEnterpriseName,
    inverterName: target.inverterName,
    inverterCapacity: target.inverterCapacity,
    inverterTypeCode: target.inverterTypeCode,
    phaseTypeCode: target.phaseTypeCode,
  };
}
