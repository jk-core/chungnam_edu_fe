/** 변경 이력의 대상. `/manage/changeHistory` 의 targetType 과 맞춘다 (미연동 도메인은 목업용) */
export type ChangeTarget =
  | 'powerPlant'
  | 'equipment'
  | 'string'
  | 'irrad'
  | 'rtuEnterprise'
  | 'inverter'
  | 'module'
  | 'user';

/** 무엇을 한 저장인지 — BE 의 `operation` 을 화면 어휘로 옮긴 것 */
export type ChangeOperation = 'create' | 'update' | 'delete';

/** 한 번의 저장에서 달라진 항목 하나 */
export interface ChangeLogField {
  label: string;
  before: string;
  after: string;
}

/**
 * 등록 정보 변경 이력 한 건 — **한 번의 저장이 한 줄**이다 (SFR-016-06 · SFR-018-04).
 * 달라진 항목은 줄을 펼쳐 본다. 필드마다 줄을 세우면 한 번의 저장이 목록을 통째로 채운다.
 */
export interface ChangeLog {
  id: string;
  targetType: ChangeTarget;
  targetId: string;
  targetName: string;
  at: string;
  actor: string;
  operation: ChangeOperation;
  /** 비어 있으면 펼칠 것이 없다 */
  fields: ChangeLogField[];
}
