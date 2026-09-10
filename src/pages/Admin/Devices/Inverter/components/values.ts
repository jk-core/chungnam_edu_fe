import { INVERTER_TYPE, PHASE_TYPE } from '@/configs/codes';
import { inverterTypeCodeOf } from '@/mocks/deviceMaster';
import type { PhaseTypeCode } from '@/configs/codes';
import type { InverterFormValues } from '@/service/inverter/type';
import type { InverterProduct } from '@/interface/deviceMaster';

export const phaseFromCode = (code: PhaseTypeCode): InverterProduct['phase'] =>
  (code === PHASE_TYPE.CODE.단상 ? '단상' : '삼상');

export const EMPTY_VALUES: InverterFormValues = {
  inverterEnterpriseName: '',
  inverterName: '',
  // 빈 숫자 칸은 NaN 이다 — 0 은 「용량 0kW」라는 뜻이 되어 버린다.
  inverterCapacity: Number.NaN,
  inverterTypeCode: INVERTER_TYPE.CODE['스트링 인버터'],
  phaseTypeCode: PHASE_TYPE.CODE.삼상,
};

export function toFormValues(product: InverterProduct): InverterFormValues {
  return {
    inverterEnterpriseName: product.maker,
    inverterName: product.name,
    inverterCapacity: product.capacityKw,
    inverterTypeCode: inverterTypeCodeOf(product.kind),
    phaseTypeCode: product.phase === '단상' ? PHASE_TYPE.CODE.단상 : PHASE_TYPE.CODE.삼상,
  };
}
