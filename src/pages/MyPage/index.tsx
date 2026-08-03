import { useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormSection, PasswordField } from '@/components/common/Form';
import { getSchoolById } from '@/mocks/schools';
import { Reveal } from '@/components/common/Reveal';
import { ROLE_LABEL, ROLE_SCOPE_NOTE } from '@/mocks/accounts';
import { StandalonePageLayout } from '@/layouts/StandalonePageLayout';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useAssetStore from '@/stores/assetStore';
import styles from './MyPage.module.scss';

/** 마이페이지 (SFR-024) — 계정 정보는 읽기 전용, 비밀번호만 바꾼다. */
function MyPage() {
  const user = useAuthUser();
  const policy = useAssetStore((state) => state.policy);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);

  if (!user) return null;

  const plants = user.plantIds.map((id) => getSchoolById(id)).filter((school) => school !== null);

  const submit = () => {
    const nextError: Record<string, string> = {};

    if (!current) nextError.current = '현재 비밀번호를 입력해 주세요.';
    if (next.length < 8) nextError.next = '새 비밀번호는 8자 이상이어야 합니다.';
    else if (!/[a-zA-Z]/.test(next) || !/\d/.test(next)) nextError.next = '영문과 숫자를 함께 사용해 주세요.';
    else if (next === current && current) nextError.next = '현재 비밀번호와 다른 비밀번호를 정해 주세요.';
    if (confirm !== next) nextError.confirm = '새 비밀번호가 서로 다릅니다.';

    setError(nextError);

    if (Object.keys(nextError).length === 0) setConfirming(true);
  };

  const commit = () => {
    toast.success('비밀번호를 변경했습니다. 다음 로그인부터 새 비밀번호를 사용하세요.');
    setCurrent('');
    setNext('');
    setConfirm('');
  };

  return (
    <StandalonePageLayout
      title="마이페이지"
      description="쓰고 있는 계정의 정보를 확인하고 비밀번호를 바꿉니다."
    >
      <div className={styles.grid}>
        <Reveal>
          <Card eyebrow="Account" title="계정 정보" description="아이디와 권한은 화면에서 바꿀 수 없습니다.">
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
                <dd>
                  {user.orgName} · {user.department}
                </dd>
              </div>
              <div>
                <dt>이메일</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>권한</dt>
                <dd className={styles.info__role}>
                  <Badge tone={user.role === 'admin' ? 'brand' : 'neutral'}>{ROLE_LABEL[user.role]}</Badge>
                  <span className={styles.info__note}>{ROLE_SCOPE_NOTE[user.role]}</span>
                </dd>
              </div>
              <div>
                <dt>담당 설비</dt>
                <dd>
                  {plants.length === 0
                    ? '충청남도 전체'
                    : plants.map((plant) => `${plant.name} (${plant.capacityKw} kW)`).join(', ')}
                </dd>
              </div>
            </dl>
          </Card>
        </Reveal>

        <Reveal delay={0.06}>
          <Card
            eyebrow="Password"
            title="비밀번호 변경"
            description={`비밀번호는 ${policy.passwordResetDays}일마다 변경해야 합니다.`}
          >
            <form
              className={styles.form}
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <FormSection legend="본인 확인">
                <PasswordField label="현재 비밀번호" value={current} onChange={setCurrent} required error={error.current} />
              </FormSection>

              <FormSection legend="새 비밀번호" hint="8자 이상, 영문과 숫자를 섞어 주세요.">
                <PasswordField label="새 비밀번호" value={next} onChange={setNext} required error={error.next} />
                <PasswordField
                  label="새 비밀번호 확인"
                  value={confirm}
                  onChange={setConfirm}
                  required
                  error={error.confirm}
                />
              </FormSection>

              <div className={styles.form__actions}>
                <Button type="submit">비밀번호 변경</Button>
              </div>
            </form>
          </Card>
        </Reveal>
      </div>

      <ConfirmDialog
        isOpen={confirming}
        title="비밀번호를 변경하시겠습니까?"
        description="변경 후 다른 기기에서는 다시 로그인해야 합니다."
        confirmLabel="변경"
        onConfirm={commit}
        onClose={() => setConfirming(false)}
      />
    </StandalonePageLayout>
  );
}

export default MyPage;
