import { cn } from '@/utils/cn';
import styles from './Table.module.scss';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
  /** 태블릿 이하에서 숨길 열 */
  hideOnTablet?: boolean;
  render: (row: T, index: number) => ReactNode;
}

interface TableProps<T> {
  /** 스크린리더용 표 설명 */
  caption: string;
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** 특정 행을 강조할 때 쓴다. */
  getRowClassName?: (row: T) => string | undefined;
  /**
   * 줄을 눌러 들어가게 한다.
   *
   * 마우스 편의일 뿐이라 이것만 두지 않는다 — 키보드로도 닿아야 하므로 같은 일을 하는
   * 버튼을 행 안에 함께 남긴다.
   */
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T>({ caption, columns, rows, getRowKey, getRowClassName, onRowClick, className }: TableProps<T>) {
  return (
    <div className={cn(styles.wrap, { [className ?? '']: !!className })}>
      <table className={styles.table}>
        <caption className={styles.table__caption}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={{ width: column.width, textAlign: column.align ?? 'left' }}
                className={cn({ [styles['table__cell--hideTablet']]: !!column.hideOnTablet })}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={getRowKey(row)}
              className={cn({
                [getRowClassName?.(row) ?? '']: !!getRowClassName?.(row),
                [styles['table__row--clickable']]: !!onRowClick,
              })}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{ textAlign: column.align ?? 'left' }}
                  className={cn({ [styles['table__cell--hideTablet']]: !!column.hideOnTablet })}
                >
                  {column.render(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
