import { ErrorBoundary } from '@/components/common/ErrorBoundary';
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
      {/*
        판 하나가 죽어도 나머지가 살아 있게 한다.

        여기 한 곳에서 감싸는 까닭은 이 컴포넌트가 **모든 판의 공통 관문**이기 때문이다 —
        시안마다 배치는 달라도 판은 전부 이것을 통과하므로, 판마다 따로 감싸면 새 판을 세울
        때 빠뜨리는 자리가 생긴다. 이름표(`title`)를 그대로 물려 어느 판이 죽었는지 적는다.
      */}
      <ErrorBoundary label={title}>{children}</ErrorBoundary>
    </section>
  );
}
