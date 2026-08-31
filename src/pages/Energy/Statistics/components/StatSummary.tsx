import { describeDetail, pickEnergyUnit } from '@/mocks/generation';
import { BoltIcon, ClockIcon, LeafIcon } from '@/components/common/Icon';
import { Card } from '@/components/common/Card';
import { KIND_LABEL } from '@/mocks/tree';
import { Reveal } from '@/components/common/Reveal';
import { formatCapacity, formatCarbon, formatNumber, formatPercent } from '@/utils/format';
import type { PeriodKey } from '@/mocks/generation';
import styles from '../Statistics.module.scss';
import type { StatisticsView } from '../hooks/useStatisticsView';

/** 하나 전 같은 기간을 부르는 말 */
const PREVIOUS_LABEL: Record<PeriodKey, string> = {
  day: '전일',
  month: '전월',
  year: '전년',
};

/**
 * 하나 전 같은 기간과의 비교 한 줄 (SFR-007-03).
 *
 * 전에는 「전일 발전량」 이 제 칸을 하나 차지하고 있었다. 그런데 이 값은 혼자 읽을 일이 없다 —
 * 늘 이번 기간과 견주려고 보는 값이라, 칸을 따로 두면 눈이 두 칸을 오가며 크기를 맞대야 했다.
 * 견줄 대상 바로 아래에 붙여 두면 값과 증감이 한자리에서 읽힌다.
 */
function Compare({ period, previous, current, digits, unit }: {
  period: PeriodKey;
  previous: number;
  current: number;
  digits: number;
  unit: string;
}) {
  // 앞 기간이 0 이면 몇 배가 늘었다고 말할 수 없다. 증감률 없이 값만 적는다.
  const ratio = previous > 0 ? (current - previous) / previous : null;

  return (
    <p className={styles.compare}>
      <span className={styles.compare__label}>
        {PREVIOUS_LABEL[period]} {formatNumber(previous, digits)}{unit}
      </span>
      {ratio === null ? null : (
        <span className={ratio >= 0 ? styles.deltaUp : styles.deltaDown}>
          {ratio >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(ratio), 1)}
        </span>
      )}
    </p>
  );
}

/**
 * 발전정보 요약과 환경 기여도 (SFR-007-03/04, SFR-009).
 *
 * 환경 기여도는 본래 따로 놓인 화면이었으나, 발전량과 떨어져 있으면 무엇을 얼마나 아꼈는지
 * 머릿속에서 이어 붙여야 했다. 같은 카드 안에서 바로 잇는다 (회의 결정).
 */
export function StatSummary({ view }: { view: StatisticsView }) {
  const { node, label, period, date, meta, stat, previous, eco } = view;

  const totalUnit = pickEnergyUnit(stat.generationKwh);
  const capacity = formatCapacity(node.capacityKw);
  const carbon = formatCarbon(eco.co2SavedKg);
  // 발전효율 = 같은 일사량에서 기대되는 발전량 대비 실측 (SFR-007-04)
  const efficiency = stat.expectedKwh > 0 ? stat.generationKwh / stat.expectedKwh : 0;

  return (
    <Reveal>
      <Card
        title="발전정보 요약"
        description={`${label} · ${describeDetail(period, date)} 기준입니다.`}
      >
        {/*
          큰 값 셋만 앞세운다 (SFR-007-03/04, SFR-009).

          전에는 여덟 칸이 같은 크기로 늘어서 있었다. 그러면 어느 것이 이 화면의 답인지가 크기로
          드러나지 않아, 여덟 개를 다 읽고 나서야 발전량을 찾게 된다. 먼저 볼 셋을 박스로 세우고
          나머지는 아래 한 줄로 내린다 — 지우지 않는 것은 요구사항이 짚어 둔 값들이기 때문이다.
        */}
        <ul className={styles.metrics}>
          <li className={styles.metric}>
            <span className={styles.metric__icon}><BoltIcon /></span>
            <div className={styles.metric__body}>
              <p className={styles.metric__label}>{meta.label} 발전량</p>
              <p className={styles.metric__value}>
                {formatNumber(stat.generationKwh / totalUnit.divider, 2)}
                <span className={styles.metric__unit}>{totalUnit.unit}</span>
              </p>
              <Compare
                period={period}
                previous={previous.generationKwh / totalUnit.divider}
                current={stat.generationKwh / totalUnit.divider}
                digits={2}
                unit={totalUnit.unit}
              />
            </div>
          </li>

          <li className={styles.metric}>
            <span className={styles.metric__icon}><ClockIcon /></span>
            <div className={styles.metric__body}>
              <p className={styles.metric__label}>발전시간</p>
              <p className={styles.metric__value}>
                {formatNumber(stat.hours, 1)}
                <span className={styles.metric__unit}>h</span>
              </p>
              <Compare period={period} previous={previous.hours} current={stat.hours} digits={1} unit="h" />
            </div>
          </li>

          <li className={styles.metric}>
            <span className={styles.metric__icon}><LeafIcon /></span>
            <div className={styles.metric__body}>
              <p className={styles.metric__label}>탄소 저감량</p>
              <p className={styles.metric__value}>
                {carbon.value}
                <span className={styles.metric__unit}>{carbon.unit}</span>
              </p>
              <p className={styles.compare}>
                <span className={styles.compare__label}>
                  소나무 {formatNumber(eco.pineTrees)}그루·년 · 가구 {formatNumber(eco.households)}가구·월
                </span>
              </p>
            </div>
          </li>
        </ul>

        {/* 박스에 올리지 않은 값 — 요구사항이 짚어 둔 것이라 지우지 않고 한 줄로 남긴다 */}
        <dl className={styles.subInfo}>
          <div>
            <dt>설비용량</dt>
            <dd>{capacity.value}{capacity.unit}</dd>
          </div>
          <div>
            <dt>발전효율</dt>
            <dd>{formatPercent(efficiency, 1)}</dd>
          </div>
          <div>
            <dt>조회 계층</dt>
            <dd>{KIND_LABEL[node.kind]}</dd>
          </div>
        </dl>
      </Card>
    </Reveal>
  );
}
