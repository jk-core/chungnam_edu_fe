import { useId } from 'react';
import { CheckIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import styles from '../Form.module.scss';

export type OptionTone = 'brand' | 'ok' | 'critical' | 'offline';

export interface RadioOption<T extends string | number | boolean> {
  value: T;
  label: string;
  tone?: OptionTone;
}

interface RadioControlProps<T extends string | number | boolean> {
  value: T | null;
  options: RadioOption<T>[];
  onChange: (value: T) => void;
  required?: boolean;
  inline?: boolean;
}

/** 이름은 감싸는 `FormField as="fieldset"` 이 준다 — `<label for>` 로는 여럿인 묶음을 가리킬 수 없다. */
export function RadioControl<T extends string | number | boolean>({
  value,
  options,
  onChange,
  required,
  inline = true,
}: RadioControlProps<T>) {
  const name = useId();

  return (
    <div className={cn(styles.optionList, inline && styles['optionList--inline'])}>
      {options.map((option) => {
        const isChecked = option.value === value;

        return (
          <label
            key={String(option.value)}
            className={cn(
              styles.option,
              isChecked && styles['option--checked'],
              option.tone && styles[`option--${option.tone}`],
            )}
          >
            <input
              type="radio"
              className={styles.option__input}
              name={name}
              value={String(option.value)}
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
