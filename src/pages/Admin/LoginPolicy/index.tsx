import styles from '../Admin.module.scss';
import { PolicyCurrent } from './components/PolicyCurrent';
import { PolicyForm } from './components/PolicyForm';

/** 로그인 설정 (SFR-026) — 로그인 화면 안내문과 세션 만료가 이 값을 그대로 쓴다. */
function LoginPolicyPage() {
  return (
    <div className={styles.tab}>
      <PolicyForm />
      <PolicyCurrent />
    </div>
  );
}

export default LoginPolicyPage;
