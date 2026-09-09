import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { formatNumber } from '@/utils/format';
import { PlusIcon } from '@/components/common/Icon';
import { SearchInput } from '@/components/common/SearchInput';
import useAssetStore, { mergeUsers, useUserChanges } from '@/stores/assetStore';
import styles from '@/pages/Admin/Admin.module.scss';
import { ChangeHistory } from '@/pages/Admin/_shared/ChangeHistory';
import { UserTable } from './UserTable';

/**
 * 사용자 관리 (SFR-018) — 관리자만 들어온다 (SFR-018-05).
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function UsersBoard() {
  const userCreated = useAssetStore((state) => state.userCreated);
  const userPatched = useAssetStore((state) => state.userPatched);
  const userDeleted = useAssetStore((state) => state.userDeleted);
  const changes = useUserChanges();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');

  const users = useMemo(() => {
    /*
      그룹관리자는 맡은 발전소가 본체라 옆 탭에서 따로 다룬다.
      교육지원청 위 등급은 이 화면에서 만들지도 고치지도 않으므로 목록에도 세우지 않는다 —
      폼이 담을 수 있는 등급과 목록이 어긋나면 고치기로 들어간 순간 등급 칸이 빈다.
    */
    const all = mergeUsers(userCreated, userPatched, userDeleted)
      .filter((user) => user.role === 'institution');
    const trimmed = keyword.trim();

    return trimmed
      ? all.filter((user) => user.name.includes(trimmed)
        || user.loginId.includes(trimmed)
        || user.email.includes(trimmed))
      : all;
  }, [userCreated, userPatched, userDeleted, keyword]);

  const lockedCount = users.filter((user) => user.locked).length;

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <SearchInput
            label="이름 검색"
            value={keyword}
            onChange={setKeyword}
            placeholder="사용자명으로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>
            총 {formatNumber(users.length)}개{lockedCount > 0 ? ` · 잠금 ${lockedCount}건` : ''}
          </p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => navigate(createPath('users', 'account'))}>
            사용자 등록
          </Button>
        </div>
      </div>

      <UserTable rows={users} />

      <ChangeHistory title="담당자 변경 이력" rows={changes} />
    </>
  );
}
