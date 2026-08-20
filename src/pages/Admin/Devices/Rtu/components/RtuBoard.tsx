import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MSG } from '@/configs/messages';
import { PlusIcon } from '@/components/common/Icon';
import { TextField } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useDeletedPlants } from '@/stores/assetStore';
import useEquipmentStore, { mergeRtus } from '@/stores/equipmentStore';
import type { Rtu } from '@/interface/asset';
import styles from '@/pages/Admin/Admin.module.scss';
import { DeviceHistory } from '../../components/DeviceHistory';
import { deletedEntry } from '../../utils/deviceChangeLog';
import { RtuEditor } from './RtuEditor';
import { RtuEvents } from './RtuEvents';
import { RtuTable } from './RtuTable';

/** 편집기를 어떤 뜻으로 열었는지 — 새 장치면 target 이 null 이다 */
interface EditIntent {
  target: Rtu | null;
}

/**
 * RTU 관리 (SFR-017-01~03).
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function RtuBoard() {
  const rtuCreated = useEquipmentStore((state) => state.rtuCreated);
  const rtuPatched = useEquipmentStore((state) => state.rtuPatched);
  const rtuDeleted = useEquipmentStore((state) => state.rtuDeleted);
  const removeRtu = useEquipmentStore((state) => state.removeRtu);
  const deletedPlants = useDeletedPlants();
  const actor = useAuthUser();

  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<EditIntent | null>(null);
  const [viewing, setViewing] = useState<Rtu | null>(null);
  const [deleting, setDeleting] = useState<Rtu | null>(null);

  // 지운 발전소의 장비는 목록에서 함께 감춘다 (SFR-016-05).
  const rows = useMemo(() => {
    const all = mergeRtus(rtuCreated, rtuPatched, rtuDeleted)
      .filter((row) => !deletedPlants.includes(row.plantId));
    const trimmed = keyword.trim();

    return trimmed
      ? all.filter((row) => row.plantName.includes(trimmed)
        || row.model.includes(trimmed)
        || row.serial.includes(trimmed))
      : all;
  }, [rtuCreated, rtuPatched, rtuDeleted, deletedPlants, keyword]);

  const remove = () => {
    if (!deleting) return;

    removeRtu(deleting.id, deletedEntry(
      { kind: 'rtu', id: deleting.id, name: `${deleting.plantName} RTU`, actor: actor?.name ?? '관리자' },
      `${deleting.model} · ${deleting.serial}`,
    ));
    toast.success(MSG.deleteSuccess(`${deleting.plantName} RTU`));
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
            placeholder="RTU명으로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => setEditing({ target: null })}>RTU 등록</Button>
        </div>
      </div>

      <RtuTable
        rows={rows}
        onOpenEvents={setViewing}
        onEdit={(row) => setEditing({ target: row })}
        onDelete={setDeleting}
      />

      <DeviceHistory kind="rtu" title="RTU 변경 이력" />

      {viewing ? <RtuEvents rtu={viewing} onClose={() => setViewing(null)} /> : null}

      {/* 고른 장치가 바뀌면 편집기를 새로 세워, 앞서 열었던 값이 남지 않게 한다. */}
      {editing ? (
        <RtuEditor key={editing.target?.id ?? 'new'} target={editing.target} onClose={() => setEditing(null)} />
      ) : null}

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(`${deleting?.plantName ?? ''} RTU`)}
        description="장치를 지우면 그 발전소의 수집이 멈춘 것으로 보입니다. 교체라면 수정으로 시리얼만 바꿔 주세요."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
