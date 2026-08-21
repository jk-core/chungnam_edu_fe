import type { PagingRequest } from '@/service/common';

/** 검색어는 인버터 이름·업체 이름을 함께 훑는다 */
export interface InverterListRequest extends PagingRequest {
  keyword?: string;
  /** 스트링 인버터만 고를 때처럼 타입으로 좁힐 때 (inverterTypeCode) */
  inverterTypeCode?: number;
}

export interface InverterListRow {
  inverterId: number;
  /** 인버터 모델명 (inverterTerm) */
  name: string;
  /** 인버터 업체명 (inverterEntName) */
  maker: string;
  /** 인버터 용량(kW) (inverterCapa) */
  inverterCapa: number;
  inverterTypeCode: number;
  /** 위상 종류 코드 (phaseTypeCode) */
  phaseTypeCode: number;
}

export interface InverterDetailRequest {
  inverterId: number;
}

export interface InverterDetailResponse {
  inverterId: number;
  name: string;
  maker: string;
  inverterCapa: number;
  inverterTypeCode: number;
  phaseTypeCode: number;
}

/** `inverterId` 가 있으면 수정, 없으면 등록 */
export interface InverterSaveRequest {
  inverterId?: number;
  name: string;
  maker: string;
  inverterCapa: number;
  inverterTypeCode: number;
  phaseTypeCode: number;
}

export interface InverterDeleteRequest {
  inverterId: number;
}
