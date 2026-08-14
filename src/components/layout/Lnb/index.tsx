import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import type { NavSection } from '@/configs/navigation';
import styles from './Lnb.module.scss';

interface LnbProps {
  section: NavSection;
}

/**
 * 홈이 아닌 페이지의 좌측 로컬 내비게이션.
 * 900px 이하에서는 콘텐츠 위 가로 스크롤 탭으로 형태를 바꾼다.
 *
 * 지금 있는 곳의 판단은 라우터에게 맡긴다. 여기서 주소를 따로 견주면 `발전통계` 처럼
 * 아래로 뎁스가 더 붙는 화면에서 라우터와 답이 갈린다 — 라우터는 앞자락만 맞아도 켜진 것으로
 * 보지만 이쪽은 정확히 같아야 켠다. 그러면 발전소를 고른 순간 표시가 꺼져 버린다.
 */
export function Lnb({ section }: LnbProps) {
  return (
    <nav className={styles.lnb} aria-label={`${section.label} 하위 메뉴`}>
      <p className={styles.lnb__title}>{section.label}</p>

      <ul className={styles.lnb__list}>
        {section.children.map((child) => (
          <li key={child.path} className={styles.lnb__item}>
            <NavLink
              to={child.path}
              className={({ isActive }) => cn(styles.lnb__link, {
                [styles['lnb__link--active']]: isActive,
              })}
            >
              <span className={styles.lnb__label}>{child.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
