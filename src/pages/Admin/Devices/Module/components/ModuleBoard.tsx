import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MSG } from '@/configs/messages';
import { PlusIcon } from '@/components/common/Icon';
import { TextField } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useEquipmentStore, { mergeInverterMasters, mergeModules } from '@/stores/equipmentStore';
import type { ModuleProduct } from '@/interface/deviceMaster';
import styles from '@/pages/Admin/Admin.module.scss';
import { DeviceHistory } from '../../components/DeviceHistory';
import { deletedEntry } from '../../utils/deviceChangeLog';
import { ModuleEditor } from './ModuleEditor';
import { ModuleTable } from './ModuleTable';

/** 편집기를 어떤 뜻으로 열었는지 — 새 제품이면 target 이 null 이다 */
interface EditIntent {
  target: ModuleProduct | null;
}

/**
 * 모듈 제품 마스터 관리 (SFR-016-01/05, SFR-017-05).
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function ModuleBoard() {
  const moduleCreated = useEquipmentStore((state) => state.moduleCreated);
  const modulePatched = useEquipmentStore((state) => state.modulePatched);
  const moduleDeleted = useEquipmentStore((state) => state.moduleDeleted);
  const inverterCreated = useEquipmentStore((state) => state.inverterCreated);
  const inverterPatched = useEquipmentStore((state) => state.inverterPatched);
  const inverterDeleted = useEquipmentStore((state) => state.inverterDeleted);
  const removeModule = useEquipmentStore((state) => state.removeModule);
  const actor = useAuthUser();

  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<EditIntent | null>(null);
  const [deleting, setDeleting] = useState<ModuleProduct | null>(null);

  const rows = useMemo(() => {
    const all = mergeModules(moduleCreated, modulePatched, moduleDeleted);
    const trimmed = keyword.trim();

    return trimmed
      ? all.filter((item) => item.name.includes(trimmed)
        || item.maker.includes(trimmed)
        || String(item.moduleId).includes(trimmed))
      : all;
  }, [moduleCreated, modulePatched, moduleDeleted, keyword]);

  // 어느 인버터가 이 제품을 쓰는지 — 삭제 확인에 몇 대가 걸려 있는지 적어 준다.
  const usage = useMemo(() => {
    const counts = new Map<string, number>();

    mergeInverterMasters(inverterCreated, inverterPatched, inverterDeleted).forEach((inverter) => {
      counts.set(inverter.moduleProductId, (counts.get(inverter.moduleProductId) ?? 0) + 1);
    });

    return counts;
  }, [inverterCreated, inverterPatched, inverterDeleted]);

  const inUse = deleting ? usage.get(deleting.id) ?? 0 : 0;

  const remove = () => {
    if (!deleting) return;

    removeModule(deleting.id, deletedEntry(
      { kind: 'module', id: deleting.id, name: deleting.name, actor: actor?.name ?? '관리자' },
      `${deleting.maker} · ${formatNumber(deleting.wattPerPanel)}W`,
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
            placeholder="모듈명으로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => setEditing({ target: null })}>모듈 등록</Button>
        </div>
      </div>

      <ModuleTable rows={rows} onEdit={(row) => setEditing({ target: row })} onDelete={setDeleting} />

      <DeviceHistory kind="module" keyword={keyword} title="모듈 제품 변경 이력" />

      {/* 고른 제품이 바뀌면 편집기를 새로 세워, 앞서 열었던 값이 남지 않게 한다. */}
      {editing ? (
        <ModuleEditor key={editing.target?.id ?? 'new'} target={editing.target} onClose={() => setEditing(null)} />
      ) : null}

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '모듈 제품')}
        description={inUse > 0
          ? `이 제품을 쓰는 인버터가 ${formatNumber(inUse)}대 있습니다. 삭제하면 해당 인버터의 모듈을 다시 골라야 합니다.`
          : '등록 이력에는 삭제한 사실이 남습니다.'}
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
