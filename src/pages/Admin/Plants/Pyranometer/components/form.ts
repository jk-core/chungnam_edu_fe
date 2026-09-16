import { z } from 'zod';
import { MSG } from '@/configs/messages';

/** 일사량계 이름 길이 제한 */
export const NAME_MAX = 48;

/** 캘리브레이션 인수 허용 범위 */
export const FACTOR_MIN = 0;
export const FACTOR_MAX = 10;

/** 통신 ID 는 장비 설정 화면에 그대로 들어가는 값이라 영숫자만 받는다. */
export const COMMUNICATION_ID = /^[A-Za-z0-9]+$/;

/**
 * 일사량계 등록·수정 폼 (SFR-016-01). 포트는 고를 수 없어 폼에서 뺀다 —
 * 3번 고정이라 저장할 때 상수로 얹는다.
 *
 * 저장 계약(`SaveEquipmentIrradInfo`)에 `powerPlantId` 가 없다. 화면은 어느 발전소의
 * 일사량계인지 고르게 하지만 BE 는 아직 그 연결을 받지 않는다 — 발전소 쪽에서
 * `irradId` 로 거는 방향만 있다.
 */
export type IrradFormValues = z.infer<typeof irradFormSchema>;
export const irradFormSchema = z.object({
  powerPlantId: z.number(MSG.selectRequired('발전소')).int(),
  irradName: z.string().trim().min(1, MSG.requiredField('설비 이름')).max(NAME_MAX, MSG.tooLong('설비 이름', NAME_MAX)),
  rtuCommunicationId: z.string().trim().regex(COMMUNICATION_ID, 'RTU 통신 ID 는 영문·숫자만 넣을 수 있습니다.'),
  isModTemp: z.boolean(),
  calibrationFactor: z
    .number(MSG.numberRange('캘리브레이션 인수', FACTOR_MIN, FACTOR_MAX))
    .min(FACTOR_MIN, MSG.numberRange('캘리브레이션 인수', FACTOR_MIN, FACTOR_MAX))
    .max(FACTOR_MAX, MSG.numberRange('캘리브레이션 인수', FACTOR_MIN, FACTOR_MAX)),
  etc: z.string(),
});
