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
    // 화면을 옮기면 발전소 계층에서 다시 시작한다. 파고든 인버터·스트링은 들고 다니지 않는다.
    resetDepth();
  }, [pathname, resetDepth]);

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
