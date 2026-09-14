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
  관내 전체를 잣대로 삼는다 — 조회를 좁혀도 「어제보다」 의 답은 같은 자로 재야 날씨 탓인지
  설비 탓인지 가늠된다. 목업 기준일이 고정이라 값도 고정이므로 그릴 때마다 다시 세지 않는다.
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
 * 발전 실적 (SFR-004-06/07) — 청사진 판.
 *
 * A 는 세 열(발전량·발전시간·탄소)짜리 표였지만 320px 레일에서는 세 수치를 한 줄에 나란히
 * 두면 자릿수가 겹친다. 여기서는 기간 하나를 **두 단**으로 접는다 — 기간 이름과 발전량을 굵게
 * 위에 세우고, 발전시간·탄소는 그 아래 도면의 부기(附記)처럼 작게 깐다. 네 기간이 파선으로
 * 갈려 세로로 훑을 때 자릿수가 이어진다.
 */
export function YieldPanel({ plants, totals }: { plants: School[]; totals: Totals }) {
  // 발전시간 = 발전량 ÷ 설비용량. 크기가 다른 기간을 같은 눈금에 세운다.
  const hoursOf = (kwh: number) => (totals.capacityKw > 0 ? kwh / totals.capacityKw : 0);

  // 개소마다의 이용률을 고르게 평균한다 — 큰 설비가 낮아도 작은 설비 여럿이 끌어올릴 수 있다.
  const utilization = plants.length > 0
    ? plants.reduce((sum, plant) => sum + plant.utilization, 0) / plants.length
    : 0;

  const periods = [
    { key: 'today', label: '금일', kwh: totals.todayKwh, digits: 1 },
    { key: 'month', label: '금월', kwh: totals.monthKwh, digits: 0 },
    { key: 'year', label: '금년', kwh: totals.yearKwh, digits: 0 },
    { key: 'total', label: '누계', kwh: CUMULATIVE.totalKwh, digits: 0 },
  ];

  return (
    <Panel title="발전 실적" note={`평균 이용률 ${formatPercent(utilization, 1)}`}>
      <ol className={styles.yield}>
        {periods.map((row) => {
          const energy = pickEnergyUnit(row.kwh);
          const carbon = formatCarbon(row.kwh * CO2_PER_KWH);

          return (
            <li key={row.key} className={styles.yield__row}>
              <p className={styles.yield__top}>
                <span className={styles.yield__label}>{row.label}</span>
                <span className={styles.yield__amount}>
                  {formatNumber(row.kwh / energy.divider, 1)}
                  <span className={styles.yield__unit}>{energy.unit}</span>
                </span>
              </p>
              <p className={styles.yield__sub}>
                <span>발전시간 <strong>{formatNumber(hoursOf(row.kwh), row.digits)}</strong>h</span>
                <span>탄소 <strong>{carbon.value}</strong>{carbon.unit}</span>
              </p>
            </li>
          );
        })}
      </ol>

      {/* 하나 전 같은 기간과의 증감 — 세 기간을 한 줄에 */}
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
        <LeafIcon width={12} height={12} className={styles.tree__mark} />
        소나무 <strong>{formatKoCount(CUMULATIVE.pineTrees)}</strong>그루 심은 효과
      </p>
    </Panel>
  );
}
