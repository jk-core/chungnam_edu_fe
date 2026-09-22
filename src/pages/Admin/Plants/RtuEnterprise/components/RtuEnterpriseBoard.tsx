import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ChangeHistory } from '@/pages/Admin/_shared/ChangeHistory';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { formatNumber } from '@/utils/format';
import { PlusIcon } from '@/components/common/Icon';
import { SearchInput } from '@/components/common/SearchInput';
import styles from '@/pages/Admin/Admin.module.scss';
import { useChangeHistory } from '@/pages/Admin/_shared/hooks/useChangeHistory';
import { useDebounce } from '@/hooks/useDebounce';
import { useRtuEnterpriseList } from '../hooks/useRtuEnterpriseList';
import { RtuEnterpriseTable } from './RtuEnterpriseTable';

/**
 * RTU 업체 관리 (SFR-016-01).
 * 검색은 서버가 한다 — 입력 DOM 이 즉시값을 쥐고, 조회 조건만 늦춰 갱신한다.
 */
export function RtuEnterpriseBoard() {
  const changes = useChangeHistory('RTU_ENTERPRISE');
  const list = useRtuEnterpriseList();
  const navigate = useNavigate();

  const search = useDebounce((keyword: string) => list.setParam((prev) => ({
    ...prev,
    keyword: keyword.trim() || undefined,
    page: 0,
  })));

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <SearchInput
            label="업체 검색"
            defaultValue={list.param.keyword}
            onChange={search}
            placeholder="업체명·이메일·전화번호로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(list.totalCount)}곳</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => navigate(createPath('plants', 'rtu-enterprise'))}>
            RTU업체 등록
          </Button>
        </div>
      </div>

      <RtuEnterpriseTable list={list} />

      <ChangeHistory title="RTU업체 변경 이력" rows={changes.rows} />
    </>
  );
}
