import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { deletedEntry } from '@/pages/Admin/_shared/device/deviceChangeLog';
import { DeviceHistory } from '@/pages/Admin/_shared/device/DeviceHistory';
import { formatNumber } from '@/utils/format';
import { MSG } from '@/configs/messages';
import { PlusIcon } from '@/components/common/Icon';
import { TextField } from '@/components/common/Form';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useEquipmentStore from '@/stores/equipmentStore';
import styles from '@/pages/Admin/Admin.module.scss';
import { useEquipmentRows } from '../hooks/useEquipmentRows';
import { EquipmentTable } from './EquipmentTable';
import type { EquipmentRow } from '../hooks/useEquipmentRows';

/**
 * 설비 관리 (SFR-016-01, SFR-017-04) — 등록 정보만 다룬다. 운영 상태는 통합관제·AI진단에서 본다.
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function EquipmentBoard() {
  const removeEquipment = useEquipmentStore((state) => state.removeEquipment);
  const actor = useAuthUser();
  const allRows = useEquipmentRows();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [deleting, setDeleting] = useState<EquipmentRow | null>(null);

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? allRows.filter((row) => row.plantName.includes(trimmed)
        || row.name.includes(trimmed)
        || row.inverterName.includes(trimmed)
        || row.rtuCommId.includes(trimmed)
        || String(row.cid).includes(trimmed))
      : allRows;
  }, [allRows, keyword]);

  const remove = () => {
    if (!deleting) return;

    removeEquipment(deleting.inverterId, deletedEntry(
      { kind: 'equipment', id: deleting.inverterId, name: deleting.name, actor: actor?.name ?? '관리자' },
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
            placeholder="설비명·CID·RTU 통신ID·발전소명으로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => navigate(createPath('plants', 'equipment'))}>
            설비 등록
          </Button>
        </div>
      </div>

      <EquipmentTable rows={rows} onDelete={setDeleting} />

      <DeviceHistory kind="equipment" keyword={keyword} title="설비 변경 이력" />

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '설비')}
        description="이 설비에 딸린 접속반·스트링 등록 정보는 남습니다. 각 화면에서 따로 정리해 주세요."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
