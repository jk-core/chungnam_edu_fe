import { CountUp } from '@/components/common/CountUp';
import { EFFICIENCY_METRICS, IMPACT_ITEMS, MODULE_SPEC } from '@/mocks/solarEdu';
import { cn } from '@/utils/cn';
import { formatNumber, formatPercent } from '@/utils/format';
import type { EduStats } from '@/mocks/solarEdu';
import { EFFICIENCY_ICONS, IMPACT_ICONS } from './EduIcons';
import { EfficiencyLadder } from './EfficiencyLadder';
import styles from './SolarEdu.module.scss';

interface MeaningSceneProps {
  scopeLabel: string;
  stats: EduStats;
}

/**
 * 씬 3 — 효율과 의미 (SFR-005-04/05/06).
 *
 * 지표 넉 장과 환산 넉 장은 각각 한 화면을 채우기엔 성글어, "얼마나 잘 만들었나 →
 * 그래서 무슨 뜻인가" 라는 한 흐름으로 이어 붙였다. 위아래 두 단이 그 순서다.
 */
export function MeaningScene({ scopeLabel, stats }: MeaningSceneProps) {
  // 계산식 카드에 붙일 오늘의 값. 순서는 EFFICIENCY_METRICS 와 같다.
  const values: Record<string, string> = {
    // 모듈 사양값이다 — 실측 출력에는 배선·인버터 손실이 함께 섞여 있어 따로 표기한다.
    conversion: formatPercent(MODULE_SPEC.efficiency),
    pr: formatPercent(stats.pr),
    cf: formatPercent(stats.capacityFactor),
    hours: `${formatNumber(stats.equivalentHours, 1)}시간`,
  };

  return (
    <div className={styles.scene}>
      <section className={cn(styles.band, styles['band--tall'])}>
        <p className={styles.band__head}>
          얼마나 잘 만들고 있나 — 햇빛의 {formatPercent(MODULE_SPEC.efficiency)}만 전기가 되고(열과 반사로
          흩어짐), 그 전기가 기대치의 {formatPercent(stats.pr)}로 나왔습니다(오염·음영·배선 손실). 오늘{' '}
          {formatNumber(stats.dayKwh)}kWh, 기대되는 값은 {formatNumber(stats.expectedKwh)}kWh 입니다.
        </p>

        {/* 넉 장의 지표가 각각 무엇을 나누는 비율인지, 깎이는 자리를 한 줄로 잇는다 */}
        <EfficiencyLadder stats={stats} />

        <div className={styles.band__grid}>
          {EFFICIENCY_METRICS.map((metric) => (
            <div key={metric.id} className={styles.term}>
              <p className={styles.term__name}>
                <span className={styles.term__icon}>{EFFICIENCY_ICONS[metric.id]}</span>
                {metric.term}
              </p>
              <p className={styles.term__value}>{values[metric.id]}</p>
              <p className={styles.term__formula}>{metric.formula}</p>
              <p className={styles.term__body}>{metric.meaning}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.band}>
        <p className={styles.band__head}>
          그래서 무슨 뜻인가 — {scopeLabel} 이 오늘 만든 전기를 다른 단위로 바꾸면 이렇게 됩니다.
        </p>
        <div className={styles.band__grid}>
          {IMPACT_ITEMS.map((item) => (
            <div key={item.id} className={styles.impact}>
              <span className={styles.impact__icon}>{IMPACT_ICONS[item.id]}</span>
              <p className={styles.impact__label}>{item.label}</p>
              <p className={styles.impact__value}>
                <CountUp
                  value={stats.dayKwh * item.perKwh}
                  fractionDigits={item.fractionDigits}
                  startOnView={false}
                />
                <span className={styles.impact__unit}>{item.unit}</span>
              </p>
              <p className={styles.impact__basis}>{item.basis}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
