import { StandalonePageLayout } from '@/layouts/StandalonePageLayout';
import styles from './MyPage.module.scss';
import { AccountInfo } from './components/AccountInfo';
import { PasswordChange } from './components/PasswordChange';

/** 마이페이지 (SFR-024) — 계정 정보는 읽기 전용, 비밀번호만 바꾼다. */
function MyPage() {
  return (
    <StandalonePageLayout
      title="마이페이지"
      description="쓰고 있는 계정의 정보를 확인하고 비밀번호를 바꿉니다."
    >
      <div className={styles.grid}>
        <AccountInfo />
        <PasswordChange />
      </div>
    </StandalonePageLayout>
  );
}

export default MyPage;
