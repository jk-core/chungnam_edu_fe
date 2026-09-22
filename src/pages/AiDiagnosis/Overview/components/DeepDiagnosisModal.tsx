import dayjs from 'dayjs';
import { Badge } from '@/components/common/Badge';
import { EChart } from '@/components/common/EChart';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { DiagnosisRawPoint } from '@/service/diagnosis/type';
import styles from '../../AiDiagnosis.module.scss';
import { useDiagnosisRaw } from '../hooks/useDiagnosisRaw';
import { metricText } from './trendMetric';
import type { EChartsOption } from 'echarts';

interface DeepDiagnosisModalProps {
  /** 열려 있으면 그 설비의 트리 노드 id, 닫혀 있으면 null */
  nodeId: string | null;
  /** 심층 진단 기준일 */
  date: Date;
  onClose: () => void;
}

/**
 * 심층 진단 (SFR-013-09/10).
 *
 * 일자별 판정이 "어느 날 처졌다"까지 알려 준다면, 여기서는 그 날 안에서 언제부터 어긋났는지를 본다.
 * 기간 추이와 같은 수집 raw 를 하루치만 받아, 측정값에 머신러닝 예측값을 겹쳐 그리고
 * 한 시점에 마우스를 올리면 예측·측정·편차·고장분류를 한 창에 모아 보여 준다.
 */
export function DeepDiagnosisModal({ nodeId, date, onClose }: DeepDiagnosisModalProps) {
  const palette = useChartPalette();
  const day = dayjs(date).format('YYYY-MM-DD');
  const { name, points, isLoading } = useDiagnosisRaw(nodeId, day, day);

  /*
   * 통신이 끊긴 설비는 실측이 통째로 0 이라 편차도 0 으로 떨어진다.
   * 그대로 두면 "편차 0% · 정상"으로 읽혀 멀쩡한 설비와 구분이 안 된다 — 잰 값이 없다고 적는다.
   */
  const live = points.filter((point) => point.pvCur !== null && point.pvCur > 0);
  const hasLive = live.length > 0;
  const deviations = live.map((point) => (
    point.pvCurMl !== null && point.pvCurMl > 0 ? (((point.pvCur ?? 0) - point.pvCurMl) / point.pvCurMl) * 100 : 0
  ));
  const averageDeviation = hasLive ? deviations.reduce((sum, value) => sum + value, 0) / deviations.length : 0;
  const worstIndex = deviations.reduce(
    (acc, value, index) => (acc === -1 || value < deviations[acc] ? index : acc),
    -1,
  );
  const worst = worstIndex === -1 ? null : live[worstIndex];

  const times = points.map((point) => dayjs(point.gathDtm).format('HH:mm'));

  const option: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 52, bottom: 30, left: 56 },
    legend: topLegend(palette, ['측정 전류', 'ML 예측 전류', '측정 전압', 'ML 예측 전압']),
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
      /*
       * 통합 정보창 (SFR-013-10) — 그 시점의 예측·측정·편차·고장분류를 한 번에 읽는다.
       * 값이 네 줄로 흩어지면 어느 쪽이 얼마나 벌어졌는지 눈으로 다시 맞춰야 한다.
       */
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const index = Number(list[0]?.dataIndex ?? 0);
        const point = points[index];

        if (!point) return '';

        const gap = point.pvCur !== null && point.pvCurMl !== null && point.pvCurMl > 0
          ? ((point.pvCur - point.pvCurMl) / point.pvCurMl) * 100
          : null;

        return [
          `<strong>${times[index]}</strong>`,
          `전류 측정 ${metricText(point.pvCur, 2, 'A')} · ML ${metricText(point.pvCurMl, 2, 'A')}`,
          `전압 측정 ${metricText(point.pvVlt, 1, 'V')} · ML ${metricText(point.pvVltMl, 1, 'V')}`,
          gap === null
            ? '편차 —'
            : `<span style="color:${gap < -10 ? palette.critical : palette.text}">편차 ${gap > 0 ? '+' : ''}${formatNumber(gap, 1)}%</span>`,
          `진단 ${point.faultCodeName || '정상'}`,
        ].join('<br/>');
      },
    },
    xAxis: {
      type: 'category',
      data: times,
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
        data: points.map((point) => point.pvCur),
      },
      {
        // 예측값은 점선으로 둔다 — 실제로 잰 값과 헷갈리면 안 된다.
        name: 'ML 예측 전류',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.generation, width: 1.4, type: 'dashed', opacity: 0.7 },
        itemStyle: { color: palette.generation },
        data: points.map((point) => point.pvCurMl),
      },
      {
        name: '측정 전압',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.irradiance, width: 2 },
        itemStyle: { color: palette.irradiance },
        data: points.map((point) => point.pvVlt),
      },
      {
        name: 'ML 예측 전압',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.irradiance, width: 1.4, type: 'dashed', opacity: 0.7 },
        itemStyle: { color: palette.irradiance },
        data: points.map((point) => point.pvVltMl),
      },
    ],
  };

  return (
    <Modal
      isOpen={nodeId !== null}
      onClose={onClose}
      size="lg"
      title={name ? `${name} 심층 진단` : '심층 진단'}
      description={`${dayjs(date).format('YYYY년 M월 D일')} 수집값에 ML 예측값을 겹쳐 봅니다. 선 위에 마우스를 올리면 그 시각의 예측·측정·편차·진단이 함께 나옵니다.`}
    >
      {points.length === 0 ? (
        <EmptyState
          title={isLoading ? '심층 진단을 불러오는 중입니다' : '심층 진단할 계측이 없습니다'}
          description={isLoading ? '' : '이 설비는 그날 수집된 값이 없습니다.'}
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
              <dd>{worst ? dayjs(worst.gathDtm).format('HH:mm') : '—'}</dd>
            </div>
            <div>
              <dt>AI 진단</dt>
              <dd><DiagnosisBadge hasLive={hasLive} point={worst} /></dd>
            </div>
          </dl>

          <EChart
            option={option}
            height={320}
            summary={`${name} ${dayjs(date).format('M월 D일')} 전압·전류 예측 대 측정 비교. 평균 편차 ${formatNumber(averageDeviation, 1)}%.`}
          />
        </>
      )}
    </Modal>
  );
}

/** 진단이 아직 안 붙은 시점은 「정상」이 아니다 — 모른다고 적는다 */
function DiagnosisBadge({ hasLive, point }: { hasLive: boolean; point: DiagnosisRawPoint | null }) {
  if (!hasLive) return <Badge tone="offline" withDot>계측 없음</Badge>;
  if (!point || point.faultCode === null) return <Badge tone="offline" withDot>—</Badge>;
  if (point.faultCode > 0) return <Badge tone="critical" withDot>{point.faultCodeName ?? '이상'}</Badge>;

  return <Badge tone="ok" withDot>{point.faultCodeName ?? '정상'}</Badge>;
}
