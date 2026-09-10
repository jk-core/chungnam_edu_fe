import { INVERTER_TYPE, PHASE_TYPE } from '@/configs/codes';
import type { InverterTypeCode, PhaseTypeCode } from '@/configs/codes';
import type { InverterFormValues } from '@/service/inverter/type';
import type { InverterKind, InverterProduct } from '@/interface/deviceMaster';

/** 목업의 인버터 타입 어휘와 서버 코드를 맞바꾼다 */
const CODE_BY_KIND: Record<InverterKind, InverterTypeCode> = {
  string: INVERTER_TYPE.CODE['스트링 인버터'],
  central: INVERTER_TYPE.CODE['센트럴 인버터'],
  micro: INVERTER_TYPE.CODE['마이크로 인버터'],
};

const KIND_BY_CODE = new Map<InverterTypeCode, InverterKind>(
  (Object.entries(CODE_BY_KIND) as [InverterKind, InverterTypeCode][]).map(([kind, code]) => [code, kind]),
);

/** 목업 계층은 일반 인버터를 모르므로 스트링으로 본다 — 아래 갈래가 스트링인 것이 기본이다 */
export const kindFromCode = (code: InverterTypeCode): InverterKind => KIND_BY_CODE.get(code) ?? 'string';

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
    inverterTypeCode: CODE_BY_KIND[product.kind],
    phaseTypeCode: product.phase === '단상' ? PHASE_TYPE.CODE.단상 : PHASE_TYPE.CODE.삼상,
  };
}
