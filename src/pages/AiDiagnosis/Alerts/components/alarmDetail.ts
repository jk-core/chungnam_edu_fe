import dayjs from 'dayjs';
import { endOfToday } from '@/mocks/today';
import { getFaultCode } from '@/mocks/equipment';
import type { AlarmDetail, AlarmStatus, AlertRecord } from '@/interface/alert';
import type { FaultTimeline } from '@/interface/faultTimeline';

/** 알림 이력 표의 한 줄 → 상세 창 */
export const detailOfAlert = (alert: AlertRecord, plannedAt: string | null): AlarmDetail => ({
  id: alert.id,
  plantName: alert.schoolName,
  deviceName: alert.deviceName,
  status: alert.status,
  faultCode: alert.faultCode,
  title: alert.title,
  message: alert.description,
  occurredAt: alert.occurredAt,
  resolvedAt: alert.resolvedAt,
  handled: alert.handled,
  manual: alert.manual,
  handler: alert.handler,
  actionNote: alert.actionNote,
  plannedAt,
});

/**
 * 간트 막대 하나 → 상세 창.
 * 막대는 제 제목을 갖지 않아 고장코드에서 빌려 온다. 마지막 단계 글귀가 그 구간의 본문이 된다.
 */
export const detailOfTimeline = (timeline: FaultTimeline, plannedAt: string | null): AlarmDetail => {
  const last = timeline.steps[timeline.steps.length - 1];

  return {
    id: timeline.id,
    plantName: timeline.plantName,
    deviceName: timeline.deviceName,
    status: timeline.source === 'system' ? 'commLost' : ('fault' as AlarmStatus),
    faultCode: timeline.faultCode,
    title: getFaultCode(timeline.faultCode)?.summary ?? '진단 효율 저하',
    message: timeline.steps[0]?.note ?? '',
    occurredAt: timeline.startedAt,
    resolvedAt: timeline.endedAt,
    handled: timeline.resolved,
    manual: Boolean(last?.manual),
    handler: last?.actor ?? null,
    actionNote: last?.manual ? last.note : null,
    plannedAt,
  };
};

/** 열려 있던 시간(분). 아직 진행 중이면 오늘까지 센다. */
export const durationOfDetail = (detail: AlarmDetail): number => Math.max(
  0,
  (detail.resolvedAt ? dayjs(detail.resolvedAt) : endOfToday()).diff(dayjs(detail.occurredAt), 'minute'),
);
