import { Reveal } from '@/components/common/Reveal';
import { StatCard } from '@/components/common/StatCard';
import { formatNumber } from '@/utils/format';
import styles from '../../Alerts.module.scss';
import type { summarize } from '../../hooks/useAlertFilters';

/** 걸린 조건 안에서 지금 무엇이 밀려 있는지 (SFR-022-03) */
export function AlertSummary({ stats }: { stats: ReturnType<typeof summarize> }) {
  return (
    <div className={styles.grid3}>
      <Reveal>
        <StatCard
          label="미조치 알림"
          value={stats.pending}
          unit="건"
          meterLabel={`경고 ${stats.pendingCritical}건`}
          meter={stats.total > 0 ? stats.pending / stats.total : 0}
        />
      </Reveal>
      <Reveal delay={0.06}>
        <StatCard
          label="처리율"
          value={stats.handledRate * 100}
          unit="%"
          fractionDigits={1}
          meter={stats.handledRate}
          meterLabel={`전체 ${formatNumber(stats.total)}건`}
          accent
        />
      </Reveal>
      <Reveal delay={0.12}>
        <StatCard
          label="평균 처리 시간"
          value={stats.averageMinutes / 60}
          unit="시간"
          fractionDigits={1}
          meterLabel={`수동 조치 ${stats.manualCount}건`}
        />
      </Reveal>
    </div>
  );
}
