import { useId, useRef, useState } from 'react';
import { ACCOUNTS, ROLE_LABEL, ROLE_SCOPE_NOTE } from '@/mocks/accounts';
import useAssetStore from '@/stores/assetStore';
import { AlertIcon, ChevronRightIcon, EyeIcon, EyeOffIcon } from '@/components/common/Icon';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';
import { useLogin } from '@/stores/authStore';
import styles from './Login.module.scss';

interface FormError {
  title: string;
  action: string;
}

function LoginPage() {
  const login = useLogin();
  const accountId = useId();
  const passwordId = useId();

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [error, setError] = useState<FormError | null>(null);
  const [failCount, setFailCount] = useState(0);
  // 관리자 콘솔에서 저장한 로그인 정책을 그대로 쓴다 (SFR-026).
  const policy = useAssetStore((state) => state.policy);
  // 연속 제출이 한 렌더에 묶여도 횟수가 어긋나지 않게 최신 값을 ref 로 들고 있는다.
  const failRef = useRef(0);

  const isLocked = failCount >= policy.maxFailCount;

  // 성공하면 AuthLayout 이 원래 가려던 곳으로 보내 준다. 여기서는 계정만 세운다.
  const enter = (id: string) => {
    if (!login(id)) {
      failRef.current += 1;

      const next = failRef.current;

      setFailCount(next);
      setError(
        next >= policy.maxFailCount
          ? {
            title: `로그인 실패가 ${policy.maxFailCount}회를 넘어 입력이 잠겼습니다.`,
            action: '소속 기관 담당자에게 계정 잠금 해제를 요청하세요.',
          }
          : {
            title: '등록되지 않은 아이디입니다.',
            action: `아이디를 다시 확인해 주세요. (실패 ${next}/${policy.maxFailCount}회)`,
          },
      );

      return;
    }
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLocked) return;

    // SIF-001-02 필수 항목 미입력 시 진행을 막는다.
    if (!account.trim()) {
      setError({ title: '아이디를 입력해 주세요.', action: '교육청에서 발급한 아이디를 넣습니다.' });

      return;
    }

    if (!password) {
      setError({ title: '비밀번호를 입력해 주세요.', action: '비밀번호는 대소문자를 구분합니다.' });

      return;
    }

    enter(account);
  };

  return (
    <div className={styles.card}>
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

      <div className={styles.demo}>
        <p className={styles.demo__title}>데모 계정으로 둘러보기</p>
        <p className={styles.demo__hint}>
          권한에 따라 보이는 메뉴와 설비 범위가 달라집니다. 눌러서 바로 들어갈 수 있습니다.
        </p>

        <div className={styles.demo__list}>
          {ACCOUNTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.demo__item}
              onClick={() => enter(item.id)}
              disabled={isLocked}
            >
              <span className={styles.demo__body}>
                <span className={styles.demo__name}>
                  {item.name} · {item.orgName}
                </span>
                <span className={styles.demo__note}>{ROLE_SCOPE_NOTE[item.role]}</span>
              </span>
              <span className={styles.demo__meta}>
                <Badge tone={item.role === 'institution' ? 'neutral' : 'brand'}>{ROLE_LABEL[item.role]}</Badge>
                <ChevronRightIcon />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
