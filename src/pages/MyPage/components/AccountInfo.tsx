import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { getSchoolById } from '@/mocks/schools';
import { Reveal } from '@/components/common/Reveal';
import { isReviewRole, ROLE_LABEL, ROLE_SCOPE_NOTE } from '@/mocks/accounts';
import { useAuthUser } from '@/stores/authStore';
import styles from '../MyPage.module.scss';

/**
 * 쓰고 있는 계정 (SFR-024).
 *
 * 아이디와 권한은 화면에서 바꿀 수 없다 — 계정을 만드는 일은 관리자 콘솔이 맡는다.
 */
export function AccountInfo() {
  const user = useAuthUser();

  if (!user) return null;

  const plants = user.plantIds.map((id) => getSchoolById(id)).filter((school) => school !== null);

  return (
    <Reveal>
      <Card title="계정 정보" description="아이디와 권한은 화면에서 바꿀 수 없습니다.">
        <dl className={styles.info}>
          <div>
            <dt>아이디</dt>
            <dd>{user.id}</dd>
          </div>
          <div>
            <dt>이름</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>소속</dt>
            <dd>{user.orgName} · {user.department}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>권한</dt>
            <dd className={styles.info__role}>
              <Badge tone={isReviewRole(user.role) ? 'brand' : 'neutral'}>{ROLE_LABEL[user.role]}</Badge>
              <span className={styles.info__note}>{ROLE_SCOPE_NOTE[user.role]}</span>
            </dd>
          </div>
          <div>
            <dt>담당 설비</dt>
            {/* 담당 설비를 지정하지 않은 계정은 도 전체를 본다 */}
            <dd>
              {plants.length === 0
                ? '충청남도 전체'
                : plants.map((plant) => `${plant.name} (${plant.capacityKw} kW)`).join(', ')}
            </dd>
          </div>
        </dl>
      </Card>
    </Reveal>
  );
}
