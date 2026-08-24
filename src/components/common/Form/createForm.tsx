import { useId, useState } from 'react';
import { Controller, FormProvider, useFormContext, useWatch } from 'react-hook-form';
import dayjs from 'dayjs';
import { Button } from '@/components/common/Button';
import { DatePicker } from '@/components/common/DatePicker';
import { describedBy, FormField } from '@/components/common/Form/FormField';
import { NumberField, PasswordField, TextArea, TextField } from '@/components/common/Form/fields';
import { PickerField } from '@/components/common/RecordPicker';
import { RadioGroup } from '@/components/common/Form/RadioGroup';
import { Select } from '@/components/common/Select';
import type { FieldWidth, ImeMode } from '@/components/common/Form/FormField';
import type { RadioOption } from '@/components/common/Form/RadioGroup';
import type { Granularity } from '@/utils/date';
import type { FieldPath, FieldPathByValue, FieldValues, PathValue, UseFormReturn } from 'react-hook-form';
import type { ReactNode } from 'react';

/*
  폼 한 벌 만들기.

  `createForm<Values>()` 을 **파일 모듈 스코프에서 한 번** 부르고 그 결과를 쓴다. 컴포넌트 안에서
  부르면 렌더마다 필드 컴포넌트가 새로 정의돼 입력이 통째로 리마운트된다.

  기존 입력 프리미티브(fields.tsx·RadioGroup·Select·PickerField)는 ref 를 넘기지 않고 `name`·
  `onBlur` 도 받지 않아 `register()` 가 붙을 자리가 없다 — 전부 `Controller` 로 잇는다.
*/

interface FieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  hint?: string;
  placeholder?: string;
}

interface RootProps<T extends FieldValues> {
  methods: UseFormReturn<T>;
  onSubmit: (values: T) => void;
  children: ReactNode;
}

export function createFields<T extends FieldValues>() {
  function useFieldError(name: FieldPath<T>) {
    const { getFieldState, formState } = useFormContext<T>();

    return getFieldState(name, formState).error?.message;
  }

  function Text({
    name,
    transform,
    ime,
    width,
    maxLength,
    readOnly,
    ...rest
  }: FieldProps & {
    name: FieldPathByValue<T, string>;
    /** 적는 대로 값을 다듬는다 — 연락처 하이픈이 이 자리다 */
    transform?: (value: string) => string;
    ime?: ImeMode;
    width?: FieldWidth;
    maxLength?: number;
    readOnly?: boolean;
  }) {
    const { control } = useFormContext<T>();
    const error = useFieldError(name);

    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <TextField
            {...rest}
            value={field.value}
            onChange={(next) => field.onChange(transform ? transform(next) : next)}
            ime={ime}
            width={width}
            maxLength={maxLength}
            readOnly={readOnly}
            error={error}
          />
        )}
      />
    );
  }

  function Area({ name, maxLength, ...rest }: FieldProps & { name: FieldPathByValue<T, string>; maxLength?: number }) {
    const { control } = useFormContext<T>();
    const error = useFieldError(name);

    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <TextArea {...rest} value={field.value} onChange={field.onChange} maxLength={maxLength} error={error} />
        )}
      />
    );
  }

  function Password({ name, width, ...rest }: FieldProps & { name: FieldPathByValue<T, string>; width?: FieldWidth }) {
    const { control } = useFormContext<T>();
    const error = useFieldError(name);

    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <PasswordField {...rest} value={field.value} onChange={field.onChange} width={width} error={error} />
        )}
      />
    );
  }

  /**
   * 숫자 칸.
   *
   * 폼 값은 언제나 `number` 다 — 빈 칸은 `NaN`(서버가 null 을 받는 칸만 `emptyValue={null}`).
   * `NaN` 을 그대로 input 에 넘기면 React 가 경고하므로 화면에 나갈 때만 빈 문자열로 되돌린다.
   */
  function Num({
    name,
    emptyValue = Number.NaN,
    min,
    max,
    step,
    unit,
    readOnly,
    width,
    ...rest
  }: FieldProps & {
    name: FieldPathByValue<T, number> | FieldPathByValue<T, number | null>;
    emptyValue?: number | null;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    readOnly?: boolean;
    width?: FieldWidth;
  }) {
    const { control } = useFormContext<T>();
    const error = useFieldError(name);

    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <NumberField
            {...rest}
            value={field.value === null || Number.isNaN(field.value) ? '' : (field.value as number)}
            onChange={(next) => field.onChange(next === '' ? emptyValue : next)}
            min={min}
            max={max}
            step={step}
            unit={unit}
            readOnly={readOnly}
            width={width}
            error={error}
          />
        )}
      />
    );
  }

  /**
   * 달력에서 고르는 날짜 칸.
   * 폼이 담는 값은 `YYYY-MM-DD` 문자열이다 — 그대로 서버로 나가고 비교·정렬도 이 형태로 한다.
   */
  function DateField({
    name,
    granularity = 'day',
    label,
    ...rest
  }: FieldProps & {
    name: FieldPathByValue<T, string>;
    granularity?: Granularity;
  }) {
    const { control } = useFormContext<T>();
    const id = useId();
    const error = useFieldError(name);

    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <FormField {...rest} label={label} htmlFor={id} error={error}>
            <DatePicker
              id={id}
              asField
              label={label}
              granularity={granularity}
              value={field.value ? dayjs(field.value).toDate() : null}
              onChange={(next) => field.onChange(dayjs(next).format('YYYY-MM-DD'))}
              placeholder={rest.placeholder}
              disabled={rest.disabled}
              invalid={Boolean(error)}
              describedBy={describedBy(id, rest.hint, error)}
            />
          </FormField>
        )}
      />
    );
  }

  function Pick<V extends string>({
    name,
    options,
    label,
    required,
    hint,
  }: {
    name: FieldPathByValue<T, V>;
    options: { value: V; label: string }[];
    label: string;
    required?: boolean;
    hint?: string;
  }) {
    const { control } = useFormContext<T>();
    const error = useFieldError(name);

    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            asField
            label={label}
            required={required}
            hint={hint}
            error={error}
            value={field.value as V}
            options={options}
            onChange={field.onChange}
          />
        )}
      />
    );
  }

  function Radio<V extends string>({
    name,
    options,
    label,
    required,
    inline,
  }: {
    name: FieldPathByValue<T, V>;
    options: RadioOption<V>[];
    label: string;
    required?: boolean;
    inline?: boolean;
  }) {
    const { control } = useFormContext<T>();
    const error = useFieldError(name);

    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <RadioGroup
            legend={label}
            value={field.value as V}
            options={options}
            onChange={field.onChange}
            required={required}
            inline={inline}
            error={error}
          />
        )}
      />
    );
  }

  /**
   * 표에서 골라 오는 칸.
   *
   * 화면에 보일 이름은 `displayName` 이 가리키는 칸이 들고 있다 — 목록을 다시 뒤져 이름을 찾지
   * 않아도 되고, 고를 때 딸려 바뀌는 칸(주소 → 시·군, 사용자 → 발전소 비우기)을 `patch` 하나로
   * 함께 넘길 수 있다.
   */
  function Picker({
    name,
    displayName,
    modal,
    ...rest
  }: FieldProps & {
    name: FieldPath<T>;
    /** 보일 이름을 담은 칸. 값이 곧 이름이면(주소) `name` 을 그대로 준다 */
    displayName: FieldPathByValue<T, string>;
    placeholder: string;
    modal: (props: { onSelect: (patch: Partial<T>) => void; onClose: () => void }) => ReactNode;
  }) {
    const { control, setValue } = useFormContext<T>();
    const [isOpen, setIsOpen] = useState(false);
    const display = useWatch({ control, name: displayName });
    const error = useFieldError(name);

    const patch = (next: Partial<T>) => {
      Object.entries(next).forEach(([field, value]) => {
        // 고른 순간 스키마를 다시 돌린다 — 문맥(등급·이미 쓴 순번)이 값에 실려 있어 같은 틱에 판정돼야 한다.
        setValue(field as FieldPath<T>, value as PathValue<T, FieldPath<T>>, {
          shouldValidate: true,
          shouldDirty: true,
        });
      });
    };

    return (
      <>
        <PickerField {...rest} value={String(display ?? '')} onOpen={() => setIsOpen(true)} error={error} />
        {isOpen
          ? modal({
            onClose: () => setIsOpen(false),
            onSelect: (next) => {
              patch(next);
              setIsOpen(false);
            },
          })
          : null}
      </>
    );
  }

  function Submit({ children = '저장' }: { children?: ReactNode }) {
    const { formState } = useFormContext<T>();

    return (
      <Button type="submit" disabled={!formState.isValid}>
        {children}
      </Button>
    );
  }

  return { Text, Area, Password, Number: Num, Date: DateField, Select: Pick, Radio, Picker, Submit };
}

export function createForm<T extends FieldValues>() {
  function Root({ methods, onSubmit, children }: RootProps<T>) {
    const submit = methods.handleSubmit(onSubmit);

    return (
      <FormProvider {...methods}>
        <form
          noValidate
          onSubmit={(event) => {
            // 막는 일부터 한다 — 걸러 내고 돌아가더라도 브라우저가 페이지를 새로 부르면 안 된다.
            event.preventDefault();

            /*
              검색기·주소창의 작은 폼은 Modal 의 포털 안에 있어도 React 트리를 타고 여기까지
              올라온다. 우리 폼이 낸 제출만 받는다 — 안 그러면 검색 엔터가 저장 확인창을 연다.
            */
            if (event.target !== event.currentTarget) return;

            void submit(event);
          }}
        >
          {children}
        </form>
      </FormProvider>
    );
  }

  return Object.assign(Root, createFields<T>());
}
