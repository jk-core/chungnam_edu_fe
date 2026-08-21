import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { MaskedText } from '@/components/common/MaskedText';
import { maskEmail } from '@/utils/mask';
import { NOW } from '@/mocks/today';
import { Reveal } from '@/components/common/Reveal';
import { ROLE_LABEL } from '@/mocks/accounts';
import { Table } from '@/components/common/Table';
import { toast } from '@/stores/toastStore';
import useAssetStore from '@/stores/assetStore';
import type { Column } from '@/components/common/Table';
import type { ManagedUser } from '@/interface/account';
import styles from '@/pages/Admin/Admin.module.scss';
import { useUserChangeLog } from '../hooks/useUserChangeLog';

/** 사용자 목록 (SFR-018). 잠금 해제와 비밀번호 초기화는 이 자리에서 바로 한다. */
export function UserTable({ rows }: { rows: ManagedUser[] }) {
  const navigate = useNavigate();
  const patchUser = useAssetStore((state) => state.patchUser);
  const entryOf = useUserChangeLog();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [shown, setShown] = useState(rows);

  // 검색 결과가 바뀌면 첫 쪽으로 돌아간다. 3쪽을 보던 중 검색어를 바꾸면 빈 쪽이 남는다.
  if (shown !== rows) {
    setShown(rows);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const unlock = (target: ManagedUser) => {
    patchUser(target.id, { locked: false }, [entryOf(target, '계정 잠금', '잠김', '해제')]);
    toast.success(`${target.name} 계정 잠금을 풀었습니다.`);
  };

  const resetPassword = (target: ManagedUser) => {
    toast.success(`${target.name} 계정에 임시 비밀번호를 보냈습니다. (${NOW.format('HH:mm')} 기준)`);
  };

  const columns: Column<ManagedUser>[] = [
    {
      key: 'name',
      header: '로그인 ID · 이름',
      width: '180px',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>
            {row.name}
            {row.locked ? <Badge tone="critical"> 잠금</Badge> : null}
          </strong>
          <span className={styles.stackCell__sub}>{row.loginId}</span>
        </span>
      ),
    },
    {
      key: 'role',
      header: '권한',
      width: '120px',
      render: (row) => <Badge tone={row.role === 'admin' ? 'brand' : 'neutral'}>{ROLE_LABEL[row.role]}</Badge>,
    },
    {
      key: 'email',
      header: '이메일',
      hideOnTablet: true,
      // 목록에서는 가려 두고 필요할 때만 확인한다 (SFR-018-05).
      render: (row) => <MaskedText masked={maskEmail(row.email)} original={row.email} label={`${row.name} 이메일`} />,
    },
    {
      key: 'login',
      header: '마지막 로그인',
      width: '140px',
      hideOnTablet: true,
      render: (row) => row.lastLoginAt ?? '이력 없음',
    },
    {
      key: 'action',
      header: '계정',
      width: '140px',
      align: 'center',
      // 줄을 누르면 수정으로 들어가는 자리다 — 여기 버튼까지 타고 올라가면 둘이 함께 열린다.
      render: (row) => (row.locked ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={(event) => {
            event.stopPropagation();
            unlock(row);
          }}
        >
          잠금 해제
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            resetPassword(row);
          }}
        >
          비번 초기화
        </Button>
      )),
    },
  ];

  return (
    <Reveal>
      <Card title="설비 담당자" description="로그인 실패가 누적돼 잠긴 계정은 여기서 풀어 줍니다.">
        <Table
          caption="사용자 목록. 로그인 ID와 이름, 권한, 이메일, 마지막 로그인 순입니다."
          columns={columns}
          rows={pageRows}
          getRowKey={(row) => row.id}
          getRowClassName={(row) => (row.locked ? styles.rowAlert : undefined)}
          onRowClick={(row) => navigate(editPath('users', 'account', 'userId', row.userId))}
        />
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          totalCount={rows.length}
          onChange={setPage}
          label="사용자 목록"
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </Card>
    </Reveal>
  );
}
