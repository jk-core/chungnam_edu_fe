import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MSG } from '@/configs/messages';
import { PlusIcon } from '@/components/common/Icon';
import { ROLE_LABEL } from '@/mocks/accounts';
import { TextField } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import useAssetStore, { mergeUsers } from '@/stores/assetStore';
import type { ManagedUser } from '@/interface/account';
import styles from '@/pages/Admin/Admin.module.scss';
import { useUserChangeLog } from '../hooks/useUserChangeLog';
import { UserEditor } from './UserEditor';
import { UserHistory } from './UserHistory';
import { UserTable } from './UserTable';

/** 편집기를 어떤 뜻으로 열었는지 — 새 계정이면 target 이 null 이다 */
interface EditIntent {
  target: ManagedUser | null;
}

/**
 * 사용자 관리 (SFR-018) — 관리자만 들어온다 (SFR-018-05).
 * 검색어 하나로 목록과 이력을 함께 좁히므로 그 값만 여기서 쥔다.
 */
export function UsersBoard() {
  const userCreated = useAssetStore((state) => state.userCreated);
  const userPatched = useAssetStore((state) => state.userPatched);
  const userDeleted = useAssetStore((state) => state.userDeleted);
  const removeUser = useAssetStore((state) => state.removeUser);
  const entryOf = useUserChangeLog();

  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<EditIntent | null>(null);
  const [deleting, setDeleting] = useState<ManagedUser | null>(null);

  const users = useMemo(() => {
    const all = mergeUsers(userCreated, userPatched, userDeleted);
    const trimmed = keyword.trim();

    return trimmed
      ? all.filter((user) => user.name.includes(trimmed)
        || user.loginId.includes(trimmed)
        || user.orgName.includes(trimmed)
        || user.email.includes(trimmed))
      : all;
  }, [userCreated, userPatched, userDeleted, keyword]);

  const lockedCount = users.filter((user) => user.locked).length;

  const remove = () => {
    if (!deleting) return;

    removeUser(
      deleting.id,
      entryOf(deleting, '계정 삭제', `${ROLE_LABEL[deleting.role]} · ${deleting.orgName}`, '삭제됨'),
    );
    toast.success(MSG.deleteSuccess(deleting.name));
    setDeleting(null);
  };

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <TextField
            label="이름 검색"
            hideLabel
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
          <Button iconLeft={<PlusIcon />} onClick={() => setEditing({ target: null })}>사용자 등록</Button>
        </div>
      </div>

      <UserTable rows={users} onEdit={(row) => setEditing({ target: row })} onDelete={setDeleting} />

      <UserHistory keyword={keyword} />

      {/* 고른 사람이 바뀌면 편집기를 새로 세워, 앞서 열었던 값이 남지 않게 한다. */}
      {editing ? (
        <UserEditor key={editing.target?.id ?? 'new'} target={editing.target} onClose={() => setEditing(null)} />
      ) : null}

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '사용자')}
        description="삭제해도 접속 로그에는 과거 기록이 남습니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
