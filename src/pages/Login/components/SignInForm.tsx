import { useId, useState } from 'react';
import { AlertIcon, EyeIcon, EyeOffIcon } from '@/components/common/Icon';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';
import type { LoginPolicy } from '@/interface/account';
import styles from '../Login.module.scss';
import type { FormError } from '../hooks/useSignIn';

interface SignInFormProps {
  policy: LoginPolicy;
  error: FormError | null;
  isLocked: boolean;
  onSubmit: (accountId: string) => void;
  /** 아이디·비밀번호를 비운 채 보냈을 때처럼, 서버까지 가지 않고 막는 경우 */
  onWarn: (error: FormError) => void;
}

/** 아이디와 비밀번호로 들어오는 길 (SIF-001) */
export function SignInForm({ policy, error, isLocked, onSubmit, onWarn }: SignInFormProps) {
  const accountId = useId();
  const passwordId = useId();

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLocked) return;

    // SIF-001-02 필수 항목 미입력 시 진행을 막는다.
    if (!account.trim()) {
      onWarn({ title: '아이디를 입력해 주세요.', action: '교육청에서 발급한 아이디를 넣습니다.' });

      return;
    }

    if (!password) {
      onWarn({ title: '비밀번호를 입력해 주세요.', action: '비밀번호는 대소문자를 구분합니다.' });

      return;
    }

    onSubmit(account);
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.field}>
        <label className={styles.field__label} htmlFor={accountId}>
          아이디
          <span className={styles.field__required} aria-hidden="true">*</span>
        </label>
        <div className={styles.field__control}>
          <input
            id={accountId}
            className={styles.field__input}
            type="text"
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            placeholder="예: cne-office"
            autoComplete="username"
            inputMode="text"
            lang="en"
            aria-required="true"
            aria-invalid={error !== null}
            disabled={isLocked}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.field__label} htmlFor={passwordId}>
          비밀번호
          <span className={styles.field__required} aria-hidden="true">*</span>
        </label>
        <div className={styles.field__control}>
          <input
            id={passwordId}
            className={cn(styles.field__input, styles['field__input--withButton'])}
            type={isRevealed ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            aria-required="true"
            aria-invalid={error !== null}
            disabled={isLocked}
          />
          <button
            type="button"
            className={styles.field__reveal}
            onClick={() => setIsRevealed((prev) => !prev)}
            aria-label={isRevealed ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {isRevealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          <AlertIcon />
          <span className={styles.error__body}>
            <span className={styles.error__title}>{error.title}</span>
            <span className={styles.error__action}>{error.action}</span>
          </span>
        </p>
      ) : null}

      <Button type="submit" size="lg" isFullWidth disabled={isLocked}>
        로그인
      </Button>

      <div className={styles.policy}>
        <span>비밀번호는 {policy.passwordResetDays}일마다 변경해야 합니다.</span>
        <span>
          로그인 유지시간은 관리자 {policy.adminSessionMinutes}분, 일반 사용자{' '}
          {policy.userSessionMinutes}분입니다.
        </span>
      </div>
    </form>
  );
}
