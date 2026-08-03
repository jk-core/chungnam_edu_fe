import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { pickEnergyUnit } from '@/mocks/generation';
import styles from '../Statistics.module.scss';

interface InverterTimeTableProps {
  labels: string[];
  /** 시점별 발전량(kWh) */
  generation: number[];
  /** 시점별 일사량(kWh/m²) */
  irradiance: number[];
  /** 기간 전체의 기대 발전량(kWh) — 시점별로 일사량에 맞춰 나눠 준다. */
  expectedKwh: number;
  caption: string;
}

/**
 * 시점을 가로로 펼친 세부 데이터 표.
 * 지표가 행, 시각이 열이라 "어느 시점에 어떤 지표가 무너졌는지" 를 좌우로 훑어볼 수 있다.
 */
export function InverterTimeTable({ labels, generation, irradiance, expectedKwh, caption }: InverterTimeTableProps) {
  const { divider, unit } = pickEnergyUnit(Math.max(...generation, 1));

  // 기대 발전량은 그 시점의 일사량에 비례한다. 기간 합계를 일사량 비율대로 흩뿌려,
  // 햇빛이 많이 든 시점일수록 기대치도 높게 잡히도록 한다.
  const totalIrradiance = irradiance.reduce((sum, value) => sum + value, 0);
  const expected = irradiance.map((value) => (totalIrradiance > 0 ? (value / totalIrradiance) * expectedKwh : 0));

  const rows = [
    {
      key: 'generation',
      label: '발전량',
      unit,
      values: generation.map((value) => formatNumber(value / divider, 2)),
      strong: true,
      // 기대치에 못 미친 시점을 짚어 준다 — 표를 좌우로 훑을 때 눈이 먼저 가야 할 칸이다.
      lowAt: generation.map((value, index) => expected[index] > 0 && value < expected[index]),
    },
    {
      key: 'expected',
      label: '기대 발전량',
      unit,
      values: expected.map((value) => formatNumber(value / divider, 2)),
      strong: false,
    },
    {
      key: 'irradiance',
      label: '일사량',
      unit: 'kWh/m²',
      values: irradiance.map((value) => formatNumber(value, 2)),
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
                    [styles['timeTable__cell--low']]: Boolean(row.lowAt?.[index]),
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
