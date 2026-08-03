import styles from './StandalonePageLayout.module.scss';
import type { ReactNode } from 'react';

interface StandalonePageLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

/**
 * 대메뉴에 속하지 않는 단독 화면의 골격.
 * 마이페이지처럼 계정 메뉴로 들어오는 화면은 LNB·조회 대상 패널 없이 본문만 둔다.
 */
export function StandalonePageLayout({ title, description, children }: StandalonePageLayoutProps) {
  return (
    <div className={styles.page}>
      <div className={styles.page__head}>
        <div className={styles.page__headInner}>
          <h1 className={styles.page__title}>{title}</h1>
          <p className={styles.page__description}>{description}</p>
        </div>
      </div>

      <div className={styles.page__body}>{children}</div>
    </div>
  );
}
