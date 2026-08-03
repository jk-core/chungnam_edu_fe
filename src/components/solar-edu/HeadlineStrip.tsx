import { CountUp } from '@/components/common/CountUp';
import { formatNumber, formatPercent } from '@/utils/format';
import { kwhToHouseholdDays } from '@/utils/eco';
import type { EduStats } from '@/mocks/solarEdu';
import { STAT_ICONS } from './EduIcons';
import styles from './SolarEdu.module.scss';

/** 표준 교실 한 칸의 넓이(m²) — 넓이를 몸으로 아는 단위로 바꿔 준다. */
const CLASSROOM_M2 = 66;

/** 맑은 날 정오의 일사강도(W/m²). 햇빛 세기를 100점 만점으로 환산하는 기준이다. */
const FULL_SUN_WM2 = 1000;

interface StatItem {
  id: string;
  label: string;
  value: (stats: EduStats) => number;
  unit: string;
  fractionDigits: number;
  /** 단위를 몰라도 크기를 가늠할 수 있게 하는 한 줄 */
  note: (stats: EduStats) => string;
}

/**
 * 늘 떠 있는 보조 지표.
 *
 * 학생이 보는 화면이라 물리 단위만 덩그러니 두지 않는다. 값은 그대로 보이되
 * 그 크기가 얼마만 한지 아는 것으로 바꿔 한 줄 덧붙인다 — 단위를 배우는 것과
 * 크기를 느끼는 것을 함께 가져간다.
 */
const STATS: StatItem[] = [
  {
    id: 'today',
    label: '오늘 만든 전기',
    value: (stats) => stats.todayKwh,
    unit: 'kWh',
    fractionDigits: 0,
    note: (stats) => `네 식구 사는 집 ${formatNumber(kwhToHouseholdDays(stats.todayKwh))}곳이 하루 쓸 양이에요`,
  },
  {
    id: 'irradiance',
    label: '지금 햇빛 세기',
    value: (stats) => (stats.irradianceNow / FULL_SUN_WM2) * 100,
    unit: '점',
    fractionDigits: 0,
    note: (stats) => `맑은 날 정오가 100점이에요 (${formatNumber(stats.irradianceNow)} W/m²)`,
  },
  {
    id: 'insolation',
    label: '해를 모은 시간',
    value: (stats) => stats.equivalentHours,
    unit: '시간',
    fractionDigits: 1,
    note: () => '가장 셀 때로 치면 이만큼 돌린 셈이에요',
  },
  {
    id: 'area',
    label: '햇빛 받는 넓이',
    value: (stats) => stats.moduleArea,
    unit: 'm²',
    fractionDigits: 0,
    note: (stats) => `교실 ${formatNumber(stats.moduleArea / CLASSROOM_M2)}칸만 한 넓이예요`,
  },
];

interface HeadlineStripProps {
  stats: EduStats;
}

/**
 * 화면 위쪽에 고정되는 지금 이 순간의 수치 (SFR-005-01).
 * 아래 그림이 무엇으로 바뀌든 "지금 얼마나 만들고 있는가" 는 계속 보여야 한다.
 */
export function HeadlineStrip({ stats }: HeadlineStripProps) {
  return (
    <div className={styles.headline}>
      <div className={styles.headline__main}>
        <p className={styles.headline__label}>지금 만들고 있는 전기</p>
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
          가장 셀 때({formatNumber(stats.capacityKw)}kW)의 {formatPercent(stats.loadRatio)}만큼 만들고 있어요
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
            <span className={styles.stat__note}>{item.note(stats)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
