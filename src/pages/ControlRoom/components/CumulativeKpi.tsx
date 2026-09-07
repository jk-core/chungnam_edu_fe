import dayjs from 'dayjs';
import { CO2_PER_KWH, CUMULATIVE, pickEnergyUnit } from '@/mocks/generation';
import { formatCarbon, formatKoCount, formatNumber, formatPercent } from '@/utils/format';
import { getNode, ROOT_ID } from '@/mocks/tree';
import { getNodeStat } from '@/mocks/nodeStats';
import { LeafIcon } from '@/components/common/Icon';
import { TODAY } from '@/mocks/today';
import type { PeriodKey } from '@/mocks/generation';
import styles from './CumulativeKpi.module.scss';

interface CumulativeKpiProps {
  /** 조회 대상의 금일·금월·금년 누적(kWh) */
  todayKwh: number;
  monthKwh: number;
  yearKwh: number;
  /** 관내 설비용량 합(kW) — 발전시간을 내는 데 쓴다 */
  capacityKw: number;
}

/** 하나 전 같은 기간을 부르는 말과, 거슬러 올라갈 단위 */
const PREVIOUS: { period: PeriodKey; label: string; unit: 'day' | 'month' | 'year' }[] = [
  { period: 'day', label: '전일', unit: 'day' },
  { period: 'month', label: '전월', unit: 'month' },
  { period: 'year', label: '전년', unit: 'year' },
];

/*
  하나 전 같은 기간과의 증감.

  관내 전체를 기준으로 잰다 — 조회 조건을 좁혀도 「어제보다 얼마나」 라는 물음의 답은 같은
  잣대라야 날씨 탓인지 설비 탓인지를 가늠할 수 있다. 목업 기준일이 고정이라 값도 고정이므로
  화면을 그릴 때마다 다시 셈하지 않는다.
*/
const DELTAS = PREVIOUS.map(({ period, label, unit }) => {
  const root = getNode(ROOT_ID);

  if (!root) return { label, ratio: null };

  const now = getNodeStat(root, period, TODAY.toDate());
  const before = getNodeStat(root, period, dayjs(TODAY).subtract(1, unit).toDate());

  return {
    label,
    ratio: before.generationKwh > 0 ? (now.generationKwh - before.generationKwh) / before.generationKwh : null,
  };
});

/**
 * 발전실적 (SFR-004-06/07).
 *
 * 네 기간을 같은 표에 같은 모양으로 세운다. 금일만 크게 앞세워 보았으나, 한 줄만 생김새가
 * 다르면 세로로 훑을 때 자릿수가 이어지지 않아 오히려 견주기 어렵다.
 *
 * 표 아래로 두 줄을 더 받는다. 하나는 하나 전 같은 기간과의 증감이고, 다른 하나는 줄인
 * 탄소를 소나무 그루로 바꾼 값이다 — 68,276톤은 체감할 수 없지만 몇 그루는 그릴 수 있다
 * (2026-08-21 회의).
 */
export function CumulativeKpi({ todayKwh, monthKwh, yearKwh, capacityKw }: CumulativeKpiProps) {
  // 발전시간 = 발전량 ÷ 설비용량. 크기가 다른 기간을 같은 눈금에 세운다.
  const hoursOf = (kwh: number) => (capacityKw > 0 ? kwh / capacityKw : 0);

  const periods = [
    { key: 'today', label: '금일', kwh: todayKwh },
    { key: 'month', label: '금월', kwh: monthKwh },
    { key: 'year', label: '금년', kwh: yearKwh },
    { key: 'total', label: '누적', kwh: CUMULATIVE.totalKwh },
  ];

  return (
    <div className={styles.kpi}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th />
            <th>발전량</th>
            <th>발전시간</th>
            <th>탄소저감</th>
          </tr>
        </thead>
        <tbody>
          {periods.map((row) => {
            const energy = pickEnergyUnit(row.kwh);
            const carbon = formatCarbon(row.kwh * CO2_PER_KWH);

            return (
              <tr key={row.key}>
                <th scope="row">{row.label}</th>
                <td>
                  {formatNumber(row.kwh / energy.divider, 1)}
                  <span>{energy.unit}</span>
                </td>
                <td>
                  {formatNumber(hoursOf(row.kwh), row.key === 'today' ? 1 : 0)}
                  <span>h</span>
                </td>
                <td>
                  {carbon.value}
                  <span>{carbon.unit}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 하나 전 같은 기간과의 증감 — 세 기간을 한 줄에 나란히 둔다 */}
      <p className={styles.delta}>
        {DELTAS.map(({ label, ratio }) => (
          <span key={label} className={styles.delta__item} data-way={ratio === null ? undefined : ratio >= 0 ? 'up' : 'down'}>
            {label}
            {ratio === null ? ' —' : ` ${ratio >= 0 ? '▲' : '▼'}${formatPercent(Math.abs(ratio), 1)}`}
          </span>
        ))}
      </p>

      {/* 톤은 체감이 어렵다 — 소나무 그루로 바꿔 적는다 */}
      <p className={styles.tree}>
        <span className={styles.tree__mark} aria-hidden="true"><LeafIcon width={13} height={13} /></span>
        소나무 <strong>{formatKoCount(CUMULATIVE.pineTrees)}</strong>그루 심은 효과
      </p>
    </div>
  );
}
