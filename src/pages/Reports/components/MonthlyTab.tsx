import dayjs from 'dayjs';
import { useMemo } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DatePicker } from '@/components/common/DatePicker';
import { EChart } from '@/components/common/EChart';
import { EmptyState } from '@/components/common/EmptyState';
import { PrinterIcon } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { StatCard } from '@/components/common/StatCard';
import { TODAY } from '@/mocks/today';
import { cn } from '@/utils/cn';
import { getFaultCode } from '@/mocks/equipment';
import { getMonthlyReport } from '@/mocks/reports';
import { formatDelta, formatNumber } from '@/utils/format';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, seriesPalette, topLegend } from '@/utils/chart';
import { useChartPalette } from '@/hooks/useChartPalette';
import { usePlantScope } from '@/hooks/usePlantScope';
import { usePrint } from '@/hooks/usePrint';
import { useStatisticsDate } from '@/stores/filterStore';
import styles from '../Reports.module.scss';
import type { EChartsOption } from 'echarts';

/**
 * 설비별 월간보고서 자동 생성 (SFR-019, SFR-020).
 * 브라우저 인쇄로 그대로 PDF 로 저장한다.
 */
export function MonthlyTab() {
  const { plant } = usePlantScope();
  const [date, setDate] = useStatisticsDate();
  const palette = useChartPalette();
  const print = usePrint();

  const cursor = dayjs(date);
  const year = cursor.year();
  const month = cursor.month();
  const report = useMemo(
    () => (plant ? getMonthlyReport(plant.id, year, month) : null),
    [plant, year, month],
  );

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

  const series = seriesPalette(palette);
  const delta = report.previousKwh > 0 ? report.totalKwh / report.previousKwh - 1 : 0;

  /** 전월 대비 금월 일 단위 발전량 (SFR-019-02) */
  const compareOption: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 20, bottom: 28, left: 52 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
    },
    legend: topLegend(palette, ['금월', '전월']),
    xAxis: {
      type: 'category',
      data: report.dailyCompare.map((row) => `${row.day}`),
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 10, fontFamily: 'Space Grotesk, sans-serif' },
    },
    yAxis: {
      type: 'value',
      name: 'kWh',
      nameGap: AXIS_NAME_GAP,
      nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, 0, 0, -30] },
      splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
      axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
    },
    series: [
      {
        name: '금월',
        type: 'bar',
        barMaxWidth: 12,
        itemStyle: { color: palette.generation, borderRadius: [3, 3, 0, 0] },
        data: report.dailyCompare.map((row) => row.current),
      },
      {
        name: '전월',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: palette.compare, width: 1.6, type: 'dashed' },
        itemStyle: { color: palette.compare },
        data: report.dailyCompare.map((row) => row.previous),
      },
    ],
  };

  /** 금월 인버터별 발전시간 — 인버터마다 다른 색 (SFR-019-03/04) */
  const inverterOption: EChartsOption = {
    grid: { top: 20, right: 20, bottom: 28, left: 64 },
    tooltip: {
      trigger: 'item',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
      valueFormatter: (value) => `${formatNumber(Number(value), 1)} 시간`,
    },
    xAxis: {
      type: 'value',
      name: '시간',
      nameTextStyle: { color: palette.axis, fontSize: 11 },
      splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
      axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
    },
    yAxis: {
      type: 'category',
      data: report.inverterHours.map((row) => row.name),
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11 },
    },
    series: [
      {
        name: '발전시간',
        type: 'bar',
        barMaxWidth: 20,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: (params) => series[params.dataIndex % series.length],
        },
        data: report.inverterHours.map((row) => row.hours),
      },
    ],
  };

  return (
    <div className={styles.tab}>
      <div className={cn(styles.toolbar, 'no-print')}>
        <div className={styles.toolbar__left}>
          <DatePicker value={date} onChange={setDate} granularity="month" label="보고 월" />
          <p className={styles.toolbar__note}>{report.schoolName} 기준</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button
            variant="secondary"
            iconLeft={<PrinterIcon />}
            onClick={() => print(`월간보고서_${report.schoolName}_${cursor.format('YYYYMM')}`)}
          >
            PDF 로 저장
          </Button>
        </div>
      </div>

      {/* 인쇄하면 조회 툴바가 숨으므로 어느 달·어느 학교 보고서인지 종이에 남긴다. */}
      <div className={cn(styles.printTitle, 'print-only')}>
        <h2>
          {report.schoolName} {report.year}년 {report.month + 1}월 발전 보고서
        </h2>
        <p>충청남도교육청 신·재생에너지 통합관리시스템 · 출력일 {TODAY.format('YYYY-MM-DD')}</p>
      </div>

      <Reveal>
        <div className={styles.summary}>
          <StatCard label="금월 발전량" value={report.totalKwh} unit="kWh" accent />
          <StatCard label="전월 발전량" value={report.previousKwh} unit="kWh" delta={delta} deltaLabel="전월 대비" />
          <StatCard label="설비용량" value={report.plantSummary.capacityKw} unit="kW" fractionDigits={1} />
          <StatCard label="인버터" value={report.inverterHours.length} unit="대" />
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <Card eyebrow="Plant" title="발전소 정보" description={`${report.year}년 ${report.month + 1}월 기준 등록 정보입니다.`}>
          <dl className={styles.infoGrid}>
            <div>
              <dt>발전소명</dt>
              <dd>{report.plantSummary.plantName}</dd>
            </div>
            <div>
              <dt>주소</dt>
              <dd>{report.plantSummary.address}</dd>
            </div>
            <div>
              <dt>설비용량</dt>
              <dd>{formatNumber(report.plantSummary.capacityKw, 1)} kW</dd>
            </div>
            <div>
              <dt>인버터 모델</dt>
              <dd>{report.plantSummary.inverterModel}</dd>
            </div>
            <div>
              <dt>인버터 구조</dt>
              <dd>{report.plantSummary.inverterStructure}</dd>
            </div>
            <div>
              <dt>모듈 모델</dt>
              <dd>{report.plantSummary.moduleModel}</dd>
            </div>
            <div>
              <dt>모듈 구조</dt>
              <dd>{report.plantSummary.moduleStructure}</dd>
            </div>
            <div>
              <dt>설치 시기</dt>
              <dd>{report.plantSummary.installedAt}</dd>
            </div>
          </dl>
        </Card>
      </Reveal>

      <Reveal delay={0.1}>
        <Card
          eyebrow="Compare"
          title="전월 대비 금월 발전량"
          description={`막대는 금월, 점선은 전월입니다. 금월 합계는 전월 대비 ${formatDelta(delta)} 입니다.`}
        >
          <EChart
            option={compareOption}
            height={280}
            summary={`금월 ${formatNumber(report.totalKwh)}kWh, 전월 ${formatNumber(report.previousKwh)}kWh.`}
          />
        </Card>
      </Reveal>

      <Reveal delay={0.14}>
        <Card
          eyebrow="Inverter"
          title="금월 인버터별 발전시간"
          description="인버터마다 다른 색으로 구분했습니다. 막대에 마우스를 올리면 발전시간이 나옵니다."
        >
          <EChart
            option={inverterOption}
            height={Math.max(200, report.inverterHours.length * 44 + 60)}
            summary={report.inverterHours.map((row) => `${row.name} ${formatNumber(row.hours, 1)}시간`).join(', ')}
          />
        </Card>
      </Reveal>

      <div className="print-page-break" />

      <Reveal delay={0.18}>
        <Card
          eyebrow="AI"
          title="인버터별 AI 진단 결과"
          description="옅은 초록 구간이 AI 가 본 정상 범위이고, 막대는 실측 발전량입니다. 범위 아래로 내려간 인버터는 붉게 표시했습니다."
        >
          <div className={styles.diagList}>
            {report.inverterDiagnosis.map((row) => {
              const max = Math.max(row.normalHigh, row.actual, 1);
              const isLow = row.actual < row.normalLow;

              return (
                <div key={row.id} className={styles.diag}>
                  <span className={styles.diag__name}>{row.name}</span>
                  <span className={styles.diag__track}>
                    <span
                      className={styles.diag__band}
                      style={{
                        left: `${(row.normalLow / max) * 100}%`,
                        width: `${((row.normalHigh - row.normalLow) / max) * 100}%`,
                      }}
                    />
                    <span
                      className={cn(styles.diag__bar, { [styles['diag__bar--low']]: isLow })}
                      style={{ width: `${(row.actual / max) * 100}%` }}
                    />
                  </span>
                  <span className={styles.diag__value}>{formatNumber(row.actual)} kWh</span>
                </div>
              );
            })}
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.22}>
        <Card
          eyebrow="String"
          title="스트링·접속반 단위 진단"
          description="정상 범위 발전효율과 실제 발전효율을 견줍니다."
        >
          <div className={styles.diagList}>
            {report.unitDiagnosis.map((row) => {
              const isLow = row.actual < row.normal - 8;

              return (
                <div key={row.id} className={styles.diag}>
                  <span className={styles.diag__name}>
                    {row.parent} {row.name}
                  </span>
                  <span className={styles.diag__track}>
                    <span
                      className={styles.diag__band}
                      style={{ left: `${row.normal - 8}%`, width: '16%' }}
                    />
                    <span
                      className={cn(styles.diag__bar, { [styles['diag__bar--low']]: isLow })}
                      style={{ width: `${Math.min(100, row.actual)}%` }}
                    />
                  </span>
                  <span className={styles.diag__value}>{row.actual}%</span>
                </div>
              );
            })}
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.26}>
        <div className={styles.grid2}>
          <Card
            eyebrow="Action"
            title="조치방안 제안"
            description="AI 가 분류한 고장에 맞춰 먼저 볼 곳을 정리했습니다."
          >
            <div className={styles.guides}>
              {report.recommendations.map((item, index) => (
                <p key={item} className={styles.guide}>
                  <span className={styles.guide__order}>{index + 1}</span>
                  {item}
                </p>
              ))}
            </div>
          </Card>

          <Card
            eyebrow="Routine"
            title="일상 점검 안내"
            description="이상이 검출되면 이 순서로 먼저 살펴 주세요."
          >
            <div className={styles.guides}>
              {report.routineGuides.map((item, index) => (
                <p key={item} className={styles.guide}>
                  <span className={styles.guide__order}>{index + 1}</span>
                  {item}
                </p>
              ))}
            </div>
          </Card>
        </div>
      </Reveal>

      <Reveal delay={0.3}>
        <Card
          eyebrow="Fault"
          title="인버터별 일 단위 고장 분류"
          description="정상인 날은 비워 두고, 분류가 붙은 날만 코드를 적었습니다."
        >
          <div className={styles.diagList}>
            {report.faultByDay.map((row) => {
              const codes = [...new Set(row.codes.filter((code) => code !== 0))];

              return (
                <p key={row.id} className={styles.guide}>
                  <span className={styles.diag__name}>{row.name}</span>
                  {codes.length === 0
                    ? '분류된 고장 없음'
                    : codes
                      .map((code) => {
                        const fault = getFaultCode(code);
                        const days = row.codes.filter((item) => item === code).length;

                        return `${fault ? `${fault.label} · ${fault.summary}` : code} ${days}일`;
                      })
                      .join(' · ')}
                </p>
              );
            })}
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
