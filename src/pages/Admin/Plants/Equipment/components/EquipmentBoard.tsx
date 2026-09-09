import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ChangeHistory } from '@/pages/Admin/_shared/ChangeHistory';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { formatNumber } from '@/utils/format';
import { PlusIcon } from '@/components/common/Icon';
import { SearchInput } from '@/components/common/SearchInput';
import styles from '@/pages/Admin/Admin.module.scss';
import { useDeviceChanges } from '@/stores/equipmentStore';
import { useEquipmentRows } from '../hooks/useEquipmentRows';
import { EquipmentTable } from './EquipmentTable';

/**
 * 설비 관리 (SFR-016-01, SFR-017-04) — 등록 정보만 다룬다. 운영 상태는 통합관제·AI진단에서 본다.
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function EquipmentBoard() {
  const allRows = useEquipmentRows();
  const changes = useDeviceChanges('equipment');
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');

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

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <SearchInput
            label="이름 검색"
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

      <EquipmentTable rows={rows} />

      <ChangeHistory title="설비 변경 이력" rows={changes} />
    </>
  );
}
