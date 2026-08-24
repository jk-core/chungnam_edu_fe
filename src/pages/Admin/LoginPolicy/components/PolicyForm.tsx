import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormField, FormRow, FormSection, NumberControl, withUnit } from '@/components/common/Form';
import { MSG } from '@/configs/messages';
import { Reveal } from '@/components/common/Reveal';
import { toast } from '@/stores/toastStore';
import useAssetStore from '@/stores/assetStore';
import type { LoginPolicy } from '@/interface/account';
import styles from '../../Admin.module.scss';
import { POLICY_FIELDS } from './policyFields';
import type { PolicyDraft, PolicyField, PolicyKey } from './policyFields';

const KEYS = Object.keys(POLICY_FIELDS) as PolicyKey[];

/** 비어 있지 않고 범위 안이면 저장할 수 있다 */
function firstInvalidKey(draft: PolicyDraft): PolicyKey | null {
  return KEYS.find((key) => {
    const value = draft[key];
    const field = POLICY_FIELDS[key];

    return value === '' || value < field.min || value > field.max;
  }) ?? null;
}

/**
 * 로그인 정책 입력 (SFR-026).
 *
 * 어느 칸이 틀렸는지를 문구가 아니라 **열쇠** 로 들고 있는다. 전에는 오류 문장에 그 칸 이름이
 * 들어 있는지 찾아 붙였는데, 문구를 다듬는 순간 오류가 엉뚱한 칸에 붙거나 아무 데도 붙지 않았다.
 */
export function PolicyForm() {
  const policy = useAssetStore((state) => state.policy);
  const savePolicy = useAssetStore((state) => state.savePolicy);

  const [draft, setDraft] = useState<PolicyDraft>(policy);
  const [invalidKey, setInvalidKey] = useState<PolicyKey | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const errorOf = (key: PolicyKey) => {
    if (invalidKey !== key) return undefined;

    const field = POLICY_FIELDS[key];

    return MSG.numberRange(field.errorLabel, field.min, field.max);
  };

  const submit = () => {
    const invalid = firstInvalidKey(draft);

    setInvalidKey(invalid);

    if (!invalid) setIsConfirming(true);
  };

  const commit = () => {
    if (firstInvalidKey(draft)) return;

    savePolicy(draft as LoginPolicy);
    toast.success(MSG.updateSuccess('로그인 설정'));
  };

  const field = (key: PolicyKey) => {
    const spec: PolicyField = POLICY_FIELDS[key];

    return (
      <FormField label={spec.label} hint={withUnit(spec.hint, spec.unit)} required error={errorOf(key)}>
        <NumberControl
          value={draft[key]}
          onChange={(value) => setDraft({ ...draft, [key]: value })}
          min={spec.min}
          max={spec.max}
        />
      </FormField>
    );
  };

  return (
    <>
      <Reveal>
        <Card title="로그인 정책" description="저장하면 로그인 화면 안내문과 세션 만료 시간에 바로 반영됩니다.">
          <div className={styles.form}>
            <FormSection legend="비밀번호" hint="주기가 지나면 로그인 시 변경을 요구합니다.">
              <FormRow cols={2}>
                {field('passwordResetDays')}
                {field('maxFailCount')}
              </FormRow>
            </FormSection>

            <FormSection legend="로그인 유지시간" hint="관리자는 권한이 큰 만큼 짧게 두는 것을 권합니다.">
              <FormRow cols={2}>
                {field('adminSessionMinutes')}
                {field('userSessionMinutes')}
              </FormRow>
            </FormSection>

            <div className={styles.toolbar__actions}>
              <Button variant="secondary" onClick={() => setDraft(policy)}>되돌리기</Button>
              <Button onClick={submit}>저장</Button>
            </div>
          </div>
        </Card>
      </Reveal>

      <ConfirmDialog
        isOpen={isConfirming}
        title={MSG.updateConfirm('로그인 설정')}
        description="다음 로그인부터 새 정책이 적용됩니다."
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
      />
    </>
  );
}
