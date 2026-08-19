import { useId } from 'react';
import { CheckIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import styles from './Form.module.scss';

/** 선택지에 상태색을 입힐 때 쓴다. 점검 결과 3지가 대표 예다. */
export type OptionTone = 'brand' | 'ok' | 'critical' | 'offline';

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  tone?: OptionTone;
}

interface RadioGroupProps<T extends string> {
  legend: string;
  value: T | null;
  options: RadioOption<T>[];
  onChange: (value: T) => void;
  required?: boolean;
  inline?: boolean;
  error?: string;
}

/** 점검 체크리스트 기본 3지 (SFR-021-02) */
/** 점검 결과 — 표준 체크리스트가 쓰는 「양호 / 미흡」 에 「해당없음」 을 더한 셋 (SFR-021-02) */
export const CHECK_OPTIONS: RadioOption<'normal' | 'abnormal' | 'na'>[] = [
  { value: 'normal', label: '양호', tone: 'ok' },
  { value: 'abnormal', label: '미흡', tone: 'critical' },
  { value: 'na', label: '해당없음', tone: 'offline' },
];

export function RadioGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
  required,
  inline = true,
  error,
}: RadioGroupProps<T>) {
  const name = useId();

  return (
    <fieldset className={cn(styles.group, { [styles['group--inline']]: inline })}>
      <legend className={styles.group__legend}>
        {legend}
        {required ? (
          <span className={styles.field__required} aria-hidden="true">
            *
          </span>
        ) : null}
      </legend>

      <div className={styles.group__list}>
        {options.map((option) => {
          const isChecked = option.value === value;

          return (
            <label
              key={option.value}
              className={cn(styles.option, {
                [styles['option--checked']]: isChecked,
                [styles[`option--${option.tone ?? 'brand'}`]]: Boolean(option.tone),
              })}
            >
              <input
                type="radio"
                className={styles.option__input}
                name={name}
                value={option.value}
                checked={isChecked}
                onChange={() => onChange(option.value)}
                required={required}
              />
              <span className={styles.option__mark} aria-hidden="true">
                {isChecked ? <CheckIcon width={11} height={11} /> : null}
              </span>
              {option.label}
            </label>
          );
        })}
      </div>

      {error ? (
        <p className={styles.field__error} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
