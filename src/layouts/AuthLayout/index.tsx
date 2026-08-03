import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';
import { PATH } from '@/routes/routes';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuthUser } from '@/stores/authStore';
import styles from './AuthLayout.module.scss';

/** 로그인 화면 골격. 헤더·LNB·푸터 없이 가운데 카드 하나만 둔다. */
export default function AuthLayout() {
  const user = useAuthUser();
  const location = useLocation();

  // 로그인 후 이동은 이 한 곳에서만 처리한다.
  // 로그인 화면이 따로 navigate 를 부르면 이 리다이렉트와 경쟁해 목적지가 엉킨다.
  if (user) {
    const from = (location.state as { from?: string } | null)?.from;

    return <Navigate to={from ?? PATH.HOME} replace />;
  }

  return (
    <div className={styles.auth}>
      <span className={styles.auth__sun} aria-hidden="true" />

      <div className={styles.auth__utils}>
        <ThemeToggle />
      </div>

      <div className={styles.auth__inner}>
        <div className={styles.auth__head}>
          <Logo />
          <h1 className={styles.auth__title}>통합관리시스템 로그인</h1>
          <p className={styles.auth__lead}>
            충청남도교육청이 발급한 계정으로 들어옵니다. 계정이 없으면 소속 기관 담당자에게 요청하세요.
          </p>
        </div>

        <Outlet />

        <p className={styles.auth__foot}>충청남도교육청 교육과정평가정보원 · 내부 업무용 시스템</p>
      </div>
    </div>
  );
}
