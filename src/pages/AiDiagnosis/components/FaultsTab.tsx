import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { DIAG_LEGEND, DiagnosisHeatmap } from '@/components/common/DiagnosisHeatmap';
import { EChart } from '@/components/common/EChart';
import { EmptyState } from '@/components/common/EmptyState';
import { getChildNodes } from '@/mocks/tree';
import { getDiagEfficiencyPoints, MODEL_METRICS, MODEL_NOTE, NORMAL_BAND } from '@/mocks/prediction';
import { getDiagnosisUnits, getFaultCode } from '@/mocks/equipment';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { buildCompareTooltip, normalBand, thresholdLine } from '@/utils/chart';
import { formatNumber, formatPercent } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import { useDiagnosisRange } from '@/stores/filterStore';
import { useDiagnosisScope } from '@/hooks/useDiagnosisScope';
import type { Column } from '@/components/common/Table';
import type { DiagEfficiencyPoint } from '@/interface/diagnosisDetail';
import type { FaultCode } from '@/interface/equipment';
import styles from '../AiDiagnosis.module.scss';
import { AnalysisFilter } from './AnalysisFilter';
import { FaultCodeModal } from './FaultCodeModal';
import type { EChartsOption } from 'echarts';

interface UnitRow {
  id: string;
  name: string;
  sub: string;
  points: DiagEfficiencyPoint[];
  efficiency: number;
  estimateKwh: number;
  measuredKwh: number;
  faultCode: string;
}

/**
 * 기간별 발전 진단·고장 분류 조회 (SFR-013).
 * 효율 추이에 정상 구간을 깔고, 설비별 일자 격자와 추정·측정 비교표를 함께 둔다.
 */
export function FaultsTab() {
  const { target, inverter, label } = useDiagnosisScope();
  const [range] = useDiagnosisRange();
  const palette = useChartPalette();
  const [openFault, setOpenFault] = useState<{ fault: FaultCode; device: string } | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  // 인버터까지 좁혔으면 그 아래 판정 단위를, 그 위 계층이면 자식 노드를 본다.
  const units = useMemo<UnitRow[]>(() => {
    const base = inverter && target.kind === 'inverter'
      ? getDiagnosisUnits(inverter).map((unit) => ({
        id: unit.id,
        name: unit.name,
        sub: inverter.name,
        status: unit.status,
        capacityKw: unit.capacityKw,
      }))
      : getChildNodes(target.id).slice(0, 14).map((node) => ({
        id: node.id,
        name: node.name,
        sub: target.name,
        status: node.status,
        capacityKw: node.capacityKw,
      }));

    return base.map((item) => {
      const points = getDiagEfficiencyPoints(item.id, item.status, item.capacityKw, range.start, range.end);
      const last = points[points.length - 1];

      return {
        id: item.id,
        name: item.name,
        sub: item.sub,
        points,
        efficiency: last?.efficiency ?? 0,
        estimateKwh: points.reduce((sum, point) => sum + point.estimateKwh, 0),
        measuredKwh: points.reduce((sum, point) => sum + point.measuredKwh, 0),
        faultCode: last?.faultCode ?? 'F-000',
      };
    });
  }, [target, inverter, range.start, range.end]);

  const focus = units.find((unit) => unit.id === focusId) ?? units[0] ?? null;

  const dayLabels = useMemo(() => {
    const days = Math.max(1, dayjs(range.end).diff(dayjs(range.start), 'day') + 1);

    return Array.from({ length: days }, (_, index) => dayjs(range.start).add(index, 'day').format('M/D'));
  }, [range.start, range.end]);

  /** 진단 효율 추이 — 정상 구간을 띠로 깔고 툴팁에 추정·측정·편차를 묶는다 (SFR-013-03/05) */
  const points = focus?.points ?? [];
  const efficiencyOption: EChartsOption = {
    grid: { top: 30, right: 24, bottom: 30, left: 48 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      padding: 10,
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const index = (list[0] as { dataIndex: number }).dataIndex;
        const point = points[index];

        if (!point) return '';

        return buildCompareTooltip({
          title: `${focus?.name ?? ''} · ${dayjs(point.date).format('M월 D일')}`,
          estimate: { label: '추정값', value: point.estimateKwh, unit: 'kWh' },
          measured: { label: '측정값', value: point.measuredKwh, unit: 'kWh' },
          rows: [
            {
              label: '진단 효율',
              value: `${point.efficiency.toFixed(1)}%`,
              tone: point.efficiency >= NORMAL_BAND.min ? 'ok' : 'critical',
            },
            {
              label: '편차',
              value: `${(point.measuredKwh - point.estimateKwh).toLocaleString('ko-KR')} kWh`,
              tone: point.measuredKwh >= point.estimateKwh ? 'ok' : 'caution',
            },
            {
              label: '고장 분류',
              value: getFaultCode(point.faultCode)?.label ?? '정상',
              tone: point.faultCode === 'F-000' ? 'ok' : 'critical',
            },
          ],
          palette,
        });
      },
    },
    xAxis: {
      type: 'category',
      data: points.map((point) => dayjs(point.date).format('M/D')),
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
    },
    yAxis: {
      type: 'value',
      name: '진단 효율 %',
      max: 110,
      nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, 0, 0, -30] },
      splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
      axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
    },
    series: [
      {
        name: '진단 효율',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: palette.generation, width: 2.2 },
        itemStyle: { color: palette.generation },
        areaStyle: { color: palette.generationSoft },
        data: points.map((point) => point.efficiency),
        markArea: normalBand(NORMAL_BAND.min, NORMAL_BAND.max, palette.okSoft),
        markLine: thresholdLine(NORMAL_BAND.min, palette.ok, `정상 기준 ${NORMAL_BAND.min}%`),
      },
    ],
  };

  const columns: Column<UnitRow>[] = [
    {
      key: 'name',
      header: '설비',
      render: (row) => (
        <span className={styles.cellStack}>
          <span className={styles.cellStrong}>{row.name}</span>
          <span className={styles.cellSub}>{row.sub}</span>
        </span>
      ),
    },
    {
      key: 'efficiency',
      header: '진단 효율',
      align: 'right',
      width: '110px',
      render: (row) => (
        <span className={row.efficiency > 0 && row.efficiency < NORMAL_BAND.min ? styles.deltaDown : styles.cellData}>
          {row.efficiency <= 0 ? '—' : `${formatNumber(row.efficiency, 1)}%`}
        </span>
      ),
    },
    {
      key: 'estimate',
      header: '추정값 (kWh)',
      align: 'right',
      width: '124px',
      hideOnTablet: true,
      render: (row) => <span className={styles.cellMuted}>{formatNumber(row.estimateKwh)}</span>,
    },
    {
      key: 'measured',
      header: '측정값 (kWh)',
      align: 'right',
      width: '124px',
      render: (row) => <span className={styles.cellData}>{formatNumber(row.measuredKwh)}</span>,
    },
    {
      key: 'fault',
      header: '고장 분류',
      width: '158px',
      render: (row) => {
        const fault = getFaultCode(row.faultCode);

        if (!fault || fault.code === 'F-000') return <Badge tone="ok">정상</Badge>;

        return (
          <button
            type="button"
            className={styles.inverter__fault}
            onClick={() => setOpenFault({ fault, device: `${row.sub} · ${row.name}` })}
          >
            <span className={styles.inverter__faultCode}>{fault.code}</span>
            {fault.label}
          </button>
        );
      },
    },
  ];

  return (
    <div className={styles.tab}>
      <AnalysisFilter trailing={<p className={styles.toolbar__count}>판정 단위 {units.length}개</p>} />

      <Reveal>
        <Card eyebrow="Model" title="AI 진단 모델" description={MODEL_NOTE}>
          <div className={styles.infoGrid}>
            <div>
              <dt>전압 예측 R²</dt>
              <dd>{MODEL_METRICS.voltageR2.toFixed(3)}</dd>
            </div>
            <div>
              <dt>전류 예측 R²</dt>
              <dd>{MODEL_METRICS.currentR2.toFixed(3)}</dd>
            </div>
            <div>
              <dt>고장 분류 정확도</dt>
              <dd>{formatPercent(MODEL_METRICS.faultAccuracy, 1)}</dd>
            </div>
            <div>
              <dt>학습 표본</dt>
              <dd>{formatNumber(MODEL_METRICS.sampleCount)}</dd>
            </div>
          </div>
        </Card>
      </Reveal>

      {units.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="판정할 하위 설비가 없습니다"
            description={`${label} 아래에는 진단 대상이 없습니다. 좌측에서 상위 계층을 골라 보세요.`}
          />
        </Card>
      ) : (
        <>
          <Reveal delay={0.06}>
            <Card
              eyebrow="Efficiency"
              title={`${focus?.name ?? ''} 진단 효율 추이`}
              description="옅은 초록 띠가 정상 구간입니다. 점 위에 마우스를 올리면 추정값·측정값·편차와 고장 분류를 함께 봅니다."
            >
              <EChart
                option={efficiencyOption}
                height={300}
                summary={`${focus?.name ?? ''}의 기간 진단 효율. 최근 ${formatNumber(focus?.efficiency ?? 0, 1)}%, 정상 기준 ${NORMAL_BAND.min}%.`}
              />
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <Card
              eyebrow="Daily"
              title="설비별 일자 진단 결과"
              description="칸을 누르면 그 설비를 위 추이 그래프로 올립니다. 계측값이 없는 날은 사선으로 표시했습니다."
            >
              <DiagnosisHeatmap
                rows={units.map((unit) => ({
                  key: unit.id,
                  label: unit.name,
                  sub: unit.sub,
                  values: unit.points.map((point) => point.efficiency),
                }))}
                cols={dayLabels}
                caption="설비별 일자 진단 효율 격자"
                legend={DIAG_LEGEND}
                onCellClick={(row) => setFocusId(row.key)}
              />
            </Card>
          </Reveal>

          <Reveal delay={0.14}>
            <Card
              eyebrow="Report"
              title="설비별 평균 발전 효율"
              description="추정값과 측정값을 나란히 놓고 봅니다. 고장 분류를 누르면 원인과 조치 방안이 열립니다."
              padding="none"
            >
              <Table
                caption="설비별 진단 효율, 추정값, 측정값, 고장 분류 표"
                columns={columns}
                rows={units}
                getRowKey={(row) => row.id}
                getRowClassName={(row) =>
                  (row.efficiency > 0 && row.efficiency < NORMAL_BAND.min ? styles.rowHighlight : undefined)}
                className={styles.tableInset}
              />
            </Card>
          </Reveal>
        </>
      )}

      <FaultCodeModal
        fault={openFault?.fault ?? null}
        deviceLabel={openFault?.device}
        onClose={() => setOpenFault(null)}
      />
    </div>
  );
}
