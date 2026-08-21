import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { DeviceHistory } from '@/pages/Admin/_shared/device/DeviceHistory';
import { formatNumber } from '@/utils/format';
import { PlusIcon } from '@/components/common/Icon';
import { TextField } from '@/components/common/Form';
import styles from '@/pages/Admin/Admin.module.scss';
import { useStringOwners } from '../hooks/useStringData';
import { StringTable } from './StringTable';

/**
 * 스트링 관리 (SFR-016-01, SFR-017-06).
 * 목록에서 조회하고, 등록·수정은 설비 한 대의 스트링을 한꺼번에 다룬다.
 */
export function StringBoard() {
  const allRows = useStringOwners();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? allRows.filter((row) => row.plantName.includes(trimmed)
        || row.equipmentName.includes(trimmed)
        || String(row.cid).includes(trimmed))
      : allRows;
  }, [allRows, keyword]);

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

      <StringTable rows={rows} />

      <DeviceHistory kind="string" keyword={keyword} title="스트링 변경 이력" />
    </>
  );
}
