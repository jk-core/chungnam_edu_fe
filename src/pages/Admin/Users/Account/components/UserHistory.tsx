import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Reveal } from '@/components/common/Reveal';
import useAssetStore, { mergeUserChanges } from '@/stores/assetStore';
import styles from '@/pages/Admin/Admin.module.scss';

/** 화면에 펴 두는 최근 변경 수 */
const RECENT_LIMIT = 10;

/**
 * 담당자 변경 이력 (SFR-018-04).
 * 위 검색어를 이력에도 그대로 걸어 준다 — 한 사람만 골라 보게 하려는 것이다.
 */
export function UserHistory({ keyword }: { keyword: string }) {
  const userChanges = useAssetStore((state) => state.userChanges);

  const history = useMemo(() => {
    const all = mergeUserChanges(userChanges);
    const trimmed = keyword.trim();

    return trimmed
      ? all.filter((item) => item.userName.includes(trimmed)
        || item.actor.includes(trimmed)
        || item.field.includes(trimmed))
      : all;
  }, [userChanges, keyword]);

  return (
    <Reveal delay={0.06}>
      <Card
        title="담당자 변경 이력"
        description="누가 언제 어떤 항목을 바꿨는지 남습니다. 위 검색어로 사람을 좁혀 볼 수 있습니다."
      >
        {history.length === 0 ? (
          <EmptyState title="변경 이력이 없습니다" description="검색어를 지우거나 다른 이름으로 찾아 보세요." />
        ) : (
          <div className={styles.history}>
            {history.slice(0, RECENT_LIMIT).map((item) => (
              <div key={item.id} className={styles.historyItem}>
                <span className={styles.historyItem__at}>{item.at}</span>
                <span className={styles.historyItem__body}>
                  <strong>{item.userName}</strong> · {item.field} —{' '}
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
