import { useMemo } from 'react';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { NAVIGATION, visibleNavigation } from '@/configs/navigation';
import { Reveal } from '@/components/common/Reveal';
import { ROLE_LABEL, ROLE_SCOPE_NOTE } from '@/mocks/accounts';
import { Table } from '@/components/common/Table';
import useAssetStore, { mergeUsers } from '@/stores/assetStore';
import type { Column } from '@/components/common/Table';
import type { Role } from '@/interface/account';
import styles from '../Admin.module.scss';

const ROLES: Role[] = ['admin', 'office', 'institution'];

interface MatrixRow {
  section: string;
  allowed: Record<Role, boolean>;
}

/** 계정·권한 관리 (SFR-023) — 계정 트리와 역할별 접근 화면. */
function AccountsPage() {
  const userCreated = useAssetStore((state) => state.userCreated);
  const userPatched = useAssetStore((state) => state.userPatched);
  const userDeleted = useAssetStore((state) => state.userDeleted);

  const users = useMemo(
    () => mergeUsers(userCreated, userPatched, userDeleted),
    [userCreated, userPatched, userDeleted],
  );

  const officeUsers = users.filter((user) => user.role !== 'institution');
  const institutionUsers = users.filter((user) => user.role === 'institution');

  // 역할별로 실제 내비게이션 필터 결과를 그대로 매트릭스로 만든다 — 화면과 규칙이 어긋날 수 없다.
  const matrix: MatrixRow[] = useMemo(() => {
    const bySection = new Map<string, MatrixRow>();

    // 관리자 콘솔 행을 포함해 대메뉴 단위로 접는다.
    NAVIGATION.forEach((section) => {
      bySection.set(section.label, {
        section: section.label,
        allowed: { admin: false, office: false, institution: false },
      });
    });
    bySection.set('관리자 콘솔', { section: '관리자 콘솔', allowed: { admin: true, office: false, institution: false } });

    ROLES.forEach((role) => {
      visibleNavigation(role).forEach((section) => {
        const row = bySection.get(section.label);

        if (row) row.allowed[role] = true;
      });
    });

    return [...bySection.values()];
  }, []);

  const columns: Column<MatrixRow>[] = [
    { key: 'section', header: '화면(대메뉴)', render: (row) => <strong>{row.section}</strong> },
    ...ROLES.map((role): Column<MatrixRow> => ({
      key: role,
      header: ROLE_LABEL[role],
      align: 'center',
      width: '130px',
      render: (row) =>
        row.allowed[role]
          ? <span className={styles.matrixCheck} aria-label="접근 가능">✓</span>
          : <span className={styles.matrixDash} aria-label="접근 불가">—</span>,
    })),
  ];

  return (
    <div className={styles.tab}>
      <Reveal>
        <Card
          eyebrow="Tree"
          title="계정 트리"
          description="교육청 아래에 교육기관 계정이 달립니다. 교육기관 계정은 담당 학교만 조회합니다."
        >
          <div className={styles.orgTree}>
            <div className={styles.orgNode}>
              <span className={styles.orgNode__name}>충청남도교육청</span>
              <Badge tone="brand">본청</Badge>
              <span className={styles.orgNode__meta}>
                관리자 {officeUsers.filter((user) => user.role === 'admin').length}명 · 담당자{' '}
                {officeUsers.filter((user) => user.role === 'office').length}명
              </span>
            </div>

            <div className={styles.orgTree__branch}>
              {institutionUsers.slice(0, 8).map((user) => (
                <div key={user.id} className={styles.orgNode}>
                  <span className={styles.orgNode__name}>{user.orgName}</span>
                  <span className={styles.orgNode__meta}>
                    {user.name} · {user.department}
                  </span>
                  {user.locked ? <Badge tone="critical">잠금</Badge> : null}
                </div>
              ))}
              <p className={styles.toolbar__note}>… 외 교육기관 계정 {Math.max(0, institutionUsers.length - 8)}개</p>
            </div>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.06}>
        <Card
          eyebrow="Matrix"
          title="계정 종류별 접근 화면"
          description="메뉴 노출 규칙과 같은 데이터를 쓰므로 이 표와 실제 화면이 어긋나지 않습니다."
        >
          <Table caption="역할별 접근 가능 화면" columns={columns} rows={matrix} getRowKey={(row) => row.section} />

          <dl className={styles.infoGrid}>
            {ROLES.map((role) => (
              <div key={role}>
                <dt>{ROLE_LABEL[role]}</dt>
                <dd>{ROLE_SCOPE_NOTE[role]}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </Reveal>
    </div>
  );
}

export default AccountsPage;
