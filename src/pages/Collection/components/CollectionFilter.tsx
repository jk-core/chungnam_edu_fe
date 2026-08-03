import { DatePicker } from '@/components/common/DatePicker';
import { useCollectionDate } from '@/stores/filterStore';
import styles from '../Collection.module.scss';
import type { ReactNode } from 'react';

interface CollectionFilterProps {
  /** 날짜 옆에 붙일 보조 컨트롤 */
  children?: ReactNode;
  trailing?: ReactNode;
}

/** 수집데이터 전 탭이 공유하는 조회일 필터. */
export function CollectionFilter({ children, trailing }: CollectionFilterProps) {
  const [date, setDate] = useCollectionDate();

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbar__left}>
        <DatePicker value={date} onChange={setDate} granularity="day" label="조회일" />
        <p className={styles.toolbar__note}>15분 주기 · 하루 96건</p>
        {children}
      </div>
      {trailing}
    </div>
  );
}
