import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Card } from '@/components/common/Card';
import { EChart } from '@/components/common/EChart';
import { EmptyState } from '@/components/common/EmptyState';
import { getChildNodes } from '@/mocks/tree';
import { getDiagEfficiencyPoints } from '@/mocks/prediction';
import { NORMAL_BAND } from '@/configs/diagnosis';
import { Button } from '@/components/common/Button';
import { FAULT_CODES } from '@/mocks/faultCodes';
import { InfoIcon } from '@/components/common/Icon';
import { Modal } from '@/components/common/Modal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { cn } from '@/utils/cn';
import { getDiagnosisUnits } from '@/mocks/equipment';
import { Reveal } from '@/components/common/Reveal';
import { normalBand, seriesPalette } from '@/utils/chart';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import { useDiagnosisRange } from '@/stores/filterStore';
import { useDiagnosisScope } from '@/hooks/useDiagnosisScope';
import type { DiagEfficiencyPoint } from '@/interface/diagnosisDetail';
import type { DiagnosisFaultCode, FaultCode } from '@/interface/equipment';
import type { OperationStatus } from '@/interface/status';
import styles from '../../AiDiagnosis.module.scss';
import { DailyEfficiencyTable } from './DailyEfficiencyTable';
import { FaultCodeModal } from './FaultCodeModal';
import type { DailyEfficiencyRow } from './DailyEfficiencyTable';
import type { EChartsOption } from 'echarts';

type DailyView = 'table' | 'chart';

const VIEW_OPTIONS: { value: DailyView; label: string }[] = [
  { value: 'table', label: '표' },
  { value: 'chart', label: '차트' },
];

interface UnitRow {
  id: string;
  name: string;
  sub: string;
  points: DiagEfficiencyPoint[];
  efficiency: number;
  estimateKwh: number;
  measuredKwh: number;
  faultCode: DiagnosisFaultCode;
  status: OperationStatus;
  capacityKw: number;
}

/**
 * 기간별 발전 진단·고장 분류 조회 (SFR-013).
 * 효율 추이에 정상 구간을 깔고, 설비별 일자 격자와 추정·측정 비교표를 함께 둔다.
 */
export function DiagnosisFaults() {
  const { target, inverter, label } = useDiagnosisScope();
  const [range] = useDiagnosisRange();
  const palette = useChartPalette();
  const [openFault, setOpenFault] = useState<{ fault: FaultCode; device: string } | null>(null);
  const [view, setView] = useState<DailyView>('table');
  const [guideOpen, setGuideOpen] = useState(false);

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
        status: item.status,
        capacityKw: item.capacityKw,
        points,
        efficiency: last?.efficiency ?? 0,
        estimateKwh: points.reduce((sum, point) => sum + point.estimateKwh, 0),
        measuredKwh: points.reduce((sum, point) => sum + point.measuredKwh, 0),
        faultCode: last?.faultCode ?? 0,
      };
    });
  }, [target, inverter, range.start, range.end]);

  /** 한 계층 아래에 무엇이 늘어서는지 — 표 제목과 머리글에 그대로 쓴다. */
  const unitNoun = target.kind === 'inverter'
    ? '스트링'
    : target.kind === 'plant' ? '인버터' : '발전소';

  const dates = useMemo(() => {
    const days = Math.max(1, dayjs(range.end).diff(dayjs(range.start), 'day') + 1);

    return Array.from({ length: days }, (_, index) => dayjs(range.start).add(index, 'day').format('YYYY-MM-DD'));
  }, [range.start, range.end]);

  const dayLabels = useMemo(() => dates.map((date) => dayjs(date).format('M/D')), [dates]);

  /**
   * 표에 얹을 줄 — 인버터 줄을 펼치면 그 아래 스트링이 따라 나온다.
   * 이미 계산해 둔 units 를 그대로 쓰고, 자식만 트리에서 한 겹 더 읽는다.
   */
  const tableRows = useMemo<DailyEfficiencyRow[]>(() => units.map((unit) => {
    const children = target.kind === 'inverter'
      ? []
      : getChildNodes(unit.id).map((node) => ({
        id: node.id,
        name: node.name,
        status: node.status,
        meta: `${formatNumber(node.capacityKw, 1)} kW`,
        points: getDiagEfficiencyPoints(node.id, node.status, node.capacityKw, range.start, range.end),
      }));

    return {
      id: unit.id,
      name: unit.name,
      status: unit.status,
      meta: children.length > 0
        ? `${formatNumber(unit.capacityKw, 1)} kW · 하위 ${children.length}`
        : `${formatNumber(unit.capacityKw, 1)} kW`,
      points: unit.points,
      children,
    };
  }), [units, target.kind, range.start, range.end]);

  /**
   * 설비별 일자 효율을 한 그림에 겹친다 (SFR-013-02).
   * 어느 설비가 언제부터 처지는지 서로 견주어 보게 하는 것이 목적이다.
   */
  const seriesColors = seriesPalette(palette);
  const compareOption: EChartsOption = {
    grid: { top: 34, right: 24, bottom: 30, left: 48 },
    legend: { top: 0, type: 'scroll', textStyle: { color: palette.textMuted, fontSize: 11 } },
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
      data: dayLabels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11, hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      name: '진단 효율 %',
      max: 110,
      nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, 0, 0, -30] },
      splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
      axisLabel: { color: palette.axis, fontSize: 11 },
    },
    series: units.map((unit, index) => ({
      name: unit.name,
      type: 'line',
      showSymbol: false,
      smooth: true,
      lineStyle: { color: seriesColors[index % seriesColors.length], width: 1.8 },
      itemStyle: { color: seriesColors[index % seriesColors.length] },
      // 계측이 없는 날은 0 이 아니라 선을 끊는다.
      data: unit.points.map((point) => (point.efficiency > 0 ? point.efficiency : null)),
      markArea: index === 0 ? normalBand(NORMAL_BAND.min, NORMAL_BAND.max, palette.okSoft) : undefined,
    })),
  };

  return (
    <>
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
              title={`${unitNoun} 일자별 발전효율`}
              description={`${label} 하위 ${unitNoun}의 일자별 발전 효율(%) — 행을 펼치면 하위 설비별 효율이 표시됩니다`}
              action={(
                <div className={styles.dailyActions}>
                  <Button variant="secondary" size="sm" iconLeft={<InfoIcon />} onClick={() => setGuideOpen(true)}>
                    고장코드 안내
                  </Button>
                  <SegmentedControl
                    label="보기 방식"
                    size="sm"
                    options={VIEW_OPTIONS}
                    value={view}
                    onChange={setView}
                  />
                </div>
              )}
            >
              {view === 'table' ? (
                <DailyEfficiencyTable
                  rows={tableRows}
                  dates={dates}
                  unitHeader="설비 / 일자"
                  onFaultClick={(fault, device, date) =>
                    setOpenFault({ fault, device: `${device} · ${dayjs(date).format('M월 D일')}` })}
                />
              ) : (
                <EChart
                  option={compareOption}
                  height={320}
                  summary={`${unitNoun}별 일자 진단 효율 비교. 정상 기준 ${NORMAL_BAND.min}%.`}
                />
              )}
            </Card>
          </Reveal>

        </>
      )}

      <FaultCodeModal
        fault={openFault?.fault ?? null}
        deviceLabel={openFault?.device}
        onClose={() => setOpenFault(null)}
      />

      <Modal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        size="lg"
        title="고장코드 안내"
        description="AI 진단이 붙이는 코드와 그 뜻입니다. 표의 칸 색이 이 코드를 따릅니다."
      >
        <ul className={styles.guideList}>
          {FAULT_CODES.map((item) => (
            <li key={item.code} className={styles.guideItem}>
              <button
                type="button"
                className={styles.guideItem__button}
                onClick={() => {
                  setOpenFault({ fault: item, device: '' });
                  setGuideOpen(false);
                }}
              >
                <span className={cn(styles.guideItem__swatch, styles[`guideSwatch--c${item.code}`])} aria-hidden />
                <span className={styles.guideItem__name}>{item.label}</span>
                <span className={styles.guideItem__summary}>{item.summary}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
