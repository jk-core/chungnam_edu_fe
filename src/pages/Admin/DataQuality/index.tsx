import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { getQualityStatus, QUALITY_THRESHOLD, summarizeQuality } from '@/mocks/quality';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { TODAY } from '@/mocks/today';
import { formatNumber } from '@/utils/format';
import type { Column } from '@/components/common/Table';
import type { DateRangeValue } from '@/components/common/DateRangePicker';
import type { QualityStatus } from '@/interface/diagnosisDetail';
import styles from '../Admin.module.scss';

/** 데이터 품질 관리 (SFR-012-10) — 발전소마다 수집 데이터가 얼마나 온전히 들어왔는지 본다. */
function DataQualityPage() {
  const [range, setRange] = useState<DateRangeValue>({
    start: TODAY.subtract(6, 'day').toDate(),
    end: TODAY.toDate(),
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const rows = useMemo(() => getQualityStatus(null, range.start, range.end), [range]);
  const total = useMemo(() => summarizeQuality(rows), [rows]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: Column<QualityStatus>[] = [
    {
      key: 'name',
      header: '발전소',
      render: (row) => (
        <>
          <strong>{row.schoolName}</strong>
          <span className={styles.toolbar__note}> · {row.regionName}</span>
        </>
      ),
    },
    {
      key: 'status',
      header: '설비 상태',
      width: '110px',
      hideOnTablet: true,
      render: (row) => (
        <Badge tone={OPERATION_TONE[row.status]} withDot>
          {OPERATION_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: 'rate',
      header: '품질률',
      width: '190px',
      render: (row) => (
        <span className={styles.rate}>
          <span className={styles.rate__track}>
            <span
              className={`${styles.rate__bar} ${row.qualityRate < QUALITY_THRESHOLD ? styles['rate__bar--low'] : ''}`}
              style={{ width: `${Math.round(row.qualityRate * 100)}%` }}
            />
          </span>
          <span className={styles.rate__value}>{(row.qualityRate * 100).toFixed(1)}%</span>
        </span>
      ),
    },
    {
      key: 'rows',
      header: '유효/전체',
      align: 'right',
      width: '150px',
      hideOnTablet: true,
      render: (row) => `${formatNumber(row.validRows)} / ${formatNumber(row.totalRows)}`,
    },
  ];

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <DateRangePicker
          value={range}
          onChange={(value) => {
            setRange(value);
            setPage(1);
          }}
          label="품질 조회 기간"
        />
        <p className={styles.toolbar__note}>
          품질 기준 {Math.round(QUALITY_THRESHOLD * 100)}% · 총 {formatNumber(rows.length)}개소
        </p>
      </div>

      <Reveal>
        <div className={styles.summary}>
          <StatCard label="전체 품질률" value={total.qualityRate * 100} unit="%" fractionDigits={1} accent />
          <StatCard label="검증 대상" value={total.totalRows} unit="건" />
          <StatCard label="기준 미달 발전소" value={total.belowThreshold} unit="개소" />
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <Card
          eyebrow="Plants"
          title="발전소별 품질"
          description="품질률이 낮은 순입니다. 기준 미달 행은 붉게 표시했습니다."
        >
          <Table
            caption="발전소별 수집 품질"
            columns={columns}
            rows={pageRows}
            getRowKey={(row) => row.schoolId}
            getRowClassName={(row) => (row.qualityRate < QUALITY_THRESHOLD ? styles.rowAlert : undefined)}
          />
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            totalCount={rows.length}
            onChange={setPage}
            label="발전소별 품질"
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

export default DataQualityPage;
