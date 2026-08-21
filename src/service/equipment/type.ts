import type { PagingRequest } from '@/service/common';

/** 검색어는 설비 이름·CID·RTU 통신 ID·발전소 이름을 함께 훑는다 */
export interface EquipmentListRequest extends PagingRequest {
  keyword?: string;
  /** 한 발전소의 설비만 볼 때 */
  powerPlantId?: number;
}

export interface EquipmentListRow {
  cid: number;
  plantName: string;
  /** 설비 이름 (meainName) */
  name: string;
  inverterName: string;
  inverterMaker: string;
  /** 인버터 타입 코드 (inverterTypeCode) */
  inverterTypeCode: number;
  /** 설비용량(kW) (instCapa) */
  instCapa: number;
  /** RTU 통신 ID (rtuCommuId) */
  rtuCommId: string;
  rtuPort: number | null;
}

export interface EquipmentDetailRequest {
  cid: number;
}

export interface EquipmentDetailResponse {
  cid: number;
  powerPlantId: number;
  plantName: string;
  userId: number | null;
  userName: string;
  name: string;
  rtuCommId: string;
  /** 3번은 일사량계 몫이라 설비가 쓸 수 없다 */
  rtuPort: number | null;
  /** 고른 인버터 제품 번호 (inverterId) */
  inverterId: number | null;
  /** 고른 모듈 제품 번호 (solaModuleId) */
  moduleId: number | null;
  /** 방위각(도). 정남이 180 이다 */
  azimuth: number;
  /** 경사각(도) (incliAngle) */
  incliAngle: number;
  instCapa: number;
  /** MPPT 1번 직렬·병렬 (modulSeriCnt / modulArowCnt) */
  series1: number;
  parallel1: number;
  /** MPPT 2번. 안 쓰면 0 */
  series2: number;
  parallel2: number;
  asExpiresAt: string;
  etc: string;
  /** 운전시작일 (meainInstDtm) */
  installedAt: string;
  /** 아래는 폼이 고치지 않고 읽기만 하는 값이다 */
  rtuEntName: string;
  installerName: string;
  /** 모듈 1장 출력(W) */
  wattPerPanel: number;
  /** 인버터 제품 용량(kW) */
  inverterCapa: number;
  firstReceivedAt: string | null;
  lastReceivedAt: string | null;
}

/** `cid` 가 있으면 수정, 없으면 등록 */
export interface EquipmentSaveRequest {
  cid?: number;
  powerPlantId: number;
  userId: number | null;
  name: string;
  rtuCommId: string;
  rtuPort: number | null;
  inverterId: number | null;
  moduleId: number | null;
  azimuth: number;
  incliAngle: number;
  instCapa: number;
  series1: number;
  parallel1: number;
  series2: number;
  parallel2: number;
  asExpiresAt: string;
  etc: string;
  installedAt: string;
}

export interface EquipmentDeleteRequest {
  cid: number;
}
