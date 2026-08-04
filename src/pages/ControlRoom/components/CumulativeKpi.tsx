import { CountUp } from '@/components/common/CountUp';
import { formatEnergy, formatNumber, formatPercent } from '@/utils/format';
import { pickEnergyUnit } from '@/mocks/generation';
import { todayVsYesterday } from '@/mocks/schoolOutput';
import { TODAY } from '@/mocks/today';
import styles from './CumulativeKpi.module.scss';

/** 누적값을 하루·한 달 몫으로 되돌릴 때 나눌 값 — 이번 달·올해가 얼마나 지났는지 */
const DAY_OF_MONTH = TODAY.date();
const MONTH_OF_YEAR = TODAY.month() + 1;

interface CumulativeKpiProps {
  /** 조회 대상의 금일·금월·금년 누적(kWh) */
  todayKwh: number;
  monthKwh: number;
  yearKwh: number;
}

/**
 * 일·월·연 누적 발전량과 전일 대비 증감 (SFR-004-06/07).
 * 증감률은 도 전체 추이의 전일 비교값을 그대로 쓴다.
 */
export function CumulativeKpi({ todayKwh, monthKwh, yearKwh }: CumulativeKpiProps) {
  const comparison = todayVsYesterday();
  const dayAverage = formatEnergy(monthKwh / DAY_OF_MONTH);
  const monthAverage = formatEnergy(yearKwh / MONTH_OF_YEAR);
  const isUp = comparison.deltaRatio >= 0;

  const rows = [
    { key: 'today', label: '금일', value: todayKwh },
    { key: 'month', label: '금월', value: monthKwh },
    { key: 'year', label: '금년', value: yearKwh },
  ];

  return (
    <div className={styles.kpi}>
      {rows.map((row) => {
        const unit = pickEnergyUnit(row.value);

        return (
          <div key={row.key} className={styles.kpi__row}>
            <span className={styles.kpi__label}>{row.label}</span>
            <span className={styles.kpi__value}>
              <CountUp value={row.value / unit.divider} fractionDigits={1} startOnView={false} />
              <span className={styles.kpi__unit}>{unit.unit}</span>
            </span>

            {row.key === 'today' ? (
              <span className={isUp ? styles.kpi__up : styles.kpi__down}>
                {isUp ? '▲' : '▼'} {formatPercent(Math.abs(comparison.deltaRatio), 1)}
                <span className={styles.kpi__deltaNote}>전일</span>
              </span>
            ) : (
              <span className={styles.kpi__bar} aria-hidden="true">
                <span
                  className={styles.kpi__barFill}
                  style={{ width: `${Math.min(100, (row.value / Math.max(yearKwh, 1)) * 100)}%` }}
                />
              </span>
            )}
          </div>
        );
      })}

      {/* 누적값만으로는 많고 적음을 가늠하기 어려워, 하루·한 달 몫으로 되돌려 함께 적는다 */}
      <dl className={styles.kpi__avg}>
        <div>
          <dt>금월 일평균</dt>
          <dd>
            {dayAverage.value}
            <span className={styles.kpi__avgUnit}>{dayAverage.unit}</span>
          </dd>
        </div>
        <div>
          <dt>금년 월평균</dt>
          <dd>
            {monthAverage.value}
            <span className={styles.kpi__avgUnit}>{monthAverage.unit}</span>
          </dd>
        </div>
      </dl>

      <p className={styles.kpi__foot}>
        전일 {formatNumber(comparison.previous)}kWh 대비 오늘 {formatNumber(comparison.today)}kWh
      </p>
    </div>
  );
}
