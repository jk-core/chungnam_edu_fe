import { z } from 'zod';
import { ZodFaultCode, ZodStatusCode } from '@/configs/codes';
import { pagingParamsSchema } from '@/service/common';

/**
 * 간트 막대 하나. 알림 한 건이 곧 한 구간이다 — 발생부터 조치 완료까지.
 * 자연 해제되거나 조치되기 전까지는 actionCompleteDtm 이 null 이고, 막대는 오늘까지 이어진다.
 */
export type AlarmSegment = z.infer<typeof alarmSegmentSchema>;
export const alarmSegmentSchema = z.object({
  alarmId: z.number().int(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  gathDtm: z.string(),
  actionCompleteDtm: z.string().nullable(),
  isManualAction: z.boolean(),
  faultCode: ZodFaultCode.nullable(),
  faultCodeName: z.string().nullable(),
  sourceCode: z.number().int(),
  sourceName: z.string(),
  lossPower: z.number(),
});

/**
 * 알림 구분은 운전상태 코드를 그대로 쓴다 — 7003 주의 · 7004 경고 · 7998 통신단절.
 * 미조치 탭은 isActionComplete=false 로 같은 조건을 좁혀 쓴다.
 */
export type AlarmFilterParams = z.infer<typeof alarmFilterParamsSchema>;
export const alarmFilterParamsSchema = z.object({
  powerPlantId: z.number().int().optional(),
  startDate: z.string(),
  endDate: z.string(),
  statusCode: ZodStatusCode.CODE.optional(),
  isActionComplete: z.boolean().optional(),
});

/** 정렬할 수 있는 sortField 는 gathDtm · duration 둘뿐이다 */
export type AlarmPageParams = z.infer<typeof alarmPageParamsSchema>;
export const alarmPageParamsSchema = alarmFilterParamsSchema.extend(pagingParamsSchema.shape);

export type AlarmPage = z.infer<typeof alarmPageSchema>;
export const alarmPageSchema = z.object({
  alarmId: z.number().int(),
  gathDtm: z.string(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  title: z.string(),
  description: z.string(),
  powerPlantId: z.number().int(),
  powerPlantName: z.string(),
  equipmentName: z.string(),
  faultCode: ZodFaultCode.nullable(),
  faultCodeName: z.string().nullable(),
  isActionComplete: z.boolean(),
  actionCompleteDtm: z.string().nullable(),
  isManualAction: z.boolean(),
  actionContent: z.string().nullable(),
  actionUser: z.string().nullable(),
  alarmPeriodDate: z.string().nullable(),
});

/** 목록과 같은 조건을 받는다. 페이징 때문에 요약을 따로 받아야 한다 */
export type AlarmOverview = z.infer<typeof alarmOverviewSchema>;
export const alarmOverviewSchema = z.object({
  totalCount: z.number().int(),
  unresolvedCount: z.number().int(),
  unresolvedErrorCount: z.number().int(),
  unresolvedLongestGathDtm: z.string().nullable(),
  handledAlarmCount: z.number().int(),
  averageActionMinute: z.number().nullable(),
  manualActionCount: z.number().int(),
});

/** 헤더 종 딥링크. 목록 조건과 무관하게 찾는다 */
export type AlarmDetailParams = z.infer<typeof alarmDetailParamsSchema>;
export const alarmDetailParamsSchema = z.object({
  alarmId: z.number().int(),
});

/** 표에서 누른 알림과 간트 막대를 누른 것이 같은 창을 열므로 응답도 한 벌이다 */
export type AlarmDetail = z.infer<typeof alarmDetailSchema>;
export const alarmDetailSchema = alarmPageSchema.extend({
  sourceCode: z.number().int(),
  sourceName: z.string(),
});

/**
 * 조치 저장.
 *
 * 수동조치 스위치가 이 요청의 축이다 — 켜면 처리일시·정상표출기간·조치자·조치내용이 함께 실리고,
 * 끄면 넷 다 null 이다. 끈 것은 「조치를 지운다」는 뜻이라 빈 문자열과 갈라야 한다.
 * 비고는 스위치 밖이다 — 자동 복구된 건에도 메모를 남긴다.
 */
export type AlarmActionParams = z.infer<typeof alarmActionSchema>;
export const alarmActionSchema = z.object({
  alarmId: z.number().int(),
  isManualAction: z.boolean(),
  actionCompleteDtm: z.string().nullable(),
  alarmPeriodDate: z.string().nullable(),
  actionContent: z.string().nullable(),
  actionUser: z.string().nullable(),
  etc: z.string().nullable(),
});

/**
 * 고장 구간 간트. 목록 탭의 기간 필터와 무관하다 — 오늘 기준 최근 몇 년치를 통째로 본다.
 * 발전소 → 인버터 → 스트링 세 단으로 내려주고, 단마다 자기 구간을 갖는다.
 */
export type AlarmTimelineParams = z.infer<typeof alarmTimelineParamsSchema>;
export const alarmTimelineParamsSchema = z.object({
  powerPlantId: z.number().int().optional(),
  cid: z.number().int().optional(),
  period: z.number().int(),
});

export type AlarmTimeline = z.infer<typeof alarmTimelineSchema>;
export const alarmTimelineSchema = z.object({
  powerPlantId: z.number().int(),
  powerPlantName: z.string(),
  inverterList: z.array(z.object({
    cid: z.number().int(),
    equipmentName: z.string(),
    segmentList: z.array(alarmSegmentSchema),
    stringList: z.array(z.object({
      stringId: z.number().int(),
      stringName: z.string(),
      segmentList: z.array(alarmSegmentSchema),
    })),
  })),
});

/** 헤더 종. 인버터·일사량계를 가르지 않고 한 목록으로 준다 — 패널이 발생 순으로 죽 세운다 */
export type AlarmUnresolvedParams = z.infer<typeof alarmUnresolvedParamsSchema>;
export const alarmUnresolvedParamsSchema = z.object({
  limit: z.number().int().optional(),
});

export type AlarmUnresolved = z.infer<typeof alarmUnresolvedSchema>;
export const alarmUnresolvedSchema = z.object({
  totalCount: z.number().int(),
  list: z.array(z.object({
    alarmId: z.number().int(),
    gathDtm: z.string(),
    statusCode: ZodStatusCode.CODE,
    statusName: ZodStatusCode.NAME,
    title: z.string(),
    powerPlantId: z.number().int(),
    powerPlantName: z.string(),
    equipmentName: z.string(),
  })),
});

/** 알림 발생 조건 설정 */
export type AlarmRule = z.infer<typeof alarmRuleSchema>;
export const alarmRuleSchema = z.object({
  alarmRuleId: z.number().int(),
  label: z.string(),
  description: z.string(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  threshold: z.string(),
  isEnabled: z.boolean(),
  channelList: z.array(z.string()),
});

/** 임계값·발송채널은 지금 읽기 전용이라 보내지 않는다 */
export type AlarmRuleParams = z.infer<typeof alarmRuleParamsSchema>;
export const alarmRuleParamsSchema = z.object({
  alarmRuleId: z.number().int(),
  isEnabled: z.boolean(),
});
