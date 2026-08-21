import type { PagingRequest } from '@/service/common';
import type { PlantType } from '@/interface/energy';

/** 검색어는 발전소 ID·이름·사용자 이름을 함께 훑는다 */
export interface PlantListRequest extends PagingRequest {
  keyword?: string;
}

export interface PlantListRow {
  powerPlantId: number;
  plantName: string;
  regionName: string;
  /** 이 발전소를 맡은 사용자 이름 */
  userName: string;
  address: string;
  addressDetail: string;
  /** 발전소 운전 상태 코드 — 코드표 미확정 */
  statusCode: number;
}

export interface PlantDetailRequest {
  powerPlantId: number;
}

export interface PlantDetailResponse {
  powerPlantId: number;
  plantName: string;
  plantType: PlantType;
  /** 시·군 코드 — 주소 검색이 함께 돌려주는 값이라 폼에 세우지 않는다 */
  regionCode: string;
  address: string;
  addressDetail: string;
  installedAt: string;
  /** RTU 업체 (rtuEntName) */
  rtuEntName: string;
  /** 시공 업체 (installerName) */
  installerName: string;
  installerPhone: string;
  userId: number | null;
  userName: string;
  irradId: number | null;
  irradName: string;
  /** 딸린 설비 용량의 합(kW) — 발전소가 직접 갖는 값이 아니라 읽어 오는 값이다 */
  instCapa: number;
  etc: string;
}

/** `powerPlantId` 가 있으면 수정, 없으면 등록 */
export interface PlantSaveRequest {
  powerPlantId?: number;
  plantName: string;
  plantType: PlantType;
  regionCode: string;
  address: string;
  addressDetail: string;
  installedAt: string;
  rtuEntName: string;
  installerName: string;
  installerPhone: string;
  userId: number | null;
  irradId: number | null;
  etc: string;
}

export interface PlantDeleteRequest {
  powerPlantId: number;
}
