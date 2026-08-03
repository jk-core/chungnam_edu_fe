import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NavLink, useLocation } from 'react-router-dom';
import { findSection } from '@/configs/navigation';
import { cn } from '@/utils/cn';
import { useVisibleNavigation } from '@/hooks/useVisibleNavigation';
import styles from './Gnb.module.scss';

/** 데스크톱 주 메뉴. 하위 메뉴가 있는 항목은 마우스를 올리면 펼쳐진다. */
export function Gnb() {
  const { pathname } = useLocation();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const activeSection = findSection(pathname);
  const navigation = useVisibleNavigation();

  return (
    <nav className={styles.gnb} aria-label="주 메뉴">
      <ul className={styles.gnb__list}>
        {navigation.map((section) => {
          const isActive = activeSection?.path === section.path;
          const isOpen = openPath === section.path && section.children.length > 0;

          return (
            <li
              key={section.path}
              className={styles.gnb__item}
              onMouseEnter={() => setOpenPath(section.path)}
              onMouseLeave={() => setOpenPath(null)}
              onFocus={() => setOpenPath(section.path)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpenPath(null);
              }}
            >
              <NavLink
                to={section.children[0]?.path ?? section.path}
                className={cn(styles.gnb__link, { [styles['gnb__link--active']]: isActive })}
                aria-current={isActive ? 'page' : undefined}
              >
                {section.label}
                {isActive ? (
                  <motion.span layoutId="gnb-underline" className={styles.gnb__underline} transition={SPRING} />
                ) : null}
              </NavLink>

              <AnimatePresence>
                {isOpen ? (
                  <motion.div
                    className={styles.gnb__panel}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    <ul className={styles.gnb__panelList}>
                      {section.children.map((child) => (
                        <li key={child.path}>
                          <NavLink to={child.path} className={styles.gnb__panelLink}>
                            <span className={styles.gnb__panelLabel}>{child.label}</span>
                            <span className={styles.gnb__panelDescription}>{child.description}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const SPRING = { type: 'spring', stiffness: 420, damping: 36 } as const;
