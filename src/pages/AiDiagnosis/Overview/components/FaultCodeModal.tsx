import { Badge, SEVERITY_LABEL, SEVERITY_TONE } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { SNOW_SUSPICION_NOTE, withSnowSuspicion } from '@/mocks/faultCodes';
import type { FaultCode } from '@/interface/equipment';
import styles from '../../AiDiagnosis.module.scss';

interface FaultCodeModalProps {
  fault: FaultCode | null;
  /** 어느 설비에서 나온 코드인지 */
  deviceLabel?: string;
  /** 눈이 의심되는 날이면 적설 예시와 특이사항을 덧붙인다 */
  isSnow?: boolean;
  onClose: () => void;
}

/**
 * 고장코드를 사용자 눈높이로 풀어 준다 (SFR-013-06).
 * 무엇이 잘못됐는지, 어떻게 조치하는지, 실제로 어떤 모습인지를 한자리에서 보여 준다.
 */
export function FaultCodeModal({ fault, deviceLabel, isSnow = false, onClose }: FaultCodeModalProps) {
  const info = fault ? withSnowSuspicion(fault, isSnow) : null;

  return (
    <Modal
      isOpen={Boolean(info)}
      onClose={onClose}
      size="lg"
      title={info ? `${info.label} · ${info.summary}` : ''}
      description={deviceLabel}
    >
      {info ? (
        <div className={styles.fault}>
          <Badge tone={SEVERITY_TONE[info.severity]} withDot>
            {SEVERITY_LABEL[info.severity]}
          </Badge>

          <section className={styles.fault__block}>
            <h3 className={styles.fault__blockTitle}>고장 코드 문제</h3>
            <ul className={styles.fault__list}>
              {info.description.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          <section className={`${styles.fault__block} ${styles['fault__block--action']}`}>
            <h3 className={styles.fault__blockTitle}>조치 방안</h3>
            <ol className={styles.fault__list}>
              {info.plan.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </section>

          {isSnow ? (
            <section className={styles.fault__block}>
              <h3 className={styles.fault__blockTitle}>특이사항</h3>
              <ul className={styles.fault__list}>
                <li>{SNOW_SUSPICION_NOTE}</li>
              </ul>
            </section>
          ) : null}

          {info.images.length > 0 ? (
            <section className={styles.fault__block}>
              <h3 className={styles.fault__blockTitle}>참고 이미지</h3>
              <div className={styles.fault__images}>
                {info.images.map((src) => (
                  <img
                    key={src}
                    className={styles.fault__image}
                    src={src}
                    alt={`${info.label} 참고 사진`}
                    loading="lazy"
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
