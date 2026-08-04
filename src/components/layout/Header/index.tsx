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
import { ThemeToggle } from '@/components/layout/ThemeToggle';
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
        <div className={styles.header__inner}>
          <Link to={PATH.HOME} className={styles.header__brand} aria-label="충청남도교육청 신·재생에너지 통합관리시스템 홈">
            <Logo />
          </Link>

          <Gnb />

          <div className={styles.header__utils}>
            <AccountMenu onOpenHelp={() => setIsHelpOpen(true)} />
            {/* 종 하나로 지금 올라온 알림에 바로 닿게 한다. 미조치가 있으면 점이 붙는다. */}
            <button
              type="button"
              className={styles.header__help}
              aria-label={pendingCount > 0 ? `실시간 알림 열기, 미조치 ${pendingCount}건` : '실시간 알림 열기'}
              aria-expanded={isAlertOpen}
              onClick={() => setIsAlertOpen((prev) => !prev)}
            >
              <BellIcon />
              {pendingCount > 0 ? <span className={styles.header__dot} aria-hidden /> : null}
            </button>
            <ThemeToggle />
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
