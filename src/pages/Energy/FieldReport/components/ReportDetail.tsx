import { useRef } from 'react';
import { Button } from '@/components/common/Button';
import { CHECK_LABEL, REPORT_STATE_LABEL, STATE_ORDER } from '@/mocks/fieldReport';
import { cn } from '@/utils/cn';
import { DownloadIcon, PrinterIcon } from '@/components/common/Icon';
import { Modal } from '@/components/common/Modal';
import { ReportStateActions } from '@/components/report/ReportStateActions';
import { usePrint } from '@/hooks/usePrint';
import { useReportPdf } from '@/hooks/useReportPdf';
import type { FieldReport, ReportState } from '@/interface/fieldReport';
import sheetStyles from '@/components/report/Report.module.scss';
import styles from '../FieldReport.module.scss';
import { useFieldReports } from '../hooks/useFieldReports';
import { useReportWorkflow } from '../hooks/useReportWorkflow';
import { FieldReportSheet } from './FieldReportSheet';

interface ReportDetailProps {
  report: FieldReport;
  onClose: () => void;
  onEdit: (report: FieldReport) => void;
  /** 반려는 사유를 받아야 해서 바깥이 창을 연다 */
  onManage: (report: FieldReport, state: ReportState) => void;
}

/** 보고서 한 건 펼쳐 보기 — 상태, 점검 항목, 사진, 이력 (SFR-021) */
export function ReportDetail({ report, onClose, onEdit, onManage }: ReportDetailProps) {
  const { permission, templateOf } = useFieldReports();
  const { setState } = useReportWorkflow();
  const print = usePrint();
  const { download, busy } = useReportPdf();
  const sheetRef = useRef<HTMLDivElement>(null);

  const filename = `현장보고서_${report.schoolName}_${report.date}`;

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        size="lg"
        title={`${report.schoolName} 점검 보고서`}
        description={
          `${report.date} · ${templateOf(report.templateId).label} v${report.templateVersion} · 점검자 ${report.inspector}`
        }
        footer={(
          <>
            <Button
              variant="secondary"
              iconLeft={<DownloadIcon />}
              onClick={() => download(sheetRef, filename)}
              disabled={busy}
            >
              {busy ? '내려받는 중…' : 'PDF 내려받기'}
            </Button>
            <Button variant="secondary" iconLeft={<PrinterIcon />} onClick={() => print(filename)}>인쇄</Button>
            {permission.canEdit(report) ? (
              <Button variant="secondary" onClick={() => onEdit(report)}>
                {report.state === 'rejected' ? '수정 후 재기안' : '수정'}
              </Button>
            ) : null}
            {permission.canSubmit(report) ? (
              <Button onClick={() => setState(report, 'submitted')}>제출</Button>
            ) : null}
            {permission.canManage(report) ? (
              <ReportStateActions report={report} onSelect={onManage} />
            ) : null}
          </>
        )}
      >
        <div className={styles.post}>
          {/*
            지나온 자취가 아니라 지금 어디인지만 짚는다 — 검토를 거쳐야 확인하는 것이 아니라
            셋 중 하나를 곧바로 매기므로, 앞 칸을 「지나왔다」 고 칠하면 없던 일을 그린다.
          */}
          <div className={styles.stateFlow}>
            {STATE_ORDER.map((state) => (
              <span key={state} className={styles.stateFlow__step}>
                <span className={cn({ [styles['stateFlow__step--current']]: state === report.state })}>
                  {REPORT_STATE_LABEL[state]}
                </span>
              </span>
            ))}
          </div>

          {report.state === 'rejected' ? (
            <div className={styles.reject}>
              <p className={styles.reject__title}>반려됨 · 고쳐서 다시 제출해 주세요</p>
              <p className={styles.post__body}>{report.rejectReason}</p>
            </div>
          ) : null}

          <p className={styles.post__body}>{report.summary}</p>

          {report.checklist.map((item) => (
            <div
              key={item.id}
              className={cn(styles.checkItem, { [styles['checkItem--abnormal']]: item.result === 'abnormal' })}
            >
              <p className={styles.checkItem__label}>{item.label}</p>
              <p className={styles.post__meta}>
                <span>{item.result ? CHECK_LABEL[item.result] : '미기재'}</span>
                {item.note ? <span>{item.note}</span> : null}
              </p>
            </div>
          ))}

          {report.actionNote ? (
            <div className={styles.checkItem}>
              <p className={styles.checkItem__label}>조치 내용</p>
              <p className={styles.post__body}>{report.actionNote}</p>
            </div>
          ) : null}

          {report.photos.length > 0 ? (
            <div className={styles.post__files}>
              {report.photos.map((photo) => {
                const linked = report.checklist.find((item) => item.id === photo.itemId);

                return (
                  <span key={photo.id} className={styles.post__file}>
                    {photo.name}
                    {linked ? <small className={styles.post__fileItem}>{linked.label}</small> : null}
                  </span>
                );
              })}
            </div>
          ) : null}

          <div className={styles.comments}>
            {report.history.map((item, index) => (
              <div key={`${item.at}-${index}`} className={styles.comment}>
                <p className={styles.comment__head}>
                  <span className={styles.comment__author}>{item.actor}</span>
                  <span>{item.at}</span>
                </p>
                <p className={styles.comment__body}>{item.change}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/*
        PDF 로 담을 지면. 화면 밖에 세워 두고 내려받을 때만 캡처한다 (SFR-021-18) —
        `display: none` 이면 크기가 0이라 캡처되지 않아 자리만 밀어 둔다.
      */}
      <div aria-hidden className={styles.offscreen}>
        <div ref={sheetRef} className={sheetStyles.sheet}>
          <FieldReportSheet report={report} />
        </div>
      </div>
    </>
  );
}
