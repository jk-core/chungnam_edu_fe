import { Badge, SEVERITY_LABEL, SEVERITY_TONE } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import type { FaultCode } from '@/interface/equipment';
import styles from '../AiDiagnosis.module.scss';

interface FaultCodeModalProps {
  fault: FaultCode | null;
  /** 어느 설비에서 나온 코드인지 */
  deviceLabel?: string;
  onClose: () => void;
}

/** 고장코드의 짐작되는 원인과 조치 방법을 펼쳐 준다. */
export function FaultCodeModal({ fault, deviceLabel, onClose }: FaultCodeModalProps) {
  return (
    <Modal
      isOpen={Boolean(fault)}
      onClose={onClose}
      title={fault ? `${fault.code} · ${fault.label}` : ''}
      description={deviceLabel}
    >
      {fault ? (
        <div className={styles.fault}>
          <Badge tone={SEVERITY_TONE[fault.severity]} withDot>
            {SEVERITY_LABEL[fault.severity]}
          </Badge>

          <section className={styles.fault__block}>
            <h3 className={styles.fault__blockTitle}>짐작되는 원인</h3>
            <ul className={styles.fault__list}>
              {fault.causes.map((cause) => (
                <li key={cause}>{cause}</li>
              ))}
            </ul>
          </section>

          <section className={`${styles.fault__block} ${styles['fault__block--action']}`}>
            <h3 className={styles.fault__blockTitle}>조치 방법</h3>
            <ol className={styles.fault__list}>
              {fault.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ol>
          </section>
        </div>
      ) : null}
    </Modal>
  );
}
