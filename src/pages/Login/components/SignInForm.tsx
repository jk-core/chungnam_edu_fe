import { useId, useState } from 'react';
import { AlertIcon, EyeIcon, EyeOffIcon } from '@/components/common/Icon';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';
import type { SignInParams } from '@/service/auth/type';
import styles from '../Login.module.scss';
import type { FormError } from '../hooks/useSignIn';

interface SignInFormProps {
  onSubmit: (params: SignInParams) => void;
  isPending: boolean;
  error: FormError | null;
  /** 다시 적기 시작하면 앞서 뜬 오류를 치운다 */
  onClearError: () => void;
}

/**
 * 아이디와 비밀번호로 들어오는 길 (SIF-001).
 *
 * 실패 횟수와 잠금은 세지 않는다 — 서버가 판정하고 문구까지 내려준다. 화면이 따로 세면
 * 브라우저를 바꾸거나 새로고침하는 순간 그 숫자가 틀어진다.
 */
export function SignInForm({ onSubmit, isPending, error, onClearError }: SignInFormProps) {
  const accountId = useId();
  const passwordId = useId();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [blocked, setBlocked] = useState<FormError | null>(null);

  const shown = blocked ?? error;

  const edit = (set: (value: string) => void) => (value: string) => {
    set(value);
    setBlocked(null);
    onClearError();
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending) return;

    // SIF-001-02 필수 항목 미입력 시 서버까지 가지 않고 막는다.
    if (!loginId.trim()) {
      setBlocked({ title: '아이디를 입력해 주세요.', action: '교육청에서 발급한 아이디를 넣습니다.' });

      return;
    }

    if (!password) {
      setBlocked({ title: '비밀번호를 입력해 주세요.', action: '비밀번호는 대소문자를 구분합니다.' });

      return;
    }

    onSubmit({ loginId: loginId.trim(), password });
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
            value={loginId}
            onChange={(event) => edit(setLoginId)(event.target.value)}
            placeholder="예: admin"
            autoComplete="username"
            inputMode="text"
            lang="en"
            aria-required="true"
            aria-invalid={shown !== null}
            disabled={isPending}
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
            onChange={(event) => edit(setPassword)(event.target.value)}
            autoComplete="current-password"
            aria-required="true"
            aria-invalid={shown !== null}
            disabled={isPending}
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

      {shown ? (
        <p className={styles.error} role="alert">
          <AlertIcon />
          <span className={styles.error__body}>
            <span className={styles.error__title}>{shown.title}</span>
            <span className={styles.error__action}>{shown.action}</span>
          </span>
        </p>
      ) : null}

      <Button type="submit" size="lg" isFullWidth disabled={isPending}>
        {isPending ? '로그인 중…' : '로그인'}
      </Button>
    </form>
  );
}
