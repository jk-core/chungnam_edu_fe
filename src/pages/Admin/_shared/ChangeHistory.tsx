import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Reveal } from '@/components/common/Reveal';
import type { ChangeLog } from '@/interface/changeLog';
import styles from '@/pages/Admin/Admin.module.scss';

/** 한 화면에 늘어놓을 이력 줄 수. 계약도 최근 10건까지만 준다 */
const RECENT_LIMIT = 10;

interface ChangeHistoryProps {
  title: string;
  rows: ChangeLog[];
}

/**
 * 등록 정보 변경 이력 (SFR-016-06 · SFR-018-04).
 * 발전소·설비·스트링·일사량계·인버터·모듈·사용자가 같은 카드를 쓴다.
 */
export function ChangeHistory({ title, rows }: ChangeHistoryProps) {
  return (
    <Reveal delay={0.06}>
      <Card title={title} description="누가 언제 어떤 항목을 바꿨는지 필드 단위로 남습니다.">
        {rows.length === 0 ? (
          <EmptyState title="변경 이력이 없습니다" description="등록하거나 고치면 여기에 쌓입니다." />
        ) : (
          <div className={styles.history}>
            {rows.slice(0, RECENT_LIMIT).map((item) => (
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
