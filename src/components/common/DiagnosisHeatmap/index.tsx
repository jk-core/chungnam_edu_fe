import { cn } from '@/utils/cn';
import styles from './DiagnosisHeatmap.module.scss';

export interface HeatmapRow {
  key: string;
  label: string;
  sub?: string;
  /** 열 순서에 맞춘 값. 0 이하는 계측값 없음으로 본다. */
  values: number[];
}

interface DiagnosisHeatmapProps {
  rows: HeatmapRow[];
  /** 열 라벨 (일자 등) */
  cols: string[];
  caption: string;
  /** 값 → 단계(1~5). 넘기지 않으면 진단효율 기준으로 나눈다. */
  stepOf?: (value: number) => number;
  onCellClick?: (row: HeatmapRow, colIndex: number, value: number) => void;
  /** 칸에 값을 어떻게 적을지 */
  formatValue?: (value: number) => string;
  legend?: { label: string; step: number }[];
}

/** 진단효율 기본 구간 — 낮을수록 진한 붉은 계열이 되도록 단계를 뒤집어 쓴다. */
const defaultStep = (value: number) => {
  if (value <= 0) return 0;
  if (value >= 95) return 1;
  if (value >= 85) return 2;
  if (value >= 70) return 3;
  if (value >= 50) return 4;

  return 5;
};

const STEP_COLOR = [
  'var(--surface-sunken)',
  'var(--ok-soft)',
  'var(--ok)',
  'var(--caution)',
  'var(--critical-soft)',
  'var(--critical)',
];

/**
 * 설비·스트링 × 일자 진단 결과 격자 (SFR-013-04).
 *
 * echarts heatmap 대신 CSS grid 로 짠다. 칸마다 aria-label 을 붙이고 Tab 으로 순회할 수 있어야 하고,
 * 색을 디자인 토큰으로 직접 칠해야 테마가 어긋나지 않는다.
 */
export function DiagnosisHeatmap({
  rows,
  cols,
  caption,
  stepOf = defaultStep,
  onCellClick,
  formatValue = (value) => (value <= 0 ? '—' : String(Math.round(value))),
  legend,
}: DiagnosisHeatmapProps) {
  return (
    <div className={styles.heatmap}>
      <div className={styles.scroll}>
        <div
          className={styles.grid}
          style={{ gridTemplateColumns: `minmax(120px, auto) repeat(${cols.length}, auto)` }}
          role="table"
          aria-label={caption}
        >
          <span className={styles.corner} role="columnheader" aria-label="설비" />
          {cols.map((col) => (
            <span key={col} className={styles.colLabel} role="columnheader">
              {col}
            </span>
          ))}

          {rows.map((row) => (
            <div key={row.key} style={{ display: 'contents' }} role="row">
              <span className={styles.rowLabel} role="rowheader">
                {row.label}
                {row.sub ? <span className={styles.rowLabel__sub}>{row.sub}</span> : null}
              </span>

              {row.values.map((value, colIndex) => {
                const step = stepOf(value);
                const label = `${row.label} ${cols[colIndex]} ${value <= 0 ? '계측값 없음' : `${formatValue(value)}%`}`;

                return (
                  <button
                    key={`${row.key}-${colIndex}`}
                    type="button"
                    role="cell"
                    className={cn(styles.cell, {
                      [styles['cell--clickable']]: Boolean(onCellClick),
                      [styles['cell--none']]: step === 0,
                      [styles['cell--deep']]: step >= 5,
                    })}
                    style={{ backgroundColor: STEP_COLOR[step] }}
                    title={label}
                    aria-label={label}
                    onClick={() => onCellClick?.(row, colIndex, value)}
                  >
                    {formatValue(value)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {legend ? (
        <ul className={styles.legend}>
          {legend.map((item) => (
            <li key={item.label} className={styles.legend__item}>
              <span className={styles.legend__swatch} style={{ backgroundColor: STEP_COLOR[item.step] }} />
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** 진단효율 히트맵 범례 기본값 */
export const DIAG_LEGEND = [
  { label: '95% 이상', step: 1 },
  { label: '85~95%', step: 2 },
  { label: '70~85%', step: 3 },
  { label: '50~70%', step: 4 },
  { label: '50% 미만', step: 5 },
  { label: '계측값 없음', step: 0 },
];
