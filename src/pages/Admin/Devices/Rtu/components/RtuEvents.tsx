import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { RTU_EVENT_LABEL } from '@/mocks/rtu';
import type { Rtu } from '@/interface/asset';
import styles from '@/pages/Admin/Admin.module.scss';

/** 장치 한 대의 교체·이설 내역 (SFR-017-02/03). 최근 것이 위로 온다. */
export function RtuEvents({ rtu, onClose }: { rtu: Rtu; onClose: () => void }) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${rtu.plantName} RTU`}
      description={`${rtu.model} · ${rtu.serial} · 펌웨어 v${rtu.firmware}`}
    >
      <div className={styles.history}>
        {[...rtu.events].reverse().map((event) => (
          <div key={`${event.at}-${event.kind}`} className={styles.historyItem}>
            <span className={styles.historyItem__at}>{event.at}</span>
            <span className={styles.historyItem__body}>
              <Badge tone={event.kind === 'replace' ? 'caution' : 'neutral'}>{RTU_EVENT_LABEL[event.kind]}</Badge>{' '}
              {event.note}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
