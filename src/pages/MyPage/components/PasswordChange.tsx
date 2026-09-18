import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormSection, PasswordField } from '@/components/common/Form';
import { PASSWORD_HINT, PASSWORD_RULE } from '@/schemas/password';
import { Reveal } from '@/components/common/Reveal';
import styles from '../MyPage.module.scss';
import { useChangePassword } from '../hooks/useChangePassword';

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

  // 서버가 보는 규칙과 같은 정규식을 쓴다 — 화면이 느슨하면 통과시킨 뒤 서버에서 되돌아온다.
  if (!PASSWORD_RULE.test(next)) errors.next = `${PASSWORD_HINT}로 넣어 주세요.`;
  else if (current && next === current) errors.next = '현재 비밀번호와 다른 비밀번호를 정해 주세요.';

  if (confirm !== next) errors.confirm = '새 비밀번호가 서로 다릅니다.';

  return errors;
}

const EMPTY: Draft = { current: '', next: '', confirm: '' };

/** 비밀번호 변경 (SFR-024) */
export function PasswordChange() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isConfirming, setIsConfirming] = useState(false);

  const { changePassword, isPending } = useChangePassword(() => setDraft(EMPTY));

  const set = (key: keyof Draft) => (value: string) => setDraft({ ...draft, [key]: value });

  const submit = () => {
    const found = validate(draft);

    setErrors(found);

    if (Object.keys(found).length === 0) setIsConfirming(true);
  };

  const commit = () => {
    setIsConfirming(false);
    changePassword({ password: draft.current, newPassword: draft.next });
  };

  return (
    <>
      <Reveal delay={0.06}>
        <Card title="비밀번호 변경" description="주기적으로 바꿔 주세요.">
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

            <FormSection legend="새 비밀번호" hint={PASSWORD_HINT}>
              <PasswordField label="새 비밀번호" value={draft.next} onChange={set('next')} required error={errors.next} />
              <PasswordField label="새 비밀번호 확인" value={draft.confirm} onChange={set('confirm')} required error={errors.confirm} />
            </FormSection>

            <div className={styles.form__actions}>
              <Button type="submit" disabled={isPending}>
                {isPending ? '변경 중…' : '비밀번호 변경'}
              </Button>
            </div>
          </form>
        </Card>
      </Reveal>

      <ConfirmDialog
        isOpen={isConfirming}
        title="비밀번호를 변경하시겠습니까?"
        description="변경 후 다른 기기를 끊으려면 계정 메뉴의 «모든 기기에서 로그아웃» 을 쓰세요."
        confirmLabel="변경"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
      />
    </>
  );
}
