import { useId } from 'react';
import { CheckIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import styles from '../Form.module.scss';

/** 선택지에 상태색을 입힐 때 쓴다. 점검 결과 3지가 대표 예다. */
export type OptionTone = 'brand' | 'ok' | 'critical' | 'offline';

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  tone?: OptionTone;
}

interface RadioControlProps<T extends string> {
  value: T | null;
  options: RadioOption<T>[];
  onChange: (value: T) => void;
  required?: boolean;
  inline?: boolean;
}

/**
 * 몇 안 되는 것 중 하나를 고르는 칸.
 *
 * 이름은 감싸는 `FormField as="fieldset"` 의 legend 가 준다 — `<label for>` 로는 여러 개인
 * 이 묶음을 가리킬 수 없다.
 */
export function RadioControl<T extends string>({
  value,
  options,
  onChange,
  required,
  inline = true,
}: RadioControlProps<T>) {
  const name = useId();

  return (
    <div className={cn(styles.group__list, { [styles['group__list--inline']]: inline })}>
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
  );
}
