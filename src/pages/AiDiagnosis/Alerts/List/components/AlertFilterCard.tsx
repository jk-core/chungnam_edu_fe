import dayjs from 'dayjs';
import { useState } from 'react';
import { ALERT_TYPES } from '@/mocks/alerts';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DatePicker } from '@/components/common/DatePicker';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Select } from '@/components/common/Select';
import { useAlertRange } from '@/stores/filterStore';
import type { AlertType } from '@/interface/alert';
import type { Granularity } from '@/utils/date';
import type { Severity } from '@/interface/energy';
import styles from '../../Alerts.module.scss';
import type { AlertFilterState } from '../../hooks/useAlertFilters';

const TYPE_OPTIONS = [
  { value: 'all', label: '전체 유형' },
  ...ALERT_TYPES.map((type) => ({ value: type, label: type })),
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: '전체 심각도' },
  { value: 'critical', label: '긴급' },
  { value: 'caution', label: '주의' },
  { value: 'info', label: '참고' },
];

const HANDLED_OPTIONS = [
  { value: 'all', label: '조치 전체' },
  { value: 'pending', label: '미조치' },
  { value: 'handled', label: '조치 완료' },
];

const UNIT_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'day', label: '일별' },
  { value: 'month', label: '월별' },
  { value: 'year', label: '연도별' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'longest', label: '지속 시간순' },
];

interface AlertFilterCardProps {
  filters: AlertFilterState;
  onChange: (change: Partial<AlertFilterState>) => void;
  /** 기본값에서 하나라도 벗어났을 때만 초기화 단추를 보여 준다 */
  isDirty: boolean;
  onReset: () => void;
}

/**
 * 조회 조건 (SFR-022-01/02).
 *
 * 기간은 일·월·연 단위로 고른다. 고르는 달력 안에 그 날짜의 날씨(월·연은 발전시간)가 함께 나온다 —
 * 알림이 뜬 날 발전이 어땠는지 같은 자리에서 읽으라는 뜻이다.
 */
export function AlertFilterCard({ filters, onChange, isDirty, onReset }: AlertFilterCardProps) {
  const [range, setRange] = useAlertRange();
  const [unit, setUnit] = useState<Granularity>('month');
  const [anchor, setAnchor] = useState<Date>(() => range.end);

  const applyPeriod = (nextUnit: Granularity, nextAnchor: Date) => {
    const cursor = dayjs(nextAnchor);

    setUnit(nextUnit);
    setAnchor(nextAnchor);
    setRange({ start: cursor.startOf(nextUnit).toDate(), end: cursor.endOf(nextUnit).toDate() });
  };

  return (
    <Reveal delay={0.06}>
      <Card title="조회 조건" padding="md" variant="outline">
        <div className={styles.filters}>
          <SegmentedControl
            label="조회 단위"
            options={UNIT_OPTIONS}
            value={unit}
            onChange={(value) => applyPeriod(value, anchor)}
          />
          <DatePicker value={anchor} onChange={(value) => applyPeriod(unit, value)} granularity={unit} label="기준일" />
          <Select
            label="유형"
            hideLabel
            value={filters.type}
            options={TYPE_OPTIONS}
            onChange={(value) => onChange({ type: value as AlertType | 'all' })}
          />
          <Select
            label="심각도"
            hideLabel
            value={filters.severity}
            options={SEVERITY_OPTIONS}
            onChange={(value) => onChange({ severity: value as Severity | 'all' })}
          />
          <Select
            label="조치 여부"
            hideLabel
            value={filters.handled}
            options={HANDLED_OPTIONS}
            onChange={(value) => onChange({ handled: value as AlertFilterState['handled'] })}
          />
          <Select
            label="정렬"
            hideLabel
            value={filters.sort}
            options={SORT_OPTIONS}
            onChange={(value) => onChange({ sort: value as AlertFilterState['sort'] })}
          />
          {isDirty ? (
            <Button variant="ghost" size="sm" onClick={onReset}>조건 초기화</Button>
          ) : null}
        </div>
      </Card>
    </Reveal>
  );
}
