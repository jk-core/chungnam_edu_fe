import { useId, useState } from 'react';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { FormField, TextField } from '@/components/common/Form';
import { SearchIcon } from '@/components/common/Icon';
import { Table } from '@/components/common/Table';
import type { Column } from '@/components/common/Table';
import styles from './RecordPicker.module.scss';

interface PickerFieldProps {
  label: string;
  /** 고른 것의 표시 이름. 비어 있으면 안내 문구가 대신 선다 */
  value: string;
  placeholder: string;
  onOpen: () => void;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
}

/**
 * 폼 쪽 짝 — 고른 값을 보여 주고 누르면 검색기를 연다.
 * 칸 전체가 곧 버튼이라 값이 길어도 누를 자리를 찾을 필요가 없다.
 */
export function PickerField({
  label,
  value,
  placeholder,
  onOpen,
  required,
  optional,
  disabled,
  hint,
  error,
}: PickerFieldProps) {
  const id = useId();

  return (
    <FormField label={label} htmlFor={id} required={required} optional={optional} hint={hint} error={error}>
      <button
        id={id}
        type="button"
        className={cn(styles.pickerField, {
          [styles['pickerField--empty']]: !value,
          [styles['pickerField--invalid']]: !!error,
        })}
        onClick={onOpen}
        disabled={disabled}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      >
        <span className={styles.pickerField__value}>{value || placeholder}</span>
        <SearchIcon className={styles.pickerField__icon} />
      </button>
    </FormField>
  );
}

interface RecordPickerProps<T> {
  columns: Column<T>[];
  /** 고를 수 있는 전체 목록. 거르기와 쪽 나눔은 안에서 한다 */
  rows: T[];
  getRowKey: (row: T) => string;
  /** 검색어에 걸리는 줄인지 */
  match: (row: T, keyword: string) => boolean;
  caption: string;
  placeholder: string;
  /** 지금 고른 값의 키. 그 줄을 강조해 어디서 이어 가는지 알린다 */
  selectedKey?: string;
  onPick: (row: T) => void;
  emptyTitle?: string;
}

/**
 * 표에서 골라 오는 검색기.
 *
 * 발전소·사용자·설비·모듈·인버터가 모두 이것 하나를 쓴다 — 셋 이상이 드롭다운으로는 감당이
 * 안 되는 길이라 표와 쪽 나눔이 필요하고, 목록마다 따로 짜면 검색 규칙이 제각각이 된다.
 * 모달 위에 겹쳐 띄우지 않고 편집 창 안에서 폼과 자리를 바꿔 쓴다.
 */
export function RecordPicker<T>({
  columns,
  rows,
  getRowKey,
  match,
  caption,
  placeholder,
  selectedKey,
  onPick,
  emptyTitle = '조건에 맞는 항목이 없습니다',
}: RecordPickerProps<T>) {
  const [draft, setDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const found = keyword ? rows.filter((row) => match(row, keyword)) : rows;
  const pageCount = Math.max(1, Math.ceil(found.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = found.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className={styles.picker}>
      <form
        className={styles.picker__search}
        onSubmit={(event) => {
          event.preventDefault();
          setKeyword(draft.trim());
          setPage(1);
        }}
      >
        <TextField
          label={placeholder}
          hideLabel
          value={draft}
          onChange={setDraft}
          placeholder={placeholder}
          width="md"
        />
        <Button type="submit" variant="secondary" iconLeft={<SearchIcon />}>검색</Button>
      </form>

      {found.length === 0 ? (
        <EmptyState title={emptyTitle} description="검색어를 지우거나 다른 말로 찾아보세요." />
      ) : (
        <>
          <Table
            caption={caption}
            columns={[
              ...columns,
              {
                key: 'pick',
                header: '선택',
                width: '90px',
                align: 'center',
                render: (row: T) => (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(event) => {
                      // 줄 자체도 고르는 자리라, 버튼까지 타고 올라가면 같은 값을 두 번 집는다.
                      event.stopPropagation();
                      onPick(row);
                    }}
                  >
                    선택
                  </Button>
                ),
              },
            ]}
            rows={pageRows}
            getRowKey={getRowKey}
            getRowClassName={(row) => (getRowKey(row) === selectedKey ? styles['picker__row--current'] : undefined)}
            onRowClick={onPick}
          />
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            totalCount={found.length}
            onChange={setPage}
            label={caption}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}
