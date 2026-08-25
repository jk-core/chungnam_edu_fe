import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { ChevronRightIcon } from '@/components/common/Icon';
import { FAULT_CODES, getFaultCode } from '@/mocks/faultCodes';
import { OPERATION_LABEL } from '@/mocks/status';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import type { DiagEfficiencyPoint } from '@/interface/diagnosisDetail';
import type { FaultCode } from '@/interface/equipment';
import type { OperationStatus } from '@/interface/status';
import styles from './DailyEfficiencyTable.module.scss';

export interface DailyEfficiencyRow {
  id: string;
  name: string;
  status: OperationStatus;
  /** 이름 옆에 붙일 짧은 설명 — 용량·구성 */
  meta: string;
  points: DiagEfficiencyPoint[];
  /** 펼쳤을 때 나올 하위 설비 */
  children?: DailyEfficiencyRow[];
}

interface DailyEfficiencyTableProps {
  rows: DailyEfficiencyRow[];
  /** 열 머리에 쓸 날짜 (YYYY-MM-DD) */
  dates: string[];
  /** 첫 열 머리 — '설비 / 일자' */
  unitHeader: string;
  onFaultClick: (fault: FaultCode, device: string, date: string) => void;
}

/**
 * 일자별 발전 효율 표 (SFR-013-02/06).
 * 가로는 날짜, 세로는 설비다. 칸 색은 그날 붙은 고장코드를 따르고,
 * 고장이 난 칸을 누르면 원인·조치와 참고 사진이 열린다.
 */
export function DailyEfficiencyTable({ rows, dates, unitHeader, onFaultClick }: DailyEfficiencyTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string[]>([]);

  // 최신 날짜가 오른쪽 끝이라, 열자마자 거기부터 보이게 한다.
  useEffect(() => {
    const node = scrollRef.current;

    if (node) node.scrollLeft = node.scrollWidth;
  }, [dates.length, rows.length]);

  if (rows.length === 0) return null;

  const toggle = (id: string) => setExpanded((prev) => (
    prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
  ));

  return (
    <div className={styles.wrap}>
      <div ref={scrollRef} className={styles.scroll} role="region" tabIndex={0} aria-label="일자별 발전 효율 표">
        <table className={styles.table}>
          <caption className={styles.srOnly}>
            설비별 일자 발전 효율. 칸의 색은 그날의 고장코드이고, 고장 칸은 눌러서 원인과 조치를 봅니다.
          </caption>
          <thead>
            <tr>
              <th scope="col" className={`${styles.head} ${styles['head--name']}`}>
                {unitHeader}
              </th>
              {dates.map((date) => (
                <th key={date} scope="col" className={styles.head}>
                  {dayjs(date).format('M월 D일')}
                </th>
              ))}
              <th scope="col" className={`${styles.head} ${styles['head--avg']}`}>
                평균
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row
                key={row.id}
                row={row}
                expanded={expanded.includes(row.id)}
                onToggle={() => toggle(row.id)}
                onFaultClick={onFaultClick}
              />
            ))}
          </tbody>
        </table>
      </div>

      <ul className={styles.legend} aria-label="고장코드 범례">
        {FAULT_CODES.map((fault) => (
          <li key={fault.code} className={styles.legend__item}>
            <span className={cn(styles.legend__swatch, styles[`swatch--c${fault.code}`])} aria-hidden />
            {fault.code === 0 ? '정상' : `고장코드${fault.code}`}
          </li>
        ))}
        <li className={styles.legend__item}>
          <span className={`${styles.legend__swatch} ${styles['swatch--missing']}`} aria-hidden />
          데이터 없음
        </li>
      </ul>
    </div>
  );
}

interface RowProps {
  row: DailyEfficiencyRow;
  expanded: boolean;
  onToggle: () => void;
  onFaultClick: (fault: FaultCode, device: string, date: string) => void;
  child?: boolean;
}

function Row({ row, expanded, onToggle, onFaultClick, child = false }: RowProps) {
  const hasChildren = Boolean(row.children && row.children.length > 0);

  return (
    <>
      <tr className={cn(styles.row, { [styles['row--child']]: child })}>
        <th scope="row" className={cn(styles.name, { [styles['name--child']]: child })}>
          {/*
            줄 세우기는 칸이 아니라 그 안쪽 껍데기가 맡는다.
            `th` 에 직접 flex 를 걸면 그 칸이 표의 줄 배치에서 빠져 나와, 옆 칸들보다 높이가
            낮아진다. 칸마다 아래 테두리를 두고 있으므로 그 차이가 곧 어긋난 가로선이 된다.
          */}
          <span className={styles.name__inner}>
            {hasChildren ? (
              <button
                type="button"
                className={styles.name__toggle}
                aria-expanded={expanded}
                aria-label={`${row.name} 하위 설비 ${expanded ? '접기' : '펼치기'}`}
                onClick={onToggle}
              >
                <ChevronRightIcon
                  className={cn(styles.name__toggleIcon, { [styles['name__toggleIcon--open']]: expanded })}
                  width={12}
                  height={12}
                  aria-hidden
                />
              </button>
            ) : (
              <span className={styles.name__toggle} aria-hidden />
            )}
            <span className={cn(styles.name__dot, styles[`dot--${row.status}`])} title={OPERATION_LABEL[row.status]} />
            <span className={styles.name__text}>{row.name}</span>
            <span className={styles.name__meta}>{row.meta}</span>
          </span>
        </th>

        {row.points.map((point) => (
          <Cell key={point.date} point={point} device={row.name} onFaultClick={onFaultClick} />
        ))}

        <td className={`${styles.cell} ${styles['cell--avg']}`}>{formatAverage(row.points)}</td>
      </tr>

      {expanded && row.children
        ? row.children.map((item) => (
          <Row key={item.id} row={item} expanded={false} onToggle={() => undefined} onFaultClick={onFaultClick} child />
        ))
        : null}
    </>
  );
}

interface CellProps {
  point: DiagEfficiencyPoint;
  device: string;
  onFaultClick: (fault: FaultCode, device: string, date: string) => void;
}

function Cell({ point, device, onFaultClick }: CellProps) {
  // 효율 0 은 계측이 없는 날이다 — 0% 로 읽히지 않게 사선으로 비워 둔다.
  const missing = point.efficiency <= 0;
  const fault = missing ? null : getFaultCode(point.faultCode);
  const clickable = Boolean(fault && fault.code > 0);
  const className = cn(styles.chip, {
    [styles['chip--missing']]: missing,
    [styles[`chip--c${point.faultCode}`]]: !missing,
    [styles['chip--clickable']]: clickable,
  });
  const label = missing ? '—' : `${formatNumber(point.efficiency, 2)}%`;
  const title = missing
    ? `${device} · ${point.date} · 계측 없음`
    : `${device} · ${point.date} · 효율 ${formatNumber(point.efficiency, 2)}%${fault && fault.code > 0 ? ` · ${fault.label}` : ''}`;

  return (
    <td className={styles.cell}>
      {clickable && fault ? (
        <button
          type="button"
          className={className}
          title={`${title} · 눌러서 상세 보기`}
          onClick={() => onFaultClick(fault, device, point.date)}
        >
          {label}
        </button>
      ) : (
        <span className={className} title={title}>
          {label}
        </span>
      )}
    </td>
  );
}

/** 계측이 있는 날만 평균에 넣는다 */
function formatAverage(points: DiagEfficiencyPoint[]): string {
  const live = points.filter((point) => point.efficiency > 0);

  if (live.length === 0) return '—';

  return `${formatNumber(live.reduce((sum, point) => sum + point.efficiency, 0) / live.length, 2)}%`;
}
