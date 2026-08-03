import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { TimelineStep } from '@/interface/faultTimeline';

/** 관리자가 직접 넣은 조치 한 건 */
export interface ManualAction {
  at: string;
  note: string;
  actor: string;
  /** 이 조치로 건이 종결됐는지 */
  resolves: boolean;
}

interface FaultActionState {
  /** 타임라인 id → 추가된 조치들 */
  actions: Record<string, ManualAction[]>;
  /** 알림 id → 조치 예정일(YYYY-MM-DD). 그 날까지 알림을 재운다 (SFR-022-05) */
  snoozedUntil: Record<string, string>;
  addAction: (timelineId: string, action: ManualAction) => void;
  removeAction: (timelineId: string, at: string) => void;
  snooze: (alertId: string, until: string) => void;
  unsnooze: (alertId: string) => void;
}

const useFaultActionStore = create<FaultActionState>()(
  persist(
    (set) => ({
      actions: {},
      snoozedUntil: {},
      addAction: (timelineId, action) =>
        set((state) => ({
          actions: { ...state.actions, [timelineId]: [...(state.actions[timelineId] ?? []), action] },
        })),
      removeAction: (timelineId, at) =>
        set((state) => ({
          actions: {
            ...state.actions,
            [timelineId]: (state.actions[timelineId] ?? []).filter((item) => item.at !== at),
          },
        })),
      snooze: (alertId, until) => set((state) => ({ snoozedUntil: { ...state.snoozedUntil, [alertId]: until } })),
      unsnooze: (alertId) =>
        set((state) => {
          const next = { ...state.snoozedUntil };

          delete next[alertId];

          return { snoozedUntil: next };
        }),
    }),
    {
      name: 'cne-fault-actions',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** 시드 타임라인에 사용자가 넣은 조치를 얹어 준다. */
export function mergeSteps(seedSteps: TimelineStep[], added: ManualAction[] = []): TimelineStep[] {
  const manual: TimelineStep[] = added.map((item) => ({
    phase: item.resolves ? 'resolved' : 'inProgress',
    at: item.at,
    note: item.note,
    manual: true,
    actor: item.actor,
  }));

  return [...seedSteps, ...manual].sort((a, b) => a.at.localeCompare(b.at));
}

export const useManualActions = () => useFaultActionStore((state) => state.actions);

export const useAddAction = () => useFaultActionStore((state) => state.addAction);

export const useSnoozeMap = () => useFaultActionStore((state) => state.snoozedUntil);

export const useSnooze = () => useFaultActionStore((state) => state.snooze);

export const useUnsnooze = () => useFaultActionStore((state) => state.unsnooze);

export default useFaultActionStore;
