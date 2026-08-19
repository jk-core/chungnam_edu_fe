import { useMemo } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DownloadIcon } from '@/components/common/Icon';
import { EChart } from '@/components/common/EChart';
import { getLoginTrend, getMenuUsage } from '@/mocks/security';
import { MSG } from '@/configs/messages';
import { NOW } from '@/mocks/today';
import { Reveal } from '@/components/common/Reveal';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { exportCsv } from '@/utils/export';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { Column } from '@/components/common/Table';
import type { CsvColumn } from '@/utils/export';
import type { LoginTrendPoint, MenuUsage } from '@/interface/security';
import styles from '../Admin.module.scss';
import type { EChartsOption } from 'echarts';

const AXIS_FONT = { fontSize: 11, fontFamily: 'Pretendard Variable, sans-serif' };

/** 시스템 활용 통계 (SFR-028) — 최근 30일 기준. */
function UsagePage() {
  const palette = useChartPalette();
  const usage = useMemo(() => getMenuUsage(), []);
  const trend = useMemo(() => getLoginTrend(30), []);

  const totalViews = usage.reduce((sum, row) => sum + row.views, 0);
  const totalLogins = trend.reduce((sum, point) => sum + point.success, 0);
  const top = usage[0];

  const topUsage = usage.slice(0, 10);

  /** 메뉴별 조회수 상위 10개 — 가로 막대 */
  const menuOption: EChartsOption = {
    grid: { top: 10, right: 30, bottom: 10, left: 110 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12 },
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: palette.textMuted, ...AXIS_FONT },
      splitLine: { lineStyle: { color: palette.grid } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: topUsage.map((row) => row.menu),
      axisLabel: { color: palette.text, ...AXIS_FONT },
      axisLine: { lineStyle: { color: palette.axis } },
    },
    series: [
      {
        name: '조회수',
        type: 'bar',
        barWidth: 14,
        itemStyle: { borderRadius: [0, 4, 4, 0], color: palette.series1 },
        data: topUsage.map((row) => row.views),
      },
    ],
  };

  /** 일별 로그인 추이 */
  const trendOption: EChartsOption = {
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

  // 활용 통계 내려받기 (SFR-028-03) — 화면에서 줄인 항목까지 그대로 담는다.
  const downloadUsage = () => {
    const csvColumns: CsvColumn<MenuUsage>[] = [
      { header: '대메뉴', value: (row) => row.section },
      { header: '화면', value: (row) => row.menu },
      { header: '조회수', value: (row) => row.views },
      { header: '이용자수', value: (row) => row.users },
      { header: '비중(%)', value: (row) => ((row.views / totalViews) * 100).toFixed(1) },
    ];
    const filename = `시스템활용통계_메뉴별_${NOW.format('YYYYMMDD')}`;

    exportCsv(filename, csvColumns, usage);
    toast.success(MSG.downloadStart(filename));
  };

  const downloadTrend = () => {
    const csvColumns: CsvColumn<LoginTrendPoint>[] = [
      { header: '일자', value: (row) => row.date },
      { header: '로그인 성공', value: (row) => row.success },
      { header: '로그인 실패', value: (row) => row.fail },
    ];
    const filename = `시스템활용통계_로그인추이_${NOW.format('YYYYMMDD')}`;

    exportCsv(filename, csvColumns, trend);
    toast.success(MSG.downloadStart(filename));
  };

  const columns: Column<MenuUsage>[] = [
    { key: 'section', header: '대메뉴', width: '120px', render: (row) => row.section },
    { key: 'menu', header: '화면', render: (row) => <strong>{row.menu}</strong> },
    { key: 'views', header: '조회수', align: 'right', width: '110px', render: (row) => formatNumber(row.views) },
    { key: 'users', header: '이용자', align: 'right', width: '90px', render: (row) => `${formatNumber(row.users)}명` },
    {
      key: 'share',
      header: '비중',
      width: '190px',
      hideOnTablet: true,
      render: (row) => (
        <span className={styles.rate}>
          <span className={styles.rate__track}>
            <span className={styles.rate__bar} style={{ width: `${Math.round((row.views / top.views) * 100)}%` }} />
          </span>
          <span className={styles.rate__value}>{((row.views / totalViews) * 100).toFixed(1)}%</span>
        </span>
      ),
    },
  ];

  return (
    <div className={styles.tab}>
      <Reveal>
        <div className={`${styles.summary} ${styles['summary--three']}`}>
          <StatCard label="30일 화면 조회" value={totalViews} unit="회" accent />
          <StatCard label="30일 로그인" value={totalLogins} unit="회" />
          <StatCard label="가장 많이 쓴 화면" value={top.views} unit={`회 · ${top.menu}`} />
        </div>
      </Reveal>

      <div className={styles.grid2}>
        <Reveal delay={0.05}>
          <Card title="메뉴별 조회수 상위 10개" description="어떤 화면이 실제로 쓰이는지 봅니다.">
            <EChart
              option={menuOption}
              height={320}
              summary={`메뉴별 조회수 상위 10개. 1위 ${top.menu} ${formatNumber(top.views)}회.`}
            />
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card
            title="일별 로그인 추이"
            description="실선은 성공, 점선은 실패입니다."
            action={(
              <Button variant="secondary" size="sm" iconLeft={<DownloadIcon />} onClick={downloadTrend}>
                내려받기
              </Button>
            )}
          >
            <EChart
              option={trendOption}
              height={320}
              summary={`최근 30일 로그인 성공 ${formatNumber(totalLogins)}회.`}
            />
          </Card>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <Card
          title="화면별 상세"
          description="조회수 순으로 정렬했습니다."
          action={(
            <Button variant="secondary" size="sm" iconLeft={<DownloadIcon />} onClick={downloadUsage}>
              엑셀 내려받기
            </Button>
          )}
        >
          <Table caption="메뉴별 활용 통계" columns={columns} rows={usage} getRowKey={(row) => row.menu} />
        </Card>
      </Reveal>
    </div>
  );
}

export default UsagePage;
