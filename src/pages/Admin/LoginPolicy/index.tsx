import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormRow, FormSection, NumberField } from '@/components/common/Form';
import { MSG } from '@/configs/messages';
import { Reveal } from '@/components/common/Reveal';
import { toast } from '@/stores/toastStore';
import useAssetStore from '@/stores/assetStore';
import styles from '../Admin.module.scss';

interface Draft {
  passwordResetDays: number | '';
  maxFailCount: number | '';
  adminSessionMinutes: number | '';
  userSessionMinutes: number | '';
}

/** 로그인 설정 (SFR-026) — 로그인 화면 안내문과 세션 만료가 이 값을 그대로 쓴다. */
function LoginPolicyPage() {
  const policy = useAssetStore((state) => state.policy);
  const savePolicy = useAssetStore((state) => state.savePolicy);

  const [draft, setDraft] = useState<Draft>(policy);
  const [error, setError] = useState<string | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);

  const submit = () => {
    const fields: [keyof Draft, string, number, number][] = [
      ['passwordResetDays', '비밀번호 재설정 주기', 30, 365],
      ['maxFailCount', '로그인 실패 허용 횟수', 3, 10],
      ['adminSessionMinutes', '관리자 유지시간', 10, 120],
      ['userSessionMinutes', '일반 사용자 유지시간', 10, 240],
    ];

    for (const [key, label, min, max] of fields) {
      const value = draft[key];

      if (value === '' || value < min || value > max) {
        setError(MSG.numberRange(label, min, max));

        return;
      }
    }

    setError(undefined);
    setConfirming(true);
  };

  const commit = () => {
    if (draft.passwordResetDays === '' || draft.maxFailCount === '' || draft.adminSessionMinutes === '' || draft.userSessionMinutes === '') return;

    savePolicy({
      passwordResetDays: draft.passwordResetDays,
      maxFailCount: draft.maxFailCount,
      adminSessionMinutes: draft.adminSessionMinutes,
      userSessionMinutes: draft.userSessionMinutes,
    });
    toast.success(MSG.updateSuccess('로그인 설정'));
  };

  return (
    <div className={styles.tab}>
      <Reveal>
        <Card
          eyebrow="Policy"
          title="로그인 정책"
          description="저장하면 로그인 화면 안내문과 세션 만료 시간에 바로 반영됩니다."
        >
          <div className={styles.form}>
            <FormSection legend="비밀번호" hint="주기가 지나면 로그인 시 변경을 요구합니다.">
              <FormRow cols={2}>
                <NumberField
                  label="재설정 주기"
                  value={draft.passwordResetDays}
                  onChange={(value) => setDraft({ ...draft, passwordResetDays: value })}
                  unit="일"
                  min={30}
                  max={365}
                  required
                  error={error?.includes('재설정 주기') ? error : undefined}
                />
                <NumberField
                  label="로그인 실패 허용 횟수"
                  value={draft.maxFailCount}
                  onChange={(value) => setDraft({ ...draft, maxFailCount: value })}
                  unit="회"
                  min={3}
                  max={10}
                  required
                  hint="넘으면 계정이 잠기고, 사용자 관리에서 풉니다."
                  error={error?.includes('실패 허용') ? error : undefined}
                />
              </FormRow>
            </FormSection>

            <FormSection legend="로그인 유지시간" hint="관리자는 권한이 큰 만큼 짧게 두는 것을 권합니다.">
              <FormRow cols={2}>
                <NumberField
                  label="관리자"
                  value={draft.adminSessionMinutes}
                  onChange={(value) => setDraft({ ...draft, adminSessionMinutes: value })}
                  unit="분"
                  min={10}
                  max={120}
                  required
                  error={error?.includes('관리자 유지시간') ? error : undefined}
                />
                <NumberField
                  label="일반 사용자"
                  value={draft.userSessionMinutes}
                  onChange={(value) => setDraft({ ...draft, userSessionMinutes: value })}
                  unit="분"
                  min={10}
                  max={240}
                  required
                  error={error?.includes('일반 사용자 유지시간') ? error : undefined}
                />
              </FormRow>
            </FormSection>

            <div className={styles.toolbar__actions}>
              <Button variant="secondary" onClick={() => setDraft(policy)}>
                되돌리기
              </Button>
              <Button onClick={submit}>저장</Button>
            </div>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.06}>
        <Card eyebrow="Now" title="현재 적용값" variant="outline">
          <dl className={styles.infoGrid}>
            <div>
              <dt>비밀번호 재설정 주기</dt>
              <dd>{policy.passwordResetDays}일</dd>
            </div>
            <div>
              <dt>로그인 실패 허용</dt>
              <dd>{policy.maxFailCount}회</dd>
            </div>
            <div>
              <dt>유지시간</dt>
              <dd>
                관리자 {policy.adminSessionMinutes}분 · 일반 {policy.userSessionMinutes}분
              </dd>
            </div>
          </dl>
        </Card>
      </Reveal>

      <ConfirmDialog
        isOpen={confirming}
        title={MSG.updateConfirm('로그인 설정')}
        description="다음 로그인부터 새 정책이 적용됩니다."
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}

export default LoginPolicyPage;
