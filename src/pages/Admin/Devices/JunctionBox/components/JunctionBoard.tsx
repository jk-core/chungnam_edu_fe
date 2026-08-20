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
import { useJunctionRows } from '../hooks/useJunctionRows';
import { JunctionEditor } from './JunctionEditor';
import { JunctionTable } from './JunctionTable';
import type { JunctionRow } from '../hooks/useJunctionRows';

/** 편집기를 어떤 뜻으로 열었는지 — 새 접속반이면 target 이 null 이다 */
interface EditIntent {
  target: JunctionRow | null;
}

/**
 * 접속반 관리 (SFR-017-06) — 인버터 아래 모듈이 어떻게 묶여 들어오는지를 적는다.
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function JunctionBoard() {
  const removeJunction = useEquipmentStore((state) => state.removeJunction);
  const actor = useAuthUser();
  const allRows = useJunctionRows();

  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<EditIntent | null>(null);
  const [deleting, setDeleting] = useState<JunctionRow | null>(null);

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? allRows.filter((row) => row.plantName.includes(trimmed)
        || row.inverterName.includes(trimmed)
        || row.name.includes(trimmed))
      : allRows;
  }, [allRows, keyword]);

  const remove = () => {
    if (!deleting) return;

    removeJunction(deleting.id, deletedEntry(
      { kind: 'junction', id: deleting.id, name: deleting.name, actor: actor?.name ?? '관리자' },
      `${deleting.inverterName} · ${deleting.seriesCount}직렬 × ${deleting.parallelCount}병렬`,
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
            placeholder="접속반명으로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => setEditing({ target: null })}>접속반 등록</Button>
        </div>
      </div>

      <JunctionTable rows={rows} onEdit={(row) => setEditing({ target: row })} onDelete={setDeleting} />

      <DeviceHistory kind="junction" keyword={keyword} title="접속반 변경 이력" />

      {/* 고른 접속반이 바뀌면 편집기를 새로 세워, 앞서 열었던 값이 남지 않게 한다. */}
      {editing ? (
        <JunctionEditor key={editing.target?.id ?? 'new'} target={editing.target} onClose={() => setEditing(null)} />
      ) : null}

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '접속반')}
        description="접속반을 지워도 그 아래 스트링 등록 정보는 남습니다. 스트링 관리에서 따로 정리해 주세요."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
