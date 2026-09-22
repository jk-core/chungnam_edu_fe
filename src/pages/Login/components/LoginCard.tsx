import styles from '../Login.module.scss';
import { useSignIn } from '../hooks/useSignIn';
import { SignInForm } from './SignInForm';

/** 로그인 화면 한 벌 (SIF-001) */
export function LoginCard() {
  const { signIn, isPending, error, clearError } = useSignIn();

  return (
    <div className={styles.card}>
      <SignInForm onSubmit={signIn} isPending={isPending} error={error} onClearError={clearError} />
    </div>
  );
}
