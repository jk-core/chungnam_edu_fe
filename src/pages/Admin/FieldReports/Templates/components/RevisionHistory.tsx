import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Reveal } from '@/components/common/Reveal';
import useFieldReportStore, { mergeRevisions } from '@/stores/fieldReportStore';
import styles from '@/pages/Admin/Admin.module.scss';

/** 화면에 펴 두는 최근 개정 수 — 그 아래는 굳이 스크롤로 찾지 않는다 */
const RECENT_LIMIT = 10;

/** 양식 개정 이력 (SFR-021-14). 누가 언제 무엇을 고쳐 몇 판으로 냈는지 남는다. */
export function RevisionHistory() {
  const revisions = useFieldReportStore((state) => state.revisions);
  const history = useMemo(() => mergeRevisions(revisions), [revisions]);

  return (
    <Reveal delay={0.06}>
      <Card title="양식 개정 이력" description="누가 언제 무엇을 고쳐 몇 판으로 냈는지 남습니다.">
        <div className={styles.history}>
          {history.slice(0, RECENT_LIMIT).map((item) => (
            <div key={item.id} className={styles.historyItem}>
              <span className={styles.historyItem__at}>{item.at}</span>
              <span className={styles.historyItem__body}>
                <strong>{item.templateLabel} v{item.version}</strong> — {item.note}
              </span>
              <span className={styles.historyItem__at}>{item.actor}</span>
            </div>
          ))}
        </div>
      </Card>
    </Reveal>
  );
}
