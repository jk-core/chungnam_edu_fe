import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { integrationSummaries } from '@/mocks/integrationLog';
import { Reveal } from '@/components/common/Reveal';
import { formatNumber } from '@/utils/format';
import styles from '../../Admin.module.scss';
import { useIntegrationLogs } from '../hooks/useIntegrationLogs';

/** 이 아래로 떨어지면 붉게 — 눈에 걸려야 하는 성공률 */
const LOW_RATE = 0.9;

/** 전송 대상별 성공률 (SFR-027). */
export function IntegrationSummary() {
  const logs = useIntegrationLogs();
  const summaries = useMemo(() => integrationSummaries(logs), [logs]);

  return (
    <Reveal>
      <div className={`${styles.summary} ${styles['summary--three']}`}>
        {summaries.map((summary) => (
          <Card key={summary.label} padding="lg">
            <p className={styles.toolbar__note}>{summary.label}</p>
            <div className={styles.rate}>
              <span className={styles.rate__track}>
                <span
                  className={`${styles.rate__bar} ${summary.rate < LOW_RATE ? styles['rate__bar--low'] : ''}`}
                  style={{ width: `${Math.round(summary.rate * 100)}%` }}
                />
              </span>
              <span className={styles.rate__value}>{(summary.rate * 100).toFixed(1)}%</span>
            </div>
            <p className={styles.toolbar__note}>
              {formatNumber(summary.success)} / {formatNumber(summary.total)}건 성공
            </p>
          </Card>
        ))}
      </div>
    </Reveal>
  );
}
