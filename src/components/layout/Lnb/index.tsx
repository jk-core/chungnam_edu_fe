import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import type { NavSection } from '@/configs/navigation';
import styles from './Lnb.module.scss';

interface LnbProps {
  section: NavSection;
  currentPath: string;
}

/**
 * 홈이 아닌 페이지의 좌측 로컬 내비게이션.
 * 900px 이하에서는 콘텐츠 위 가로 스크롤 탭으로 형태를 바꾼다.
 */
export function Lnb({ section, currentPath }: LnbProps) {
  return (
    <nav className={styles.lnb} aria-label={`${section.label} 하위 메뉴`}>
      <p className={styles.lnb__title}>{section.label}</p>

      <ul className={styles.lnb__list}>
        {section.children.map((child) => {
          const isActive = child.path === currentPath;

          return (
            <li key={child.path} className={styles.lnb__item}>
              <NavLink
                to={child.path}
                className={cn(styles.lnb__link, { [styles['lnb__link--active']]: isActive })}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive ? (
                  <motion.span
                    layoutId="lnb-active"
                    className={styles.lnb__marker}
                    transition={{ type: 'spring', stiffness: 460, damping: 38 }}
                  />
                ) : null}
                <span className={styles.lnb__label}>{child.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
