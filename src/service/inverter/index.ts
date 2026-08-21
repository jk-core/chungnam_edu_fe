import { crudEndpoints } from '@/service/common';

/**
 * 인버터 제품 마스터 — PK 는 `inverterId`.
 * 발전소에 실제로 설치된 한 대는 설비(`equipment`) 쪽이다.
 */
export const INVERTER_API = crudEndpoints('inverter');
