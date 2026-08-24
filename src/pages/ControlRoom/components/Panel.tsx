import styles from '../ControlRoom.module.scss';
import type { ReactNode } from 'react';

interface PanelProps {
  /** 판 이름 — 제목이자 보조기술이 읽는 이름이다 */
  title: string;
  /** 제목 오른쪽 한 마디. 아래 내용이 이미 말하는 것은 적지 않는다 */
  note?: ReactNode;
  /** 열에 남는 높이를 이 판이 받을지 */
  grow?: boolean;
  /** 테두리를 도는 빛으로 이 판이 스스로 돌고 있음을 알릴지 — AI 진단처럼 살아 있는 판에만 준다 */
  accent?: boolean;
  children: ReactNode;
}

/**
 * 상황판의 판 한 칸.
 *
 * 아홉 판이 모두 「테두리 + 제목 줄 + 내용」 이라는 같은 골격을 쓴다. 판마다 그 골격을 다시
 * 적으면 열여덟 줄이 되풀이되고, 제목 줄의 생김새를 고칠 때 아홉 곳을 함께 고쳐야 한다.
 *
 * 제목을 `aria-label` 로도 쓴다 — 둘을 따로 적으면 제목만 고치고 이름표는 옛말로 남는다.
 */
export function Panel({ title, note, grow, accent, children }: PanelProps) {
  const className = [
    styles.panel,
    grow ? styles.col__grow : '',
    accent ? styles['panel--accent'] : '',
  ].filter(Boolean).join(' ');

  return (
    <section className={className} aria-label={title}>
      <div className={styles.panel__head}>
        <h2 className={styles.panel__title}>{title}</h2>
        {note ? <span className={styles.panel__note}>{note}</span> : null}
      </div>
      {children}
    </section>
  );
}
