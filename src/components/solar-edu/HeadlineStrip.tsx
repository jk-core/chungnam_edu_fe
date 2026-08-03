import { CountUp } from '@/components/common/CountUp';
import { formatNumber, formatPercent } from '@/utils/format';
import type { EduStats } from '@/mocks/solarEdu';
import { STAT_ICONS } from './EduIcons';
import styles from './SolarEdu.module.scss';

/** 늘 떠 있는 보조 지표. id 는 STAT_ICONS 의 키와 같다. */
const STATS: {
  id: string;
  label: string;
  unit: string;
  fractionDigits: number;
  value: (stats: EduStats) => number;
}[] = [
  { id: 'today', label: '오늘 지금까지', unit: 'kWh', fractionDigits: 0, value: (s) => s.todayKwh },
  { id: 'irradiance', label: '지금 일사강도', unit: 'W/m²', fractionDigits: 0, value: (s) => s.irradianceNow },
  { id: 'insolation', label: '오늘 적산 일사', unit: 'kWh/m²', fractionDigits: 2, value: (s) => s.insolation },
  { id: 'area', label: '모듈 설치 면적', unit: 'm²', fractionDigits: 0, value: (s) => s.moduleArea },
];

interface HeadlineStripProps {
  stats: EduStats;
}

/**
 * 화면 위쪽에 고정되는 지금 이 순간의 수치 (SFR-005-01).
 * 뒤쪽 씬이 무엇으로 넘어가든 "지금 얼마나 만들고 있는가" 는 계속 보여야 해서 회전에서 뺐다.
 */
export function HeadlineStrip({ stats }: HeadlineStripProps) {
  return (
    <div className={styles.headline}>
      <div className={styles.headline__main}>
        <p className={styles.headline__label}>현재 출력</p>
        <p className={styles.headline__figure}>
          <CountUp
            className={styles.headline__value}
            value={stats.outputKw}
            fractionDigits={1}
            startOnView={false}
          />
          <span className={styles.headline__unit}>kW</span>
        </p>
        <p className={styles.headline__note}>
          설비용량 {formatNumber(stats.capacityKw)}kW 의 {formatPercent(stats.loadRatio)}
        </p>
      </div>

      <ul className={styles.headline__list}>
        {STATS.map((item) => (
          <li key={item.id} className={styles.stat}>
            <span className={styles.stat__label}>
              <span className={styles.stat__icon}>{STAT_ICONS[item.id]}</span>
              {item.label}
            </span>
            <span className={styles.stat__value}>
              {formatNumber(item.value(stats), item.fractionDigits)}
              <span className={styles.stat__unit}>{item.unit}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
