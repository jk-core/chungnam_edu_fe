import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AccountMenu } from '@/components/layout/AccountMenu';
import { Gnb } from '@/components/layout/Gnb';
import { HelpPanel } from '@/components/help/HelpPanel';
import { Logo } from '@/components/layout/Logo';
import { HelpCircleIcon, MenuIcon } from '@/components/common/Icon';
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { PATH } from '@/routes/routes';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { cn } from '@/utils/cn';
import styles from './Header.module.scss';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 8);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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
            <AccountMenu />
            <button
              type="button"
              className={styles.header__help}
              aria-label="이 화면 도움말 열기"
              aria-expanded={isHelpOpen}
              onClick={() => setIsHelpOpen((prev) => !prev)}
            >
              <HelpCircleIcon />
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
    </>
  );
}
