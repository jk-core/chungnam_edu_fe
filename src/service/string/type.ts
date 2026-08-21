import type { PagingRequest } from '@/service/common';

/** 목록 한 줄은 설비 한 대다. 검색어는 설비 이름·CID·발전소 이름을 함께 훑는다 */
export interface StringListRequest extends PagingRequest {
  keyword?: string;
}

export interface StringListRow {
  cid: number;
  plantName: string;
  /** 설비 이름 (meainName) */
  equipmentName: string;
  stringCount: number;
  /** 스트링들의 직렬 × 병렬 합 */
  moduleCount: number;
}

export interface StringDetailRequest {
  cid: number;
}

export interface StringUnit {
  stringId: number;
  /** 스트링 순번. 1 부터 (stringNum) */
  seq: number;
  name: string;
  /** 모듈 직렬 개수 (modulSeriCnt) */
  seriesCount: number;
  /** 모듈 병렬 개수 (modulArowCnt) */
  parallelCount: number;
}

export interface StringDetailResponse {
  cid: number;
  equipmentName: string;
  plantName: string;
  strings: StringUnit[];
}

/**
 * 한 설비의 스트링 전체를 통째로 교체한다.
 * 줄마다 `stringId` 가 있으면 수정, 없으면 등록이고, 목록에서 빠진 줄은 서버가 지운다.
 */
export interface StringSaveRequest {
  cid: number;
  strings: (Omit<StringUnit, 'stringId'> & { stringId?: number })[];
}

export interface StringDeleteRequest {
  stringId: number;
}
