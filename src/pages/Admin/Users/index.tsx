import { useNavigate, useParams } from 'react-router-dom';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import styles from '../Admin.module.scss';
import AccountDepth from './Account';
import GroupDepth from './Group';

/** 무엇을 관리할지 (SFR-018) */
type Kind = 'account' | 'group';

const DEPTHS = {
  account: AccountDepth,
  group: GroupDepth,
} as const;

/**
 * 사용자 관리 (SFR-018) — 관리자만 들어온다 (SFR-018-05).
 *
 * 그룹관리자는 계정 성격이 아니라 **맡은 발전소 묶음**이 본체라 따로 세운다 — 계정 목록에
 * 섞어 두면 그 사람이 어디를 보는지가 행 하나에 담기지 않는다.
 */
function UsersPage({ depth }: { depth: AdminDepth }) {
  const { kind = 'account' } = useParams<{ kind: Kind }>();
  const navigate = useNavigate();
  const Depth = DEPTHS[kind as Kind] ?? DEPTHS.account;

  return (
    <div className={styles.tab}>
      {/* 폼에서는 갈래를 갈아 끼울 자리가 아니다 — 적던 값이 주소와 함께 날아간다. */}
      {depth === 'list' ? (
        <div className={styles.toolbar}>
          <SegmentedControl
            value={kind as Kind}
            onChange={(value) => navigate(listPath('users', value))}
            label="관리 대상"
            options={[
              { value: 'account', label: '사용자' },
              { value: 'group', label: '그룹관리자' },
            ]}
          />
        </div>
      ) : null}

      <Depth depth={depth} />
    </div>
  );
}

export default UsersPage;
