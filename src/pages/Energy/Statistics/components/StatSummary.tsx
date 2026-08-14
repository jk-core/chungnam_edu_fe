import { describeDetail, DETAIL_UNIT, pickEnergyUnit } from '@/mocks/generation';
import { Card } from '@/components/common/Card';
import { KIND_LABEL } from '@/mocks/tree';
import { Reveal } from '@/components/common/Reveal';
import { formatCapacity, formatCarbon, formatNumber, formatPercent } from '@/utils/format';
import type { PeriodKey } from '@/mocks/generation';
import styles from '../Statistics.module.scss';
import type { StatisticsView } from '../hooks/useStatisticsView';

const PREVIOUS_LABEL: Record<PeriodKey, string> = {
  day: '전일 발전량',
  month: '전월 발전량',
  year: '전년 발전량',
};

/**
 * 발전정보 요약과 환경 기여도 (SFR-007-03/04, SFR-009).
 *
 * 환경 기여도는 본래 따로 놓인 화면이었으나, 발전량과 떨어져 있으면 무엇을 얼마나 아꼈는지
 * 머릿속에서 이어 붙여야 했다. 같은 카드 안에서 바로 잇는다 (회의 결정).
 */
export function StatSummary({ view }: { view: StatisticsView }) {
  const { node, label, period, date, meta, stat, previous, detail, eco, childKind } = view;

  const totalUnit = pickEnergyUnit(stat.generationKwh);
  const capacity = formatCapacity(node.capacityKw);
  const carbon = formatCarbon(eco.co2SavedKg);
  const compareRatio = previous.generationKwh > 0
    ? (stat.generationKwh - previous.generationKwh) / previous.generationKwh
    : 0;
  // 발전효율 = 같은 일사량에서 기대되는 발전량 대비 실측 (SFR-007-04)
  const efficiency = stat.expectedKwh > 0 ? stat.generationKwh / stat.expectedKwh : 0;
  const bestIndex = stat.series.reduce((best, value, index) => (value > stat.series[best] ? index : best), 0);
  // 발전량이 왜 많고 적었는지는 그날 들어온 햇빛의 양이 답한다.
  const totalIrradiance = detail.reduce((sum, point) => sum + point.irradiance, 0);

  return (
    <Reveal>
      <Card
        eyebrow="Summary"
        title="발전정보 요약"
        description={`${label} · ${describeDetail(period, date)} 기준입니다.`}
      >
        <dl className={styles.infoGrid}>
          <div>
            <dt>설비용량</dt>
            <dd>
              {capacity.value}
              <span className={styles.infoGrid__unit}>{capacity.unit}</span>
            </dd>
          </div>
          <div>
            <dt>{meta.label} 발전량</dt>
            <dd className={styles.infoGrid__accent}>
              {formatNumber(stat.generationKwh / totalUnit.divider, 2)}
              <span className={styles.infoGrid__unit}>{totalUnit.unit}</span>
            </dd>
          </div>
          {/* 같은 기간 하나 전과의 비교 (SFR-007-03) */}
          <div>
            <dt>{PREVIOUS_LABEL[period]}</dt>
            <dd>
              {formatNumber(previous.generationKwh / totalUnit.divider, 2)}
              <span className={styles.infoGrid__unit}>{totalUnit.unit}</span>
              <span className={compareRatio >= 0 ? styles.deltaUp : styles.deltaDown}>
                {compareRatio >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(compareRatio), 1)}
              </span>
            </dd>
          </div>
          {/* 발전효율 = 실측 ÷ 같은 일사량에서 기대되는 발전량 (SFR-007-04) */}
          <div>
            <dt>발전효율</dt>
            <dd>
              {formatPercent(efficiency, 1)}
              <span className={styles.infoGrid__unit}>실측/기대</span>
            </dd>
          </div>
          <div>
            <dt>일사량</dt>
            <dd>
              {formatNumber(totalIrradiance, 2)}
              <span className={styles.infoGrid__unit}>kWh/m²</span>
            </dd>
          </div>
          <div>
            <dt>등가 발전시간</dt>
            <dd>
              {formatNumber(stat.hours, 1)}
              <span className={styles.infoGrid__unit}>h</span>
            </dd>
          </div>
          <div>
            <dt>조회 계층</dt>
            <dd>{KIND_LABEL[node.kind]}</dd>
          </div>
          <div>
            <dt>최고 발전 {DETAIL_UNIT[period]}</dt>
            <dd>
              {detail[bestIndex]?.label ?? '—'}
              <span className={styles.infoGrid__unit}>
                {formatNumber(stat.series[bestIndex] / totalUnit.divider, 2)}
                {totalUnit.unit}
              </span>
            </dd>
          </div>
          <div>
            <dt>하위 설비</dt>
            <dd>
              {childKind ? formatNumber(node.childIds.length) : '—'}
              <span className={styles.infoGrid__unit}>
                {childKind ? `${KIND_LABEL[childKind]}` : '최말단'}
              </span>
            </dd>
          </div>
        </dl>

        <dl className={styles.ecoGrid}>
          <div>
            <dt>CO₂ 절감량</dt>
            <dd>
              {carbon.value}
              <span className={styles.infoGrid__unit}>{carbon.unit}</span>
            </dd>
          </div>
          <div>
            <dt>소나무 환산</dt>
            <dd>
              {formatNumber(eco.pineTrees)}
              <span className={styles.infoGrid__unit}>그루·년</span>
            </dd>
          </div>
          <div>
            <dt>가구 사용량 환산</dt>
            <dd>
              {formatNumber(eco.households)}
              <span className={styles.infoGrid__unit}>가구·년</span>
            </dd>
          </div>
        </dl>
      </Card>
    </Reveal>
  );
}
