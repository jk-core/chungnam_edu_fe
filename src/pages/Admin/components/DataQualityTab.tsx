import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { getQualityStatus, QUALITY_CODES, QUALITY_META, QUALITY_THRESHOLD, summarizeQuality } from '@/mocks/quality';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Reveal } from '@/components/common/Reveal';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { TODAY } from '@/mocks/today';
import { formatNumber } from '@/utils/format';
import type { Column } from '@/components/common/Table';
import type { DateRangeValue } from '@/components/common/DateRangePicker';
import type { QualityStatus } from '@/interface/diagnosisDetail';
import styles from '../Admin.module.scss';

/** 데이터 품질 관리 (SFR-012-10) — 품질 기준 미달은 AI 학습에서 뺀다 (SFR-012-11). */
export function DataQualityTab() {
  const [range, setRange] = useState<DateRangeValue>({
    start: TODAY.subtract(6, 'day').toDate(),
    end: TODAY.toDate(),
  });

  const rows = useMemo(() => getQualityStatus(null, range.start, range.end), [range]);
  const total = useMemo(() => summarizeQuality(rows), [rows]);

  // 어떤 유형이 잦은지 코드별 합계로 본다.
  const byCode = useMemo(
    () =>
      QUALITY_CODES.filter((code) => code !== 'ok')
        .map((code) => ({
          code,
          count: rows.reduce((sum, row) => sum + row.byCode[code], 0),
        }))
        .sort((a, b) => b.count - a.count),
    [rows],
  );

  const maxCode = Math.max(1, ...byCode.map((item) => item.count));

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
    {
      key: 'excluded',
      header: 'AI 학습 제외',
      align: 'right',
      width: '120px',
      render: (row) =>
        row.excludedFromTraining > 0 ? (
          <Badge tone="caution">{formatNumber(row.excludedFromTraining)}건</Badge>
        ) : (
          <span className={styles.matrixDash}>—</span>
        ),
    },
  ];

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <DateRangePicker value={range} onChange={setRange} label="품질 조회 기간" />
        <p className={styles.toolbar__note}>
          품질 기준 {Math.round(QUALITY_THRESHOLD * 100)}% — 못 미치면 AI 학습에서 제외합니다.
        </p>
      </div>

      <Reveal>
        <div className={styles.summary}>
          <StatCard label="전체 품질률" value={total.qualityRate * 100} unit="%" fractionDigits={1} accent />
          <StatCard label="검증 대상" value={total.totalRows} unit="건" />
          <StatCard label="기준 미달 발전소" value={total.belowThreshold} unit="개소" />
          <StatCard label="AI 학습 제외" value={total.excludedRows} unit="건" />
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <Card
          eyebrow="Code"
          title="상태 코드별 검출 건수"
          description="어떤 유형의 불량 데이터가 잦은지 봅니다. 코드는 수집 정합성 검증 규칙과 1:1 입니다."
        >
          <div className={styles.history}>
            {byCode.map((item) => (
              <div key={item.code} className={styles.historyItem}>
                <Badge tone={QUALITY_META[item.code].severity === 'critical' ? 'critical' : QUALITY_META[item.code].severity === 'caution' ? 'caution' : 'neutral'}>
                  {QUALITY_META[item.code].label}
                </Badge>
                <span className={styles.historyItem__body}>{QUALITY_META[item.code].detail}</span>
                <span className={styles.rate} style={{ width: 220 }}>
                  <span className={styles.rate__track}>
                    <span
                      className={styles.rate__bar}
                      style={{ width: `${Math.round((item.count / maxCode) * 100)}%` }}
                    />
                  </span>
                  <span className={styles.rate__value}>{formatNumber(item.count)}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
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
            rows={rows}
            getRowKey={(row) => row.schoolId}
            getRowClassName={(row) => (row.qualityRate < QUALITY_THRESHOLD ? styles.rowAlert : undefined)}
          />
        </Card>
      </Reveal>
    </div>
  );
}
