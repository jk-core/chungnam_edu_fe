import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DataCalendar } from '@/components/common/DataCalendar';
import { EChart } from '@/components/common/EChart';
import { EmptyState } from '@/components/common/EmptyState';
import { ExcelIcon } from '@/components/common/Icon';
import { getInverters, INVERTER_TYPE_LABEL } from '@/mocks/equipment';
import { getMonthDays, getYearMonths } from '@/mocks/weather';
import { getPredictionSeries } from '@/mocks/prediction';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE, RTU_LABEL, RTU_TONE } from '@/mocks/status';
import { MSG } from '@/configs/messages';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { cn } from '@/utils/cn';
import { exportCsv } from '@/utils/export';
import { formatNumber, formatPercent } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useChartPalette } from '@/hooks/useChartPalette';
import { useCollectionDate } from '@/stores/filterStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { CsvColumn } from '@/utils/export';
import type { PredictionPoint } from '@/interface/diagnosisDetail';
import shared from '../Collection.module.scss';
import { CollectionFilter } from './CollectionFilter';
import styles from './HistoryTab.module.scss';
import type { EChartsOption } from 'echarts';

type ViewMode = 'chart' | 'table';

/**
 * 인버터별 통신주기 운전이력 (SFR-009, SFR-010).
 * 인버터를 골라 전압·전류·전력 기록을 그래프나 표로 보고 엑셀로 내려받는다.
 */
export function HistoryTab() {
  const { plant, label } = usePlantScope();
  const [date, setDate] = useCollectionDate();
  const palette = useChartPalette();
  const [view, setView] = useState<ViewMode>('chart');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const inverters = useMemo(() => getInverters(plant?.id ?? null), [plant?.id]);
  const selected = inverters.find((item) => item.id === selectedId) ?? inverters[0] ?? null;

  const rows = useMemo(() => (selected ? getPredictionSeries(selected.id, date) : []), [selected, date]);

  const calendar = useMemo(() => {
    const cursor = dayjs(date);

    return {
      year: cursor.year(),
      month: cursor.month(),
      days: getMonthDays(plant?.id ?? null, cursor.year(), cursor.month()),
      months: getYearMonths(plant?.id ?? null, cursor.year()),
    };
  }, [date, plant?.id]);

  const csvColumns: CsvColumn<PredictionPoint>[] = [
    { header: '시각', value: (row) => row.time },
    { header: '직류전압(V)', value: (row) => row.actualVoltage },
    { header: '예측 직류전압(V)', value: (row) => row.predVoltage },
    { header: '직류전류(A)', value: (row) => row.actualCurrent },
    { header: '예측 직류전류(A)', value: (row) => row.predCurrent },
    { header: '직류전력(kW)', value: (row) => Math.round((row.actualVoltage * row.actualCurrent) / 100) / 10 },
    { header: '실측/예측 비율', value: (row) => row.ratio },
    { header: '편차(%)', value: (row) => row.deviation },
  ];

  const download = () => {
    if (!selected || rows.length === 0) {
      toast.error(MSG.noResult);

      return;
    }

    const filename = `운전이력_${plant?.name ?? '충남전체'}_${selected.name}_${dayjs(date).format('YYYYMMDD')}`;

    exportCsv(filename, csvColumns, rows);
    toast.success(MSG.downloadStart(filename));
  };

  const option: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 56, bottom: 30, left: 56 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
    },
    legend: topLegend(palette, ['직류전압', '직류전류', '직류전력']),
    xAxis: {
      type: 'category',
      data: rows.map((row) => row.time),
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
    },
    yAxis: [
      {
        type: 'value',
        name: 'V · A',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, 0, 0, -22] },
        splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
        axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
      },
      {
        type: 'value',
        name: 'kW',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11 },
        splitLine: { show: false },
        axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
      },
    ],
    series: [
      {
        name: '직류전압',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: palette.series1, width: 2 },
        itemStyle: { color: palette.series1 },
        data: rows.map((row) => row.actualVoltage),
      },
      {
        name: '직류전류',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: palette.series3, width: 2, type: 'dashed' },
        itemStyle: { color: palette.series3 },
        data: rows.map((row) => row.actualCurrent),
      },
      {
        name: '직류전력',
        type: 'bar',
        yAxisIndex: 1,
        barMaxWidth: 14,
        itemStyle: { color: palette.generation, borderRadius: [3, 3, 0, 0] },
        data: rows.map((row) => Math.round((row.actualVoltage * row.actualCurrent) / 100) / 10),
      },
    ],
  };

  return (
    <div className={shared.tab}>
      <CollectionFilter trailing={<p className={shared.toolbar__count}>인버터 {inverters.length}대</p>} />

      {/* 일 단위 조회에 날씨와 발전시간, 예상 수익금을 달력에 얹는다 (SFR-010-01/02) */}
      <Reveal>
        <Card
          eyebrow="Calendar"
          title="일자별 운전 달력"
          description="날짜마다 그 날 날씨와 발전시간, 예상 수익금을 함께 보여 줍니다. 칸을 누르면 조회일이 바뀝니다."
        >
          <DataCalendar
            view="month"
            year={calendar.year}
            month={calendar.month}
            days={calendar.days}
            months={calendar.months}
            selected={dayjs(date).format('YYYY-MM-DD')}
            onSelect={(key) => setDate(dayjs(key).toDate())}
            onNavigate={(year, month) => setDate(dayjs(new Date(year, month ?? dayjs(date).month(), 1)).toDate())}
          />
        </Card>
      </Reveal>

      <Reveal delay={0.06}>
        <Card
          eyebrow="Inverter"
          title="인버터 목록"
          description={`${label}의 인버터 상태입니다. 설비 상태와 수집장치 상태를 따로 표시하고, 카드를 누르면 아래에 운전이력이 열립니다.`}
        >
          {inverters.length === 0 ? (
            <EmptyState title="등록된 인버터가 없습니다" description={`${label}에는 인버터 정보가 없습니다.`} />
          ) : (
            <div className={styles.invGrid}>
              {inverters.map((inverter) => (
                <button
                  key={inverter.id}
                  type="button"
                  className={cn(styles.inv, { [styles['inv--selected']]: inverter.id === selected?.id })}
                  onClick={() => setSelectedId(inverter.id)}
                >
                  <span className={styles.inv__head}>
                    <span>
                      <span className={styles.inv__name}>{inverter.name}</span>
                      <span className={styles.inv__sub}>
                        {INVERTER_TYPE_LABEL[inverter.type]} · {formatNumber(inverter.capacityKw, 1)}kW
                      </span>
                    </span>
                    <span className={styles.inv__badges}>
                      <Badge tone={OPERATION_TONE[inverter.status]} withDot>
                        {OPERATION_LABEL[inverter.status]}
                      </Badge>
                      <Badge tone={RTU_TONE[inverter.rtuStatus]}>수집 {RTU_LABEL[inverter.rtuStatus]}</Badge>
                    </span>
                  </span>

                  <dl className={styles.inv__metrics}>
                    <div>
                      <dt>금일 발전량</dt>
                      <dd>{formatNumber(inverter.todayKwh, 1)}</dd>
                    </div>
                    <div>
                      <dt>발전시간</dt>
                      <dd>
                        {inverter.capacityKw > 0 ? formatNumber(inverter.todayKwh / inverter.capacityKw, 1) : '0.0'}
                      </dd>
                    </div>
                    <div>
                      <dt>PR</dt>
                      <dd className={isAbnormal(inverter.status) ? shared.deltaDown : undefined}>
                        {formatPercent(inverter.pr, 1)}
                      </dd>
                    </div>
                  </dl>
                </button>
              ))}
            </div>
          )}
        </Card>
      </Reveal>

      {selected ? (
        <Reveal delay={0.1}>
          <Card
            eyebrow="History"
            title={`${selected.name} 운전이력`}
            description={`${dayjs(date).format('YYYY년 M월 D일')} 정시 기준 직류 전압·전류와 물리·AI 예측값입니다. 결측 구간은 붉게 표시했습니다.`}
            action={(
              <span className={styles.detailHead__actions}>
                <SegmentedControl
                  value={view}
                  onChange={setView}
                  options={[
                    { value: 'chart', label: '그래프' },
                    { value: 'table', label: '표' },
                  ]}
                  label="표출 방식"
                />
                <Button variant="secondary" size="sm" iconLeft={<ExcelIcon />} onClick={download}>
                  엑셀 내려받기
                </Button>
              </span>
            )}
          >
            {view === 'chart' ? (
              <EChart
                option={option}
                height={340}
                summary={`${selected.name}의 시간대별 직류전압·전류·전력 추이. 최고 전류 ${formatNumber(Math.max(...rows.map((row) => row.actualCurrent), 0), 1)}A.`}
              />
            ) : (
              <div className={styles.dataWrap}>
                <table className={styles.data}>
                  <caption>
                    {selected.name} 운전이력 표. 시각, 직류전압, 예측 전압, 직류전류, 예측 전류, 직류전력, 편차 순입니다.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className={styles.data__time}>시각</th>
                      <th scope="col">전압 (V)</th>
                      <th scope="col">예측 전압</th>
                      <th scope="col">전류 (A)</th>
                      <th scope="col">예측 전류</th>
                      <th scope="col">전력 (kW)</th>
                      <th scope="col">편차 (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const isMissing = row.actualVoltage === 0 && row.actualCurrent === 0;

                      return (
                        <tr key={row.time} className={cn({ [styles['data__row--missing']]: isMissing })}>
                          <th scope="row" className={styles.data__time}>{row.time}</th>
                          <td className={cn({ [styles.data__none]: isMissing })}>
                            {isMissing ? '—' : formatNumber(row.actualVoltage, 1)}
                          </td>
                          <td>{formatNumber(row.predVoltage, 1)}</td>
                          <td className={cn({ [styles.data__none]: isMissing })}>
                            {isMissing ? '—' : formatNumber(row.actualCurrent, 1)}
                          </td>
                          <td>{formatNumber(row.predCurrent, 1)}</td>
                          <td className={cn({ [styles.data__none]: isMissing })}>
                            {isMissing ? '—' : formatNumber((row.actualVoltage * row.actualCurrent) / 1000, 2)}
                          </td>
                          <td className={row.deviation < -10 ? shared.deltaDown : undefined}>
                            {isMissing ? '—' : formatNumber(row.deviation, 1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <p className={styles.legendRow}>
              <span>
                <span className={styles.legendRow__swatch} style={{ backgroundColor: 'var(--critical-soft)' }} />
                결측 구간
              </span>
              <span>예측값은 일사량·모듈온도를 넣은 물리식과 AI 모델이 함께 낸 값입니다.</span>
            </p>
          </Card>
        </Reveal>
      ) : null}
    </div>
  );
}
