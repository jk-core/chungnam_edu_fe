import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@/components/common/Icon';
import { PATH } from '@/routes/routes';
import styles from './Breadcrumb.module.scss';

interface Crumb {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: Crumb[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className={styles.breadcrumb} aria-label="현재 위치">
      <ol className={styles.breadcrumb__list}>
        <li className={styles.breadcrumb__item}>
          <Link to={PATH.HOME} className={styles.breadcrumb__link}>
            홈
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            // 같은 이름이 두 번 오는 자리가 있다(대메뉴만 있고 소메뉴가 아직 안 잡힌 순간).
            <li key={`${item.label}-${index}`} className={styles.breadcrumb__item}>
              <ChevronRightIcon className={styles.breadcrumb__separator} />
              {item.path && !isLast ? (
                <Link to={item.path} className={styles.breadcrumb__link}>
                  {item.label}
                </Link>
              ) : (
                <span className={styles.breadcrumb__current} aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
