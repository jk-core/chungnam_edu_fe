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
import { useInverterRows } from '../hooks/useInverterRows';
import { InverterEditor } from './InverterEditor';
import { InverterTable } from './InverterTable';
import type { InverterRow } from '../hooks/useInverterRows';

/** 편집기를 어떤 뜻으로 열었는지 — 새 설비면 target 이 null 이다 */
interface EditIntent {
  target: InverterRow | null;
}

/**
 * 인버터 관리 (SFR-017-04) — 등록 정보만 다룬다. 운영 상태는 통합관제·AI진단에서 본다.
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function InverterBoard() {
  const removeInverter = useEquipmentStore((state) => state.removeInverter);
  const actor = useAuthUser();
  const allRows = useInverterRows();

  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<EditIntent | null>(null);
  const [deleting, setDeleting] = useState<InverterRow | null>(null);

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? allRows.filter((row) => row.plantName.includes(trimmed)
        || row.name.includes(trimmed)
        || row.maker.includes(trimmed))
      : allRows;
  }, [allRows, keyword]);

  const remove = () => {
    if (!deleting) return;

    removeInverter(deleting.inverterId, deletedEntry(
      { kind: 'inverter', id: deleting.inverterId, name: deleting.name, actor: actor?.name ?? '관리자' },
      `${deleting.plantName} · ${formatNumber(deleting.equipmentCapacity, 1)}kW`,
    ));
    toast.success(MSG.deleteSuccess(deleting.name));
    setDeleting(null);
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
            placeholder="인버터명·CID·RTU 통신ID 로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => setEditing({ target: null })}>인버터 등록</Button>
        </div>
      </div>

      <InverterTable rows={rows} onEdit={(row) => setEditing({ target: row })} onDelete={setDeleting} />

      <DeviceHistory kind="inverter" keyword={keyword} title="인버터 변경 이력" />

      {/* 고른 설비가 바뀌면 편집기를 새로 세워, 앞서 열었던 값이 남지 않게 한다. */}
      {editing ? (
        <InverterEditor
          key={editing.target?.inverterId ?? 'new'}
          target={editing.target}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '인버터')}
        description="이 인버터에 딸린 접속반·스트링 등록 정보는 남습니다. 각 화면에서 따로 정리해 주세요."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
