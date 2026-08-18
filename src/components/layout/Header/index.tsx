import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ALERT_RECORDS } from '@/mocks/alerts';
import { AccountMenu } from '@/components/layout/AccountMenu';
import { Gnb } from '@/components/layout/Gnb';
import { AlertPanel } from '@/components/alert/AlertPanel';
import { HelpPanel } from '@/components/help/HelpPanel';
import { Logo } from '@/components/layout/Logo';
import { BellIcon, MenuIcon } from '@/components/common/Icon';
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { PATH } from '@/routes/routes';
import { cn } from '@/utils/cn';
import styles from './Header.module.scss';

export function Header() {
  // 헤더 종에 붙는 미조치 표시 — 화면을 옮겨도 같은 수를 본다.
  const pendingCount = ALERT_RECORDS.filter((alert) => !alert.handled).length;

  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 8);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={cn(styles.header, { [styles['header--scrolled']]: isScrolled })}>

        {/* 브랜드 줄 — 기관과 유틸리티만 선다. 길 고르는 일은 아래 주메뉴 줄이 맡는다 */}
        <div className={styles.header__inner}>
          <Link to={PATH.HOME} className={styles.header__brand} aria-label="충청남도교육청 신·재생에너지 통합관리시스템 홈">
            <Logo />
          </Link>

          <div className={styles.header__utils}>
            <AccountMenu onOpenHelp={() => setIsHelpOpen(true)} />
            {/* 종 하나로 지금 올라온 알림에 바로 닿게 한다. 미조치가 있으면 점이 붙는다. */}
            <button
              type="button"
              className={styles.header__help}
              aria-label={pendingCount > 0 ? `실시간 알림 열기, 미조치 ${pendingCount}건` : '실시간 알림 열기'}
              aria-expanded={isAlertOpen}
              // 이 버튼이 스스로 여닫으므로 바깥 클릭 닫기에서 빼 둔다.
              data-dismiss-ignore
              onClick={() => setIsAlertOpen((prev) => !prev)}
            >
              <BellIcon />
              {/*
                점 하나로는 몇 건인지도, 급한지도 알 수 없어 눈에 걸리지 않았다.
                수를 적어 두면 지나치기 어렵고, 누르기 전에 무게를 가늠할 수 있다.
              */}
              {pendingCount > 0 ? (
                <span className={styles.header__badge} aria-hidden>
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              ) : null}
            </button>

            {/* 좁은 화면에는 주메뉴 줄이 서지 않는다 — 그때는 이 단추가 길을 여는 유일한 문이다 */}
            <button
              type="button"
              className={styles.header__menu}
              aria-label="전체 메뉴 열기"
              aria-expanded={isDrawerOpen}
              onClick={() => setIsDrawerOpen(true)}
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        {/*
          주메뉴 줄.

          전체메뉴 단추를 두지 않는다 — 이 줄은 넓은 화면에만 서고, 그때는 1뎁스가 이미 다 보여
          단추가 여는 것과 같은 것을 두 번 내놓게 된다. 좁은 화면에서는 이 줄이 통째로 사라지고
          위 유틸리티 줄의 단추가 유일한 문이 된다.
        */}
        <Gnb />
      </header>

      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />
      <HelpPanel isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <AlertPanel isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} />
    </>
  );
}
