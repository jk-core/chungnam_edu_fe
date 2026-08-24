import { cn } from '@/utils/cn';
import { SearchIcon } from '@/components/common/Icon';
import styles from '../Form.module.scss';
import type { ComponentPropsWithoutRef } from 'react';

interface PickerControlProps extends Omit<ComponentPropsWithoutRef<'button'>, 'value' | 'onChange' | 'type'> {
  /** 고른 것의 표시 이름. 비어 있으면 안내 문구가 대신 선다 */
  value: string;
  placeholder: string;
  onOpen: () => void;
  isOpen: boolean;
}

/**
 * 표에서 골라 오는 칸.
 *
 * 칸 전체가 곧 버튼이라 값이 길어도 누를 자리를 찾을 필요가 없다. 무엇을 고르는 표인지는
 * 이 컨트롤이 모른다 — 검색기는 호출부가 모달로 띄운다.
 */
export function PickerControl({ value, placeholder, onOpen, isOpen, className, ...rest }: PickerControlProps) {
  return (
    <button
      {...rest}
      type="button"
      className={cn(styles.pickerControl, {
        [styles['pickerControl--empty']]: !value,
        [className ?? '']: !!className,
      })}
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
    >
      <span className={styles.pickerControl__value}>{value || placeholder}</span>
      <SearchIcon className={styles.pickerControl__icon} />
    </button>
  );
}
