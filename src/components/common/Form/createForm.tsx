import { useState } from 'react';
import { Controller, FormProvider, useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/components/common/Button';
import type { Granularity } from '@/utils/date';
import type { ImeMode } from '@/utils/ime';
import { DateControl } from './controls/DateControl';
import { FormField } from './FormField';
import { NumberControl } from './controls/NumberControl';
import { PasswordControl } from './controls/PasswordControl';
import { PickerControl } from './controls/PickerControl';
import { RadioControl } from './controls/RadioControl';
import { SelectControl } from './controls/SelectControl';
import { TextAreaControl } from './controls/TextAreaControl';
import { TextControl } from './controls/TextControl';
import { withUnit } from './controls/shared';
import type { FieldWidth } from './controls/shared';
import type { RadioOption } from './controls/RadioControl';
import type { FieldPath, FieldPathByValue, FieldValues, PathValue, UseFormReturn } from 'react-hook-form';
import type { ReactNode } from 'react';

/*
  `createForm<Values>()` 을 **파일 모듈 스코프에서 한 번** 부르고 그 결과를 쓴다. 컴포넌트 안에서
  부르면 렌더마다 필드 컴포넌트가 새로 정의돼 입력이 통째로 리마운트된다.

  컨트롤은 ref 를 받지 않고 `name`·`onBlur` 도 모르므로 `register()` 가 붙을 자리가 없다 —
  전부 `Controller` 로 잇는다.
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
    label,
    required,
    optional,
    hint,
    hideLabel,
    transform,
    ...control
  }: FieldProps & {
    name: FieldPathByValue<T, string>;
    /** 적는 대로 값을 다듬는다 — 연락처 하이픈이 이 자리다 */
    transform?: (value: string) => string;
    /** 바깥 제목이 이미 같은 말을 하고 있을 때 */
    hideLabel?: boolean;
    ime?: ImeMode;
    width?: FieldWidth;
    maxLength?: number;
    readOnly?: boolean;
  }) {
    const { control: form } = useFormContext<T>();
    const error = useFieldError(name);

    return (
      <Controller
        name={name}
        control={form}
        render={({ field }) => (
          <FormField
            label={label}
            required={required}
            optional={optional}
            hint={hint}
            hideLabel={hideLabel}
            error={error}
          >
            <TextControl
              {...control}
              value={field.value}
              onChange={(next) => field.onChange(transform ? transform(next) : next)}
            />
          </FormField>
        )}
      />
    );
  }

  function Area({
    name,
    label,
    required,
    optional,
    hint,
    ...control
  }: FieldProps & { name: FieldPathByValue<T, string>; maxLength?: number }) {
    const { control: form } = useFormContext<T>();
    const error = useFieldError(name);

    return (
      <Controller
        name={name}
        control={form}
        render={({ field }) => (
          <FormField label={label} required={required} optional={optional} hint={hint} error={error}>
            <TextAreaControl {...control} value={field.value} onChange={field.onChange} />
          </FormField>
        )}
      />
    );
  }

  function Password({
    name,
    label,
    required,
    optional,
    hint,
    ...control
  }: FieldProps & { name: FieldPathByValue<T, string>; width?: FieldWidth }) {
    const { control: form } = useFormContext<T>();
    const error = useFieldError(name);

    return (
      <Controller
        name={name}
        control={form}
        render={({ field }) => (
          <FormField label={label} required={required} optional={optional} hint={hint} error={error}>
            <PasswordControl {...control} value={field.value} onChange={field.onChange} />
          </FormField>
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
    label,
    required,
    optional,
    hint,
    unit,
    emptyValue = Number.NaN,
    ...control
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
    const { control: form } = useFormContext<T>();
    const error = useFieldError(name);

    return (
      <Controller
        name={name}
        control={form}
        render={({ field }) => (
          <FormField label={label} required={required} optional={optional} hint={withUnit(hint, unit)} error={error}>
            <NumberControl
              {...control}
              value={field.value === null || Number.isNaN(field.value) ? '' : (field.value as number)}
              onChange={(next) => field.onChange(next === '' ? emptyValue : next)}
            />
          </FormField>
        )}
      />
    );
  }

  function DateField({
    name,
    label,
    required,
    optional,
    hint,
    ...control
  }: FieldProps & {
    name: FieldPathByValue<T, string>;
    granularity?: Granularity;
  }) {
    const { control: form } = useFormContext<T>();
    const error = useFieldError(name);

    return (
      <Controller
        name={name}
        control={form}
        render={({ field }) => (
          <FormField label={label} required={required} optional={optional} hint={hint} error={error}>
            <DateControl {...control} value={field.value} onChange={field.onChange} />
          </FormField>
        )}
      />
    );
  }

  function Pick<V extends string | number | boolean>({
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
          <FormField label={label} required={required} hint={hint} error={error}>
            <SelectControl value={field.value as V} options={options} onChange={field.onChange} />
          </FormField>
        )}
      />
    );
  }

  function Radio<V extends string | number | boolean>({
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
          <FormField as="fieldset" label={label} required={required} error={error}>
            <RadioControl
              value={field.value as V}
              options={options}
              onChange={field.onChange}
              required={required}
              inline={inline}
            />
          </FormField>
        )}
      />
    );
  }

  /**
   * 보일 이름을 `displayName` 칸이 들고 있어 목록을 다시 뒤지지 않는다. 고를 때 딸려 바뀌는
   * 칸(주소 → 시·군, 사용자 → 발전소 비우기)도 `onSelect` 한 번에 함께 넘어온다.
   */
  function Picker({
    name,
    displayName,
    modal,
    label,
    required,
    optional,
    hint,
    disabled,
    placeholder,
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

    return (
      <>
        {/* 검색기는 껍데기 밖에 둔다 — FormField 는 컨트롤 하나를 감싸 거기에 id·aria 를 꽂는다. */}
        <FormField label={label} required={required} optional={optional} hint={hint} error={error}>
          <PickerControl
            value={String(display ?? '')}
            placeholder={placeholder}
            disabled={disabled}
            isOpen={isOpen}
            onOpen={() => setIsOpen(true)}
          />
        </FormField>
        {isOpen
          ? modal({
            onClose: () => setIsOpen(false),
            onSelect: (next) => {
              Object.entries(next).forEach(([field, value]) => {
                // 문맥(등급·이미 쓴 순번)이 값에 실려 있어 고른 순간 같은 틱에 다시 판정돼야 한다.
                setValue(field as FieldPath<T>, value as PathValue<T, FieldPath<T>>, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              });
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
    return (
      <FormProvider {...methods}>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();

            /*
              검색기·주소창의 작은 폼은 Modal 의 포털 안에 있어도 React 트리를 타고 여기까지
              올라온다. 우리 폼이 낸 제출만 받는다 — 안 그러면 검색 엔터가 저장 확인창을 연다.
            */
            if (event.target !== event.currentTarget) return;

            void methods.handleSubmit(onSubmit)(event);
          }}
        >
          {children}
        </form>
      </FormProvider>
    );
  }

  return Object.assign(Root, createFields<T>());
}
