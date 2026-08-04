import { useState } from 'react';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Badge } from '@/components/common/Badge';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { currentOutputOf } from '@/mocks/schoolOutput';
import { formatEnergy, formatNumber, formatPercent } from '@/utils/format';
import { useAutoPager } from '@/hooks/useAutoPager';
import type { School } from '@/interface/energy';
import { PagerBar } from './PagerBar';
import styles from './AggregationPanel.module.scss';

/** 한 쪽이 머무는 시간 — 표를 읽어 내려갈 만큼은 준다 */
const PAGE_MS = 7000;

/**
 * 집계 축 (SFR-004-03).
 * 이 시스템에서 발전소와 학교는 1:1 이라 둘을 같은 축으로 두면 같은 표가 두 번 나온다.
 * 그래서 개별 설비는 '발전소별', 학교 성격별 묶음은 '학교급별' 로 갈라 두 축을 다르게 만든다.
 */
type Axis = 'plant' | 'level' | 'region';

const AXIS_OPTIONS: { value: Axis; label: string }[] = [
  { value: 'plant', label: '발전소별' },
  { value: 'level', label: '학교급별' },
  { value: 'region', label: '권역별' },
];

interface AggregationRow {
  key: string;
  name: string;
  /** 묶음에 속한 발전소 수 — 발전소별에서는 표시하지 않는다 */
  count: number;
  capacityKw: number;
  todayKwh: number;
  outputKw: number;
  /** 이상 설비 수 */
  abnormal: number;
  /** 발전소별에서만 채운다 */
  school: School | null;
}

function aggregate(schools: School[], axis: Axis): AggregationRow[] {
  if (axis === 'plant') {
    return schools.map((school) => ({
      key: school.id,
      name: school.name,
      count: 1,
      capacityKw: school.capacityKw,
      todayKwh: school.todayKwh,
      outputKw: currentOutputOf(school),
      abnormal: isAbnormal(school.status) ? 1 : 0,
      school,
    }));
  }

  const buckets = new Map<string, AggregationRow>();

  schools.forEach((school) => {
    const name = axis === 'level' ? school.level : school.regionName;
    const row = buckets.get(name) ?? {
      key: name,
      name,
      count: 0,
      capacityKw: 0,
      todayKwh: 0,
      outputKw: 0,
      abnormal: 0,
      school: null,
    };

    row.count += 1;
    row.capacityKw += school.capacityKw;
    row.todayKwh += school.todayKwh;
    row.outputKw += currentOutputOf(school);
    row.abnormal += isAbnormal(school.status) ? 1 : 0;
    buckets.set(name, row);
  });

  return [...buckets.values()];
}

interface AggregationPanelProps {
  schools: School[];
}

/**
 * 발전소별·학교급별·권역별 발전 현황 집계 (SFR-004-03).
 * 같은 목록을 축만 바꿔 접었다 폈다 하며, 1위 대비 비율을 막대로 견준다.
 */
export function AggregationPanel({ schools }: AggregationPanelProps) {
  const [axis, setAxis] = useState<Axis>('region');

  const rows = aggregate(schools, axis).sort((a, b) => b.todayKwh - a.todayKwh);
  const best = rows[0]?.todayKwh ?? 1;
  const totalKwh = rows.reduce((sum, row) => sum + row.todayKwh, 0);
  const total = formatEnergy(totalKwh);

  // 벽면 모니터에는 스크롤을 굴려 줄 사람이 없다. 칸에 담기는 만큼만 두고 나머지는 저절로 넘긴다.
  const {
    frameRef, itemRef, from, to, page, pageCount, turnKey, paused, togglePause, goTo, next, prev,
  } = useAutoPager<HTMLDivElement, HTMLTableRowElement>({ total: rows.length, intervalMs: PAGE_MS });

  const visibleRows = rows.slice(from, to);

  return (
    <div className={styles.agg}>
      <div className={styles.agg__head}>
        <SegmentedControl
          label="집계 기준"
          size="sm"
          options={AXIS_OPTIONS}
          value={axis}
          onChange={setAxis}
        />
        <p className={styles.agg__total}>
          합계 {total.value}
          <span className={styles.agg__unit}>{total.unit}</span>
        </p>
      </div>

      <div
        ref={frameRef}
        className={styles.agg__frame}
      >
        <table className={styles.table}>
          <caption className={styles.table__caption}>
            {AXIS_OPTIONS.find((option) => option.value === axis)?.label} 금일 발전 현황
          </caption>
          <thead>
            <tr>
              <th scope="col">{axis === 'plant' ? '발전소' : '구분'}</th>
              <th scope="col" className={styles.table__num}>설비용량</th>
              <th scope="col" className={styles.table__num}>현재 출력</th>
              <th scope="col" className={styles.table__num}>금일 발전량</th>
              <th scope="col" className={styles.table__share}>비중</th>
            </tr>
          </thead>
          {/* 쪽이 갈릴 때마다 새로 만들어야 옆에서 밀려 들어오는 움직임이 다시 돈다 */}
          <tbody key={turnKey} className={styles.table__body}>
            {visibleRows.map((row, index) => (
              <tr key={row.key} ref={index === 0 ? itemRef : undefined}>
                <th scope="row" className={styles.table__name}>
                  <span>{row.name}</span>
                  {row.count > 1 ? <span className={styles.table__count}>{row.count}개소</span> : null}
                  {row.school ? (
                    <Badge tone={OPERATION_TONE[row.school.status]} withDot>
                      {OPERATION_LABEL[row.school.status]}
                    </Badge>
                  ) : row.abnormal > 0 ? (
                    <Badge tone="critical">이상 {row.abnormal}</Badge>
                  ) : null}
                </th>
                <td className={styles.table__num}>{formatNumber(row.capacityKw, 1)}</td>
                <td className={styles.table__num}>{formatNumber(row.outputKw, 1)}</td>
                <td className={styles.table__num}>{formatNumber(row.todayKwh)}</td>
                <td className={styles.table__share}>
                  <span className={styles.bar}>
                    <span
                      className={styles.bar__fill}
                      style={{ width: `${Math.max(3, (row.todayKwh / Math.max(best, 1)) * 100)}%` }}
                    />
                  </span>
                  <span className={styles.bar__value}>
                    {formatPercent(totalKwh > 0 ? row.todayKwh / totalKwh : 0, 1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PagerBar
        page={page}
        pageCount={pageCount}
        turnKey={turnKey}
        intervalMs={PAGE_MS}
        total={rows.length}
        controls={{ paused, onTogglePause: togglePause, onGo: goTo, onPrev: prev, onNext: next }}
      />
    </div>
  );
}
