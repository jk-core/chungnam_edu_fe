import { crudEndpoints } from '@/service/common';

/**
 * 스트링 (SolaString) — PK 는 `stringId`.
 *
 * 목록과 상세는 스트링 한 조가 아니라 **설비 한 대(`cid`)** 를 단위로 삼는다. 스트링은 설비마다
 * 함께 늘고 주는 값이라, 한 조씩 늘어놓으면 어느 설비의 것인지가 흩어진다.
 */
export const STRING_API = crudEndpoints('string');
