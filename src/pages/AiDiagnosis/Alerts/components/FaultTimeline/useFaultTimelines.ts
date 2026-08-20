import { useMemo } from 'react';
import { getFaultTimelines, timelineDurationMinutes } from '@/mocks/faultTimeline';
import { mergeSteps, useManualActions } from '@/stores/faultActionStore';
import { NOW } from '@/mocks/today';
import { useDiagnosisScope } from '@/hooks/useDiagnosisScope';
import type { FaultTimeline } from '@/interface/faultTimeline';

/** 타임라인이 거슬러 올라가는 기간(년) */
const TIMELINE_YEARS = 5;

/**
 * 이상 발생 구간 목록 (SFR-015).
 * 사용자가 직접 넣은 조치를 원래 단계에 얹어, 완료 여부와 끝난 시각을 다시 셈한다.
 */
export function useFaultTimelines() {
  const { target, label } = useDiagnosisScope();
  // 사용자가 넣은 조치가 바뀌면 목록을 다시 그린다.
  const manual = useManualActions();

  const timelines = useMemo(() => {
    const rows = getFaultTimelines(target);

    return rows.map((row) => {
      const steps = mergeSteps(row.steps, manual[row.id]);
      const resolvedStep = steps.findLast((step) => step.phase === 'resolved');

      return {
        ...row,
        steps,
        resolved: Boolean(resolvedStep),
        endedAt: resolvedStep?.at ?? null,
      } satisfies FaultTimeline;
    });
  }, [target, manual]);

  /**
   * 축은 오늘부터 5년 전까지 — 과거로 계속 밀어 볼 수 있어야 한다.
   * 날짜 칸이 1,800개를 넘으므로 눈금은 보이는 구간만 그린다(FaultGantt).
   */
  const axis = useMemo(
    () => ({ from: NOW.subtract(TIMELINE_YEARS, 'year').startOf('day'), to: NOW.endOf('day') }),
    [],
  );

  return {
    label,
    timelines,
    axis,
    openCount: timelines.filter((item) => !item.resolved).length,
    totalLoss: timelines.reduce((sum, item) => sum + item.lossKwh, 0),
    averageMinutes: timelines.length > 0
      ? Math.round(timelines.reduce((sum, item) => sum + timelineDurationMinutes(item), 0) / timelines.length)
      : 0,
  };
}
