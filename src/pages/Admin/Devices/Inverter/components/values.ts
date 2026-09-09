import { INVERTER_TYPE } from '@/configs/codes';
import type { InverterFormValues } from '@/service/inverter/type';
import type { InverterKind, InverterProduct } from '@/interface/deviceMaster';

/** 목업의 인버터 타입 어휘와 서버 코드를 맞바꾼다 */
const CODE_BY_KIND: Record<InverterKind, InverterFormValues['inverterTypeCode']> = {
  string: INVERTER_TYPE.CODE.스트링,
  central: INVERTER_TYPE.CODE.센트럴,
  micro: INVERTER_TYPE.CODE.마이크로,
};

const KIND_BY_CODE = new Map<InverterFormValues['inverterTypeCode'], InverterKind>(
  (Object.entries(CODE_BY_KIND) as [InverterKind, InverterFormValues['inverterTypeCode']][])
    .map(([kind, code]) => [code, kind]),
);

export const kindFromCode = (code: InverterFormValues['inverterTypeCode']): InverterKind =>
  KIND_BY_CODE.get(code) ?? 'string';

export const EMPTY_VALUES: InverterFormValues = {
  inverterEnterpriseName: '',
  inverterName: '',
  // 빈 숫자 칸은 NaN 이다 — 0 은 「용량 0kW」라는 뜻이 되어 버린다.
  inverterCapacity: Number.NaN,
  inverterTypeCode: INVERTER_TYPE.CODE.스트링,
  phaseTypeName: '삼상',
};

export function toFormValues(product: InverterProduct): InverterFormValues {
  return {
    inverterEnterpriseName: product.maker,
    inverterName: product.name,
    inverterCapacity: product.capacityKw,
    inverterTypeCode: CODE_BY_KIND[product.kind],
    phaseTypeName: product.phase,
  };
}
