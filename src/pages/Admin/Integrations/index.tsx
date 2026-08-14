import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EChart } from '@/components/common/EChart';
import { INTEGRATION_LOGS, integrationSummaries, integrationTrend } from '@/mocks/integrationLog';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Table } from '@/components/common/Table';
import { formatNumber, formatPercent } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import { toast } from '@/stores/toastStore';
import useAssetStore from '@/stores/assetStore';
import type { Column } from '@/components/common/Table';
import type { IntegrationLog, IntegrationResult } from '@/interface/integration';
import styles from '../Admin.module.scss';
import type { EChartsOption } from 'echarts';

type Filter = 'all' | IntegrationResult;

const RESULT_LABEL: Record<IntegrationResult, string> = {
  success: '성공',
  retried: '재시도 성공',
  fail: '실패',
};

/** 교육부 연계이력 관리 (SFR-027) */
function IntegrationsPage() {
  const palette = useChartPalette();
  const resentIds = useAssetStore((state) => state.resentIds);
  const markResent = useAssetStore((state) => state.markResent);

  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // 재송신한 건은 '재시도 성공' 으로 승격해 보여 준다 (SFR-027-05).
  const logs = useMemo(
    () =>
      INTEGRATION_LOGS.map((log) =>
        log.result === 'fail' && resentIds.includes(log.id)
          ? { ...log, result: 'retried' as const, responseCode: 200, failReason: null }
          : log,
      ),
    [resentIds],
  );

  const rows = useMemo(
    () => (filter === 'all' ? logs : logs.filter((log) => log.result === filter)),
    [logs, filter],
  );

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const summaries = useMemo(() => integrationSummaries(logs), [logs]);
  const trend = useMemo(() => integrationTrend(logs), [logs]);

  /** 성공률 추이 — 100%에 못 미친 날만 붉게 세운다. */
  const trendOption: EChartsOption = {
    grid: { top: 20, right: 16, bottom: 28, left: 44 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12 },
      valueFormatter: (value) => `${formatNumber(Number(value), 1)}%`,
    },
    xAxis: {
      type: 'category',
      data: trend.map((point) => point.date.slice(5)),
      axisLabel: { color: palette.textMuted, fontSize: 11, interval: 3 },
      axisLine: { lineStyle: { color: palette.axis } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      min: 90,
      axisLabel: { color: palette.textMuted, formatter: '{value}%', fontSize: 11 },
      splitLine: { lineStyle: { color: palette.grid } },
    },
    series: [
      {
        name: '성공률',
        type: 'bar',
        barWidth: 10,
        data: trend.map((point) => ({
          value: Math.round(point.rate * 1000) / 10,
          itemStyle: { color: point.rate < 1 ? palette.critical : palette.series1 },
        })),
      },
    ],
  };
  const openFails = logs.filter((log) => log.result === 'fail');

  const resendAll = () => {
    openFails.forEach((log) => markResent(log.id));
    toast.success(`실패 ${openFails.length}건을 재송신해 모두 응답 200 을 받았습니다.`);
  };

  const columns: Column<IntegrationLog>[] = [
    { key: 'at', header: '전송 시각', width: '160px', render: (row) => <strong>{row.at}</strong> },
    { key: 'target', header: '전송 대상', width: '140px', hideOnTablet: true, render: (row) => row.target },
    { key: 'rows', header: '전송 건수', align: 'right', width: '110px', render: (row) => `${formatNumber(row.rowCount)}건` },
    {
      key: 'result',
      header: '결과',
      width: '110px',
      render: (row) => (
        <Badge tone={row.result === 'fail' ? 'critical' : row.result === 'retried' ? 'caution' : 'ok'} withDot>
          {RESULT_LABEL[row.result]}
        </Badge>
      ),
    },
    { key: 'code', header: '응답', align: 'center', width: '70px', render: (row) => row.responseCode },
    { key: 'latency', header: '지연', align: 'right', width: '90px', hideOnTablet: true, render: (row) => `${formatNumber(row.latencyMs)}ms` },
    {
      key: 'reason',
      header: '비고',
      render: (row) =>
        row.result === 'fail' ? (
          <span className={styles.toolbar__actions}>
            <span className={styles.toolbar__note}>{row.failReason}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                markResent(row.id);
                toast.success(`${row.at} 전송분을 재송신했습니다.`);
              }}
            >
              재송신
            </Button>
          </span>
        ) : (
          <span className={styles.toolbar__note}>{row.result === 'retried' ? '재송신으로 회복' : '—'}</span>
        ),
    },
  ];

  return (
    <div className={styles.tab}>
      <Reveal>
        <div className={`${styles.summary} ${styles['summary--three']}`}>
          {summaries.map((summary) => (
            <Card key={summary.label} padding="lg">
              <p className={styles.toolbar__note}>{summary.label}</p>
              <div className={styles.rate}>
                <span className={styles.rate__track}>
                  <span
                    className={`${styles.rate__bar} ${summary.rate < 0.9 ? styles['rate__bar--low'] : ''}`}
                    style={{ width: `${Math.round(summary.rate * 100)}%` }}
                  />
                </span>
                <span className={styles.rate__value}>{(summary.rate * 100).toFixed(1)}%</span>
              </div>
              <p className={styles.toolbar__note}>
                {formatNumber(summary.success)} / {formatNumber(summary.total)}건 성공
              </p>
            </Card>
          ))}
        </div>
      </Reveal>

      <div className={styles.toolbar}>
        <SegmentedControl
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: '전체' },
            { value: 'success', label: '성공' },
            { value: 'retried', label: '재시도' },
            { value: 'fail', label: '실패' },
          ]}
          label="전송 결과 필터"
        />
        <div className={styles.toolbar__actions}>
          <p className={styles.toolbar__note}>{formatNumber(rows.length)}건</p>
          <Button variant="secondary" onClick={resendAll} disabled={openFails.length === 0}>
            실패 {openFails.length}건 일괄 재송신
          </Button>
        </div>
      </div>

      <Reveal delay={0.05}>
        <Card
          eyebrow="Trend"
          title="일자별 전송 성공률"
          description="어느 날부터 실패가 늘었는지 추이로 봅니다. 100%에 못 미친 날은 붉게 표시했습니다."
        >
          <EChart
            option={trendOption}
            height={240}
            summary={`최근 30일 전송 성공률 추이. 평균 ${formatPercent(
              trend.reduce((sum, point) => sum + point.rate, 0) / Math.max(1, trend.length),
              1,
            )}.`}
          />
        </Card>
      </Reveal>

      <Reveal delay={0.09}>
        <Card
          eyebrow="REMS"
          title="교육부 전송 이력"
          description="최근 30일, 하루 4회 수집 데이터를 가공 없이 그대로 보냅니다. 실패 건은 사유 확인 후 재송신합니다."
        >
          <Table
            caption="교육부 연계 전송 이력"
            columns={columns}
            rows={pageRows}
            getRowKey={(row) => row.id}
            getRowClassName={(row) => (row.result === 'fail' ? styles.rowAlert : undefined)}
          />
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            totalCount={rows.length}
            onChange={setPage}
            label="전송 이력"
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </Card>
      </Reveal>
    </div>
  );
}

export default IntegrationsPage;
