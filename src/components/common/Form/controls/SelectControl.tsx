import { ChevronDownIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import styles from '../Form.module.scss';
import type { FieldWidth } from './shared';
import type { ComponentPropsWithoutRef } from 'react';

interface SelectControlProps<T extends string | number | boolean>
  extends Omit<ComponentPropsWithoutRef<'select'>, 'value' | 'onChange' | 'children'> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  width?: FieldWidth;
}

/**
 * 툴바의 `Select` 와 다른 컴포넌트다 — 거기는 알약, 여기는 옆 글자칸과 같은 상자다.
 * 하나에 「어디에 놓였는가」 분기를 두는 대신 자리마다 맞는 것을 쓴다.
 *
 * BE 코드값을 그대로 담으려고 숫자도 받는다. `<select>` 는 값을 문자열로만 돌려주므로
 * 고른 것을 문자열로 맞대 보고 원래 값을 되돌려준다 — 숫자 칸에 문자열이 들어가지 않게.
 */
export function SelectControl<T extends string | number | boolean>({
  value,
  options,
  onChange,
  width = 'full',
  className,
  ...rest
}: SelectControlProps<T>) {
  return (
    <span className={cn(styles.selectWrap, styles[`width--${width}`], className)}>
      <select
        {...rest}
        className={cn(styles.control, styles['control--select'])}
        value={String(value)}
        onChange={(event) => {
          const picked = options.find((option) => String(option.value) === event.target.value);

          if (picked) onChange(picked.value);
        }}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className={styles.selectWrap__icon} />
    </span>
  );
}
