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
import useEquipmentStore, { mergePyranometers } from '@/stores/equipmentStore';
import type { Pyranometer } from '@/interface/deviceMaster';
import styles from '@/pages/Admin/Admin.module.scss';
import { DeviceHistory } from '../../components/DeviceHistory';
import { deletedEntry } from '../../utils/deviceChangeLog';
import { PyranometerEditor } from './PyranometerEditor';
import { PyranometerTable } from './PyranometerTable';

/** 편집기를 어떤 뜻으로 열었는지 — 새 설비면 target 이 null 이다 */
interface EditIntent {
  target: Pyranometer | null;
}

/**
 * 일사량계(환경센서) 관리 (SFR-016-01/05) — 발전소마다 한 대가 기본이다.
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function PyranometerBoard() {
  const pyranometerCreated = useEquipmentStore((state) => state.pyranometerCreated);
  const pyranometerPatched = useEquipmentStore((state) => state.pyranometerPatched);
  const pyranometerDeleted = useEquipmentStore((state) => state.pyranometerDeleted);
  const removePyranometer = useEquipmentStore((state) => state.removePyranometer);
  const deletedPlants = useDeletedPlants();
  const actor = useAuthUser();

  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<EditIntent | null>(null);
  const [deleting, setDeleting] = useState<Pyranometer | null>(null);

  // 지운 발전소의 장비는 목록에서 함께 감춘다 (SFR-016-05).
  const rows = useMemo(() => {
    const all = mergePyranometers(pyranometerCreated, pyranometerPatched, pyranometerDeleted)
      .filter((row) => !deletedPlants.includes(row.plantId));
    const trimmed = keyword.trim();

    return trimmed
      ? all.filter((row) => row.plantName.includes(trimmed)
        || row.name.includes(trimmed)
        || row.rtuCommId.includes(trimmed))
      : all;
  }, [pyranometerCreated, pyranometerPatched, pyranometerDeleted, deletedPlants, keyword]);

  const remove = () => {
    if (!deleting) return;

    removePyranometer(deleting.id, deletedEntry(
      { kind: 'pyranometer', id: deleting.id, name: deleting.name, actor: actor?.name ?? '관리자' },
      `${deleting.plantName} · ${deleting.rtuCommId}`,
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
            placeholder="일사량계명·RTU 통신ID 로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => setEditing({ target: null })}>일사량계 등록</Button>
        </div>
      </div>

      <PyranometerTable rows={rows} onEdit={(row) => setEditing({ target: row })} onDelete={setDeleting} />

      <DeviceHistory kind="pyranometer" keyword={keyword} title="일사량계 변경 이력" />

      {/* 고른 설비가 바뀌면 편집기를 새로 세워, 앞서 열었던 값이 남지 않게 한다. */}
      {editing ? (
        <PyranometerEditor
          key={editing.target?.id ?? 'new'}
          target={editing.target}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '일사량계')}
        description="일사량 값이 없으면 그 발전소의 AI 진단은 기대 발전량을 계산하지 못합니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
