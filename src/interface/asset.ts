import type { RtuStatus } from './status';

/** 모듈 스펙 — 입력하면 총 설비용량이 자동 산출된다 (SFR-016-03) */
export interface ModuleSpec {
  model: string;
  /** 모듈 1장 출력(W) */
  wattPerPanel: number;
  panelCount: number;
  seriesCount: number;
}

/** 발전소 등록 정보 (SFR-016) */
export interface PlantAsset {
  plantId: string;
  plantName: string;
  address: string;
  installedAt: string;
  /** 시공 업체 */
  builder: { name: string; phone: string };
  /** 모니터링(유지관리) 업체 */
  monitoring: { name: string; phone: string };
  /** 수용가(계약) 정보 — 화면에서는 마스킹 대상 (SFR-016-04) */
  customer: { name: string; phone: string };
  inverterModel: string;
  module: ModuleSpec;
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
