import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { RECENT_ALERTS } from '@/mocks/alerts';
import { ArrowUpRightIcon } from '@/components/common/Icon';
import { Badge, SEVERITY_LABEL, SEVERITY_TONE } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { PATH } from '@/routes/routes';
import { Reveal } from '@/components/common/Reveal';
import { OPERATION_LABEL, OPERATION_ORDER } from '@/mocks/status';
import { SCHOOLS, STATUS_COUNT } from '@/mocks/schools';
import { formatNumber, formatPercent } from '@/utils/format';
import type { OperationStatus } from '@/interface/status';
import styles from './StatusSummary.module.scss';

const SEGMENT_COLOR: Record<OperationStatus, string> = {
  running: 'var(--ok)',
  ready: 'var(--brand)',
  degraded: 'var(--caution)',
  fault: 'var(--critical)',
  commLost: 'var(--offline)',
};

const SEGMENTS = OPERATION_ORDER.map((key) => ({
  key,
  label: OPERATION_LABEL[key],
  color: SEGMENT_COLOR[key],
}));

const RADIUS = 68;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TOTAL = SCHOOLS.length;

/** 도넛 각 조각의 길이와 시작 오프셋을 미리 계산한다. */
const ARCS = SEGMENTS.reduce<{ key: OperationStatus; color: string; length: number; offset: number }[]>(
  (acc, segment) => {
    const length = (STATUS_COUNT[segment.key] / TOTAL) * CIRCUMFERENCE;
    const offset = acc.length === 0 ? 0 : acc[acc.length - 1].offset - acc[acc.length - 1].length;

    return [...acc, { key: segment.key, color: segment.color, length, offset }];
  },
  [],
);

export function StatusSummary() {
  const total = TOTAL;

  return (
    <section className={styles.status} aria-labelledby="status-title">
      <div className={styles.status__inner}>
        <Reveal className={styles.status__left}>
          <Card
            eyebrow="Health"
            title={<span id="status-title">설비 운영 상태</span>}
            description={`${formatNumber(total)}개 표본 설비의 실시간 상태 분포입니다.`}
          >
            <div className={styles.status__chartRow}>
              <div className={styles.status__donutWrap}>
                <svg className={styles.status__donut} viewBox="0 0 160 160" aria-hidden="true">
                  <circle cx="80" cy="80" r={RADIUS} className={styles.status__track} />
                  {ARCS.map((arc, index) => (
                    <motion.circle
                      key={arc.key}
                      cx="80"
                      cy="80"
                      r={RADIUS}
                      className={styles.status__segment}
                      stroke={arc.color}
                      strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
                      initial={{ strokeDashoffset: arc.offset + CIRCUMFERENCE, opacity: 0 }}
                      whileInView={{ strokeDashoffset: arc.offset, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: index * 0.12, ease: [0.22, 0.68, 0.32, 1] }}
                    />
                  ))}
                </svg>

                <div className={styles.status__donutCenter}>
                  <p className={styles.status__ratio}>{formatPercent(STATUS_COUNT.running / total, 1)}</p>
                  <p className={styles.status__ratioLabel}>정상 가동</p>
                </div>
              </div>

              <ul className={styles.status__legend}>
                {SEGMENTS.map((segment) => (
                  <li key={segment.key} className={styles.status__legendItem}>
                    <span className={styles.status__dot} style={{ backgroundColor: segment.color }} />
                    <span className={styles.status__legendLabel}>{segment.label}</span>
                    <span className={styles.status__legendValue}>{STATUS_COUNT[segment.key]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.08} className={styles.status__right}>
          <Card
            eyebrow="Alerts"
            title="최근 알림"
            description="검출된 이상 항목을 발생 순으로 보여줍니다."
            action={
              <Link to={PATH.ALERTS_LIST}>
                <Button variant="ghost" size="sm" iconRight={<ArrowUpRightIcon />}>
                  전체 보기
                </Button>
              </Link>
            }
            padding="none"
          >
            <ul className={styles.status__alerts}>
              {RECENT_ALERTS.map((alert) => (
                <li key={alert.id} className={styles.status__alert}>
                  <Badge tone={SEVERITY_TONE[alert.severity]} withDot>
                    {SEVERITY_LABEL[alert.severity]}
                  </Badge>
                  <span className={styles.status__alertBody}>
                    <span className={styles.status__alertSchool}>{alert.schoolName}</span>
                    <span className={styles.status__alertMessage}>{alert.title}</span>
                  </span>
                  <span className={styles.status__alertTime}>
                    {alert.handled ? '조치 완료' : '미조치'}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
