import dayjs from 'dayjs';
import { CO2_PER_KWH, CUMULATIVE, pickEnergyUnit } from '@/mocks/generation';
import { getNode, ROOT_ID } from '@/mocks/tree';
import { getNodeStat } from '@/mocks/nodeStats';
import { LeafIcon } from '@/components/common/Icon';
import { TODAY } from '@/mocks/today';
import { formatCarbon, formatKoCount, formatNumber, formatPercent } from '@/utils/format';
import type { PeriodKey } from '@/mocks/generation';
import type { School } from '@/interface/energy';
import { Panel } from './Panel';
import styles from './YieldPanel.module.scss';

interface YieldPanelProps {
  totals: { todayKwh: number; monthKwh: number; yearKwh: number; capacityKw: number };
  /** 평균 이용률을 표제 줄에 적는 데 쓴다 */
  plants: School[];
}

/** 하나 전 같은 기간을 부르는 말과, 거슬러 올라갈 단위 */
const PREVIOUS: { period: PeriodKey; label: string; unit: 'day' | 'month' | 'year' }[] = [
  { period: 'day', label: '전일', unit: 'day' },
  { period: 'month', label: '전월', unit: 'month' },
  { period: 'year', label: '전년', unit: 'year' },
];

/*
  하나 전 같은 기간과의 증감.
  A 의 실적 판과 같은 값이라 셈도 그대로다 — 관내 전체를 잣대로 잡아야 「어제보다 얼마나」 가
  조회 조건에 흔들리지 않는다. 목업 기준일이 고정이라 값도 고정이므로 그릴 때마다 다시 세지 않는다.
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
 * 발전 실적 (SFR-004-06/07) — 아틀라스 판.
 *
 * 담는 것은 A 와 같다 — 네 기간(금일·금월·금년·누적)의 발전량·발전시간·탄소저감, 그 아래
 * 하나 전 기간과의 증감, 그리고 줄인 탄소를 소나무 그루로 옮긴 한 줄. 그리는 방식만 바꾼다.
 *
 * 이 시안에는 표가 곧 제 결이다 — 괘선을 그은 장부 한 장으로 세운다. 수치 글꼴도 세리프라
 * 인쇄된 실적표처럼 읽힌다. 네 줄을 같은 모양으로 세워 세로로 자릿수가 이어지게 한다.
 */
export function YieldPanel({ totals, plants }: YieldPanelProps) {
  const { todayKwh, monthKwh, yearKwh, capacityKw } = totals;

  // 개소마다의 이용률을 고르게 평균한다 — 큰 설비가 낮아도 작은 설비 여럿이 끌어올릴 수 있다.
  const utilization = plants.length > 0
    ? plants.reduce((sum, plant) => sum + plant.utilization, 0) / plants.length
    : 0;

  // 발전시간 = 발전량 ÷ 설비용량. 크기가 다른 기간을 같은 눈금에 세운다.
  const hoursOf = (kwh: number) => (capacityKw > 0 ? kwh / capacityKw : 0);

  const periods = [
    { key: 'today', label: '금일', kwh: todayKwh },
    { key: 'month', label: '금월', kwh: monthKwh },
    { key: 'year', label: '금년', kwh: yearKwh },
    { key: 'total', label: '누적', kwh: CUMULATIVE.totalKwh },
  ];

  return (
    <Panel title="발전 실적" note={`평균 이용률 ${formatPercent(utilization, 1)}`}>
      <div className={styles.yield}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.table__term}>구분</th>
              <th scope="col">발전량</th>
              <th scope="col">발전시간</th>
              <th scope="col">탄소저감</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((row) => {
              const energy = pickEnergyUnit(row.kwh);
              const carbon = formatCarbon(row.kwh * CO2_PER_KWH);

              return (
                <tr key={row.key}>
                  <th scope="row" className={styles.table__term}>{row.label}</th>
                  <td>
                    {formatNumber(row.kwh / energy.divider, 1)}<span className={styles.table__unit}>{energy.unit}</span>
                  </td>
                  <td>
                    {formatNumber(hoursOf(row.kwh), row.key === 'today' ? 1 : 0)}<span className={styles.table__unit}>h</span>
                  </td>
                  <td>
                    {carbon.value}<span className={styles.table__unit}>{carbon.unit}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className={styles.delta}>
          {DELTAS.map(({ label, ratio }) => (
            <span
              key={label}
              className={styles.delta__item}
              data-way={ratio === null ? undefined : ratio >= 0 ? 'up' : 'down'}
            >
              {label}
              {ratio === null ? ' —' : ` ${ratio >= 0 ? '▲' : '▼'}${formatPercent(Math.abs(ratio), 1)}`}
            </span>
          ))}
        </p>

        <p className={styles.tree}>
          <span className={styles.tree__mark} aria-hidden="true"><LeafIcon width={13} height={13} /></span>
          소나무 <strong>{formatKoCount(CUMULATIVE.pineTrees)}</strong>그루 심은 효과
        </p>
      </div>
    </Panel>
  );
}
