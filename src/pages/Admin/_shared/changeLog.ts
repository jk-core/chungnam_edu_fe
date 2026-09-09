import { NOW } from '@/mocks/today';
import type { ChangeLog, ChangeTarget } from '@/interface/changeLog';

/*
  등록 정보 변경 이력 만들기 (SFR-016-06 · SFR-018-04).

  발전소·설비·사용자가 같은 형식으로 이력을 남겨야 해서 한 곳으로 모았다.
  신규는 한 줄, 수정은 실제로 달라진 항목만, 삭제는 한 줄.
*/

/** 이력에 남길 항목 한 쌍 — 화면의 입력 라벨을 그대로 쓴다. */
export interface TrackedField {
  label: string;
  before: string;
  after: string;
}

export interface Target {
  targetType: ChangeTarget;
  id: string;
  name: string;
  actor: string;
}

/*
  이력 id 는 목록의 key 로 쓰인다. 화면 시각(`NOW`)은 목업이라 고정이고 대상·항목이 같은 저장이
  거듭될 수 있어, 저장 시각과 호출 순번을 함께 물려 같은 id 가 두 번 나오지 않게 한다.
*/
let sequence = 0;

export function entry(target: Target, field: string, before: string, after: string): ChangeLog {
  sequence += 1;

  return {
    id: `CL-${NOW.format('MMDDHHmm')}-${target.id}-${Date.now().toString(36)}-${sequence}`,
    targetType: target.targetType,
    targetId: target.id,
    targetName: target.name,
    at: NOW.format('YYYY-MM-DD HH:mm'),
    actor: target.actor,
    field,
    before,
    after,
  };
}

/** 신규 등록 한 줄 */
export function createdEntry(target: Target, summary: string): ChangeLog[] {
  return [entry(target, '신규 등록', '—', summary)];
}

/** 삭제 한 줄 */
export function deletedEntry(target: Target, summary: string): ChangeLog {
  return entry(target, '삭제', summary, '—');
}

/** 달라진 항목만 골라 이력으로 만든다. 값이 같으면 줄을 남기지 않는다. */
export function diffEntries(target: Target, fields: TrackedField[]): ChangeLog[] {
  return fields.flatMap(({ label, before, after }) => (
    before === after ? [] : [entry(target, label, before || '—', after || '—')]
  ));
}
