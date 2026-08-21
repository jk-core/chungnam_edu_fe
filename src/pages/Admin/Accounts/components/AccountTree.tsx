import { useMemo } from 'react';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { getSchoolById } from '@/mocks/schools';
import { Reveal } from '@/components/common/Reveal';
import useAssetStore, { mergeUsers } from '@/stores/assetStore';
import styles from '../../Admin.module.scss';

/** 트리에 펼쳐 보일 교육기관 수 — 나머지는 수로만 적는다 */
const BRANCH_LIMIT = 8;

/**
 * 계정 트리 (SFR-023).
 *
 * 교육청 아래에 교육기관 계정이 달린다. 계정 목록은 이 판만 쓰므로 여기서 직접 읽는다 —
 * 위에서 받아 내리면 옆 판이 쓰지도 않는 값을 지나쳐 보내게 된다.
 */
export function AccountTree() {
  const userCreated = useAssetStore((state) => state.userCreated);
  const userPatched = useAssetStore((state) => state.userPatched);
  const userDeleted = useAssetStore((state) => state.userDeleted);

  const users = useMemo(
    () => mergeUsers(userCreated, userPatched, userDeleted),
    [userCreated, userPatched, userDeleted],
  );

  const customerUsers = users.filter((user) => user.role === 'customer');
  const adminCount = users.filter((user) => user.role === 'admin').length;
  const guestCount = users.filter((user) => user.role === 'guest').length;
  const groupCount = users.filter((user) => user.role === 'group').length;

  return (
    <Reveal>
      <Card
        title="계정 트리"
        description="교육청 아래에 교육기관 계정이 달립니다. 교육기관 계정은 담당 학교만 조회합니다."
      >
        <div className={styles.orgTree}>
          <div className={styles.orgNode}>
            <span className={styles.orgNode__name}>충청남도교육청</span>
            <Badge tone="brand">본청</Badge>
            <span className={styles.orgNode__meta}>
              관리자 {adminCount}명 · 게스트 {guestCount}명 · 그룹관리자 {groupCount}명
            </span>
          </div>

          <div className={styles.orgTree__branch}>
            {customerUsers.slice(0, BRANCH_LIMIT).map((user) => (
              <div key={user.id} className={styles.orgNode}>
                {/* 교육기관 계정은 소속을 따로 적지 않고 담당 학교로 묶인다. */}
                <span className={styles.orgNode__name}>
                  {getSchoolById(user.plantIds[0] ?? null)?.name ?? '담당 학교 없음'}
                </span>
                <span className={styles.orgNode__meta}>
                  {user.name} · {user.loginId}
                </span>
                {user.locked ? <Badge tone="critical">잠금</Badge> : null}
              </div>
            ))}
            <p className={styles.toolbar__note}>
              … 외 교육기관 계정 {Math.max(0, customerUsers.length - BRANCH_LIMIT)}개
            </p>
          </div>
        </div>
      </Card>
    </Reveal>
  );
}
