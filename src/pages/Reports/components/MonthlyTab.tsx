import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DatePicker } from '@/components/common/DatePicker';
import { DownloadIcon, PrinterIcon } from '@/components/common/Icon';
import { EmptyState } from '@/components/common/EmptyState';
import { formatNumber } from '@/utils/format';
import { getMonthlyReport } from '@/mocks/reports';
import { usePlantScope } from '@/hooks/usePlantScope';
import { usePrint } from '@/hooks/usePrint';
import { useReportPdf } from '@/hooks/useReportPdf';
import { useStatisticsDate } from '@/stores/filterStore';
import useFieldReportStore, { mergeFieldReports } from '@/stores/fieldReportStore';
import styles from '../Reports.module.scss';
import { pageCountOf, ReportSheet } from './monthly/ReportSheet';
import sheetStyles from './monthly/Report.module.scss';

/** 지면 실제 너비(px). `Report.module.scss` 의 $page-width 와 같은 값이다. */
const PAGE_WIDTH = 1050;

/**
 * 설비별 월간보고서 자동 생성 (SFR-019, SFR-020).
 *
 * 화면을 위에서 아래로 잇는 대신 A4 지면을 여러 장 쌓는다 — 어느 장에 무엇이 실리는지
 * 미리 보이고, 그대로 PDF 한 장씩으로 떨어진다. 인버터가 늘면 진단 장이 함께 늘어난다.
 */
export function MonthlyTab() {
  const { plant } = usePlantScope();
  const [date, setDate] = useStatisticsDate();
  const print = usePrint();
  const { download, busy } = useReportPdf();
  const sheetRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const fieldCreated = useFieldReportStore((state) => state.created);
  const fieldPatched = useFieldReportStore((state) => state.patched);
  const fieldDeleted = useFieldReportStore((state) => state.deleted);

  const cursor = dayjs(date);
  const year = cursor.year();
  const month = cursor.month();
  // `getMonthlyReport` 는 결과를 캐시하므로 매 렌더 불러도 다시 셈하지 않는다.
  const report = plant ? getMonthlyReport(plant.id, year, month) : null;

  /*
    이 달, 이 발전소에서 올라온 현장보고서 (SFR-019-07).
    작성중인 것은 뺀다 — 아직 제출도 안 한 내용이 월간보고서에 실리면 안 된다.
  */
  const monthKey = cursor.format('YYYY-MM');
  const fieldReports = plant
    ? mergeFieldReports(fieldCreated, fieldPatched, fieldDeleted)
      .filter((item) => item.schoolId === plant.id && item.state !== 'draft' && item.date.startsWith(monthKey))
      .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  /*
    지면은 A4 실제 크기라 화면보다 넓다. 창에 맞춰 통째로 줄여 보여 준다 —
    가로로 밀어 가며 읽는 보고서는 미리보기 구실을 못한다.
  */
  const [scale, setScale] = useState(1);
  // 줄인 만큼 실제 높이도 당겨야 아래에 빈 자리가 남지 않는다 — `transform` 은 자리를 줄이지 않는다.
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    const sheet = sheetRef.current;

    if (!stage || !sheet) return;

    const apply = () => {
      // 창이 아니라 본문 폭을 잰다 — 좌측 조회 대상 패널이 자리를 차지한다.
      setScale(Math.min(1, stage.clientWidth / PAGE_WIDTH));
      setSheetHeight(sheet.scrollHeight);
    };

    apply();

    const observer = new ResizeObserver(apply);

    observer.observe(stage);
    observer.observe(sheet);

    return () => observer.disconnect();
  }, []);

  if (!plant || !report) {
    return (
      <div className={styles.tab}>
        <Card padding="none">
          <EmptyState
            title="발전소를 먼저 고르세요"
            description="월간보고서는 발전소 한 곳을 기준으로 만듭니다. 좌측 조회 대상에서 학교를 골라 주세요."
          />
        </Card>
      </div>
    );
  }

  const filename = `월간보고서_${plant.name}_${cursor.format('YYYYMM')}`;
  const pages = pageCountOf(report);

  return (
    <div className={styles.tab}>
      <div className={`${sheetStyles.toolbar} no-print`}>
        <div className={sheetStyles.toolbar__left}>
          <DatePicker label="보고 월" value={date} onChange={setDate} granularity="month" />
          <p className={sheetStyles.toolbar__note}>
            {plant.name} 기준 · 모두 {formatNumber(pages)}장
          </p>
        </div>

        <div className={sheetStyles.toolbar__left}>
          <Button variant="secondary" iconLeft={<PrinterIcon />} onClick={() => print(filename)}>
            인쇄
          </Button>
          <Button
            iconLeft={<DownloadIcon />}
            disabled={busy}
            onClick={() => download(sheetRef, filename)}
          >
            {busy ? 'PDF 만드는 중…' : 'PDF 내려받기'}
          </Button>
        </div>
      </div>

      {/* 지면 크기는 고정이고 보이는 크기만 줄인다. 줄인 만큼 남는 아래 여백은 감싼 쪽에서 걷는다. */}
      <div
        ref={stageRef}
        className={sheetStyles.stage}
        style={{ height: sheetHeight > 0 ? sheetHeight * scale : undefined }}
      >
        <div
          ref={sheetRef}
          className={`${sheetStyles.sheet} ${sheetStyles['sheet--scaled']}`}
          style={{ transform: `scale(${scale})` }}
        >
          <ReportSheet report={report} fieldReports={fieldReports} />
        </div>
      </div>
    </div>
  );
}
