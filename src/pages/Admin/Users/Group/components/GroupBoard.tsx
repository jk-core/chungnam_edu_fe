import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { formatNumber } from '@/utils/format';
import { MSG } from '@/configs/messages';
import { PlusIcon } from '@/components/common/Icon';
import { ROLE_LABEL } from '@/mocks/accounts';
import { TextField } from '@/components/common/Form';
import { toast } from '@/stores/toastStore';
import { useManagedUsers } from '@/pages/Admin/Plants/Equipment/hooks/useEquipmentPickers';
import useAssetStore from '@/stores/assetStore';
import type { ManagedUser } from '@/interface/account';
import styles from '@/pages/Admin/Admin.module.scss';
import { useUserChangeLog } from '../../Account/hooks/useUserChangeLog';
import { GroupTable } from './GroupTable';

/**
 * 그룹관리자 목록 (SFR-018, SFR-023).
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function GroupBoard() {
  const removeUser = useAssetStore((state) => state.removeUser);
  const entryOf = useUserChangeLog();
  const users = useManagedUsers();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [deleting, setDeleting] = useState<ManagedUser | null>(null);

  const rows = useMemo(() => {
    const all = users.filter((user) => user.role === 'group');
    const trimmed = keyword.trim();

    return trimmed
      ? all.filter((user) => user.name.includes(trimmed)
        || user.loginId.includes(trimmed)
        || user.orgName.includes(trimmed))
      : all;
  }, [users, keyword]);

  const remove = () => {
    if (!deleting) return;

    removeUser(
      deleting.id,
      entryOf(deleting, '계정 삭제', `${ROLE_LABEL.group} · 발전소 ${deleting.plantIds.length}곳`, '삭제됨'),
    );
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
            placeholder="이름·로그인 ID·소속으로 검색"
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

      <GroupTable rows={rows} onDelete={setDeleting} />

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '그룹관리자')}
        description="맡고 있던 발전소는 남습니다 — 계정만 지웁니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
