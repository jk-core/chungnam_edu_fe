import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { NAVIGATION, visibleNavigation } from '@/configs/navigation';
import { Reveal } from '@/components/common/Reveal';
import { ADMIN_ROLES, ROLE_LABEL, ROLE_SCOPE_NOTE, VISIBLE_ROLES } from '@/mocks/accounts';
import { Table } from '@/components/common/Table';
import type { Column } from '@/components/common/Table';
import type { Role } from '@/interface/account';
import styles from '../../Admin.module.scss';

const ROLES: Role[] = VISIBLE_ROLES;

interface MatrixRow {
  section: string;
  allowed: Record<Role, boolean>;
}

/** 어느 등급도 못 보는 상태에서 시작해 실제 규칙으로 켜 나간다 */
const NONE_ALLOWED = (): Record<Role, boolean> => ({
  institution: false,
  group: false,
  educationOffice: false,
  admin: false,
  superAdmin: false,
  developer: false,
});

/**
 * 계정 종류별 접근 화면 (SFR-023).
 *
 * 표를 손으로 적지 않고 **실제 메뉴 노출 규칙을 돌려서** 만든다. 규칙이 바뀌면 표도 함께
 * 바뀌므로, 「문서에는 이렇게 적혀 있는데 화면은 다르다」 가 생길 수 없다.
 */
export function AccessMatrix() {
  const rows: MatrixRow[] = useMemo(() => {
    const bySection = new Map<string, MatrixRow>(
      NAVIGATION.map((section) => [section.label, { section: section.label, allowed: NONE_ALLOWED() }]),
    );

    // 관리자 콘솔은 내비게이션 규칙 바깥에 있어 손으로 한 줄 세운다.
    const adminRow: MatrixRow = { section: '관리자 콘솔', allowed: NONE_ALLOWED() };

    ADMIN_ROLES.forEach((role) => { adminRow.allowed[role] = true; });
    bySection.set('관리자 콘솔', adminRow);

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
      // 표시가 아니라 뜻을 읽어 주어야 한다 — 「✓」 만으로는 무엇인지 알 수 없다
      render: (row) => (row.allowed[role]
        ? <span className={styles.matrixCheck} aria-label="접근 가능">✓</span>
        : <span className={styles.matrixDash} aria-label="접근 불가">—</span>),
    })),
  ];

  return (
    <Reveal delay={0.06}>
      <Card
        title="계정 종류별 접근 화면"
        description="메뉴 노출 규칙과 같은 데이터를 쓰므로 이 표와 실제 화면이 어긋나지 않습니다."
      >
        <Table caption="역할별 접근 가능 화면" columns={columns} rows={rows} getRowKey={(row) => row.section} />

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
  );
}
