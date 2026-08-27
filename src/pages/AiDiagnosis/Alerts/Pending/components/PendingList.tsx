import { motion } from 'motion/react';
import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { useUnsnooze } from '@/stores/faultActionStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { AlertRecord } from '@/interface/alert';
import styles from '../../Alerts.module.scss';
import { AlertDetailModal } from '../../components/AlertDetailModal';
import { detailOfAlert } from '../../components/alarmDetail';
import { isSnoozed, usePendingAlerts } from '../hooks/usePendingAlerts';
import { PendingRow } from './PendingRow';

/** 줄줄이 밀려 나오는 애니메이션이 길어지지 않게, 열한 번째부터는 같은 시점에 나온다 */
const MAX_STAGGER = 10;

/** 아직 열려 있는 알림 목록 (SFR-022-05) */
export function PendingList() {
  const { plantLabel: label } = usePlantScope();
  const { alerts, snoozedUntil } = usePendingAlerts();
  const unsnooze = useUnsnooze();

  const [selected, setSelected] = useState<AlertRecord | null>(null);

  if (alerts.length === 0) {
    return (
      <Card padding="none">
        <EmptyState title="미조치 알림이 없습니다" description={`${label}의 알림은 모두 조치되었습니다.`} />
      </Card>
    );
  }

  return (
    <>
      <ul className={styles.pendingList}>
        {alerts.map((alert, index) => (
          <motion.li
            key={alert.id}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.32, delay: Math.min(index, MAX_STAGGER) * 0.04 }}
          >
            {/* 조치 예정일은 상세 창의 조치 폼에서 함께 받는다 — 재우기만 따로 여는 창을 두지 않는다 */}
            <PendingRow
              alert={alert}
              snoozedUntil={isSnoozed(snoozedUntil[alert.id]) ? snoozedUntil[alert.id] : undefined}
              onOpen={() => setSelected(alert)}
              onWake={() => unsnooze(alert.id)}
            />
          </motion.li>
        ))}
      </ul>

      <AlertDetailModal
        alarm={selected ? detailOfAlert(selected, snoozedUntil[selected.id] ?? null) : null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
