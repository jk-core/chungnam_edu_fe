import { CountUp } from '@/components/common/CountUp';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { statOf } from '@/mocks/eduContent';
import type { HeadlineContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { STAT_ICONS } from './EduIcons';
import styles from './SolarEdu.module.scss';
import type { CSSProperties } from 'react';

interface HeadlineStripProps {
  stats: EduStats;
  content: HeadlineContent;
  /** 초등 판은 멀리서도 읽히게 한 단계 키운다 */
  large?: boolean;
}

/**
 * 화면 위쪽에 고정되는 지금 이 순간의 수치 (SFR-005-01).
 * 아래 그림이 무엇으로 바뀌든 "지금 얼마나 만들고 있는가" 는 계속 보여야 한다.
 *
 * 보조 지표는 눈높이에 따라 개수가 다르다 — 물리 단위만 덩그러니 두지 않고,
 * 그 크기가 얼마만 한지 아는 것으로 바꿔 한 줄 덧붙인다.
 */
export function HeadlineStrip({ stats, content, large }: HeadlineStripProps) {
  return (
    <div className={cn(styles.headline, { [styles['headline--large']]: large })}>
      <div className={styles.headline__main}>
        <p className={styles.headline__label}>{content.mainLabel}</p>
        <p className={styles.headline__figure}>
          <CountUp
            className={styles.headline__value}
            value={stats.outputKw}
            fractionDigits={1}
            startOnView={false}
          />
          <span className={styles.headline__unit}>kW</span>
        </p>
        {/*
          지금 출력이 설비가 낼 수 있는 최대의 몇 할인지.
          숫자만 있으면 300kW 가 센지 약한지 견줄 것이 없다. 높이는 늘 같게 두어 값이
          오르내려도 아래 그림이 밀리지 않는다.
        */}
        <span className={styles.headline__gauge} role="img" aria-label={`설비 최대 대비 ${Math.round(stats.loadRatio * 100)}퍼센트`}>
          <span
            className={styles.headline__gaugeFill}
            style={{ width: `${Math.min(100, Math.max(2, stats.loadRatio * 100))}%` }}
          />
        </span>

        <p className={styles.headline__note}>{content.mainNote(stats)}</p>
      </div>

      {/* 열 수를 항목 수에서 끌어온다 — 스타일 쪽에 숫자를 박아 두면 지표를 늘릴 때 두 곳을 고쳐야 한다 */}
      <ul
        className={styles.headline__list}
        style={{ '--stat-count': content.statIds.length } as CSSProperties}
      >
        {content.statIds.map((id) => {
          const item = statOf(id, content.copy?.[id]);

          return (
            <li key={id} className={styles.stat}>
              <span className={styles.stat__label}>
                <span className={styles.stat__icon}>{STAT_ICONS[id]}</span>
                {item.label}
              </span>
              <span className={styles.stat__value}>
                {formatNumber(item.value(stats), item.fractionDigits)}
                <span className={styles.stat__unit}>{item.unit}</span>
              </span>
              <span className={styles.stat__note}>{item.note(stats)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
