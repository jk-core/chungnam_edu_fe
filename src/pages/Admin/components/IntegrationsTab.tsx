import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { INTEGRATION_LOGS, integrationSummaries } from '@/mocks/integrationLog';
import { Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import useAssetStore from '@/stores/assetStore';
import type { Column } from '@/components/common/Table';
import type { IntegrationLog, IntegrationResult } from '@/interface/integration';
import styles from '../Admin.module.scss';

type Filter = 'all' | IntegrationResult;

const PAGE_SIZE = 12;

const RESULT_LABEL: Record<IntegrationResult, string> = {
  success: '성공',
  retried: '재시도 성공',
  fail: '실패',
};

/** 교육부 연계이력 관리 (SFR-027) */
export function IntegrationsTab() {
  const resentIds = useAssetStore((state) => state.resentIds);
  const markResent = useAssetStore((state) => state.markResent);

  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);

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

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const summaries = useMemo(() => integrationSummaries(logs), [logs]);
  const openFails = logs.filter((log) => log.result === 'fail');

  const resendAll = () => {
    openFails.forEach((log) => markResent(log.id));
    toast.success(`실패 ${openFails.length}건을 재송신해 모두 응답 200 을 받았습니다.`);
  };

  const columns: Column<IntegrationLog>[] = [
    { key: 'at', header: '전송 시각', width: '140px', render: (row) => row.at },
    { key: 'payload', header: '전문', render: (row) => <strong>{row.payload}</strong> },
    { key: 'rows', header: '건수', align: 'right', width: '90px', hideOnTablet: true, render: (row) => formatNumber(row.rowCount) },
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
                toast.success(`${row.at} ${row.payload} 전문을 재송신했습니다.`);
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
          eyebrow="REMS"
          title="교육부 전송 이력"
          description="최근 30일, 하루 4회 전문을 보냅니다. 실패 건은 사유 확인 후 재송신합니다."
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
          />
        </Card>
      </Reveal>
    </div>
  );
}
