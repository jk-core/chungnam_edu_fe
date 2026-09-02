import styles from '../Admin.module.scss';
import { AccessMatrix } from './components/AccessMatrix';

/** 계정·권한 관리 (SFR-023) — 역할별 접근 화면. */
function AccountsPage() {
  return (
    <div className={styles.tab}>
      <AccessMatrix />
    </div>
  );
}

export default AccountsPage;
