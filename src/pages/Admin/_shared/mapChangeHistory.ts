import dayjs from 'dayjs';
import type { ChangeLog, ChangeOperation, ChangeTarget } from '@/interface/changeLog';
import type { ChangeHistory, ChangeHistoryTargetType } from '@/service/changeHistory/type';

const TARGET_UI: Record<ChangeHistoryTargetType, ChangeTarget> = {
  USER: 'user',
  POWER_PLANT: 'powerPlant',
  RTU_ENTERPRISE: 'rtuEnterprise',
  INVERTER: 'inverter',
  MODULE: 'module',
  STRING: 'string',
  IRRAD: 'irrad',
};

const OPERATION_UI: Record<ChangeHistory['operation'], ChangeOperation> = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

const dash = (value: string | null | undefined) => value?.trim() || '—';

function formatAt(value: string): string {
  const parsed = dayjs(value);

  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : value;
}

/** API 이력 이벤트를 화면용 줄로 옮긴다 — 한 건이 한 줄이고, 달라진 항목은 그 안에 든다. */
export function toChangeLogs(histories: ChangeHistory[]): ChangeLog[] {
  return histories.map((item) => ({
    id: String(item.historyId),
    targetType: TARGET_UI[item.targetType],
    targetId: String(item.targetId),
    targetName: item.targetLabel,
    at: formatAt(item.changedDtm),
    actor: item.changedByName?.trim() || '시스템',
    operation: OPERATION_UI[item.operation],
    fields: item.changes.map((change) => ({
      label: change.label || change.key,
      before: dash(change.oldValue),
      after: dash(change.newValue),
    })),
  }));
}
