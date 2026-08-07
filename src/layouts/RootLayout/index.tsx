import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SkipLink } from '@/components/layout/SkipLink';
import { ToastViewport } from '@/components/common/Toast';
import { useResetDepth } from '@/stores/plantStore';
import { useScopeClamp } from '@/hooks/useScopeClamp';
import styles from './RootLayout.module.scss';

export default function RootLayout() {
  const { pathname } = useLocation();
  const resetDepth = useResetDepth();

  // 교육기관 계정은 담당 발전소 밖을 볼 수 없다.
  useScopeClamp();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  /*
   * 화면을 옮기면 발전소 계층에서 다시 시작한다. 파고든 인버터·스트링은 들고 다니지 않는다.
   *
   * 다만 같은 화면 안에서 뎁스만 바뀐 것은 화면 이동이 아니다 — 발전통계는 조회 뎁스를
   * 주소에 담으므로(`/energy/statistics/:plantId/:inverterId`), 경로가 바뀔 때마다 되돌리면
   * 방금 고른 인버터를 그 자리에서 뺏는다. 그래서 앞 두 마디(화면)가 바뀔 때만 되돌린다.
   */
  const screen = pathname.split('/').slice(0, 3).join('/');

  useEffect(() => {
    resetDepth();
  }, [screen, resetDepth]);

  return (
    <>
      <SkipLink />
      <Header />

      <main id="main" className={styles.main}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
        >
          <Outlet />
        </motion.div>
      </main>

      <Footer />
      <ToastViewport />
    </>
  );
}
