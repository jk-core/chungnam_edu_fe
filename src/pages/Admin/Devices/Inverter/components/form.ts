import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { ZodInverterTypeCode, ZodPhaseTypeCode } from '@/configs/codes';

/** 인버터 용량 범위(kW) */
export const CAPACITY_MIN = 0;
export const CAPACITY_MAX = 5000;

export const NAME_MAX = 120;

/**
 * 인버터 제품 등록·수정 폼 (SFR-017-04).
 * 서버 번호(`inverterId`)는 폼이 만지는 값이 아니라 여기 없다.
 *
 * BE v2.0 에 인버터 제품 엔드포인트가 아직 없어, 이것은 화면이 지키는 입력 규칙일 뿐이다.
 */
export type InverterFormValues = z.infer<typeof inverterFormSchema>;
export const inverterFormSchema = z.object({
  inverterName: z.string().trim().min(1, MSG.requiredField('인버터 이름')).max(NAME_MAX, MSG.tooLong('인버터 이름', NAME_MAX)),
  inverterEnterpriseName: z.string().trim().min(1, MSG.requiredField('업체 이름')).max(NAME_MAX, MSG.tooLong('업체 이름', NAME_MAX)),
  inverterCapacity: z
    .number(MSG.numberRange('인버터 용량', CAPACITY_MIN, CAPACITY_MAX))
    .gt(CAPACITY_MIN, MSG.numberRange('인버터 용량', CAPACITY_MIN, CAPACITY_MAX))
    .max(CAPACITY_MAX, MSG.numberRange('인버터 용량', CAPACITY_MIN, CAPACITY_MAX)),
  inverterTypeCode: ZodInverterTypeCode.CODE,
  phaseTypeCode: ZodPhaseTypeCode.CODE,
});
