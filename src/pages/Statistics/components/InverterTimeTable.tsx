import { cn } from '@/utils/cn';
import { formatNumber, formatPercent } from '@/utils/format';
import { pickEnergyUnit } from '@/mocks/generation';
import styles from '../Statistics.module.scss';

interface InverterTimeTableProps {
  labels: string[];
  /** 시점별 발전량(kWh) */
  generation: number[];
  /** 시점별 일사량(kWh/m²) */
  irradiance: number[];
  /** 대상 발전성능비 — 기대 발전량을 되짚는 데 쓴다. */
  pr: number;
  caption: string;
}

/**
 * 시점을 가로로 펼친 세부 데이터 표.
 * 지표가 행, 시각이 열이라 "어느 시점에 어떤 지표가 무너졌는지" 를 좌우로 훑어볼 수 있다.
 */
export function InverterTimeTable({ labels, generation, irradiance, pr, caption }: InverterTimeTableProps) {
  const { divider, unit } = pickEnergyUnit(Math.max(...generation, 1));

  // 기대 발전량은 그 시점의 일사량에 비례한다.
  // 합계가 "총발전량 ÷ PR" 이 되도록 정규화해, 구간 전체 달성률은 PR 과 맞으면서
  // 시점별로는 일사량 대비 실측이 얼마나 따라갔는지가 드러나게 한다.
  const totalGeneration = generation.reduce((sum, value) => sum + value, 0);
  const totalIrradiance = irradiance.reduce((sum, value) => sum + value, 0);
  const scale = totalIrradiance > 0 && pr > 0 ? totalGeneration / pr / totalIrradiance : 0;
  const expected = irradiance.map((value) => value * scale);

  const rows = [
    {
      key: 'generation',
      label: '발전량',
      unit,
      values: generation.map((value) => formatNumber(value / divider, 2)),
      strong: true,
    },
    {
      key: 'expected',
      label: '기대 발전량',
      unit,
      values: expected.map((value) => formatNumber(value / divider, 2)),
      strong: false,
    },
    {
      key: 'achievement',
      label: '달성률',
      unit: '%',
      values: generation.map((value, index) =>
        expected[index] > 0 ? formatPercent(value / expected[index], 1) : '—',
      ),
      strong: false,
      // 달성률이 80% 아래면 짚어 준다.
      lowAt: generation.map((value, index) => expected[index] > 0 && value / expected[index] < 0.8),
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
