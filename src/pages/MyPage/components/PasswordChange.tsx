import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormSection, PasswordField } from '@/components/common/Form';
import { Reveal } from '@/components/common/Reveal';
import { toast } from '@/stores/toastStore';
import useAssetStore from '@/stores/assetStore';
import styles from '../MyPage.module.scss';

/** 새 비밀번호가 지켜야 할 것 — 안내 문구도 이 값을 그대로 쓴다 */
const MIN_LENGTH = 8;

interface Draft {
  current: string;
  next: string;
  confirm: string;
}

type FieldErrors = Partial<Record<keyof Draft, string>>;

/** 채워야 할 것과 지켜야 할 것을 한 번에 본다 — 하나씩 물으면 세 번을 눌러야 안다 */
function validate({ current, next, confirm }: Draft): FieldErrors {
  const errors: FieldErrors = {};

  if (!current) errors.current = '현재 비밀번호를 입력해 주세요.';

  if (next.length < MIN_LENGTH) errors.next = `새 비밀번호는 ${MIN_LENGTH}자 이상이어야 합니다.`;
  else if (!/[a-zA-Z]/.test(next) || !/\d/.test(next)) errors.next = '영문과 숫자를 함께 사용해 주세요.';
  else if (current && next === current) errors.next = '현재 비밀번호와 다른 비밀번호를 정해 주세요.';

  if (confirm !== next) errors.confirm = '새 비밀번호가 서로 다릅니다.';

  return errors;
}

const EMPTY: Draft = { current: '', next: '', confirm: '' };

/** 비밀번호 변경 (SFR-024). 재설정 주기는 로그인 설정이 정한 값을 그대로 안내한다 (SFR-026). */
export function PasswordChange() {
  const resetDays = useAssetStore((state) => state.policy.passwordResetDays);

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isConfirming, setIsConfirming] = useState(false);

  const set = (key: keyof Draft) => (value: string) => setDraft({ ...draft, [key]: value });

  const submit = () => {
    const found = validate(draft);

    setErrors(found);

    if (Object.keys(found).length === 0) setIsConfirming(true);
  };

  const commit = () => {
    toast.success('비밀번호를 변경했습니다. 다음 로그인부터 새 비밀번호를 사용하세요.');
    setDraft(EMPTY);
  };

  return (
    <>
      <Reveal delay={0.06}>
        <Card title="비밀번호 변경" description={`비밀번호는 ${resetDays}일마다 변경해야 합니다.`}>
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <FormSection legend="본인 확인">
              <PasswordField label="현재 비밀번호" value={draft.current} onChange={set('current')} required error={errors.current} />
            </FormSection>

            <FormSection legend="새 비밀번호" hint={`${MIN_LENGTH}자 이상, 영문과 숫자를 섞어 주세요.`}>
              <PasswordField label="새 비밀번호" value={draft.next} onChange={set('next')} required error={errors.next} />
              <PasswordField label="새 비밀번호 확인" value={draft.confirm} onChange={set('confirm')} required error={errors.confirm} />
            </FormSection>

            <div className={styles.form__actions}>
              <Button type="submit">비밀번호 변경</Button>
            </div>
          </form>
        </Card>
      </Reveal>

      <ConfirmDialog
        isOpen={isConfirming}
        title="비밀번호를 변경하시겠습니까?"
        description="변경 후 다른 기기에서는 다시 로그인해야 합니다."
        confirmLabel="변경"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
      />
    </>
  );
}
