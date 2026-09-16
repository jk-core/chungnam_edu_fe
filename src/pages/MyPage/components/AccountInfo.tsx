import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Reveal } from '@/components/common/Reveal';
import { isReviewRole, ROLE_LABEL, ROLE_SCOPE_NOTE } from '@/mocks/accounts';
import styles from '../MyPage.module.scss';
import { useMyAccount } from '../hooks/useMyAccount';

/**
 * 쓰고 있는 계정 (SFR-024).
 *
 * 아이디와 권한은 화면에서 바꿀 수 없다 — 계정을 만드는 일은 관리자 콘솔이 맡는다.
 * 소속·이메일·담당 설비는 `/user/userInfo` 가 주지 않아 여기 세우지 않는다.
 */
export function AccountInfo() {
  const { user, isLoading } = useMyAccount();

  if (isLoading) {
    return (
      <Reveal>
        <Card title="계정 정보" description="계정을 불러오는 중입니다.">
          <p className={styles.info__note}>잠시만 기다려 주세요.</p>
        </Card>
      </Reveal>
    );
  }

  if (!user) return null;

  return (
    <Reveal>
      <Card title="계정 정보" description="아이디와 권한은 화면에서 바꿀 수 없습니다.">
        <dl className={styles.info}>
          <div>
            <dt>아이디</dt>
            <dd>{user.loginId}</dd>
          </div>
          <div>
            <dt>이름</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>권한</dt>
            <dd className={styles.info__role}>
              <Badge tone={isReviewRole(user.role) ? 'brand' : 'neutral'}>{ROLE_LABEL[user.role]}</Badge>
              <span className={styles.info__note}>{ROLE_SCOPE_NOTE[user.role]}</span>
            </dd>
          </div>
        </dl>
      </Card>
    </Reveal>
  );
}
