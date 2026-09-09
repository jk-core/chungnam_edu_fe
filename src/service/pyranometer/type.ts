import { z } from 'zod';
import { MSG } from '@/configs/messages';

/** 설비 이름 길이 제한 */
export const NAME_MAX = 48;

/** 캘리브레이션 인수 허용 범위 */
export const FACTOR_MIN = 0;
export const FACTOR_MAX = 10;

/** 통신 ID 는 장비 설정 화면에 그대로 들어가는 값이라 영숫자만 받는다. */
export const COMM_ID = /^[A-Za-z0-9]+$/;

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
