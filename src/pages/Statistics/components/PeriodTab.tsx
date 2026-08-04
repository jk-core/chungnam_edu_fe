import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Card } from '@/components/common/Card';
import { DataCalendar } from '@/components/common/DataCalendar';
import { getMonthDays, getYearMonths } from '@/mocks/weather';
import { describePeriod, getTrend, labelOf, PERIOD_META, pickEnergyUnit } from '@/mocks/generation';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { MSG } from '@/configs/messages';
import { cn } from '@/utils/cn';
import { exportCsv } from '@/utils/export';
import { formatDelta, formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import { useStatisticsDate } from '@/stores/filterStore';
import type { Column } from '@/components/common/Table';
import type { CsvColumn } from '@/utils/export';
import type { PeriodKey } from '@/mocks/generation';
import type { TrendPoint } from '@/interface/energy';
import styles from '../Statistics.module.scss';
import { PeriodFilter } from './PeriodFilter';

export function PeriodTab() {
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [date, setDate] = useStatisticsDate();
  const { label, factor, plant } = usePlantScope();
  const meta = PERIOD_META[period];
  const focusLabel = labelOf(period, date);

  const rows = useMemo(
    () =>
      getTrend(period, date).map((row) => ({
        ...row,
        generation: row.generation * factor,
        previous: row.previous * factor,
      })),
    [period, date, factor],
  );

  // 달력은 지금 고른 발전소 기준으로 채운다. 도 전체를 보고 있으면 도 전체 값이다.
  const calendar = useMemo(() => {
    const cursor = dayjs(date);

    return {
      year: cursor.year(),
      month: cursor.month(),
      days: getMonthDays(plant?.id ?? null, cursor.year(), cursor.month()),
      months: getYearMonths(plant?.id ?? null, cursor.year()),
    };
  }, [date, plant?.id]);

  const download = () => {
    if (rows.length === 0) {
      toast.error(MSG.noResult);

      return;
    }

    // 화면은 단위를 줄여 보여 주지만 파일에는 원단위 그대로 담는다.
    const csvColumns: CsvColumn<typeof rows[number]>[] = [
      { header: PERIOD_META[period].label, value: (row) => row.label },
      { header: '발전량(kWh)', value: (row) => Math.round(row.generation) },
      { header: '전기 발전량(kWh)', value: (row) => Math.round(row.previous) },
      { header: '증감률', value: (row) => formatDelta(row.generation / row.previous - 1) },
      { header: '일사량(kWh/m²)', value: (row) => row.irradiance },
    ];
    const filename = `기간비교_${label}_${describePeriod(period, date)}`;

    exportCsv(filename, csvColumns, rows);
    toast.success(MSG.downloadStart(filename));
  };

  const max = Math.max(...rows.map((row) => row.generation));
  const { divider, unit } = pickEnergyUnit(max);
  const total = rows.reduce((sum, row) => sum + row.generation, 0);

  const columns: Column<TrendPoint>[] = [
    {
      key: 'label',
      header: '구간',
      width: '96px',
      render: (row) => (
        <span className={cn(styles.cellStrong, { [styles.cellFocus]: row.label === focusLabel })}>{row.label}</span>
      ),
    },
    {
      key: 'generation',
      header: `발전량 (${unit})`,
      align: 'right',
      width: '132px',
      render: (row) => <span className={styles.cellData}>{formatNumber(row.generation / divider, 2)}</span>,
    },
    {
      key: 'bar',
      header: '비중',
      render: (row) => (
        <span className={styles.rowBar}>
          <span className={styles.rowBar__fill} style={{ width: `${(row.generation / max) * 100}%` }} />
        </span>
      ),
    },
    {
      key: 'previous',
      header: '전기',
      align: 'right',
      width: '120px',
      hideOnTablet: true,
      render: (row) => <span className={styles.cellMuted}>{formatNumber(row.previous / divider, 2)}</span>,
    },
    {
      key: 'delta',
      header: '증감',
      align: 'right',
      width: '96px',
      render: (row) => {
        const delta = row.generation / row.previous - 1;

        return <span className={delta >= 0 ? styles.deltaUp : styles.deltaDown}>{formatDelta(delta)}</span>;
      },
    },
    {
      key: 'irradiance',
      header: '일사량',
      align: 'right',
      width: '104px',
      hideOnTablet: true,
      render: (row) => <span className={styles.cellMuted}>{formatNumber(row.irradiance, 2)}</span>,
    },
  ];

  return (
    <div className={styles.tab}>
      <PeriodFilter
        period={period}
        onPeriodChange={setPeriod}
        date={date}
        onDateChange={setDate}
        onDownload={download}
      />

      {/* 일 단위에서는 날씨·발전시간을, 월·연 단위에서는 발전시간·예상 수익금을 달력에 얹는다 (SFR-007-01/02) */}
      <Reveal>
        <Card
          eyebrow="Calendar"
          title={period === 'year' ? '월별 발전 달력' : '일자별 발전 달력'}
          description={
            period === 'year'
              ? '각 달의 발전시간과 예상 수익금입니다. 칸을 누르면 그 달로 기준을 옮깁니다.'
              : '날짜마다 그 날 날씨와 발전시간, 예상 수익금을 함께 보여 줍니다. 칸을 누르면 기준일이 바뀝니다.'
          }
        >
          <DataCalendar
            view={period === 'year' ? 'year' : 'month'}
            year={calendar.year}
            month={calendar.month}
            days={calendar.days}
            months={calendar.months}
            selected={period === 'year' ? dayjs(date).format('YYYY-MM') : dayjs(date).format('YYYY-MM-DD')}
            onSelect={(key) => setDate(dayjs(key.length === 7 ? `${key}-01` : key).toDate())}
            onNavigate={(year, month) => setDate(dayjs(new Date(year, month ?? dayjs(date).month(), 1)).toDate())}
          />
        </Card>
      </Reveal>

      <Reveal delay={0.06}>
        <Card
          eyebrow="Table"
          title={`${meta.label} 집계표`}
          description={`${label} · ${describePeriod(period, date)} · 합계 ${formatNumber(total / divider, 2)}${unit}`}
          padding="none"
        >
          <Table
            caption={`${label}의 ${meta.label} 발전량 집계표. 구간, 발전량, 전기 대비 증감, 일사량 순으로 구성됩니다.`}
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.label}
            getRowClassName={(row) => (row.label === focusLabel ? styles.rowHighlight : undefined)}
            className={styles.tableInset}
          />
        </Card>
      </Reveal>
    </div>
  );
}
