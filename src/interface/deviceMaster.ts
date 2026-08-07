import type { RtuStatus } from './status';

/*
  설비 마스터 — 관리자 콘솔에서 등록·수정·삭제하는 값들 (SFR-016-01/05, SFR-017-04~06).

  운영 화면이 쓰는 `Inverter`·`StringUnit`·`JunctionBox`(interface/equipment.ts)와 일부러 갈라 둔다.
  그쪽은 발전량·건전도처럼 계산으로 채워지는 필드를 함께 들고 있어, 등록 폼이 건드릴 값과
  시스템이 만들어 내는 값이 한 타입에 섞이면 무엇을 고칠 수 있는지가 흐려진다.
*/

/** 모듈 제품 마스터 — 인버터 등록에서 이 목록을 고른다 (SFR-017-05) */
export interface ModuleProduct {
  id: string;
  name: string;
  maker: string;
  /** 모듈 1장 출력(W) */
  wattPerPanel: number;
  /** 최대 출력 동작 전압(V) */
  maxVoltage: number;
  /** 최대 출력 동작 전류(A) */
  maxCurrent: number;
  /** 개방 전압(V) */
  openVoltage: number;
  /** 단락 전류(A) */
  shortCurrent: number;
  /** 전압 온도계수(%/℃) — 음수다 */
  voltTempCoeff: number;
  /** 전류 온도계수(%/℃) */
  currentTempCoeff: number;
  /** single = 단면, double = 양면 */
  cellType: 'single' | 'double';
}

/** 일사량계(환경센서) — 발전소마다 한 대 (SFR-016-01) */
export interface Pyranometer {
  id: string;
  plantId: string;
  plantName: string;
  name: string;
  /** 캘리브레이션 인수 */
  calibrationFactor: number;
  rtuCommId: string;
  /** RTU 포트. 일사량계는 3번을 쓴다 */
  rtuPort: number;
  /** 모듈 온도계를 함께 달았는지 */
  hasModuleThermometer: boolean;
  note: string;
  status: RtuStatus;
}

/** 접속반 등록 정보 (SFR-017-06) */
export interface JunctionBoxMaster {
  id: string;
  inverterId: string;
  name: string;
  /** 모듈 직렬 개수 */
  seriesCount: number;
  /** 모듈 병렬 개수 */
  parallelCount: number;
}

/** 스트링 등록 정보 — 인버터 하나에 여러 개 (SFR-016-01) */
export interface StringMaster {
  id: string;
  inverterId: string;
  /** 스트링 순번. 1부터 */
  seq: number;
  name: string;
  seriesCount: number;
  parallelCount: number;
}

/** 인버터 타입 (SFR-017-04) */
export type InverterKind = 'general' | 'string' | 'central' | 'micro';

/**
 * 인버터 등록 정보 (SFR-017-04).
 * 설비용량은 필드로 두지 않는다 — 모듈 스펙에서 산출한다 (SFR-016-03).
 */
export interface InverterMaster {
  inverterId: string;
  plantId: string;
  name: string;
  /** 인버터 업체명 */
  maker: string;
  /** 인버터 모델명 */
  productName: string;
  rtuCommId: string;
  /** RTU 포트. 3번은 일사량계 몫이라 인버터가 쓸 수 없다 */
  rtuPort: number | null;
  kind: InverterKind;
  phase: 'single' | 'three';
  moduleProductId: string;
  /** MPPT 1번 직렬·병렬 */
  series1: number;
  parallel1: number;
  /** MPPT 2번. 안 쓰면 0 */
  series2: number;
  parallel2: number;
  note: string;
  installedAt: string;
  operatedAt: string;
}

/** 장비 등록 정보 변경 이력 한 건 (SFR-016-06) — 6종이 함께 쓴다 */
export type DeviceKind = 'rtu' | 'inverter' | 'junction' | 'module' | 'string' | 'pyranometer';

export interface DeviceChange {
  id: string;
  kind: DeviceKind;
  targetId: string;
  targetName: string;
  at: string;
  actor: string;
  field: string;
  before: string;
  after: string;
}
