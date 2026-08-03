import { ChevronRightIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import styles from './Pagination.module.scss';

interface PaginationProps {
  page: number;
  pageCount: number;
  totalCount: number;
  onChange: (page: number) => void;
  /** 목록 이름 — 스크린리더 안내에 쓴다. */
  label: string;
}

/** 현재 페이지 주변 번호만 뽑아 낸다. 앞뒤가 잘리면 생략 표시(...)를 넣는다. */
function pageNumbers(page: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);

  const items: (number | 'gap')[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pageCount - 1, page + 1);

  if (from > 2) items.push('gap');
  for (let index = from; index <= to; index += 1) items.push(index);
  if (to < pageCount - 1) items.push('gap');
  items.push(pageCount);

  return items;
}

export function Pagination({ page, pageCount, totalCount, onChange, label }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label={`${label} 페이지 이동`}>
      <p className={styles.pagination__count}>전체 {formatNumber(totalCount)}건</p>

      <div className={styles.pagination__pages}>
        <button
          type="button"
          className={cn(styles.pagination__arrow, styles['pagination__arrow--prev'])}
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="이전 페이지"
        >
          <ChevronRightIcon />
        </button>

        {pageNumbers(page, pageCount).map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`} className={styles.pagination__gap} aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={cn(styles.pagination__page, { [styles['pagination__page--current']]: item === page })}
              onClick={() => onChange(item)}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          className={styles.pagination__arrow}
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="다음 페이지"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </nav>
  );
}
