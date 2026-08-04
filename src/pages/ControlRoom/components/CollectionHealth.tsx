import { countRtuStatus, INVERTERS } from '@/mocks/equipment';
import { LINK_RATE_TARGET } from '@/mocks/collection';
import { RTU_LABEL, RTU_ORDER, RTU_TONE } from '@/mocks/status';
import { formatNumber, formatPercent } from '@/utils/format';
import type { CollectionStatus } from '@/interface/collection';
import styles from './CollectionHealth.module.scss';

interface CollectionHealthProps {
  /** 발전소별 수집 현황 */
  rows: CollectionStatus[];
  /** 품질 기준(95%)에 못 미쳐 AI 학습에서 빠진 개소 */
  belowThreshold: number;
}

/**
 * 수집 연동 현황 (ECR-007-03 / SFR-001-09 · SFR-002-16 / SFR-012-10 / SFR-017-01).
 *
 * 위의 지표들이 "얼마나 잘 만들고 있나" 를 답한다면, 여기서는 "그 숫자를 믿어도 되나" 를 답한다.
 * 관제 화면에서 가장 먼저 무너지는 것이 수집이고, 연동률 95% 는 이 사업의 검수 기준이자
 * AI 학습에 데이터를 쓸 수 있는지를 가르는 선이라 그 선을 눈금으로 그려 둔다.
 */
export function CollectionHealth({ rows, belowThreshold }: CollectionHealthProps) {
  const expected = rows.reduce((sum, row) => sum + row.expected, 0);
  const missing = rows.reduce((sum, row) => sum + row.missing, 0);
  const rate = expected > 0 ? (expected - missing) / expected : 0;
  const meetsTarget = rate >= LINK_RATE_TARGET;
  const rtu = countRtuStatus(INVERTERS);

  return (
    <div className={styles.health}>
      <p className={styles.health__head}>
        <span className={styles.health__label}>수집 연동 현황</span>
        <span className={meetsTarget ? styles.health__rate : styles['health__rate--low']}>
          {formatPercent(rate, 1)}
        </span>
      </p>

      <div
        className={styles.health__track}
        role="img"
        aria-label={`연동률 ${formatPercent(rate, 1)}, 기준 ${formatPercent(LINK_RATE_TARGET, 0)}`}
      >
        <span
          className={meetsTarget ? styles.health__fill : styles['health__fill--low']}
          style={{ width: `${rate * 100}%` }}
        />
        {/* 검수 기준선 — 이 선을 넘겼는지가 한눈에 보여야 한다 */}
        <span className={styles.health__target} style={{ left: `${LINK_RATE_TARGET * 100}%` }} aria-hidden="true" />
      </div>

      <p className={styles.health__note}>
        기준 {formatPercent(LINK_RATE_TARGET, 0)}
        <span className={meetsTarget ? styles.health__ok : styles.health__warn}>
          {meetsTarget ? '충족' : `${formatPercent(LINK_RATE_TARGET - rate, 1)} 부족`}
        </span>
        <span className={styles.health__missing}>미수신 {formatNumber(missing)}건</span>
      </p>

      {/* 인버터 고장과 수집장치 고장은 원인이 달라 따로 센다 (SFR-009-03) */}
      <ul className={styles.health__rtu}>
        {RTU_ORDER.map((status) => (
          <li key={status} className={styles.health__rtuItem}>
            <span
              className={`${styles.health__dot} ${styles[`health__dot--${RTU_TONE[status]}`]}`}
              aria-hidden="true"
            />
            수집장치 {RTU_LABEL[status]}
            <span className={styles.health__rtuValue}>{formatNumber(rtu[status])}</span>
          </li>
        ))}
        <li className={styles.health__rtuItem}>
          <span className={`${styles.health__dot} ${styles['health__dot--critical']}`} aria-hidden="true" />
          AI 학습 제외
          <span className={styles.health__rtuValue}>{formatNumber(belowThreshold)}</span>
        </li>
      </ul>
    </div>
  );
}
