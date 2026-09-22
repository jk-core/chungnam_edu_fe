import { cn } from '@/utils/cn';
import { imeProps } from '@/utils/ime';
import styles from './SearchInput.module.scss';

interface SearchInputProps {
  /** 화면에는 자리표시가 대신 서므로 이 문구는 스크린리더에만 간다 */
  label: string;
  /**
   * 값을 코드로 되돌려야 할 때만 준다. 서버 검색처럼 조회만 늦추면 되는 자리는
   * `defaultValue` 로 두어 입력 DOM 이 즉시값을 쥐게 한다 — 그래야 디바운스가 타자를 늦추지 않는다.
   */
  value?: string;
  defaultValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: 'md' | 'full';
  className?: string;
}

/**
 * 폼 칸이 아니라 툴바 칩이다 — 옆에 서는 것이 저장 버튼이 아니라 필터·세그먼트라서
 * 그쪽 키와 모서리를 따르고, 라벨도 그리지 않는다.
 */
export function SearchInput({
  label,
  value,
  defaultValue,
  onChange,
  placeholder,
  width = 'md',
  className,
}: SearchInputProps) {
  return (
    <input
      {...imeProps('hangul')}
      type="search"
      className={cn(styles.search, styles[`search--${width}`], className)}
      value={value}
      defaultValue={defaultValue}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={label}
    />
  );
}
