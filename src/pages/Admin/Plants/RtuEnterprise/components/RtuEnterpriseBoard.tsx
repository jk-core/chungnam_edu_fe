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
import { useRtuEnterpriseRows } from '../hooks/useRtuEnterpriseRows';
import { RtuEnterpriseTable } from './RtuEnterpriseTable';

/**
 * RTU 업체 관리 (SFR-016-01).
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function RtuEnterpriseBoard() {
  const changes = useDeviceChanges('rtuEnterprise');
  const allRows = useRtuEnterpriseRows();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? allRows.filter((row) => row.name.includes(trimmed)
        || row.email.includes(trimmed)
        || row.phone.includes(trimmed))
      : allRows;
  }, [allRows, keyword]);

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <SearchInput
            label="업체 검색"
            value={keyword}
            onChange={setKeyword}
            placeholder="업체명·이메일·전화번호로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}곳</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => navigate(createPath('plants', 'rtu-enterprise'))}>
            RTU업체 등록
          </Button>
        </div>
      </div>

      <RtuEnterpriseTable rows={rows} />

      <ChangeHistory title="RTU업체 변경 이력" rows={changes} />
    </>
  );
}
