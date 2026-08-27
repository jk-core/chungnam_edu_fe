import { Badge, SEVERITY_LABEL, SEVERITY_TONE } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { alertDurationMinutes } from '@/mocks/alerts';
import { formatDuration } from '@/utils/format';
import { getFaultCode } from '@/mocks/equipment';
import type { AlertRecord } from '@/interface/alert';
import styles from '../Alerts.module.scss';

interface AlertDetailModalProps {
  alert: AlertRecord | null;
  onClose: () => void;
}

export function AlertDetailModal({ alert, onClose }: AlertDetailModalProps) {
  const fault = getFaultCode(alert?.faultCode ?? null);

  return (
    <Modal
      isOpen={Boolean(alert)}
      onClose={onClose}
      size="lg"
      title={alert?.title ?? ''}
      description={alert ? `${alert.schoolName} · ${alert.deviceName}` : undefined}
    >
      {alert ? (
        <div className={styles.detail}>
          <div className={styles.detail__badges}>
            <Badge tone={SEVERITY_TONE[alert.severity]} withDot>
              {SEVERITY_LABEL[alert.severity]}
            </Badge>
            <Badge tone={alert.handled ? 'ok' : 'critical'} withDot>
              {alert.handled ? '조치 완료' : '미조치'}
            </Badge>
            {alert.faultCode ? <Badge tone="brand">{alert.faultCode}</Badge> : null}
          </div>

          <p className={styles.detail__description}>{alert.description}</p>

          <dl className={styles.detail__meta}>
            <div>
              <dt>발생 일시</dt>
              <dd>{alert.occurredAt}</dd>
            </div>
            <div>
              <dt>해소 일시</dt>
              <dd>{alert.resolvedAt ?? '진행 중'}</dd>
            </div>
            <div>
              <dt>지속 시간</dt>
              <dd className={alert.handled ? undefined : styles.deltaDown}>
                {formatDuration(alertDurationMinutes(alert))}
              </dd>
            </div>
            <div>
              <dt>설비</dt>
              <dd>
                {alert.schoolName} · {alert.deviceName}
              </dd>
            </div>
          </dl>

          <section className={styles.detail__block}>
            <h3 className={styles.detail__blockTitle}>조치 내역</h3>
            {alert.handled ? (
              <dl className={styles.detail__action}>
                <div>
                  <dt>조치자</dt>
                  <dd>{alert.handler}</dd>
                </div>
                <div>
                  <dt>조치 방식</dt>
                  <dd>{alert.manual ? '현장 수동 조치' : '자동 복구'}</dd>
                </div>
                <div>
                  <dt>조치 내용</dt>
                  <dd>{alert.actionNote}</dd>
                </div>
              </dl>
            ) : (
              <p className={styles.detail__pending}>아직 조치되지 않았습니다. 담당자 배정이 필요합니다.</p>
            )}
          </section>

          {fault ? (
            <section className={`${styles.detail__block} ${styles['detail__block--fault']}`}>
              <h3 className={styles.detail__blockTitle}>
                {fault.label} · {fault.summary}
              </h3>
              <div className={styles.detail__faultGrid}>
                <div>
                  <p className={styles.detail__faultLabel}>고장 코드 문제</p>
                  <ul className={styles.detail__faultList}>
                    {fault.description.map((cause) => (
                      <li key={cause}>{cause}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className={styles.detail__faultLabel}>조치 방안</p>
                  <ul className={styles.detail__faultList}>
                    {fault.plan.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
