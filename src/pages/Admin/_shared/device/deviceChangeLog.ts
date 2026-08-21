import { NOW } from '@/mocks/today';
import type { DeviceChange, DeviceKind } from '@/interface/deviceMaster';

/*
  장비 등록 정보 변경 이력 만들기 (SFR-016-06).

  일곱 갈래가 같은 형식으로 이력을 남겨야 해서, `UsersTab.entryOf` 의 방식을 한 곳으로 뺐다.
  신규는 한 줄, 수정은 실제로 달라진 항목만, 삭제는 한 줄.
*/

/** 이력에 남길 항목 한 쌍 — 화면의 입력 라벨을 그대로 쓴다. */
export interface TrackedField {
  label: string;
  before: string;
  after: string;
}

interface Target {
  kind: DeviceKind;
  id: string;
  name: string;
  actor: string;
}

/*
  이력 id 는 목록의 key 로 쓰인다. 화면 시각(`NOW`)은 목업이라 고정이고 대상·항목이 같은 저장이
  거듭될 수 있어, 저장 시각과 호출 순번을 함께 물려 같은 id 가 두 번 나오지 않게 한다.
*/
let sequence = 0;

function entry(target: Target, field: string, before: string, after: string): DeviceChange {
  sequence += 1;

  return {
    id: `DC-${NOW.format('MMDDHHmm')}-${target.id}-${Date.now().toString(36)}-${sequence}`,
    kind: target.kind,
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
export function createdEntry(target: Target, summary: string): DeviceChange[] {
  return [entry(target, '신규 등록', '—', summary)];
}

/** 삭제 한 줄 */
export function deletedEntry(target: Target, summary: string): DeviceChange {
  return entry(target, '삭제', summary, '—');
}

/** 달라진 항목만 골라 이력으로 만든다. 값이 같으면 줄을 남기지 않는다. */
export function diffEntries(target: Target, fields: TrackedField[]): DeviceChange[] {
  return fields.flatMap(({ label, before, after }) => (
    before === after ? [] : [entry(target, label, before || '—', after || '—')]
  ));
}
