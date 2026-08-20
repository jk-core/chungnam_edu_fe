import styles from '../Login.module.scss';
import { useSignIn } from '../hooks/useSignIn';
import { DemoAccounts } from './DemoAccounts';
import { SignInForm } from './SignInForm';

/**
 * 로그인 화면 한 벌 (SIF-001).
 * 직접 적는 길과 데모 계정을 누르는 길이 같은 실패 횟수·잠금 상태를 나눠 쓴다.
 */
export function LoginCard() {
  const { policy, error, isLocked, enter, warn } = useSignIn();

  return (
    <div className={styles.card}>
      <SignInForm policy={policy} error={error} isLocked={isLocked} onSubmit={enter} onWarn={warn} />
      <DemoAccounts onEnter={enter} isLocked={isLocked} />
    </div>
  );
}
