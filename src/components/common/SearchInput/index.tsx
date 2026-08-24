import { cn } from '@/utils/cn';
import { imeProps } from '@/utils/ime';
import styles from './SearchInput.module.scss';

interface SearchInputProps {
  /** 화면에는 자리표시가 대신 서므로 이 문구는 스크린리더에만 간다 */
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: 'md' | 'full';
  className?: string;
}

/**
 * 폼 칸이 아니라 툴바 칩이다 — 옆에 서는 것이 저장 버튼이 아니라 필터·세그먼트라서
 * 그쪽 키와 모서리를 따르고, 라벨도 그리지 않는다.
 */
export function SearchInput({ label, value, onChange, placeholder, width = 'md', className }: SearchInputProps) {
  return (
    <input
      {...imeProps('hangul')}
      type="search"
      className={cn(styles.search, styles[`search--${width}`], className)}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={label}
    />
  );
}
