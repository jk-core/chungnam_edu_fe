import type { RtuStatus } from './status';

/** 모듈 스펙 — 입력하면 총 설비용량이 자동 산출된다 (SFR-016-03) */
export interface ModuleSpec {
  model: string;
  /** 모듈 1장 출력(W) */
  wattPerPanel: number;
  panelCount: number;
  seriesCount: number;
}

/**
 * 발전소 등록 정보 (SFR-016).
 * 서버 규격은 `PowerPlant` 로, 필드 이름을 주석에 함께 적어 둔다.
 */
export interface PlantAsset {
  plantId: string;
  /** 서버가 매기는 발전소 번호 (powerPlantId) */
  powerPlantId: number;
  plantName: string;
  /** 시·군 코드 (regionCode) — 5자리 숫자 문자열 */
  regionCode: string;
  address: string;
  /** 상세 주소 (addressDetail) */
  addressDetail: string;
  installedAt: string;
  /** 시공 업체 (constructEnterpriseName·Phone) */
  builder: { name: string; phone: string };
  /** 유지관리 업체 (manageEnterpriseName·Phone) */
  monitoring: { name: string; phone: string };
  /** 수용가(계약) 정보 — 화면에서는 마스킹 대상 (SFR-016-04) */
  customer: { name: string; phone: string };
  /** 수용가 계정 번호 (userId) — 사용자 관리의 계정과 잇는다 */
  userId: number | null;
  /** 연결한 일사량계 번호 (irradId) */
  irradId: number | null;
  inverterModel: string;
  module: ModuleSpec;
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

/** RTU(RTU) 이력 구분 (SFR-017-03) */
export type RtuEventKind = 'install' | 'replace' | 'relocate' | 'firmware';

export interface RtuEvent {
  at: string;
  kind: RtuEventKind;
  note: string;
}

/** RTU 한 대 (SFR-017-01~03) */
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
  events: RtuEvent[];
}
