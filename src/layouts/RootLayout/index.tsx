import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Masthead } from '@/components/layout/Masthead';
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
      {/* 정부 누리집 안내는 로고·메뉴보다 위, 화면에서 가장 먼저 닿는 곳에 선다 */}
      <Masthead />
      <Header />

      <main id="main" className={styles.main}>
        {/*
          진입 연출은 **화면이 바뀔 때만** 돈다.

          `key` 를 전체 경로로 두면 조회 뎁스가 주소에 적히는 순간에도 본문이 통째로 새로
          만들어져 연출이 다시 돈다 — 발전통계는 맨 주소로 들어오면 보고 있던 발전소를 주소에
          적어 주므로(`useScopeRoute`), 들어서자마자 두 번 떠올랐다. 인버터를 눌러 한 단
          파고들 때도 마찬가지였다. 같은 화면 안에서 대상만 좁힌 것은 화면 이동이 아니다.
        */}
        <motion.div
          key={screen}
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
