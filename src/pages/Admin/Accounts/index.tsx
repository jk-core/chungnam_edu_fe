import styles from '../Admin.module.scss';
import { AccessMatrix } from './components/AccessMatrix';
import { AccountTree } from './components/AccountTree';

/** 계정·권한 관리 (SFR-023) — 계정 트리와 역할별 접근 화면. */
function AccountsPage() {
  return (
    <div className={styles.tab}>
      <AccountTree />
      <AccessMatrix />
    </div>
  );
}

export default AccountsPage;
