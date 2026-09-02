import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { pickEnergyUnit } from '@/mocks/generation';
import styles from '../Statistics.module.scss';

interface InverterTimeTableProps {
  labels: string[];
  /** 시점별 발전량(kWh) */
  generation: number[];
  /** 시점별 일사강도(W/m²) — 계측은 시점 강도만 하고 적산하지 않는다 */
  irradiance: number[];
  caption: string;
}

/**
 * 시점을 가로로 펼친 세부 데이터 표.
 * 지표가 행, 시각이 열이라 "어느 시점에 어떤 지표가 무너졌는지" 를 좌우로 훑어볼 수 있다.
 */
export function InverterTimeTable({ labels, generation, irradiance, caption }: InverterTimeTableProps) {
  const { divider, unit } = pickEnergyUnit(Math.max(...generation, 1));

  const rows = [
    {
      key: 'generation',
      label: '발전량',
      unit,
      values: generation.map((value) => formatNumber(value / divider, 2)),
      strong: true,
    },
    {
      key: 'irradiance',
      label: '일사강도',
      unit: 'W/m²',
      values: irradiance.map((value) => formatNumber(value)),
      strong: false,
    },
  ];

  return (
    <div className={styles.timeTableWrap}>
      <table className={styles.timeTable}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={styles.timeTable__corner}>
              지표
            </th>
            {labels.map((label) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row" className={styles.timeTable__metric}>
                <span className={styles.timeTable__metricName}>{row.label}</span>
                <span className={styles.timeTable__metricUnit}>{row.unit}</span>
              </th>
              {row.values.map((value, index) => (
                <td
                  key={`${row.key}-${labels[index]}`}
                  className={cn(styles.timeTable__cell, {
                    [styles['timeTable__cell--strong']]: row.strong,
                  })}
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
