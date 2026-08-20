import { useMemo } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DownloadIcon } from '@/components/common/Icon';
import { EChart } from '@/components/common/EChart';
import { MSG } from '@/configs/messages';
import { NOW } from '@/mocks/today';
import { Reveal } from '@/components/common/Reveal';
import { exportCsv } from '@/utils/export';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { CsvColumn } from '@/utils/export';
import type { LoginTrendPoint } from '@/interface/security';
import { AXIS_FONT } from './usageChart';
import { readLoginTrend, TREND_DAYS } from './usageData';
import type { EChartsOption } from 'echarts';

const CSV_COLUMNS: CsvColumn<LoginTrendPoint>[] = [
  { header: '일자', value: (row) => row.date },
  { header: '로그인 성공', value: (row) => row.success },
  { header: '로그인 실패', value: (row) => row.fail },
];

/**
 * 일별 로그인 추이 (SFR-028).
 *
 * 실패를 점선으로 함께 깐다 — 성공만 보면 「조용한 날」 과 「아무도 못 들어온 날」 이 같아 보인다.
 */
export function LoginTrendChart() {
  const palette = useChartPalette();
  const trend = useMemo(() => readLoginTrend(), []);
  const totalLogins = trend.reduce((sum, point) => sum + point.success, 0);

  const option: EChartsOption = {
    grid: { top: 30, right: 16, bottom: 24, left: 40 },
    legend: { top: 0, textStyle: { color: palette.textMuted, fontSize: 11 } },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      // 연도는 다 같아 지운다 — 30칸에 「2026-」 이 서른 번 적히면 날짜가 안 읽힌다
      data: trend.map((point) => point.date.slice(5)),
      axisLabel: { color: palette.textMuted, ...AXIS_FONT },
      axisLine: { lineStyle: { color: palette.axis } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: palette.textMuted, ...AXIS_FONT },
      splitLine: { lineStyle: { color: palette.grid } },
    },
    series: [
      {
        name: '로그인 성공',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.series2, width: 2 },
        itemStyle: { color: palette.series2 },
        data: trend.map((point) => point.success),
      },
      {
        name: '실패',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.critical, width: 1.6, type: 'dashed' },
        itemStyle: { color: palette.critical },
        data: trend.map((point) => point.fail),
      },
    ],
  };

  const download = () => {
    const filename = `시스템활용통계_로그인추이_${NOW.format('YYYYMMDD')}`;

    exportCsv(filename, CSV_COLUMNS, trend);
    toast.success(MSG.downloadStart(filename));
  };

  return (
    <Reveal delay={0.08}>
      <Card
        title="일별 로그인 추이"
        description="실선은 성공, 점선은 실패입니다."
        action={(
          <Button variant="secondary" size="sm" iconLeft={<DownloadIcon />} onClick={download}>
            내려받기
          </Button>
        )}
      >
        <EChart
          option={option}
          height={320}
          summary={`최근 ${TREND_DAYS}일 로그인 성공 ${formatNumber(totalLogins)}회.`}
        />
      </Card>
    </Reveal>
  );
}
