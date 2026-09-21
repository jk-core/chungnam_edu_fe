import dayjs from 'dayjs';
import type { ChangeLog, ChangeTarget } from '@/interface/changeLog';
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

const OPERATION_FIELD: Record<ChangeHistory['operation'], string> = {
  CREATE: '신규 등록',
  UPDATE: '수정',
  DELETE: '삭제',
};

const dash = (value: string | null | undefined) => value?.trim() || '—';

function formatAt(value: string): string {
  const parsed = dayjs(value);

  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : value;
}

/**
 * API 이력 이벤트를 화면용 필드 단위 줄로 펼친다.
 * 필드 변경이 없으면 CREATE/DELETE 한 줄만 남긴다.
 */
export function toChangeLogs(histories: ChangeHistory[]): ChangeLog[] {
  return histories.flatMap((item) => {
    const base = {
      targetType: TARGET_UI[item.targetType],
      targetId: String(item.targetId),
      targetName: item.targetLabel,
      at: formatAt(item.changedDtm),
      actor: item.changedByName?.trim() || '시스템',
    };

    if (item.changes.length === 0) {
      const isCreate = item.operation === 'CREATE';

      return [
        {
          ...base,
          id: `${item.historyId}`,
          field: OPERATION_FIELD[item.operation],
          before: isCreate ? '—' : item.targetLabel,
          after: item.operation === 'DELETE' ? '—' : item.targetLabel,
        },
      ];
    }

    return item.changes.map((change, index) => ({
      ...base,
      id: `${item.historyId}-${change.key}-${index}`,
      field: change.label || OPERATION_FIELD[item.operation],
      before: dash(change.oldValue),
      after: dash(change.newValue),
    }));
  });
}
