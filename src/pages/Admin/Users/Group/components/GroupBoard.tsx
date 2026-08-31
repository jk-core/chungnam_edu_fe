import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { formatNumber } from '@/utils/format';
import { PlusIcon } from '@/components/common/Icon';
import { SearchInput } from '@/components/common/SearchInput';
import { useManagedUsers } from '@/hooks/usePlantAssets';
import styles from '@/pages/Admin/Admin.module.scss';
import { GroupTable } from './GroupTable';

/**
 * 그룹관리자 목록 (SFR-018, SFR-023).
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function GroupBoard() {
  const users = useManagedUsers();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');

  const rows = useMemo(() => {
    const all = users.filter((user) => user.role === 'group');
    const trimmed = keyword.trim();

    return trimmed
      ? all.filter((user) => user.name.includes(trimmed)
        || user.loginId.includes(trimmed)
        || user.email.includes(trimmed))
      : all;
  }, [users, keyword]);

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <SearchInput
            label="이름 검색"
            value={keyword}
            onChange={setKeyword}
            placeholder="이름·로그인 ID·이메일로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => navigate(createPath('users', 'group'))}>
            그룹관리자 등록
          </Button>
        </div>
      </div>

      <GroupTable rows={rows} />
    </>
  );
}
