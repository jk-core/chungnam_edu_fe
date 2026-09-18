import { ChevronRightIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { Select } from '@/components/common/Select';
import styles from './Pagination.module.scss';

/** 목록에서 고를 수 있는 쪽당 개수 */
export const PAGE_SIZE_OPTIONS = [10, 20, 30];

/** 관리 목록의 기본 쪽당 개수 */
export const DEFAULT_PAGE_SIZE = 20;

interface PaginationProps {
  page: number;
  pageCount: number;
  totalCount: number;
  onChange: (page: number) => void;
  /** 목록 이름 — 스크린리더 안내에 쓴다. */
  label: string;
  /** 쪽당 개수를 고를 수 있게 하려면 함께 넘긴다 */
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
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

export function Pagination({
  page,
  pageCount,
  totalCount,
  onChange,
  label,
  pageSize,
  onPageSizeChange,
}: PaginationProps) {
  /*
    한 쪽짜리여도 숨지 않는다.

    옆에 붙은 「전체 N건」이 함께 사라져, 조건을 좁혀 한 쪽이 된 순간 몇 건인지 알 길이 없어진다.
    목록이 있는 자리에 목록의 크기가 늘 적혀 있어야 좁힌 결과를 읽을 수 있다.
    아예 보이지 않아야 하는 자리(조회 대상을 아직 고르지 않았을 때)는 부르는 쪽이 가린다.
  */
  const count = Math.max(1, pageCount);

  return (
    <nav className={styles.pagination} aria-label={`${label} 페이지 이동`}>
      <div className={styles.pagination__left}>
        <p className={styles.pagination__count}>전체 {formatNumber(totalCount)}건</p>

        {onPageSizeChange && pageSize !== undefined ? (
          <Select
            label="쪽당 개수"
            hideLabel
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            options={PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: `${size}개씩` }))}
            className={styles.pagination__size}
          />
        ) : null}
      </div>

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

        {pageNumbers(page, count).map((item, index) =>
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
          disabled={page >= count}
          aria-label="다음 페이지"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </nav>
  );
}
