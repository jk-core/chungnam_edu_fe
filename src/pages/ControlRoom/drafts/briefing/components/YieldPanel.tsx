import dayjs from 'dayjs';
import { LeafIcon } from '@/components/common/Icon';
import { CO2_PER_KWH, CUMULATIVE, pickEnergyUnit } from '@/mocks/generation';
import { getNode, ROOT_ID } from '@/mocks/tree';
import { getNodeStat } from '@/mocks/nodeStats';
import { TODAY } from '@/mocks/today';
import { formatCarbon, formatKoCount, formatNumber, formatPercent } from '@/utils/format';
import type { PeriodKey } from '@/mocks/generation';
import type { School } from '@/interface/energy';
import { Panel } from './Panel';
import styles from './YieldPanel.module.scss';

interface Totals {
  todayKwh: number;
  monthKwh: number;
  yearKwh: number;
  capacityKw: number;
}

/** 하나 전 같은 기간을 부르는 말과 거슬러 올라갈 단위 */
const PREVIOUS: { period: PeriodKey; label: string; unit: 'day' | 'month' | 'year' }[] = [
  { period: 'day', label: '전일', unit: 'day' },
  { period: 'month', label: '전월', unit: 'month' },
  { period: 'year', label: '전년', unit: 'year' },
];

/*
  하나 전 같은 기간과의 증감.

  관내 전체를 기준으로 잰다 — 「어제보다 얼마나」 의 답은 같은 잣대라야 날씨 탓인지 설비 탓인지를
  가늠할 수 있다. 목업 기준일이 고정이라 값도 고정이므로 화면을 그릴 때마다 다시 셈하지 않는다.
*/
const DELTAS = PREVIOUS.map(({ period, label, unit }) => {
  const root = getNode(ROOT_ID);

  if (!root) return { label, ratio: null as number | null };

  const now = getNodeStat(root, period, TODAY.toDate());
  const before = getNodeStat(root, period, dayjs(TODAY).subtract(1, unit).toDate());

  return {
    label,
    ratio: before.generationKwh > 0 ? (now.generationKwh - before.generationKwh) / before.generationKwh : null,
  };
});

/**
 * 발전 실적 (SFR-004-06/07).
 *
 * 가로로 납작한 칸이다. A 는 네 기간을 표로 세로로 쌓았는데, 이 칸에서는 그 표가 넘친다.
 * 네 기간을 가로로 나란히 펴 각각 발전량을 큰 수치로 세우고 그 아래 발전시간·탄소저감을
 * 한 줄로 붙인다. 금일 칸만 호박 밑줄로 짚어 오늘치가 먼저 눈에 들게 한다.
 *
 * 판 아래 한 줄은 하나 전 같은 기간과의 증감과, 줄인 탄소를 소나무 그루로 바꾼 값이다 —
 * 68,276톤은 체감할 수 없지만 몇 그루는 그릴 수 있다 (2026-08-21 회의).
 */
export function YieldPanel({ plants, totals }: { plants: School[]; totals: Totals }) {
  // 개소마다의 이용률을 고르게 평균한다 — 큰 설비가 낮아도 작은 설비 여럿이 끌어올릴 수 있다.
  const utilization = plants.length > 0
    ? plants.reduce((sum, plant) => sum + plant.utilization, 0) / plants.length
    : 0;

  // 발전시간 = 발전량 ÷ 설비용량. 크기가 다른 기간을 같은 눈금에 세운다.
  const hoursOf = (kwh: number) => (totals.capacityKw > 0 ? kwh / totals.capacityKw : 0);

  const periods = [
    { key: 'today', label: '금일', kwh: totals.todayKwh },
    { key: 'month', label: '금월', kwh: totals.monthKwh },
    { key: 'year', label: '금년', kwh: totals.yearKwh },
    { key: 'total', label: '누적', kwh: CUMULATIVE.totalKwh },
  ];

  return (
    <Panel title="발전 실적" note={`평균 이용률 ${formatPercent(utilization, 1)}`}>
      <div className={styles.yield}>
        <ol className={styles.yield__periods}>
          {periods.map((row) => {
            const energy = pickEnergyUnit(row.kwh);
            const carbon = formatCarbon(row.kwh * CO2_PER_KWH);

            return (
              <li key={row.key} className={styles.period} data-lead={row.key === 'today' ? '' : undefined}>
                <p className={styles.period__label}>{row.label}</p>
                <p className={styles.period__value}>
                  {formatNumber(row.kwh / energy.divider, 1)}
                  <span className={styles.period__unit}>{energy.unit}</span>
                </p>
                <p className={styles.period__meta}>
                  {formatNumber(hoursOf(row.kwh), row.key === 'today' ? 1 : 0)}h
                  <span className={styles.period__sep} aria-hidden="true">·</span>
                  {carbon.value}
                  {carbon.unit}
                </p>
              </li>
            );
          })}
        </ol>

        <div className={styles.yield__foot}>
          <p className={styles.deltas}>
            {DELTAS.map(({ label, ratio }) => (
              <span
                key={label}
                className={styles.deltas__item}
                data-way={ratio === null ? undefined : ratio >= 0 ? 'up' : 'down'}
              >
                {label}
                {ratio === null ? ' —' : ` ${ratio >= 0 ? '▲' : '▼'}${formatPercent(Math.abs(ratio), 1)}`}
              </span>
            ))}
          </p>

          <p className={styles.tree}>
            <span className={styles.tree__mark} aria-hidden="true"><LeafIcon width={13} height={13} /></span>
            소나무 <strong>{formatKoCount(CUMULATIVE.pineTrees)}</strong>그루
          </p>
        </div>
      </div>
    </Panel>
  );
}
