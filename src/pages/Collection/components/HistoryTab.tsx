import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DataCalendar } from '@/components/common/DataCalendar';
import { EmptyState } from '@/components/common/EmptyState';
import { ExcelIcon } from '@/components/common/Icon';
import { getInverters } from '@/mocks/equipment';
import { getMonthDays, getYearMonths } from '@/mocks/weather';
import { getOperationRaw, RAW_STATE_LABEL, sortRawDesc } from '@/mocks/operationRaw';
import { getRtuOf } from '@/mocks/rtu';
import { Pagination } from '@/components/common/Pagination';
import { MSG } from '@/configs/messages';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { exportCsv } from '@/utils/export';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useCollectionDate } from '@/stores/filterStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { CsvColumn } from '@/utils/export';
import type { OperationRaw } from '@/interface/operation';
import shared from '../Collection.module.scss';
import { CollectionFilter } from './CollectionFilter';
import { OperationTable } from './OperationTable';
import styles from './HistoryTab.module.scss';

/** 달력을 어느 단위로 펼지 (SFR-010-01/02) */
type CalendarView = 'day' | 'month' | 'year';

const CALENDAR_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'day', label: '일별' },
  { value: 'month', label: '월별' },
  { value: 'year', label: '연도별' },
];

/** 한 화면에 펼 계측 줄 수 — 하루치는 수백 건이라 나눠 본다. */
const PAGE_SIZE = 30;

/**
 * 인버터별 통신주기 운전이력 (SFR-009, SFR-010).
 * 인버터를 골라 전압·전류·전력 기록을 그래프나 표로 보고 엑셀로 내려받는다.
 */
export function HistoryTab() {
  const { plant, inverter, label } = usePlantScope();
  const [date, setDate] = useCollectionDate();
  const [calendarView, setCalendarView] = useState<CalendarView>('day');
  // 페이지는 조회 대상·날짜에 묶어 둔다. 대상이 바뀌면 저절로 첫 쪽으로 돌아간다.
  const [pageState, setPageState] = useState({ key: '', page: 1 });

  const inverters = useMemo(() => getInverters(plant?.id ?? null), [plant?.id]);
  // 좌측 조회 대상에서 인버터까지 좁혔으면 그 인버터, 발전소까지면 첫 인버터를 편다.
  const selected = inverter ?? inverters[0] ?? null;

  const raw = useMemo(() => (selected ? sortRawDesc(getOperationRaw(selected, date)) : []), [selected, date]);

  const pageKey = `${selected?.id ?? ''}-${dayjs(date).format('YYYYMMDD')}`;
  const page = pageState.key === pageKey ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ key: pageKey, page: next });

  const pageCount = Math.max(1, Math.ceil(raw.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = raw.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const plantLabel = plant?.name ?? label;
  const interval = plant ? getRtuOf(plant.id)?.intervalMinutes ?? null : null;
  const intervalLabel = interval ? `${interval}분 · 하루 ${formatNumber(raw.length)}건` : `하루 ${formatNumber(raw.length)}건`;

  const calendar = useMemo(() => {
    const cursor = dayjs(date);

    return {
      year: cursor.year(),
      month: cursor.month(),
      days: getMonthDays(plant?.id ?? null, cursor.year(), cursor.month()),
      months: getYearMonths(plant?.id ?? null, cursor.year()),
    };
  }, [date, plant?.id]);

  const csvColumns: CsvColumn<OperationRaw>[] = [
    { header: '수집일시', value: (row) => row.at },
    { header: '데이터상태', value: (row) => RAW_STATE_LABEL[row.state] },
    { header: '누적발전량(Wh)', value: (row) => row.accumWh },
    { header: '일사량(W/m2)', value: (row) => row.irradiance ?? '' },
    { header: '모듈온도(C)', value: (row) => row.moduleTemp ?? '' },
    { header: '인버터온도(C)', value: (row) => row.inverterTemp ?? '' },
    { header: '입력전압(V)', value: (row) => row.dcVolt ?? '' },
    { header: '입력전류(A)', value: (row) => row.dcAmp ?? '' },
    { header: '입력전력(W)', value: (row) => row.dcWatt ?? '' },
    { header: '출력전압 R-S(V)', value: (row) => row.acVoltRS ?? row.acVolt ?? '' },
    { header: '출력전압 S-T(V)', value: (row) => row.acVoltST ?? '' },
    { header: '출력전압 T-R(V)', value: (row) => row.acVoltTR ?? '' },
    { header: '출력전류 R(A)', value: (row) => row.acAmpR ?? row.acAmp ?? '' },
    { header: '출력전류 S(A)', value: (row) => row.acAmpS ?? '' },
    { header: '출력전류 T(A)', value: (row) => row.acAmpT ?? '' },
    { header: '출력전력(W)', value: (row) => row.acWatt ?? '' },
    { header: '주파수(Hz)', value: (row) => row.frequency ?? '' },
    { header: '역률(%)', value: (row) => row.powerFactor ?? '' },
  ];

  const download = () => {
    if (!selected || raw.length === 0) {
      toast.error(MSG.noResult);

      return;
    }

    const filename = `운전이력_${plant?.name ?? '충남전체'}_${selected.name}_${dayjs(date).format('YYYYMMDD')}`;

    exportCsv(filename, csvColumns, raw);
    toast.success(MSG.downloadStart(filename));
  };

  return (
    <div className={shared.tab}>
      <CollectionFilter trailing={<p className={shared.toolbar__count}>인버터 {inverters.length}대</p>}>
        <SegmentedControl
          label="조회 단위"
          size="sm"
          options={CALENDAR_OPTIONS}
          value={calendarView}
          onChange={setCalendarView}
        />
      </CollectionFilter>

      {/*
        일·월 단위는 날씨와 발전시간을, 연도별은 달마다 발전시간·예상 수익금을 얹는다 (SFR-010-01/02).
        연도별은 12개월 그리드라 날짜 칸이 없어 조회일은 그 달 1일로 옮긴다.
      */}
      <Reveal>
        <Card
          eyebrow="Calendar"
          title={calendarView === 'year' ? '월별 운전 달력' : '일자별 운전 달력'}
          description={calendarView === 'year'
            ? '달마다 발전시간과 예상 수익금을 보여 줍니다. 칸을 누르면 그 달로 옮겨 갑니다.'
            : '날짜마다 그 날 날씨와 발전시간, 예상 수익금을 함께 보여 줍니다. 칸을 누르면 조회일이 바뀝니다.'}
        >
          <DataCalendar
            view={calendarView === 'year' ? 'year' : 'month'}
            year={calendar.year}
            month={calendar.month}
            days={calendar.days}
            months={calendar.months}
            selected={calendarView === 'year' ? dayjs(date).format('YYYY-MM') : dayjs(date).format('YYYY-MM-DD')}
            onSelect={(key) => setDate(dayjs(key.length === 7 ? `${key}-01` : key).toDate())}
            onNavigate={(year, month) => setDate(dayjs(new Date(year, month ?? dayjs(date).month(), 1)).toDate())}
          />
        </Card>
      </Reveal>

      {!selected ? (
        <Card padding="none">
          <EmptyState
            title="인버터를 골라 주세요"
            description={`${label}에는 펼 인버터가 없습니다. 좌측 조회 대상에서 발전소나 인버터를 골라 주세요.`}
          />
        </Card>
      ) : (
        <Reveal delay={0.1}>
          <Card
            eyebrow="History"
            title={`${plantLabel} · ${selected.name} · 운전이력`}
            description="수집주기마다 올라온 계측값을 그대로 폅니다. 결측·이상 줄은 배경으로 갈라 두었습니다."
            action={(
              <Button variant="secondary" size="sm" iconLeft={<ExcelIcon />} onClick={download}>
                엑셀 내려받기
              </Button>
            )}
            padding="none"
          >
            <div className={styles.criteria} aria-label="조회 기준">
              <span className={styles.criteria__label}>조회 기준</span>
              <span className={styles.criteria__item}>
                <span className={styles.criteria__key}>기간</span>
                <span className={styles.criteria__value}>{dayjs(date).format('YYYY-MM-DD')}</span>
              </span>
              <span className={styles.criteria__item}>
                <span className={styles.criteria__key}>발전소</span>
                <span className={styles.criteria__value}>{plantLabel}</span>
              </span>
              <span className={styles.criteria__item}>
                <span className={styles.criteria__key}>인버터</span>
                <span className={styles.criteria__value}>{selected.name}</span>
              </span>
              <span className={styles.criteria__item}>
                <span className={styles.criteria__key}>수집주기</span>
                <span className={styles.criteria__value}>{intervalLabel}</span>
              </span>
            </div>

            <OperationTable rows={pageRows} threePhase={selected.phase === 'three'} />

            <Pagination
              page={currentPage}
              pageCount={pageCount}
              totalCount={raw.length}
              onChange={setPage}
              label="운전이력"
            />
          </Card>
        </Reveal>
      )}
    </div>
  );
}
