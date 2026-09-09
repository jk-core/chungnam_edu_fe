/** 변경 이력의 대상. 계약(`/manage/history`)의 targetType 과 같은 값이다 */
export type ChangeTarget = 'powerPlant' | 'equipment' | 'string' | 'irrad' | 'inverter' | 'module' | 'user';

/** 등록 정보 변경 이력 한 건 — 한 필드가 한 줄이다 (SFR-016-06 · SFR-018-04) */
export interface ChangeLog {
  id: string;
  targetType: ChangeTarget;
  targetId: string;
  targetName: string;
  at: string;
  actor: string;
  field: string;
  before: string;
  after: string;
}
