import { formatNumber } from '@/utils/format';
import { cn } from '@/utils/cn';
import styles from './PagerBar.module.scss';
import type { CSSProperties } from 'react';

interface PagerBarProps {
  page: number;
  pageCount: number;
  /** 쪽이 넘어갈 때마다 바뀌는 값 — 진행 막대를 되감는다 */
  turnKey: number;
  /** 한 쪽이 머무는 시간(ms) */
  intervalMs: number;
  /** 전체 항목 수 */
  total: number;
}

/**
 * 자동으로 넘어가는 목록의 쪽 표시 (SFR-004).
 * 스크롤바가 없는 화면이라 "지금 어디를 보고 있고 얼마나 더 있는지" 를 여기서만 알 수 있다.
 */
export function PagerBar({ page, pageCount, turnKey, intervalMs, total }: PagerBarProps) {
  if (pageCount <= 1) {
    return (
      <p className={styles.pager}>
        <span className={styles.pager__count}>전체 {formatNumber(total)}건</span>
      </p>
    );
  }

  return (
    <p className={styles.pager}>
      <span className={styles.pager__count}>
        전체 {formatNumber(total)}건 · {page + 1} / {pageCount}
      </span>

      <span className={styles.pager__dots} aria-hidden="true">
        {Array.from({ length: pageCount }, (_, index) => (
          <span
            // 활성 칸은 넘어갈 때마다 다시 만들어야 막대가 처음부터 차오른다
            key={index === page ? `active-${turnKey}` : `idle-${index}`}
            className={cn(styles.pager__dot, { [styles['pager__dot--active']]: index === page })}
            style={index === page ? ({ '--page-ms': `${intervalMs}ms` } as CSSProperties) : undefined}
          />
        ))}
      </span>
    </p>
  );
}
