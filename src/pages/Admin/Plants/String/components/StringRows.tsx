import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/components/common/Button';
import { createFields, FormSection } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { PlusIcon } from '@/components/common/Icon';
import {
  NAME_MAX,
  STRING_COUNT_MAX,
  STRING_COUNT_MIN,
  STRING_NUMBER_MAX,
  STRING_NUMBER_MIN,
} from '@/service/string/type';
import type { StringRow, StringRowsShape } from '@/service/string/type';
import styles from '@/pages/Admin/Admin.module.scss';
import type { FieldValues } from 'react-hook-form';

/** 줄을 새로 만들 때의 기본 구성 */
const DEFAULT_SERIES = 18;
const DEFAULT_PARALLEL = 1;

/*
  편집판은 두 폼(스트링 판·설비 폼)이 함께 쓴다. 그래서 자기 폼 타입을 갖지 않고 주변 provider
  에 붙되, 그 폼이 `rows`·`takenNumbers` 두 칸을 이 이름으로 갖고 있어야 한다 (StringRowsShape).
*/
type Shape = StringRowsShape & FieldValues;

const Field = createFields<Shape>();

interface StringRowsProps {
  legend: string;
  hint?: string;
  emptyNote?: string;
}

/**
 * 스트링 줄 편집판 (SFR-016-01, SFR-017-06).
 * 독립 화면(`StringSheet`)과 설비 폼 안의 「스트링 구조」 뷰가 같은 이 몸을 쓴다.
 */
export function StringRows({
  legend,
  hint = '복사를 누르면 같은 구성으로 한 줄이 더 생깁니다.',
  emptyNote = '아래 버튼으로 줄을 추가해 주세요.',
}: StringRowsProps) {
  const { control, getValues, getFieldState, formState } = useFormContext<Shape>();
  const { fields, append, remove } = useFieldArray<Shape, 'rows'>({ control, name: 'rows' });
  const rows = useWatch({ control, name: 'rows' });

  const panels = rows.reduce(
    (sum, row) => sum + (row.moduleSerialCount || 0) * (row.moduleParallelCount || 0),
    0,
  );
  const listError = getFieldState('rows', formState).error;

  const addRow = (from?: StringRow) => {
    /*
      `fields` 는 배열을 마지막으로 건드린 시점의 스냅샷이라, 방금 고친 순번이 들어 있지 않다.
      순번을 새로 매길 때는 반드시 지금 값을 읽는다.
    */
    const current = getValues('rows');
    const stringNumber = Math.max(
      0,
      ...getValues('takenNumbers'),
      ...current.map((row) => row.stringNumber || 0),
    ) + 1;

    append({
      stringId: null,
      stringNumber,
      stringName: from ? `${from.stringName} 복사` : `스트링 ${stringNumber}`,
      moduleSerialCount: from?.moduleSerialCount ?? DEFAULT_SERIES,
      moduleParallelCount: from?.moduleParallelCount ?? DEFAULT_PARALLEL,
    });
  };

  return (
    <FormSection legend={legend} hint={hint}>
      {fields.length === 0 ? (
        <p className={styles.toolbar__note}>
          {emptyNote}{listError?.message ? ` ${listError.message}` : ''}
        </p>
      ) : (
        <div className={styles.stringList}>
          {fields.map((field, index) => (
            <div key={field.id} className={styles.stringRow}>
              <Field.Number
                label="순번"
                name={`rows.${index}.stringNumber`}
                min={STRING_NUMBER_MIN}
                max={STRING_NUMBER_MAX}
                width="sm"
              />
              <Field.Text label="이름" name={`rows.${index}.stringName`} width="full" maxLength={NAME_MAX} />
              <Field.Number
                label="직렬"
                name={`rows.${index}.moduleSerialCount`}
                min={STRING_COUNT_MIN}
                max={STRING_COUNT_MAX}
                width="sm"
              />
              <Field.Number
                label="병렬"
                name={`rows.${index}.moduleParallelCount`}
                min={STRING_COUNT_MIN}
                max={STRING_COUNT_MAX}
                width="sm"
              />
              <span className={styles.stringRow__actions}>
                <Button size="sm" variant="secondary" onClick={() => addRow(getValues(`rows.${index}`))}>복사</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(index)}>빼기</Button>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.rowFoot}>
        <p className={styles.toolbar__note}>
          {formatNumber(fields.length)}조 · 모듈 {formatNumber(panels)}장
        </p>
        <Button variant="secondary" iconLeft={<PlusIcon />} onClick={() => addRow()}>줄 추가</Button>
      </div>
    </FormSection>
  );
}
