import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Card } from '@/components/common/Card';
import { EChart } from '@/components/common/EChart';
import { EmptyState } from '@/components/common/EmptyState';
import { NORMAL_BAND } from '@/configs/diagnosis';
import { Button } from '@/components/common/Button';
import { FAULT_CODES } from '@/mocks/faultCodes';
import { InfoIcon } from '@/components/common/Icon';
import { Modal } from '@/components/common/Modal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { cn } from '@/utils/cn';
import { Reveal } from '@/components/common/Reveal';
import { normalBand, seriesPalette } from '@/utils/chart';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import { useDiagnosisScope } from '@/hooks/useDiagnosisScope';
import type { FaultCode } from '@/interface/equipment';
import styles from '../../AiDiagnosis.module.scss';
import { useDiagnosisEfficiency } from '../hooks/useDiagnosisEfficiency';
import { DailyEfficiencyTable } from './DailyEfficiencyTable';
import { FaultCodeModal } from './FaultCodeModal';
import type { EChartsOption } from 'echarts';

type DailyView = 'table' | 'chart';

const VIEW_OPTIONS: { value: DailyView; label: string }[] = [
  { value: 'table', label: '표' },
  { value: 'chart', label: '차트' },
];

/**
 * 기간별 발전 진단·고장 분류 조회 (SFR-013).
 * 가로는 날짜, 세로는 설비다 — 줄을 펼치면 그 아래 스트링이 따라 나온다.
 */
export function DiagnosisFaults() {
  const { label } = useDiagnosisScope();
  const { rows, dates, isLoading, hasChildren, unitNoun } = useDiagnosisEfficiency();
  const palette = useChartPalette();
  const [openFault, setOpenFault] = useState<{ fault: FaultCode; device: string } | null>(null);
  const [view, setView] = useState<DailyView>('table');
  const [guideOpen, setGuideOpen] = useState(false);

  const dayLabels = useMemo(() => dates.map((date) => dayjs(date).format('M/D')), [dates]);

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
    series: rows.map((row, index) => ({
      name: row.name,
      type: 'line',
      showSymbol: false,
      smooth: true,
      lineStyle: { color: seriesColors[index % seriesColors.length], width: 1.8 },
      itemStyle: { color: seriesColors[index % seriesColors.length] },
      // 계측이 없는 날은 0 이 아니라 선을 끊는다.
      data: row.points.map((point) => (point.efficiency > 0 ? point.efficiency : null)),
      markArea: index === 0 ? normalBand(NORMAL_BAND.min, NORMAL_BAND.max, palette.okSoft) : undefined,
    })),
  };

  // 조회 대상에 아래 계층이 없다는 안내는 설비별 진단 현황 판이 이미 띄운다.
  if (!hasChildren) return null;

  return (
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
          {rows.length === 0 ? (
            <EmptyState
              title={isLoading ? '진단 결과를 불러오는 중입니다' : '진단 결과가 없습니다'}
              description={isLoading ? '' : `${label} 하위 ${unitNoun}의 조회 기간 진단 결과가 없습니다.`}
            />
          ) : view === 'table' ? (
            <DailyEfficiencyTable
              rows={rows}
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
