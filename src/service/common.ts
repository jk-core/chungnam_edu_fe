/*
  API 계약 공통 껍데기.

  호출은 아직 없다 — BE 가 붙기 전에 엔드포인트와 요청·응답 모양을 먼저 못 박아 두는 자리다.
  화면이 담는 값이 그대로 실려 나가도록, 목업과 폼이 이 타입을 기준으로 움직인다.
*/

export const API_BASE = '/api/v2.0';

export interface Endpoint {
  method: 'GET' | 'PUT' | 'DELETE';
  url: string;
}

/**
 * 엔티티 하나가 갖는 네 갈래.
 * 식별자는 전부 queryString 으로 넘긴다 — path variable 을 쓰지 않는다.
 */
export interface CrudEndpoints {
  /** 표가 그리는 컬럼만 담아 내려주는 목록 */
  list: Endpoint;
  /** PK 하나로 폼이 채울 전체 필드를 꺼낸다 */
  detail: Endpoint;
  /** PK 가 실려 있으면 수정, 없으면 등록 */
  save: Endpoint;
  remove: Endpoint;
}

export function crudEndpoints(resource: string): CrudEndpoints {
  return {
    list: { method: 'GET', url: `${API_BASE}/${resource}/list` },
    detail: { method: 'GET', url: `${API_BASE}/${resource}/detail` },
    save: { method: 'PUT', url: `${API_BASE}/${resource}` },
    remove: { method: 'DELETE', url: `${API_BASE}/${resource}` },
  };
}

/** 목록 요청 공통. 쪽 번호는 0 부터 */
export interface PagingRequest {
  page: number;
  size: number;
}

export interface PagingResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** 등록·수정·삭제 응답 — 방금 다룬 PK 하나 */
export interface MutationResponse {
  id: number;
}
