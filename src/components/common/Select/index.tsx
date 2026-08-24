import { useId } from 'react';
import { ChevronDownIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import styles from './Select.module.scss';

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  /** 라벨을 시각적으로 숨기고 스크린리더에만 남긴다. */
  hideLabel?: boolean;
  className?: string;
}

/**
 * 목록·조회 화면 위에서 무엇을 볼지 좁히는 칩.
 *
 * 폼 칸이 아니다 — 옆에 서는 것이 저장 버튼이 아니라 세그먼트·날짜 칩이라서 그쪽 키와 알약
 * 모서리를 따른다. 폼 안의 고르는 칸은 `Form.Select`(`Form/controls/SelectControl`)가 따로 있다.
 */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  hideLabel = false,
  className,
}: SelectProps<T>) {
  const id = useId();

  return (
    <div className={cn(styles.select, { [className ?? '']: !!className })}>
      <label htmlFor={id} className={cn(styles.select__label, { [styles['select__label--hidden']]: hideLabel })}>
        {label}
      </label>
      <div className={styles.select__control}>
        <select
          id={id}
          className={styles.select__input}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className={styles.select__icon} />
      </div>
    </div>
  );
}
