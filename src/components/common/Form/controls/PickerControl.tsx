import { cn } from '@/utils/cn';
import { SearchIcon } from '@/components/common/Icon';
import styles from '../Form.module.scss';
import type { ComponentPropsWithoutRef } from 'react';

interface PickerControlProps extends Omit<ComponentPropsWithoutRef<'button'>, 'value' | 'onChange' | 'type'> {
  value: string;
  placeholder: string;
  onOpen: () => void;
  isOpen: boolean;
}

/** 칸 전체가 곧 버튼이라 값이 길어도 누를 자리를 찾을 필요가 없다. */
export function PickerControl({
  value,
  placeholder,
  onOpen,
  isOpen,
  className,
  id,
  // button role 은 aria-required 를 지원하지 않는다 — 라벨의 * 와 저장 시 오류가 그 몫을 한다.
  'aria-required': _required,
  ...rest
}: PickerControlProps) {
  return (
    <button
      {...rest}
      id={id}
      type="button"
      className={cn(styles.pickerControl, !value && styles['pickerControl--empty'], className)}
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      // 라벨만 걸면 고른 값이 이름에서 빠진다 — 자기 자신을 함께 가리켜 뒤에 붙인다.
      aria-labelledby={id ? `${id}-label ${id}` : undefined}
    >
      <span className={styles.pickerControl__value}>{value || placeholder}</span>
      <SearchIcon className={styles.pickerControl__icon} />
    </button>
  );
}
