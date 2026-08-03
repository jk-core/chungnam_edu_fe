import { useId } from 'react';
import { OPERATION_LABEL, OPERATION_ORDER } from '@/mocks/status';
import { REGIONS } from '@/mocks/regions';
import { SCHOOL_LEVELS } from '@/mocks/schools';
import { SearchIcon } from '@/components/common/Icon';
import { Select } from '@/components/common/Select';
import { formatNumber } from '@/utils/format';
import styles from './ControlFilterBar.module.scss';

export const FILTER_ALL = 'all';

export interface ControlFilter {
  keyword: string;
  region: string;
  level: string;
  status: string;
}

interface ControlFilterBarProps {
  value: ControlFilter;
  onChange: (value: ControlFilter) => void;
  /** 조건에 걸린 개소 수 */
  matchedCount: number;
  /** 수집이 지연된 개소 수 */
  staleCount: number;
}

/**
 * 관제 검색·필터 (SFR-004-11/12).
 * 여기서 좁힌 목록을 지도·우선 목록·총출력이 함께 쓴다.
 */
export function ControlFilterBar({ value, onChange, matchedCount, staleCount }: ControlFilterBarProps) {
  const searchId = useId();

  return (
    <div className={styles.bar}>
      <div className={styles.search}>
        <SearchIcon className={styles.search__icon} width={18} height={18} />
        <input
          id={searchId}
          type="search"
          className={styles.search__input}
          value={value.keyword}
          onChange={(event) => onChange({ ...value, keyword: event.target.value })}
          placeholder="학교명·시·군·주소로 검색"
          aria-label="발전소 검색"
        />
      </div>

      <Select
        className={styles.bar__select}
        label="행정구역"
        hideLabel
        value={value.region}
        onChange={(region) => onChange({ ...value, region })}
        options={[
          { value: FILTER_ALL, label: '전체 시·군' },
          ...REGIONS.map((item) => ({ value: item.code, label: item.name })),
        ]}
      />
      <Select
        className={styles.bar__select}
        label="학교급"
        hideLabel
        value={value.level}
        onChange={(level) => onChange({ ...value, level })}
        options={[
          { value: FILTER_ALL, label: '전체 학교급' },
          ...SCHOOL_LEVELS.map((item) => ({ value: item, label: item })),
        ]}
      />
      <Select
        className={styles.bar__select}
        label="운영상태"
        hideLabel
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
        options={[
          { value: FILTER_ALL, label: '전체 상태' },
          ...OPERATION_ORDER.map((item) => ({ value: item, label: OPERATION_LABEL[item] })),
        ]}
      />

      <p className={styles.bar__meta}>
        <span className={styles.bar__count}>{formatNumber(matchedCount)}개소</span>
        {staleCount > 0 ? <span className={styles.bar__stale}>미수신 {staleCount}</span> : null}
      </p>
    </div>
  );
}
