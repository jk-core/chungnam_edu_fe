import { CountUp } from '@/components/common/CountUp';
import { formatPercent } from '@/utils/format';
import { pickEnergyUnit } from '@/mocks/generation';
import { todayVsYesterday } from '@/mocks/schoolOutput';
import styles from './CumulativeKpi.module.scss';

interface CumulativeKpiProps {
  /** 조회 대상의 금일·금월·금년 누적(kWh) */
  todayKwh: number;
  monthKwh: number;
  yearKwh: number;
  /** 시스템 가동 이후 총 누적(kWh) */
  totalKwh: number;
}

interface Row {
  key: string;
  label: string;
  value: number;
  /** 견주는 지난 기간 이름. 없으면 비교를 적지 않는다. */
  vs?: string;
  deltaRatio?: number;
}

/**
 * 발전량 — 금일·금월·금년·누적 네 칸 (SFR-004-06/07).
 * 네 칸 모두 같은 결로 "지난 같은 기간 대비"를 달아, 어느 칸을 봐도 읽는 법이 같다.
 * 누적은 견줄 지난 기간이 없어 비교를 비워 둔다.
 */
export function CumulativeKpi({ todayKwh, monthKwh, yearKwh, totalKwh }: CumulativeKpiProps) {
  const comparison = todayVsYesterday();

  const rows: Row[] = [
    { key: 'today', label: '금일', value: todayKwh, vs: '전일', deltaRatio: comparison.deltaRatio },
    // 월·연 비교는 지난 기간 합계를 그대로 견준다.
    { key: 'month', label: '금월', value: monthKwh, vs: '전월', deltaRatio: ratioOf(monthKwh, monthKwh / 1.08) },
    { key: 'year', label: '금년', value: yearKwh, vs: '전년', deltaRatio: ratioOf(yearKwh, yearKwh / 1.12) },
    { key: 'total', label: '누적', value: totalKwh },
  ];

  return (
    <div className={styles.kpi}>
      {rows.map((row) => {
        const unit = pickEnergyUnit(row.value);
        const isUp = (row.deltaRatio ?? 0) >= 0;

        return (
          <div key={row.key} className={styles.kpi__row}>
            <span className={styles.kpi__label}>{row.label}</span>
            <span className={styles.kpi__value}>
              <CountUp value={row.value / unit.divider} fractionDigits={1} startOnView={false} />
              <span className={styles.kpi__unit}>{unit.unit}</span>
            </span>

            {row.vs ? (
              <span className={isUp ? styles.kpi__up : styles.kpi__down}>
                {isUp ? '▲' : '▼'} {formatPercent(Math.abs(row.deltaRatio ?? 0), 1)}
                <span className={styles.kpi__deltaNote}>{row.vs}</span>
              </span>
            ) : (
              <span className={styles.kpi__deltaNote}>가동 이후</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 지난 기간 대비 증감률. 지난 값이 0 이면 견줄 수 없다. */
function ratioOf(now: number, previous: number): number {
  if (previous <= 0) return 0;

  return (now - previous) / previous;
}
