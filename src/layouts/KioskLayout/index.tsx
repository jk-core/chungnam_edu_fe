import { TODAY } from '@/mocks/today';
import styles from './KioskLayout.module.scss';
import type { ReactNode } from 'react';

interface KioskLayoutProps {
  title: string;
  lead: string;
  children: ReactNode;
}

/**
 * 교육용 대시보드 골격 (SFR-005).
 * 모니터에 걸어 두고 조작 없이 돌리는 화면이라 헤더·LNB·푸터를 전부 뺀다.
 */
export function KioskLayout({ title, lead, children }: KioskLayoutProps) {
  return (
    <div className={styles.kiosk}>
      <header className={styles.kiosk__head}>
        <div>
          <h1 className={styles.kiosk__title}>{title}</h1>
          <p className={styles.kiosk__lead}>{lead}</p>
        </div>
        <p className={styles.kiosk__stamp}>
          충청남도교육청 신·재생에너지 통합관리시스템
          <br />
          {TODAY.format('YYYY년 M월 D일')} 기준
        </p>
      </header>

      <div className={styles.kiosk__body}>{children}</div>
    </div>
  );
}
