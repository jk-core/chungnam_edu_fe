import type { PagingRequest } from '@/service/common';

/** 검색어는 일사량계 이름·RTU 통신 ID 를 함께 훑는다 */
export interface PyranometerListRequest extends PagingRequest {
  keyword?: string;
  /** 한 발전소의 일사량계만 볼 때 — 발전소 폼의 검색기가 쓴다 */
  powerPlantId?: number;
}

export interface PyranometerListRow {
  irradId: number;
  /** 일사량계 이름 (irradTerm) */
  name: string;
  plantName: string;
  rtuCommId: string;
  rtuPort: number;
  /** 모듈 온도계를 함께 달았는지 (isModTemp) */
  isModTemp: boolean;
}

export interface PyranometerDetailRequest {
  irradId: number;
}

export interface PyranometerDetailResponse {
  irradId: number;
  powerPlantId: number;
  plantName: string;
  name: string;
  calibrationFactor: number;
  rtuCommId: string;
  /** 일사량계는 3번을 쓴다 */
  rtuPort: number;
  isModTemp: boolean;
  etc: string;
  /** RTU 통신 상태 코드 (rtuCommunicationStateCode) */
  rtuStateCode: number;
}

/** `irradId` 가 있으면 수정, 없으면 등록 */
export interface PyranometerSaveRequest {
  irradId?: number;
  powerPlantId: number;
  name: string;
  calibrationFactor: number;
  rtuCommId: string;
  rtuPort: number;
  isModTemp: boolean;
  etc: string;
}

export interface PyranometerDeleteRequest {
  irradId: number;
}
