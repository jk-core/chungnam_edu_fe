import { NOW } from '@/mocks/today';
import type { ChangeLog, ChangeLogField, ChangeOperation, ChangeTarget } from '@/interface/changeLog';

/*
  등록 정보 변경 이력 만들기 (SFR-016-06).

  **설비 화면 몫이다** — 나머지 갈래는 BE 가 이력을 쌓는다(`_shared/mapChangeHistory.ts`).
  설비 관리 API 가 붙으면 이 파일도 사라진다.

  한 번의 저장이 한 건이다. 신규·삭제는 요약 한 줄을, 수정은 실제로 달라진 항목만 담는다.
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
  이력 id 는 목록의 key 로 쓰인다. 화면 시각(`NOW`)은 목업이라 고정이고 같은 대상을 거듭
  저장할 수 있어, 저장 시각과 호출 순번을 함께 물려 같은 id 가 두 번 나오지 않게 한다.
*/
let sequence = 0;

export function entry(target: Target, operation: ChangeOperation, fields: ChangeLogField[]): ChangeLog {
  sequence += 1;

  return {
    id: `CL-${NOW.format('MMDDHHmm')}-${target.id}-${Date.now().toString(36)}-${sequence}`,
    targetType: target.targetType,
    targetId: target.id,
    targetName: target.name,
    at: NOW.format('YYYY-MM-DD HH:mm'),
    actor: target.actor,
    operation,
    fields,
  };
}

/** 신규 등록 한 건 */
export function createdEntry(target: Target, summary: string): ChangeLog[] {
  return [entry(target, 'create', [{ label: '신규 등록', before: '—', after: summary }])];
}

/** 삭제 한 건 */
export function deletedEntry(target: Target, summary: string): ChangeLog {
  return entry(target, 'delete', [{ label: '삭제', before: summary, after: '—' }]);
}

/** 달라진 항목만 모아 한 건으로. 달라진 게 없으면 남기지 않는다. */
export function diffEntries(target: Target, fields: TrackedField[]): ChangeLog[] {
  const changed = fields
    .filter(({ before, after }) => before !== after)
    .map(({ label, before, after }) => ({ label, before: before || '—', after: after || '—' }));

  return changed.length === 0 ? [] : [entry(target, 'update', changed)];
}
