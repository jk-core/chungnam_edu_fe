import { useMemo, useState } from 'react';
import { getQualityStatus, summarizeQuality } from '@/mocks/quality';
import { TODAY } from '@/mocks/today';
import type { DateRangeValue } from '@/components/common/DateRangePicker';
import styles from '../../Admin.module.scss';
import { QualitySummary } from './QualitySummary';
import { QualityTable } from './QualityTable';
import { QualityToolbar } from './QualityToolbar';

/** 처음 열었을 때 보는 기간 — 최근 한 주 */
const DEFAULT_DAYS = 6;

/**
 * 데이터 품질 관리 본문 (SFR-012-10).
 *
 * 조회 기간 하나가 요약 카드와 표를 함께 움직인다 — 같은 기간에서 나온 값이라야 「전체 품질률
 * 97%」 와 아래 표의 줄들이 서로 들어맞는다. 그래서 기간만 여기서 쥐고, 쪽 번호처럼 판 하나에만
 * 매인 상태는 그 판이 가져간다.
 */
export function DataQualityBoard() {
  const [range, setRange] = useState<DateRangeValue>({
    start: TODAY.subtract(DEFAULT_DAYS, 'day').toDate(),
    end: TODAY.toDate(),
  });

  const rows = useMemo(() => getQualityStatus(null, range.start, range.end), [range]);
  const total = useMemo(() => summarizeQuality(rows), [rows]);

  return (
    <div className={styles.tab}>
      <QualityToolbar range={range} onChange={setRange} count={rows.length} />
      <QualitySummary total={total} />
      <QualityTable rows={rows} />
    </div>
  );
}
