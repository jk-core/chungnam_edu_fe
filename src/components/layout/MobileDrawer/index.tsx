import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NavLink, useLocation } from 'react-router-dom';
import { CloseIcon, HelpCircleIcon } from '@/components/common/Icon';
import { useVisibleNavigation } from '@/hooks/useVisibleNavigation';
import { Logo } from '@/components/layout/Logo';
import { cn } from '@/utils/cn';
import styles from './MobileDrawer.module.scss';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** 도움말 열기 — 좁은 화면에서는 헤더 대신 여기서 연다. */
  onOpenHelp: () => void;
}

/** 태블릿·모바일 전체 메뉴. 열려 있는 동안 배경 스크롤을 막고 포커스를 가둔다. */
export function MobileDrawer({ isOpen, onClose, onOpenHelp }: MobileDrawerProps) {
  const { pathname } = useLocation();
  const navigation = useVisibleNavigation();
  const panelRef = useRef<HTMLDivElement>(null);

  /*
    닫기 콜백은 부르는 쪽에서 인라인 함수로 넘겨 렌더마다 참조가 바뀐다.
    의존성에 그대로 두면 효과가 렌더마다 다시 걸리며 포커스를 서랍으로 되돌리고,
    `previousOverflow` 도 'hidden' 으로 다시 잡혀 닫은 뒤 배경 스크롤이 풀리지 않는다.
  */
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRef.current();

        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen ? (
        // key 가 없으면 AnimatePresence 가 이 노드를 추적하지 못해 exit 이 끝나지 않는다.
        <div key="drawer" className={styles.drawer}>
          <motion.button
            type="button"
            className={styles.drawer__backdrop}
            aria-label="메뉴 닫기"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            ref={panelRef}
            className={styles.drawer__panel}
            role="dialog"
            aria-modal="true"
            aria-label="전체 메뉴"
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
          >
            <div className={styles.drawer__head}>
              <Logo compact />
              <button type="button" className={styles.drawer__close} onClick={onClose} aria-label="메뉴 닫기">
                <CloseIcon />
              </button>
            </div>

            <nav className={styles.drawer__nav} aria-label="전체 메뉴">
              {navigation.map((section, sectionIndex) => (
                <motion.div
                  key={section.path}
                  className={styles.drawer__group}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + sectionIndex * 0.06, duration: 0.32, ease: 'easeOut' }}
                >
                  <NavLink
                    to={section.children[0]?.path ?? section.path}
                    className={cn(styles.drawer__section, {
                      [styles['drawer__section--active']]: section.path === '/'
                        ? pathname === '/'
                        : pathname.startsWith(section.path),
                    })}
                    onClick={onClose}
                  >
                    {section.label}
                  </NavLink>

                  {section.children.length > 0 ? (
                    <ul className={styles.drawer__children}>
                      {section.children.map((child) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            className={cn(styles.drawer__child, {
                              [styles['drawer__child--active']]: pathname === child.path,
                            })}
                            onClick={onClose}
                          >
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </motion.div>
              ))}
            </nav>

            <button
              type="button"
              className={styles.drawer__help}
              onClick={() => {
                onClose();
                onOpenHelp();
              }}
            >
              <HelpCircleIcon width={18} height={18} />
              이 화면 도움말
            </button>

            <p className={styles.drawer__foot}>충청남도교육청 신·재생에너지 통합관리시스템</p>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
