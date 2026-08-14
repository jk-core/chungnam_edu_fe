import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { mergeDeviceChanges } from '@/stores/equipmentStore';
import { Reveal } from '@/components/common/Reveal';
import useEquipmentStore from '@/stores/equipmentStore';
import type { DeviceKind } from '@/interface/deviceMaster';
import styles from '../../Admin.module.scss';

/** 한 화면에 늘어놓을 이력 줄 수 */
const MAX_ROWS = 10;

interface DeviceHistoryProps {
  kind: DeviceKind;
  /** 목록 검색어를 그대로 걸어 준다 — 한 장비만 골라 보게 하려는 것 */
  keyword?: string;
  title: string;
}

/**
 * 장비 등록 정보 변경 이력 (SFR-016-06).
 * 여섯 세그먼트가 같은 카드를 쓰고, 자기 종류의 이력만 걸러 보여 준다.
 */
export function DeviceHistory({ kind, keyword = '', title }: DeviceHistoryProps) {
  const deviceChanges = useEquipmentStore((state) => state.deviceChanges);
  const trimmed = keyword.trim();

  const rows = mergeDeviceChanges(deviceChanges)
    .filter((item) => item.kind === kind)
    .filter((item) => (trimmed
      ? item.targetName.includes(trimmed) || item.field.includes(trimmed) || item.actor.includes(trimmed)
      : true));

  return (
    <Reveal delay={0.06}>
      <Card
        eyebrow="History"
        title={title}
        description="누가 언제 어떤 항목을 바꿨는지 남습니다. 위 검색어로 좁혀 볼 수 있습니다."
      >
        {rows.length === 0 ? (
          <EmptyState title="변경 이력이 없습니다" description="등록하거나 고치면 여기에 쌓입니다." />
        ) : (
          <div className={styles.history}>
            {rows.slice(0, MAX_ROWS).map((item) => (
              <div key={item.id} className={styles.historyItem}>
                <span className={styles.historyItem__at}>{item.at}</span>
                <span className={styles.historyItem__body}>
                  <strong>{item.targetName}</strong> · {item.field} —{' '}
                  <span className={styles.historyItem__diff}>
                    <del>{item.before}</del> → <ins>{item.after}</ins>
                  </span>
                </span>
                <span className={styles.historyItem__at}>{item.actor}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Reveal>
  );
}
