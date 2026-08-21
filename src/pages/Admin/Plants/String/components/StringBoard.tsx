import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MSG } from '@/configs/messages';
import { PlusIcon } from '@/components/common/Icon';
import { TextField } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useEquipmentStore from '@/stores/equipmentStore';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { DeviceHistory } from '@/pages/Admin/_shared/device/DeviceHistory';
import { deletedEntry } from '@/pages/Admin/_shared/device/deviceChangeLog';
import styles from '@/pages/Admin/Admin.module.scss';
import { summarizeString, useStringOwners, useStringsOf } from '../hooks/useStringData';
import { StringTable } from './StringTable';
import type { StringOwner } from '../hooks/useStringData';

/**
 * 스트링 관리 (SFR-016-01, SFR-017-06).
 * 목록에서 조회하고, 등록·수정은 설비 한 대의 스트링을 한꺼번에 다룬다.
 */
export function StringBoard() {
  const saveStrings = useEquipmentStore((state) => state.saveStrings);
  const actor = useAuthUser();
  const allRows = useStringOwners();
  const { listOf } = useStringsOf();

  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [clearing, setClearing] = useState<StringOwner | null>(null);

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
          <Button iconLeft={<PlusIcon />} onClick={() => navigate(createPath('plants', 'string'))}>
            스트링 등록
          </Button>
        </div>
      </div>

      <StringTable rows={rows} onClear={setClearing} />

      <DeviceHistory kind="string" keyword={keyword} title="스트링 변경 이력" />

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
