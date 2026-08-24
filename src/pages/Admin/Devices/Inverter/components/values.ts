import type { InverterFormValues } from '@/service/inverter/type';
import type { InverterProduct } from '@/interface/deviceMaster';

export const EMPTY_VALUES: InverterFormValues = {
  maker: '',
  name: '',
  // 빈 숫자 칸은 NaN 이다 — 0 은 「용량 0kW」라는 뜻이 되어 버린다.
  capacityKw: Number.NaN,
  kind: 'string',
  phase: '삼상',
};

export function toFormValues(product: InverterProduct): InverterFormValues {
  return {
    maker: product.maker,
    name: product.name,
    capacityKw: product.capacityKw,
    kind: product.kind,
    phase: product.phase,
  };
}
