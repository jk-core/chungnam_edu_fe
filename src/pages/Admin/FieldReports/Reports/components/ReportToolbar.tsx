import { formatNumber } from '@/utils/format';
import { SearchInput } from '@/components/common/SearchInput';
import { Select } from '@/components/common/Select';
import styles from '@/pages/Admin/Admin.module.scss';
import { STATE_FILTER } from './reportState';

interface ReportToolbarProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  state: string;
  onStateChange: (value: string) => void;
  /** 걸러 낸 뒤 남은 보고서 수 */
  total: number;
  /** 그 가운데 아직 손이 가야 하는 것 (제출완료·검토중) */
  waiting: number;
}

/** 무엇을 볼지 고르는 줄 — 검색·상태와 지금 몇 건이 걸렸는지를 함께 보여 준다 */
export function ReportToolbar({ keyword, onKeywordChange, state, onStateChange, total, waiting }: ReportToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbar__left}>
        <SearchInput
          label="이름 검색"
          value={keyword}
          onChange={onKeywordChange}
          placeholder="발전소명·점검자·보고서 번호로 검색"
          width="md"
        />
        <Select label="상태" hideLabel value={state} options={STATE_FILTER} onChange={onStateChange} />
        <p className={styles.toolbar__note}>
          총 {formatNumber(total)}개{waiting > 0 ? ` · 처리 대기 ${waiting}건` : ''}
        </p>
      </div>
    </div>
  );
}
