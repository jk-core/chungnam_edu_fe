import type { PlantType } from './energy';
import type { RtuStatus } from './status';

/**
 * 발전소 등록 정보 (SFR-016).
 * 서버 규격은 `PowerPlant` 로, 필드 이름을 주석에 함께 적어 둔다.
 *
 * 모듈 구성과 인버터 모델은 여기 없다 — 그것은 발전소가 아니라 그 아래 선 설비마다 다르므로
 * `EquipmentMaster` 가 갖는다. 발전소 설비용량도 딸린 설비들의 합으로 읽는다.
 */
export interface PlantAsset {
  plantId: string;
  /** 서버가 매기는 발전소 번호 (powerPlantId) */
  powerPlantId: number;
  plantName: string;
  /**
   * 시·군 코드 (regionCode) — 5자리 숫자 문자열.
   * 주소 검색이 함께 돌려주는 값이라 폼에 세우지 않는다.
   */
  regionCode: string;
  address: string;
  /** 상세 주소 (addressDetail) */
  addressDetail: string;
  installedAt: string;
  /** RTU 업체 (rtuEntName) */
  rtuEntName: string;
  /** 시공 업체 (installerName) */
  builder: { name: string; phone: string };
  /** 이 발전소를 맡은 사용자 (userId) — 사용자 관리의 계정과 잇는다 */
  userId: number | null;
  /** 연결한 일사량계 번호 (irradId) */
  irradId: number | null;
  /** 구분 (plantType) */
  plantType: PlantType;
  /** 비고 (etc) */
  etc: string;
}

/** 등록 정보 수정 이력 한 건 (SFR-016-06) */
export interface AssetChange {
  id: string;
  plantId: string;
  plantName: string;
  at: string;
  actor: string;
  field: string;
  before: string;
  after: string;
}

/** RTU 한 대. 관리 화면은 없고 수집 주기·상태를 읽는 쪽만 쓴다 */
export interface Rtu {
  id: string;
  plantId: string;
  plantName: string;
  model: string;
  serial: string;
  firmware: string;
  /** 수집 주기(분) */
  intervalMinutes: number;
  status: RtuStatus;
  /** 마지막 수신 시각 */
  lastSeenAt: string;
}
