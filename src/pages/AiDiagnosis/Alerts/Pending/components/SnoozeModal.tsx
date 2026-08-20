import dayjs from 'dayjs';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { DatePicker } from '@/components/common/DatePicker';
import { Modal } from '@/components/common/Modal';
import { daysAhead } from '@/mocks/today';
import { toast } from '@/stores/toastStore';
import { useSnooze } from '@/stores/faultActionStore';
import type { AlertRecord } from '@/interface/alert';
import styles from '../../Alerts.module.scss';

interface SnoozeModalProps {
  alert: AlertRecord;
  onClose: () => void;
}

/** 사흘 뒤를 첫 제안으로 둔다 — 현장 방문을 잡기에 가장 흔한 간격이다 */
const DEFAULT_AHEAD_DAYS = 3;

/** 조치 예정일 등록 (SFR-022-05). 정한 날까지 그 알림을 목록 아래로 접어 둔다. */
export function SnoozeModal({ alert, onClose }: SnoozeModalProps) {
  const snooze = useSnooze();
  const [plannedAt, setPlannedAt] = useState(() => new Date(daysAhead(DEFAULT_AHEAD_DAYS)));

  const commit = () => {
    const until = dayjs(plannedAt).format('YYYY-MM-DD');

    snooze(alert.id, until);
    toast.success(`${until} 까지 이 알림을 접어 둡니다.`);
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="조치 예정일 등록"
      description={`${alert.schoolName} · ${alert.deviceName} — 정한 날짜까지 이 알림을 목록 아래로 접어 둡니다.`}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button onClick={commit}>등록</Button>
        </>
      )}
    >
      <div className={styles.snoozeForm}>
        <DatePicker value={plannedAt} onChange={setPlannedAt} granularity="day" label="조치 예정일" />
        <p className={styles.snooze__note}>
          예정일이 지나면 다시 위로 올라옵니다. 그 전에 조치를 마쳤다면 &lsquo;다시 알림&rsquo;으로 되돌릴 수
          있습니다.
        </p>
      </div>
    </Modal>
  );
}
