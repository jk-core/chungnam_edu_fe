import { cn } from '@/utils/cn';
import styles from './Report.module.scss';
import type { ReactNode } from 'react';

interface ReportPageProps {
  /** 머리글 왼쪽 — 보고서 이름과 대상 */
  title: string;
  /** 머리글 오른쪽 — 조회 기간 */
  period: string;
  /** 이 장의 소제목 */
  heading: string;
  /** 제목 옆 이름표 — 세부 진단은 어느 인버터 것인지 붙인다 */
  badge?: string;
  /** 표와 글만 있는 장은 블록을 위아래로 퍼뜨려 지면을 채운다 */
  spread?: boolean;
  /** 쪽번호 (1부터) */
  page: number;
  total: number;
  children: ReactNode;
}

/**
 * 보고서 한 장 (SFR-019-05, SFR-020-05).
 *
 * A4 한 장 크기를 픽셀로 못박는다 — 화면에서 본 자리와 종이에 찍힌 자리가 같아야
 * 어느 장에 무엇이 실리는지 미리 알 수 있다. 210×297mm 를 5px/mm 로 환산했다.
 * 장마다 같은 머리글과 쪽번호를 달아, 떼어 내도 어느 보고서의 몇 쪽인지 남게 한다.
 */
export function ReportPage({ title, period, heading, badge, spread, page, total, children }: ReportPageProps) {
  return (
    <article className={cn(styles.page, 'report-page')} data-page={page}>
      <header className={styles.page__head}>
        <span className={styles.page__title}>{title}</span>
        <span className={styles.page__period}>{period}</span>
      </header>

      <h3 className={styles.page__heading}>
        {heading}
        {badge ? <span className={styles.page__badge}>{badge}</span> : null}
      </h3>

      <div className={cn(styles.page__body, { [styles['page__body--spread']]: spread })}>{children}</div>

      <footer className={styles.page__foot}>
        <span>충청남도교육청 신·재생에너지 통합관리시스템</span>
        <span className={styles.page__no}>- {page} / {total} -</span>
      </footer>
    </article>
  );
}
