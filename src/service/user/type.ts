import type { PagingRequest } from '@/service/common';

/** 검색어는 사용자 이름·로그인 ID·이메일을 함께 훑는다 */
export interface UserListRequest extends PagingRequest {
  keyword?: string;
  /** 그룹관리자 탭처럼 한 등급만 볼 때 (userTypeCode) */
  userTypeCode?: number;
}

export interface UserListRow {
  userId: number;
  loginId: string;
  /** 사용자 이름 (userName) */
  name: string;
  userTypeCode: number;
  email: string;
  /** 마지막 로그인 — 없으면 null */
  lastLoginAt: string | null;
  /** 로그인 실패가 쌓여 잠긴 계정인지 */
  locked: boolean;
  /** 맡은 발전소 수 — 그룹관리자 목록이 쓴다 */
  plantCount: number;
}

export interface UserDetailRequest {
  userId: number;
}

export interface UserDetailResponse {
  userId: number;
  loginId: string;
  name: string;
  userTypeCode: number;
  email: string;
  /** 휴대전화번호 (cellPhone) */
  phone: string;
  /** 조회 가능한 발전소. 빈 배열이면 제한 없음 */
  powerPlantIds: number[];
  lastLoginAt: string | null;
  locked: boolean;
}

/**
 * `userId` 가 있으면 수정, 없으면 등록.
 * 비밀번호는 등록에만 필수고, 수정에서는 적었을 때만 실어 보낸다.
 */
export interface UserSaveRequest {
  userId?: number;
  loginId: string;
  password?: string;
  name: string;
  userTypeCode: number;
  email: string;
  phone: string;
  powerPlantIds: number[];
}

export interface UserDeleteRequest {
  userId: number;
}
