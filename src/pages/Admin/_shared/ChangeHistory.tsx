import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { ChevronDownIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import { EmptyState } from '@/components/common/EmptyState';
import { Reveal } from '@/components/common/Reveal';
import type { ChangeLog, ChangeOperation } from '@/interface/changeLog';
import styles from '@/pages/Admin/Admin.module.scss';

const OPERATION_LABEL: Record<ChangeOperation, string> = {
  create: '신규 등록',
  update: '수정',
  delete: '삭제',
};

interface ChangeHistoryProps {
  title: string;
  rows: ChangeLog[];
}

/**
 * 등록 정보 변경 이력 (SFR-016-06 · SFR-018-04).
 * 발전소·설비·스트링·일사량계·RTU업체·인버터·모듈·사용자가 같은 카드를 쓴다.
 *
 * 한 줄이 한 번의 저장이고, 달라진 항목은 줄을 펼쳐 본다. 몇 건까지 볼지는 서버가 정한다 —
 * 화면이 다시 자르면 서버가 준 것과 보이는 것이 달라져 「왜 안 보이나」를 여기서 찾게 된다.
 */
export function ChangeHistory({ title, rows }: ChangeHistoryProps) {
  // 펼친 줄은 하나만 둔다 — 여럿을 펼치면 카드가 끝없이 길어진다.
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Reveal delay={0.06}>
      <Card title={title} description="누가 언제 무엇을 바꿨는지 저장 단위로 남습니다. 줄을 누르면 바뀐 항목이 펼쳐집니다.">
        {rows.length === 0 ? (
          <EmptyState title="변경 이력이 없습니다" description="등록하거나 고치면 여기에 쌓입니다." />
        ) : (
          <div className={styles.history}>
            {rows.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                isOpen={openId === item.id}
                onToggle={() => setOpenId(openId === item.id ? null : item.id)}
              />
            ))}
          </div>
        )}
      </Card>
    </Reveal>
  );
}

interface HistoryItemProps {
  item: ChangeLog;
  isOpen: boolean;
  onToggle: () => void;
}

function HistoryItem({ item, isOpen, onToggle }: HistoryItemProps) {
  const panelId = `change-${item.id}`;
  /*
    펼칠 것이 있는 줄은 수정뿐이다. 신규 등록·삭제는 대상 자체가 생기거나 사라진 일이라
    「무엇이 무엇으로 바뀌었나」가 없고, 항목 수를 적어 봐야 읽을 것이 없다.
  */
  const isExpandable = item.operation === 'update' && item.fields.length > 0;
  const summary = (
    <>
      <span className={styles.historyItem__at}>{item.at}</span>
      <span className={styles.historyItem__body}>
        <strong>{item.targetName}</strong> · {OPERATION_LABEL[item.operation]}
        {isExpandable ? ` · ${item.fields.length}개 항목` : ''}
      </span>
      <span className={styles.historyItem__at}>{item.actor}</span>
    </>
  );

  // 누를 수 있게 보이면 눌러 보는데, 펼칠 것이 없으면 아무 일도 일어나지 않는다.
  if (!isExpandable) {
    return (
      <div className={styles.historyItem}>
        <div className={styles.historyItem__head}>{summary}</div>
      </div>
    );
  }

  return (
    <div className={styles.historyItem}>
      <button
        type="button"
        className={cn(styles.historyItem__head, styles['historyItem__head--action'])}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        {summary}
        <ChevronDownIcon
          className={cn(styles.historyItem__chevron, { [styles['historyItem__chevron--open']]: isOpen })}
        />
      </button>

      {isOpen ? (
        <dl id={panelId} className={styles.historyItem__fields}>
          {item.fields.map((field, index) => (
            <div key={`${field.label}-${index}`} className={styles.historyItem__field}>
              <dt>{field.label}</dt>
              <dd className={styles.historyItem__diff}>
                <del>{field.before}</del> → <ins>{field.after}</ins>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
