import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { REPORT_STATE_LABEL } from '@/mocks/fieldReport';
import { Reveal } from '@/components/common/Reveal';
import type { BadgeTone } from '@/components/common/Badge';
import type { FieldReport, ReportState } from '@/interface/fieldReport';
import styles from '../FieldReport.module.scss';
import { useFieldReports } from '../hooks/useFieldReports';

const STATE_TONE: Record<ReportState, BadgeTone> = {
  draft: 'neutral',
  submitted: 'brand',
  reviewing: 'caution',
  confirmed: 'ok',
  rejected: 'critical',
};

interface ReportListProps {
  reports: FieldReport[];
  /** 나란히 견줄 대상으로 고른 보고서 (SFR-021-12) */
  picked: string[];
  onTogglePick: (id: string) => void;
  onOpen: (id: string) => void;
}

/** 점검 보고서 목록 (SFR-021) */
export function ReportList({ reports, picked, onTogglePick, onOpen }: ReportListProps) {
  const { templateOf } = useFieldReports();

  return (
    <Reveal delay={0.06}>
      <Card
        title="점검 보고서 목록"
        description="보고서를 누르면 점검 항목과 상태 이력을 펼쳐 봅니다. 왼쪽 칸으로 두 건을 골라 나란히 비교할 수 있습니다."
      >
        {reports.length === 0 ? (
          <EmptyState title="보고서가 없습니다" description="위 버튼으로 첫 보고서를 작성해 보세요." />
        ) : (
          <div className={styles.list}>
            {reports.map((report) => (
              <div key={report.id} className={styles.rowWrap}>
                <label className={styles.rowPick}>
                  <input
                    type="checkbox"
                    checked={picked.includes(report.id)}
                    onChange={() => onTogglePick(report.id)}
                  />
                  <span className={styles.rowPick__label}>{report.date} 보고서 비교 대상으로 고르기</span>
                </label>
                <button type="button" className={styles.row} onClick={() => onOpen(report.id)}>
                  <span className={styles.row__body}>
                    <span className={styles.row__title}>
                      {report.schoolName} · {templateOf(report.templateId).label}
                    </span>
                    <span className={styles.row__meta}>
                      {report.date} · 점검자 {report.inspector} · {report.summary}
                    </span>
                  </span>
                  <span className={styles.row__right}>
                    <Badge tone="neutral">{report.inspectType}</Badge>
                    <Badge tone={STATE_TONE[report.state]} withDot>
                      {REPORT_STATE_LABEL[report.state]}
                    </Badge>
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Reveal>
  );
}
