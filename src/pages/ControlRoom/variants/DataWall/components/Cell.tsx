import styles from '../DataWall.module.scss';
import type { ReactNode } from 'react';

interface CellProps {
  title: string;
  note?: string;
  /** 지도처럼 한 칸으로는 읽히지 않는 것만 두 칸을 쓴다 */
  wide?: boolean;
  children: ReactNode;
}

/** 벽을 이루는 판 하나. 크기가 같아야 벽이므로 바깥에서 크기를 정하지 않는다 */
export function Cell({ title, note, wide, children }: CellProps) {
  return (
    <section className={wide ? `${styles.cell} ${styles['cell--wide']}` : styles.cell} aria-label={title}>
      <header className={styles.cell__head}>
        <h2 className={styles.cell__title}>{title}</h2>
        {note ? <span className={styles.cell__note}>{note}</span> : null}
      </header>

      <div className={styles.cell__body}>{children}</div>
    </section>
  );
}
