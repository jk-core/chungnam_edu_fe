import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MSG } from '@/configs/messages';
import { PlusIcon } from '@/components/common/Icon';
import { TextField } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useEquipmentStore from '@/stores/equipmentStore';
import styles from '@/pages/Admin/Admin.module.scss';
import { DeviceHistory } from '../../components/DeviceHistory';
import { deletedEntry } from '../../utils/deviceChangeLog';
import { summarizeString, useEquipmentRows, useStringsOf } from '../hooks/useStringData';
import { StringSheet } from './StringSheet';
import { StringTable } from './StringTable';
import type { EquipmentRow } from '../hooks/useStringData';

/** 편집판을 어떤 뜻으로 열었는지 — 새로 등록하는 판이면 target 이 null 이다 */
interface EditIntent {
  target: EquipmentRow | null;
}

/**
 * 스트링 관리 (SFR-016-01, SFR-017-06).
 * 목록에서 조회하고, 등록·수정은 설비 한 대의 스트링을 한꺼번에 다룬다.
 */
export function StringBoard() {
  const saveStrings = useEquipmentStore((state) => state.saveStrings);
  const actor = useAuthUser();
  const allRows = useEquipmentRows();
  const { listOf } = useStringsOf();

  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<EditIntent | null>(null);
  const [clearing, setClearing] = useState<EquipmentRow | null>(null);

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? allRows.filter((row) => row.plantName.includes(trimmed)
        || row.equipmentName.includes(trimmed)
        || String(row.cid).includes(trimmed))
      : allRows;
  }, [allRows, keyword]);

  const clearAll = () => {
    if (!clearing) return;

    // 설비 단위로 비우는 자리라, 지운 줄을 한 줄씩 이력에 남긴다.
    const entries = listOf(clearing.inverterId).map((row) => deletedEntry(
      { kind: 'string', id: row.id, name: row.name, actor: actor?.name ?? '관리자' },
      `${clearing.equipmentName} · ${summarizeString(row)}`,
    ));

    saveStrings(clearing.inverterId, [], entries);
    toast.success(MSG.deleteSuccess(`${clearing.equipmentName} 스트링`));
    setClearing(null);
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <TextField
            label="이름 검색"
            hideLabel
            value={keyword}
            onChange={setKeyword}
            placeholder="스트링명으로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => setEditing({ target: null })}>스트링 등록</Button>
        </div>
      </div>

      <StringTable rows={rows} onEdit={(row) => setEditing({ target: row })} onClear={setClearing} />

      <DeviceHistory kind="string" keyword={keyword} title="스트링 변경 이력" />

      {/* 고른 설비가 바뀌면 편집판을 새로 세워, 앞서 열었던 줄이 남지 않게 한다. */}
      {editing ? (
        <StringSheet key={editing.target?.inverterId ?? 'new'} target={editing.target} onClose={() => setEditing(null)} />
      ) : null}

      <ConfirmDialog
        isOpen={clearing !== null}
        title={MSG.deleteConfirm(
          `${clearing?.equipmentName ?? '설비'} 스트링 ${formatNumber(clearing?.stringCount ?? 0)}조`,
        )}
        description="이 설비에 등록된 스트링을 모두 지웁니다. 한 조만 지우려면 스트링 편집에서 그 줄을 빼세요."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={clearAll}
        onClose={() => setClearing(null)}
      />
    </>
  );
}
