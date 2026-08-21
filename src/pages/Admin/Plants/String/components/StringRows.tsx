import { Button } from '@/components/common/Button';
import { FormSection, NumberField, TextField } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { MSG } from '@/configs/messages';
import { PlusIcon } from '@/components/common/Icon';
import styles from '@/pages/Admin/Admin.module.scss';

/** 한 스트링이 받을 수 있는 직렬·병렬 수 */
export const STRING_COUNT_MIN = 0;
export const STRING_COUNT_MAX = 1000;

/** 줄을 새로 만들 때의 기본 구성 */
const DEFAULT_SERIES = 18;
const DEFAULT_PARALLEL = 1;

/**
 * 편집판의 한 줄.
 * 스트링은 한 설비 안에서 함께 늘고 주는 값이라, 등록도 수정도 여러 줄을 한 판에 놓고 다룬다.
 * `id` 가 없으면 이번에 새로 만든 줄이다.
 */
export interface StringDraftRow {
  key: number;
  id: string | null;
  seq: number | '';
  name: string;
  seriesCount: number | '';
  parallelCount: number | '';
}

interface StringRowsProps {
  rows: StringDraftRow[];
  onChange: (rows: StringDraftRow[]) => void;
  errors: Record<string, string>;
  /** 이미 저장돼 있어 피해야 할 순번. 편집판이 곧 전체 목록이면 넘기지 않는다 */
  takenSeqs?: number[];
  legend: string;
  hint?: string;
  emptyNote?: string;
}

/**
 * 스트링 줄 편집판 (SFR-016-01, SFR-017-06).
 * 독립 화면(`StringSheet`)과 설비 폼 안의 「스트링 구조」 뷰가 같은 이 몸을 쓴다.
 */
export function StringRows({
  rows,
  onChange,
  errors,
  takenSeqs = [],
  legend,
  hint = '복사를 누르면 같은 구성으로 한 줄이 더 생깁니다.',
  emptyNote = '아래 버튼으로 줄을 추가해 주세요.',
}: StringRowsProps) {
  const panels = rows.reduce(
    (sum, row) => sum + Number(row.seriesCount || 0) * Number(row.parallelCount || 0),
    0,
  );

  const patchRow = (key: number, patch: Partial<StringDraftRow>) => {
    onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const addRow = (from: StringDraftRow | null) => {
    const seq = Math.max(0, ...takenSeqs, ...rows.map((row) => Number(row.seq) || 0)) + 1;
    const key = Math.max(0, ...rows.map((row) => row.key)) + 1;

    onChange([
      ...rows,
      {
        key,
        id: null,
        seq,
        name: from ? `${from.name} 복사` : `스트링 ${seq}`,
        seriesCount: from?.seriesCount ?? DEFAULT_SERIES,
        parallelCount: from?.parallelCount ?? DEFAULT_PARALLEL,
      },
    ]);
  };

  return (
    <FormSection legend={legend} hint={hint}>
      {rows.length === 0 ? (
        <p className={styles.toolbar__note}>
          {emptyNote}{errors.rows ? ` ${errors.rows}` : ''}
        </p>
      ) : (
        <div className={styles.stringList}>
          {rows.map((row) => (
            <div key={row.key} className={styles.stringRow}>
              <NumberField
                label="순번"
                value={row.seq}
                onChange={(value) => patchRow(row.key, { seq: value })}
                min={1}
                width="sm"
                error={errors[`${row.key}.seq`]}
              />
              <TextField
                label="이름"
                value={row.name}
                onChange={(value) => patchRow(row.key, { name: value })}
                width="full"
                maxLength={120}
                error={errors[`${row.key}.name`]}
              />
              <NumberField
                label="직렬"
                value={row.seriesCount}
                onChange={(value) => patchRow(row.key, { seriesCount: value })}
                min={STRING_COUNT_MIN}
                max={STRING_COUNT_MAX}
                width="sm"
                error={errors[`${row.key}.seriesCount`]}
              />
              <NumberField
                label="병렬"
                value={row.parallelCount}
                onChange={(value) => patchRow(row.key, { parallelCount: value })}
                min={STRING_COUNT_MIN}
                max={STRING_COUNT_MAX}
                width="sm"
                error={errors[`${row.key}.parallelCount`]}
              />
              <span className={styles.toolbar__actions}>
                <Button size="sm" variant="secondary" onClick={() => addRow(row)}>복사</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onChange(rows.filter((item) => item.key !== row.key))}
                >
                  빼기
                </Button>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.stringFoot}>
        <p className={styles.toolbar__note}>
          {formatNumber(rows.length)}조 · 모듈 {formatNumber(panels)}장
        </p>
        <Button variant="secondary" iconLeft={<PlusIcon />} onClick={() => addRow(null)}>줄 추가</Button>
      </div>
    </FormSection>
  );
}

/**
 * 줄마다 채워야 할 것을 본다.
 * 순번은 판 안에서도, 이미 저장된 것과도 겹치면 안 된다 — 두 소비처가 같은 규칙을 봐야 해서
 * 검사를 여기 둔다.
 */
export function validateStringRows(rows: StringDraftRow[], takenSeqs: number[] = []): Record<string, string> {
  const found: Record<string, string> = {};
  const seen = new Set(takenSeqs);

  rows.forEach((row) => {
    if (!row.name.trim()) found[`${row.key}.name`] = MSG.requiredField('이름');

    if (row.seq === '' || row.seq < 1) found[`${row.key}.seq`] = MSG.numberRange('순번', 1, 999);
    else if (seen.has(row.seq)) found[`${row.key}.seq`] = '순번이 겹칩니다.';
    else seen.add(row.seq);

    if (row.seriesCount === '' || row.seriesCount < STRING_COUNT_MIN || row.seriesCount > STRING_COUNT_MAX) {
      found[`${row.key}.seriesCount`] = MSG.numberRange('직렬', STRING_COUNT_MIN, STRING_COUNT_MAX);
    }

    if (row.parallelCount === '' || row.parallelCount < STRING_COUNT_MIN || row.parallelCount > STRING_COUNT_MAX) {
      found[`${row.key}.parallelCount`] = MSG.numberRange('병렬', STRING_COUNT_MIN, STRING_COUNT_MAX);
    }
  });

  return found;
}
