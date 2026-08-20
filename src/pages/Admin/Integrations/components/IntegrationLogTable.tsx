import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import useAssetStore from '@/stores/assetStore';
import type { Column } from '@/components/common/Table';
import type { IntegrationLog, IntegrationResult } from '@/interface/integration';
import styles from '../../Admin.module.scss';
import { useIntegrationLogs } from '../hooks/useIntegrationLogs';

type ResultFilter = 'all' | IntegrationResult;

const RESULT_LABEL: Record<IntegrationResult, string> = {
  success: '성공',
  retried: '재시도 성공',
  fail: '실패',
};

const RESULT_TONE: Record<IntegrationResult, 'ok' | 'caution' | 'critical'> = {
  success: 'ok',
  retried: 'caution',
  fail: 'critical',
};

const FILTER_OPTIONS: { value: ResultFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'success', label: '성공' },
  { value: 'retried', label: '재시도' },
  { value: 'fail', label: '실패' },
];

/**
 * 교육부 전송 이력 (SFR-027).
 *
 * 거르는 조건과 쪽 번호를 표가 쥔다 — 둘 다 이 표 하나만의 사정이라, 조건을 바꾸면 첫 쪽으로
 * 돌아가는 규칙도 여기 있어야 두 값이 어긋나지 않는다.
 *
 * 재송신은 실패한 줄에서 바로 누른다. 목록을 떠나 다른 화면으로 보내면 어느 건을 보내려던
 * 것인지 잊는다.
 */
export function IntegrationLogTable() {
  const logs = useIntegrationLogs();
  const markResent = useAssetStore((state) => state.markResent);

  const [filter, setFilter] = useState<ResultFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const rows = useMemo(
    () => (filter === 'all' ? logs : logs.filter((log) => log.result === filter)),
    [logs, filter],
  );
  const openFails = useMemo(() => logs.filter((log) => log.result === 'fail'), [logs]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resend = (log: IntegrationLog) => {
    markResent(log.id);
    toast.success(`${log.at} 전송분을 재송신했습니다.`);
  };

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
      render: (row) => <Badge tone={RESULT_TONE[row.result]} withDot>{RESULT_LABEL[row.result]}</Badge>,
    },
    { key: 'code', header: '응답', align: 'center', width: '70px', render: (row) => row.responseCode },
    { key: 'latency', header: '지연', align: 'right', width: '90px', hideOnTablet: true, render: (row) => `${formatNumber(row.latencyMs)}ms` },
    {
      key: 'reason',
      header: '비고',
      render: (row) => (row.result === 'fail' ? (
        <span className={styles.toolbar__actions}>
          <span className={styles.toolbar__note}>{row.failReason}</span>
          <Button size="sm" variant="secondary" onClick={() => resend(row)}>재송신</Button>
        </span>
      ) : (
        <span className={styles.toolbar__note}>{row.result === 'retried' ? '재송신으로 회복' : '—'}</span>
      )),
    },
  ];

  return (
    <>
      <div className={styles.toolbar}>
        <SegmentedControl
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
          options={FILTER_OPTIONS}
          label="전송 결과 필터"
        />
        <div className={styles.toolbar__actions}>
          <p className={styles.toolbar__note}>{formatNumber(rows.length)}건</p>
          <Button variant="secondary" onClick={resendAll} disabled={openFails.length === 0}>
            실패 {openFails.length}건 일괄 재송신
          </Button>
        </div>
      </div>

      <Reveal delay={0.09}>
        <Card
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
    </>
  );
}
