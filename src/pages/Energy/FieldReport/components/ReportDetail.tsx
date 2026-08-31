import { useRef } from 'react';
import { Button } from '@/components/common/Button';
import { CHECK_LABEL, REPORT_STATE_LABEL, STATE_ORDER } from '@/mocks/fieldReport';
import { cn } from '@/utils/cn';
import { DownloadIcon, PrinterIcon } from '@/components/common/Icon';
import { Modal } from '@/components/common/Modal';
import { usePrint } from '@/hooks/usePrint';
import { useReportPdf } from '@/hooks/useReportPdf';
import type { FieldReport } from '@/interface/fieldReport';
import sheetStyles from '@/components/report/Report.module.scss';
import styles from '../FieldReport.module.scss';
import { useFieldReports } from '../hooks/useFieldReports';
import { useReportWorkflow } from '../hooks/useReportWorkflow';
import { FieldReportSheet } from './FieldReportSheet';

interface ReportDetailProps {
  report: FieldReport;
  onClose: () => void;
  onEdit: (report: FieldReport) => void;
  onReject: (report: FieldReport) => void;
}

/** 보고서 한 건 펼쳐 보기 — 상태 흐름, 점검 항목, 사진, 이력 (SFR-021) */
export function ReportDetail({ report, onClose, onEdit, onReject }: ReportDetailProps) {
  const { permission, templateOf } = useFieldReports();
  const { advance } = useReportWorkflow();
  const print = usePrint();
  const { download, busy } = useReportPdf();
  const sheetRef = useRef<HTMLDivElement>(null);

  const filename = `현장보고서_${report.schoolName}_${report.date}`;
  const current = STATE_ORDER.indexOf(report.state);
  const nextState = current >= 0 && current < STATE_ORDER.length - 1 ? STATE_ORDER[current + 1] : null;

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
            {permission.canReject(report) ? (
              <Button variant="ghost" onClick={() => onReject(report)}>반려</Button>
            ) : null}
            {permission.canAdvance(report) && nextState ? (
              <Button onClick={() => advance(report)}>{REPORT_STATE_LABEL[nextState]}로 처리</Button>
            ) : null}
          </>
        )}
      >
        <div className={styles.post}>
          <div className={styles.stateFlow}>
            {STATE_ORDER.map((state, index) => (
              <span key={state} className={styles.stateFlow__step}>
                <span
                  className={cn({
                    [styles['stateFlow__step--done']]: index < current,
                    [styles['stateFlow__step--current']]: index === current,
                  })}
                >
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

          {/* 어느 설비를 봤는지 (SFR-021-06) */}
          {report.devices.length > 0 ? (
            <div className={styles.checkItem}>
              <p className={styles.checkItem__label}>점검 설비</p>
              {report.devices.map((device) => (
                <p key={device.id} className={styles.post__meta}>
                  <span>{device.kind} · {device.name}</span>
                  {device.note ? <span>{device.note}</span> : null}
                </p>
              ))}
            </div>
          ) : null}

          {report.checklist.map((item, index) => (
            <div key={item.id}>
              {index === 0 || item.section !== report.checklist[index - 1].section ? (
                <p className={styles.sectionHead}>{item.section}</p>
              ) : null}
              <div className={cn(styles.checkItem, { [styles['checkItem--abnormal']]: item.result === 'abnormal' })}>
                <p className={styles.checkItem__label}>{item.label}</p>
                <p className={styles.post__meta}>
                  <span>{item.result ? CHECK_LABEL[item.result] : '미기재'}</span>
                  {item.note ? <span>{item.note}</span> : null}
                </p>
              </div>
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
