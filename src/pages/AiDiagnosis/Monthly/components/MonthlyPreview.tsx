import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DatePicker } from '@/components/common/DatePicker';
import { DownloadIcon, PrinterIcon } from '@/components/common/Icon';
import { EmptyState } from '@/components/common/EmptyState';
import { formatNumber } from '@/utils/format';
import { usePrint } from '@/hooks/usePrint';
import { useReportPdf } from '@/hooks/useReportPdf';
import { useStatisticsDate } from '@/stores/filterStore';
import sheetStyles from '@/components/report/Report.module.scss';
import { useMonthlyReport } from '../hooks/useMonthlyReport';
import { useSheetScale } from '../hooks/useSheetScale';
import { pageCountOf, ReportSheet } from './ReportSheet';

/**
 * 월간보고서 미리보기와 내보내기 (SFR-019, SFR-020).
 *
 * 머리줄의 내려받기가 아래 지면을 그대로 떠 가므로 둘을 한 컴포넌트에 둔다.
 */
export function MonthlyPreview() {
  const { plant, report, fieldReports, filename } = useMonthlyReport();
  const [date, setDate] = useStatisticsDate();
  const print = usePrint();
  const { download, busy } = useReportPdf();
  const { stageRef, sheetRef, scale, stageHeight } = useSheetScale();

  if (!plant || !report) {
    return (
      <Card padding="none">
        <EmptyState
          title="발전소를 먼저 고르세요"
          description="월간보고서는 발전소 한 곳을 기준으로 만듭니다. 좌측 조회 대상에서 학교를 골라 주세요."
        />
      </Card>
    );
  }

  return (
    <>
      <div className={`${sheetStyles.toolbar} no-print`}>
        <div className={sheetStyles.toolbar__left}>
          <DatePicker label="보고 월" value={date} onChange={setDate} granularity="month" />
          <p className={sheetStyles.toolbar__note}>
            {plant.name} 기준 · 모두 {formatNumber(pageCountOf(report))}장
          </p>
        </div>

        <div className={sheetStyles.toolbar__left}>
          <Button variant="secondary" iconLeft={<PrinterIcon />} onClick={() => print(filename)}>
            인쇄
          </Button>
          <Button iconLeft={<DownloadIcon />} disabled={busy} onClick={() => download(sheetRef, filename)}>
            {busy ? 'PDF 만드는 중…' : 'PDF 내려받기'}
          </Button>
        </div>
      </div>

      {/* 지면 크기는 고정이고 보이는 크기만 줄인다. 줄인 만큼 남는 아래 여백은 감싼 쪽에서 걷는다. */}
      <div ref={stageRef} className={sheetStyles.stage} style={{ height: stageHeight }}>
        <div
          ref={sheetRef}
          className={`${sheetStyles.sheet} ${sheetStyles['sheet--scaled']}`}
          style={{ transform: `scale(${scale})` }}
        >
          <ReportSheet report={report} fieldReports={fieldReports} />
        </div>
      </div>
    </>
  );
}
