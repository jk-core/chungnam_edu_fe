import { cn } from '@/utils/cn';
import styles from './SearchInput.module.scss';

interface SearchInputProps {
  /** 스크린리더에 읽힐 이름. 화면에는 자리표시가 대신 선다 */
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** md = 툴바 한 칸, full = 모달 안에서 폭을 다 쓴다 */
  width?: 'md' | 'full';
  className?: string;
}

/**
 * 목록 위에서 무엇을 찾을지 적는 칸.
 *
 * 폼 칸이 아니라 툴바 칩이다 — 옆에 서는 것이 저장 버튼이 아니라 필터·세그먼트라서, 폼 입력이
 * 아니라 그쪽 키와 모서리를 따른다. 라벨을 그리지 않는 것도 같은 이유다.
 */
export function SearchInput({ label, value, onChange, placeholder, width = 'md', className }: SearchInputProps) {
  return (
    <input
      type="search"
      className={cn(styles.search, styles[`search--${width}`], { [className ?? '']: !!className })}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={label}
    />
  );
}
