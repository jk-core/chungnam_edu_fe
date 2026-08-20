import { useMemo } from 'react';
import { Reveal } from '@/components/common/Reveal';
import { StatCard } from '@/components/common/StatCard';
import styles from '../../Admin.module.scss';
import { readLoginTrend, readMenuUsage, sumViews, TREND_DAYS } from './usageData';

/** 활용 통계 머리 세 값 (SFR-028). */
export function UsageSummary() {
  const usage = useMemo(() => readMenuUsage(), []);
  const trend = useMemo(() => readLoginTrend(), []);

  const totalViews = sumViews(usage);
  const totalLogins = trend.reduce((sum, point) => sum + point.success, 0);
  const top = usage[0];

  return (
    <Reveal>
      <div className={`${styles.summary} ${styles['summary--three']}`}>
        <StatCard label={`${TREND_DAYS}일 화면 조회`} value={totalViews} unit="회" accent />
        <StatCard label={`${TREND_DAYS}일 로그인`} value={totalLogins} unit="회" />
        <StatCard label="가장 많이 쓴 화면" value={top.views} unit={`회 · ${top.menu}`} />
      </div>
    </Reveal>
  );
}
