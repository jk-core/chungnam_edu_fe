import type { RtuStatus } from './status';

/*
  설비 마스터 — 관리자 콘솔에서 등록·수정·삭제하는 값들 (SFR-016-01/05, SFR-017-04~06).

  운영 화면이 쓰는 `Inverter`·`StringUnit`(interface/equipment.ts)와 일부러 갈라 둔다.
  그쪽은 발전량·건전도처럼 계산으로 채워지는 필드를 함께 들고 있어, 등록 폼이 건드릴 값과
  시스템이 만들어 내는 값이 한 타입에 섞이면 무엇을 고칠 수 있는지가 흐려진다.

  **인버터·모듈 제품 카탈로그는 여기 없다** — 서버가 쥐고 있어 `service/inverter`·
  `service/module` 의 타입을 그대로 쓴다 (`hooks/useProductCatalog.ts`).
*/

/** 일사량계(환경센서) — 발전소마다 한 대 (SFR-016-01). 서버 규격은 `EquipmentIrrad` 다. */
export interface Pyranometer {
  id: string;
  /** 서버가 매기는 일사량계 번호 (irradId) */
  irradId: number;
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

/** 스트링 등록 정보 — 인버터 하나에 여러 개 (SFR-016-01). 서버 규격은 `SolaString` 이다. */
export interface StringMaster {
  id: string;
  /** 서버가 매기는 스트링 번호 (stringId) */
  stringId: number;
  inverterId: string;
  /** 스트링 순번. 1부터 */
  seq: number;
  name: string;
  seriesCount: number;
  parallelCount: number;
}

/**
 * 설비 등록 정보 (SFR-016-01, SFR-017-04). 서버 규격은 `Meain` 이다.
 * 발전소에 실제로 설치된 한 대를 가리킨다 — 어떤 인버터·모듈 제품을 썼는지는 참조로 든다.
 */
export interface EquipmentMaster {
  /** 화면이 쓰는 키 */
  inverterId: string;
  /** 설비를 가리키는 서버 식별자 (cid) — 화면에서도 검색 조건으로 쓴다 */
  cid: number;
  plantId: string;
  /** 이 설비를 맡은 사용자 (userId). 발전소를 고르기 전에 먼저 고른다 */
  userId: number | null;
  /** 설비 이름 (meainName) */
  name: string;
  /** RTU 통신 ID (rtuCommuId) */
  rtuCommId: string;
  /** RTU 포트. 3번은 일사량계 몫이라 설비가 쓸 수 없다 */
  rtuPort: number | null;
  /** 고른 인버터 제품의 서버 번호 (inverterId) */
  inverterProductId: number;
  /** 모듈 제품의 서버 번호 (solaModuleId) */
  moduleProductId: number;
  /** 방위각(도). 정남이 180 이다 */
  azimuth: number;
  /** 경사각(도) */
  inclineAngle: number;
  /**
   * 설비용량(kW) — 서버는 값을 그대로 받는다 (instCapa).
   * 화면은 모듈 구성에서 산출한 값을 채워 주되(SFR-016-03) 손으로 고칠 수 있게 둔다.
   */
  equipmentCapacity: number;
  /** MPPT 1번 직렬·병렬 */
  series1: number;
  parallel1: number;
  /** MPPT 2번. 안 쓰면 0 */
  series2: number;
  parallel2: number;
  /** AS 만료일 */
  asExpiresAt: string;
  note: string;
  /** 설치일시 (meainInstDtm) */
  installedAt: string;
  operatedAt: string;
  /** 수집이 처음·마지막으로 들어온 때. 등록이 아니라 수집기가 채우는 값이라 폼이 만지지 않는다 */
  firstReceivedAt: string | null;
  lastReceivedAt: string | null;
}
