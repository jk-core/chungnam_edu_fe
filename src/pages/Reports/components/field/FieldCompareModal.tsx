import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { CHECK_LABEL, REPORT_STATE_LABEL } from '@/mocks/fieldReport';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { cn } from '@/utils/cn';
import type { FieldReport } from '@/interface/fieldReport';
import styles from '../../Reports.module.scss';

interface FieldCompareModalProps {
  isOpen: boolean;
  /** 견줄 두 건. 오래된 쪽을 왼쪽에 세운다 */
  reports: FieldReport[];
  onClose: () => void;
}

/**
 * 과거 점검 보고서 비교 (SFR-021-12).
 *
 * 두 건을 좌우로 놓고 **결과가 갈린 줄만** 물들인다 — 27문항짜리 양식에서 전부 색을 칠하면
 * 무엇이 달라졌는지 되레 안 보인다. 양식이 서로 다르면 견줄 축이 없으므로 그 사실을 먼저 알린다.
 */
export function FieldCompareModal({ isOpen, reports, onClose }: FieldCompareModalProps) {
  const [left, right] = [...reports].sort((a, b) => a.date.localeCompare(b.date));
  const sameTemplate = Boolean(left && right && left.templateId === right.templateId);
  // 문항 id 가 같은 자리를 짝지어 준다. 양식이 같아도 개정으로 문항이 늘 수 있어 왼쪽을 기준으로 편다.
  const rows = sameTemplate
    ? left.checklist.map((item) => ({
      item,
      leftResult: item.result,
      rightResult: right.checklist.find((other) => other.id === item.id)?.result ?? null,
    }))
    : [];
  const diffCount = rows.filter((row) => row.leftResult !== row.rightResult).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="점검 보고서 비교"
      description={left && right ? `${left.date} ↔ ${right.date} · 달라진 항목 ${diffCount}건` : undefined}
      footer={<Button variant="secondary" onClick={onClose}>닫기</Button>}
    >
      {!left || !right ? null : (
        <div className={styles.post}>
          <div className={styles.compare}>
            {[left, right].map((report) => (
              <div key={report.id}>
                <p className={styles.compare__head}>
                  {report.date}
                  <span className={styles.compare__meta}>
                    점검자 {report.inspector} · {REPORT_STATE_LABEL[report.state]}
                  </span>
                </p>
                <p className={styles.row__meta}>{report.summary}</p>
                <p className={styles.row__meta}>
                  {report.devices.length > 0
                    ? `점검 설비 ${report.devices.map((device) => device.name).join(', ')}`
                    : '점검 설비 미기재'}
                </p>
              </div>
            ))}
          </div>

          {!sameTemplate ? (
            <EmptyState
              title="양식이 서로 달라 항목을 견줄 수 없습니다"
              description={`${left.date} 는 다른 양식으로 작성됐습니다. 같은 양식으로 쓴 보고서끼리 골라 주세요.`}
            />
          ) : (
            <>
              <p className={styles.compareLegend}>
                <span>왼쪽 {left.date}</span>
                <span>오른쪽 {right.date}</span>
                <Badge tone="caution">결과가 달라진 줄만 배경을 칠했습니다</Badge>
              </p>

              {rows.map((row, index) => (
                <div key={row.item.id}>
                  {index === 0 || row.item.section !== rows[index - 1].item.section ? (
                    <p className={styles.sectionHead}>{row.item.section}</p>
                  ) : null}
                  <div
                    className={cn(styles.compareRow, {
                      [styles['compareRow--diff']]: row.leftResult !== row.rightResult,
                    })}
                  >
                    <span className={styles.compareRow__label}>{row.item.label}</span>
                    <span className={styles.compareRow__value}>
                      {row.leftResult ? CHECK_LABEL[row.leftResult] : '미기재'}
                    </span>
                    <span className={styles.compareRow__value}>
                      {row.rightResult ? CHECK_LABEL[row.rightResult] : '미기재'}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
