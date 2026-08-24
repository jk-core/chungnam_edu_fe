import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { pagingRequest } from '@/service/common';

/** 설비 이름 길이 제한 */
export const NAME_MAX = 48;

/** 캘리브레이션 인수 허용 범위 */
export const FACTOR_MIN = 0;
export const FACTOR_MAX = 10;

/** 통신 ID 는 장비 설정 화면에 그대로 들어가는 값이라 영숫자만 받는다. */
export const COMM_ID = /^[A-Za-z0-9]+$/;

/** 검색어는 일사량계 이름·RTU 통신 ID 를 함께 훑는다 */
export const pyranometerListRequestSchema = pagingRequest.extend({
  keyword: z.string().optional(),
  /** 한 발전소의 일사량계만 볼 때 — 발전소 폼의 검색기가 쓴다 */
  powerPlantId: z.number().int().optional(),
});

export const pyranometerListRowSchema = z.object({
  irradId: z.number().int(),
  /** 일사량계 이름 (irradTerm) */
  name: z.string(),
  plantName: z.string(),
  rtuCommId: z.string(),
  rtuPort: z.number().int(),
  /** 모듈 온도계를 함께 달았는지 (isModTemp) */
  isModTemp: z.boolean(),
});

export const pyranometerDetailRequestSchema = z.object({
  irradId: z.number().int(),
});

export const pyranometerDetailResponseSchema = pyranometerListRowSchema.extend({
  powerPlantId: z.number().int(),
  calibrationFactor: z.number(),
  etc: z.string(),
  /** RTU 통신 상태 코드 (rtuCommunicationStateCode) */
  rtuStateCode: z.number().int(),
});

/** `irradId` 가 있으면 수정, 없으면 등록 */
export const pyranometerSaveRequestSchema = pyranometerDetailResponseSchema
  .omit({ plantName: true, rtuStateCode: true })
  .partial({ irradId: true });

export const pyranometerDeleteRequestSchema = z.object({
  irradId: z.number().int(),
});

export type PyranometerListRequest = z.infer<typeof pyranometerListRequestSchema>;
export type PyranometerListRow = z.infer<typeof pyranometerListRowSchema>;
export type PyranometerDetailRequest = z.infer<typeof pyranometerDetailRequestSchema>;
export type PyranometerDetailResponse = z.infer<typeof pyranometerDetailResponseSchema>;
export type PyranometerSaveRequest = z.infer<typeof pyranometerSaveRequestSchema>;
export type PyranometerDeleteRequest = z.infer<typeof pyranometerDeleteRequestSchema>;

// ── 폼 ─────────────────────────────────────────────────────

/**
 * 일사량계 등록·수정 폼 (SFR-016-01).
 * RTU 포트는 3번 고정이라 폼에 없다 — 저장할 때 상수로 얹는다.
 */
export const pyranometerFormSchema = z.object({
  plantId: z.string().min(1, MSG.selectRequired('발전소')),
  name: z.string().trim().min(1, MSG.requiredField('설비 이름')).max(NAME_MAX, MSG.tooLong('설비 이름', NAME_MAX)),
  calibrationFactor: z
    .number(MSG.numberRange('캘리브레이션 인수', FACTOR_MIN, FACTOR_MAX))
    .min(FACTOR_MIN, MSG.numberRange('캘리브레이션 인수', FACTOR_MIN, FACTOR_MAX))
    .max(FACTOR_MAX, MSG.numberRange('캘리브레이션 인수', FACTOR_MIN, FACTOR_MAX)),
  rtuCommId: z.string().trim().regex(COMM_ID, 'RTU 통신 ID 는 영문·숫자만 넣을 수 있습니다.'),
  /** 모듈 온도계 유무 — 라디오가 담는 값이라 예·아니오 문자열이다 */
  moduleThermometer: z.enum(['yes', 'no']),
  note: z.string(),
});

export type PyranometerFormValues = z.infer<typeof pyranometerFormSchema>;
