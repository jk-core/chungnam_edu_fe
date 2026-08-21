import { crudEndpoints } from '@/service/common';

/**
 * 사용자 — PK 는 `userId`.
 * 목록은 개발자(2999)를 뺀 채 내려온다 — 화면 어디에도 세우지 않는 등급이다.
 */
export const USER_API = crudEndpoints('user');
