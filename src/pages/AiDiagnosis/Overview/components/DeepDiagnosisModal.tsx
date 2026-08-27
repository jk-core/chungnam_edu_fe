import dayjs from 'dayjs';
import { useMemo } from 'react';
import { Badge } from '@/components/common/Badge';
import { EChart } from '@/components/common/EChart';
import { EmptyState } from '@/components/common/EmptyState';
import { faultCodeLabel, getFaultCode } from '@/mocks/faultCodes';
import { getInvertersOf } from '@/mocks/equipment';
import { getPredictionSeries } from '@/mocks/prediction';
import { Modal } from '@/components/common/Modal';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { PredictionPoint } from '@/interface/diagnosisDetail';
import type { ScopeNode } from '@/interface/tree';
import styles from '../../AiDiagnosis.module.scss';
import type { EChartsOption } from 'echarts';

interface DeepDiagnosisModalProps {
  /** 열려 있으면 그 설비, 닫혀 있으면 null */
  node: ScopeNode | null;
  /** 심층 진단 기준일 */
  date: Date;
  onClose: () => void;
}

/**
 * 심층 진단 (SFR-013-09/10).
 *
 * 일자별 판정이 "어느 날 처졌다"까지 알려 준다면, 여기서는 그 날 안에서 언제부터 어긋났는지를 본다.
 * raw 수집값(정시 전압·전류)에 AI 추정값을 겹쳐 그리고, 한 시점에 마우스를 올리면
 * 추정값·측정값·편차·고장분류를 한 창에 모아 보여 준다.
 */
export function DeepDiagnosisModal({ node, date, onClose }: DeepDiagnosisModalProps) {
  const palette = useChartPalette();

  /*
   * 예측 모델은 인버터 단위로 돌아간다 (SFR-014-01).
   * 인버터보다 위(발전소)를 고르면 그 발전소의 첫 인버터를, 아래(스트링)를 고르면
   * 소속 인버터를 기준으로 삼는다 — 어느 인버터를 보고 있는지는 제목에 적는다.
   */
  const inverterId = useMemo(() => {
    if (!node) return null;
    if (node.kind === 'inverter') return node.id;
    if (node.inverterId) return node.inverterId;
    if (node.plantId) return getInvertersOf(node.plantId)[0]?.id ?? null;

    return null;
  }, [node]);

  const points = useMemo<PredictionPoint[]>(
    () => (inverterId ? getPredictionSeries(inverterId, date) : []),
    [inverterId, date],
  );

  /*
   * 통신이 끊긴 설비는 실측이 통째로 0 이라 편차도 0 으로 떨어진다.
   * 그대로 두면 "편차 0% · 정상"으로 읽혀 멀쩡한 설비와 구분이 안 된다 — 잰 값이 없다고 적는다.
   */
  const live = points.filter((point) => point.actualCurrent > 0);
  const hasLive = live.length > 0;
  const worst = live.reduce<PredictionPoint | null>(
    (acc, point) => (acc === null || point.deviation < acc.deviation ? point : acc),
    null,
  );
  const fault = getFaultCode(worst?.faultCode ?? 0);
  const averageDeviation = hasLive
    ? live.reduce((sum, point) => sum + point.deviation, 0) / live.length
    : 0;

  const option: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 52, bottom: 30, left: 56 },
    legend: topLegend(palette, ['측정 전류', '추정 전류', '측정 전압', '추정 전압']),
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
      /*
       * 통합 정보창 (SFR-013-10) — 그 시점의 추정·측정·편차·고장분류를 한 번에 읽는다.
       * 값이 네 줄로 흩어지면 어느 쪽이 얼마나 벌어졌는지 눈으로 다시 맞춰야 한다.
       */
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const index = Number(list[0]?.dataIndex ?? 0);
        const point = points[index];

        if (!point) return '';

        const gap = point.deviation;
        const gapColor = gap < -10 ? palette.critical : palette.text;

        return [
          `<strong>${point.time}</strong>`,
          `전류 측정 ${formatNumber(point.actualCurrent, 1)}A · 추정 ${formatNumber(point.predCurrent, 1)}A`,
          `전압 측정 ${formatNumber(point.actualVoltage, 1)}V · 추정 ${formatNumber(point.predVoltage, 1)}V`,
          `<span style="color:${gapColor}">편차 ${gap > 0 ? '+' : ''}${formatNumber(gap, 1)}%</span>`,
          `진단 ${faultCodeLabel(point.faultCode)}`,
        ].join('<br/>');
      },
    },
    xAxis: {
      type: 'category',
      data: points.map((point) => point.time),
      boundaryGap: false,
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11, hideOverlap: true },
    },
    yAxis: [
      {
        type: 'value',
        name: 'A',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, 0, 0, -28] },
        splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
        axisLabel: { color: palette.axis, fontSize: 11 },
      },
      {
        type: 'value',
        name: 'V',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11 },
        splitLine: { show: false },
        axisLabel: { color: palette.axis, fontSize: 11 },
      },
    ],
    series: [
      {
        name: '측정 전류',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.generation, width: 2 },
        itemStyle: { color: palette.generation },
        data: points.map((point) => point.actualCurrent),
      },
      {
        // 추정값은 점선으로 둔다 — 실제로 잰 값과 헷갈리면 안 된다.
        name: '추정 전류',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.generation, width: 1.4, type: 'dashed', opacity: 0.7 },
        itemStyle: { color: palette.generation },
        data: points.map((point) => point.predCurrent),
      },
      {
        name: '측정 전압',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.irradiance, width: 2 },
        itemStyle: { color: palette.irradiance },
        data: points.map((point) => point.actualVoltage),
      },
      {
        name: '추정 전압',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.irradiance, width: 1.4, type: 'dashed', opacity: 0.7 },
        itemStyle: { color: palette.irradiance },
        data: points.map((point) => point.predVoltage),
      },
    ],
  };

  return (
    <Modal
      isOpen={node !== null}
      onClose={onClose}
      size="lg"
      title={node ? `${node.name} 심층 진단` : '심층 진단'}
      description={`${dayjs(date).format('YYYY년 M월 D일')} 정시 수집값에 AI 추정값을 겹쳐 봅니다. 선 위에 마우스를 올리면 그 시각의 추정·측정·편차·진단이 함께 나옵니다.`}
    >
      {points.length === 0 ? (
        <EmptyState
          title="심층 진단할 계측이 없습니다"
          description="이 설비에는 예측 모델이 도는 인버터가 없습니다."
        />
      ) : (
        <>
          <dl className={styles.deepSummary}>
            <div>
              <dt>평균 편차</dt>
              <dd className={hasLive && averageDeviation < -10 ? styles.deltaDown : undefined}>
                {hasLive ? `${averageDeviation > 0 ? '+' : ''}${formatNumber(averageDeviation, 1)}` : '—'}
                {hasLive ? <small>%</small> : null}
              </dd>
            </div>
            <div>
              <dt>가장 벌어진 시각</dt>
              <dd>{worst ? worst.time : '—'}</dd>
            </div>
            <div>
              <dt>AI 진단</dt>
              <dd>
                {hasLive ? (
                  <Badge tone={fault && fault.code > 0 ? 'critical' : 'ok'} withDot>
                    {fault ? fault.label : '정상'}
                  </Badge>
                ) : (
                  <Badge tone="offline" withDot>계측 없음</Badge>
                )}
              </dd>
            </div>
          </dl>

          <EChart
            option={option}
            height={320}
            summary={`${node?.name ?? ''} ${dayjs(date).format('M월 D일')} 정시 전압·전류 추정 대 측정 비교. 평균 편차 ${formatNumber(averageDeviation, 1)}%.`}
          />
        </>
      )}
    </Modal>
  );
}
