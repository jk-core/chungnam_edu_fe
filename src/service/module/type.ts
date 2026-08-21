import type { PagingRequest } from '@/service/common';

/** 검색어는 모듈 이름·업체 이름을 함께 훑는다 */
export interface ModuleListRequest extends PagingRequest {
  keyword?: string;
}

export interface ModuleListRow {
  moduleId: number;
  name: string;
  maker: string;
  /** 모듈 1장 출력(W) (pwrMp) */
  wattPerPanel: number;
  /** 0 = 단면, 1 = 양면 */
  cellType: number;
}

export interface ModuleDetailRequest {
  moduleId: number;
}

export interface ModuleDetailResponse {
  moduleId: number;
  name: string;
  maker: string;
  wattPerPanel: number;
  cellType: number;
  /** 최대 출력 동작 전압(V) (vltMp) */
  maxVoltage: number;
  /** 최대 출력 동작 전류(A) (curMp) */
  maxCurrent: number;
  /** 개방 전압(V) (vltOc) */
  openVoltage: number;
  /** 단락 전류(A) (curSc) */
  shortCurrent: number;
  /** 전압 온도계수(%/℃) (tempVltCof) — 음수다 */
  voltTempCoeff: number;
  /** 전류 온도계수(%/℃) (tempCurCof) */
  currentTempCoeff: number;
}

/** `moduleId` 가 있으면 수정, 없으면 등록 */
export interface ModuleSaveRequest {
  moduleId?: number;
  name: string;
  maker: string;
  wattPerPanel: number;
  cellType: number;
  maxVoltage: number;
  maxCurrent: number;
  openVoltage: number;
  shortCurrent: number;
  voltTempCoeff: number;
  currentTempCoeff: number;
}

export interface ModuleDeleteRequest {
  moduleId: number;
}
