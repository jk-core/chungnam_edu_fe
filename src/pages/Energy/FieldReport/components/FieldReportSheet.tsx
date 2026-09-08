import { CHECK_LABEL, CHECKLIST_NOTICE, getTemplate, REPORT_STATE_LABEL } from '@/mocks/fieldReport';
import type { ChecklistItem, FieldReport } from '@/interface/fieldReport';
import { ReportPage } from '@/components/report/ReportPage';
import styles from '@/components/report/Report.module.scss';

/*
  현장보고서 지면 (SFR-021-18).

  월간보고서와 같은 A4 골격(`ReportPage`)을 쓴다 — 두 보고서가 같은 종이 위에 찍혀야
  묶어 놓았을 때 어색하지 않고, PDF 로 뽑는 코드(`useReportPdf`)도 그대로 재사용된다.
  점검 항목 수가 양식마다 크게 달라(2~27문항) 장수는 고정하지 않고 항목을 잘라 담는다.
*/

/** 한 장에 담을 문항 수 */
const ROWS_PER_PAGE = 22;

function paginate(checklist: ChecklistItem[]): ChecklistItem[][] {
  const pages: ChecklistItem[][] = [];

  for (let index = 0; index < checklist.length; index += ROWS_PER_PAGE) {
    pages.push(checklist.slice(index, index + ROWS_PER_PAGE));
  }

  return pages;
}

/** 이 보고서가 몇 장짜리인지 — 미리보기 높이를 잡을 때도 쓴다. */
export function fieldPageCount(report: FieldReport): number {
  return 1 + paginate(report.checklist).length + 1;
}

interface FieldReportSheetProps {
  report: FieldReport;
}

export function FieldReportSheet({ report }: FieldReportSheetProps) {
  const template = getTemplate(report.templateId);
  const checklistPages = paginate(report.checklist);
  const total = 1 + checklistPages.length + 1;
  const title = `${report.schoolName} 현장 점검 보고서`;
  const period = `${report.date} · ${template.label}`;
  const abnormal = report.checklist.filter((item) => item.result === 'abnormal');

  return (
    <>
      <ReportPage title={title} period={period} heading="1. 점검 개요" page={1} total={total} spread>
        <div className={styles.block}>
          <p className={styles.block__head}>
            1) 보고서 정보
            <span className={styles.block__note}>양식 {template.label} v{report.templateVersion}</span>
          </p>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th>발전소</th>
                <td>{report.schoolName}</td>
                <th>점검일</th>
                <td>{report.date}</td>
              </tr>
              <tr>
                <th>점검 유형</th>
                <td>{report.inspectType}점검</td>
                <th>점검 대상</th>
                <td>{report.targetType}</td>
              </tr>
              <tr>
                <th>점검자</th>
                <td>{report.inspector}</td>
                <th>점검자 연락처</th>
                <td>{report.inspectorPhone || '—'}</td>
              </tr>
              <tr>
                <th>보고서 상태</th>
                <td colSpan={3}>{REPORT_STATE_LABEL[report.state]}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.block}>
          <p className={styles.block__head}>
            2) 점검 요약
            <span className={styles.block__note}>미흡 {abnormal.length}건 / 전체 {report.checklist.length}항목</span>
          </p>
          <p className={styles.block__text}>{report.summary}</p>
        </div>
      </ReportPage>

      {checklistPages.map((page, index) => (
        <ReportPage
          key={`check-${index}`}
          title={title}
          period={period}
          heading="2. 점검 항목 결과"
          badge={checklistPages.length > 1 ? `${index + 1}/${checklistPages.length}` : undefined}
          page={index + 2}
          total={total}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '48px' }}>번호</th>
                <th>점검 항목</th>
                <th style={{ width: '90px' }}>결과</th>
                <th style={{ width: '220px' }}>비고</th>
              </tr>
            </thead>
            <tbody>
              {page.map((item, rowIndex) => (
                <tr key={item.id}>
                  <td>{index * ROWS_PER_PAGE + rowIndex + 1}</td>
                  <td>{item.label}</td>
                  <td>{item.result ? CHECK_LABEL[item.result] : '미기재'}</td>
                  <td>{item.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 종이 양식이 표 아래 굵게 적어 두는 문장 — 미흡이 있을 때만 뜬다 */}
          {index === checklistPages.length - 1 && abnormal.length > 0 ? (
            <p className={styles.notice}>{CHECKLIST_NOTICE}</p>
          ) : null}
        </ReportPage>
      ))}

      <ReportPage title={title} period={period} heading="3. 조치 내용 및 처리 이력" page={total} total={total} spread>
        <div className={styles.block}>
          <p className={styles.block__head}>1) 조치 내용</p>
          <p className={styles.block__text}>{report.actionNote || '별도 조치 사항이 없습니다.'}</p>
        </div>

        {report.rejectReason ? (
          <div className={styles.notice}>
            <p className={styles.notice__head}>반려 사유</p>
            <p className={styles.block__text}>{report.rejectReason}</p>
          </div>
        ) : null}

        <div className={styles.block}>
          <p className={styles.block__head}>
            2) 현장 사진
            <span className={styles.block__note}>사진마다 어느 점검 항목 자료인지 함께 적는다</span>
          </p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>파일</th>
                <th style={{ width: '320px' }}>연계 점검 항목</th>
              </tr>
            </thead>
            <tbody>
              {report.photos.length === 0 ? (
                <tr>
                  <td colSpan={2}>첨부된 사진이 없습니다.</td>
                </tr>
              ) : (
                report.photos.map((photo) => (
                  <tr key={photo.id}>
                    <td>{photo.name}</td>
                    <td>{report.checklist.find((item) => item.id === photo.itemId)?.label ?? '보고서 전체'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.block}>
          <p className={styles.block__head}>
            3) 처리 이력
            <span className={styles.block__note}>재제출 {report.resubmitCount}회</span>
          </p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '160px' }}>시각</th>
                <th style={{ width: '140px' }}>처리자</th>
                <th>내용</th>
              </tr>
            </thead>
            <tbody>
              {report.history.map((item, index) => (
                <tr key={`${item.at}-${index}`}>
                  <td>{item.at}</td>
                  <td>{item.actor}</td>
                  <td>{item.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportPage>
    </>
  );
}
