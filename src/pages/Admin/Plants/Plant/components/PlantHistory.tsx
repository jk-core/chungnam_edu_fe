import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Reveal } from '@/components/common/Reveal';
import useAssetStore, { mergeChanges } from '@/stores/assetStore';
import styles from '@/pages/Admin/Admin.module.scss';

/** 화면에 펴 두는 최근 변경 수 */
const RECENT_LIMIT = 8;

/** 발전소 수정 이력 (SFR-016-06) */
export function PlantHistory() {
  const changes = useAssetStore((state) => state.changes);
  const history = useMemo(() => mergeChanges(changes), [changes]);

  return (
    <Reveal delay={0.06}>
      <Card title="수정 이력" description="누가 언제 무엇을 바꿨는지 필드 단위로 남습니다.">
        <div className={styles.history}>
          {history.slice(0, RECENT_LIMIT).map((item) => (
            <div key={item.id} className={styles.historyItem}>
              <span className={styles.historyItem__at}>{item.at}</span>
              <span className={styles.historyItem__body}>
                <strong>{item.plantName}</strong> · {item.field} —{' '}
                <span className={styles.historyItem__diff}>
                  <del>{item.before}</del> → <ins>{item.after}</ins>
                </span>
              </span>
              <span className={styles.historyItem__at}>{item.actor}</span>
            </div>
          ))}
        </div>
      </Card>
    </Reveal>
  );
}
