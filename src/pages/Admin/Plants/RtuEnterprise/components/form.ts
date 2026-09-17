import { z } from 'zod';
import { EMAIL, EMAIL_MAX } from '@/schemas/email';
import { MSG } from '@/configs/messages';

/** RTU 업체 이름 길이 제한 */
export const NAME_MAX = 40;

/**
 * RTU 업체 등록·수정 폼 (SFR-016-01).
 * 이메일·전화번호는 업체에 따라 하나만 있는 곳이 있어 둘 다 비울 수 있다.
 */
export type RtuEnterpriseFormValues = z.infer<typeof rtuEnterpriseFormSchema>;
export const rtuEnterpriseFormSchema = z.object({
  rtuEnterpriseName: z
    .string()
    .trim()
    .min(1, MSG.requiredField('업체 이름'))
    .max(NAME_MAX, MSG.tooLong('업체 이름', NAME_MAX)),
  rtuEnterpriseEmail: z
    .string()
    .trim()
    .max(EMAIL_MAX, MSG.tooLong('이메일', EMAIL_MAX))
    .refine((value) => !value || EMAIL.test(value), '이메일 형식이 올바르지 않습니다.'),
  rtuEnterprisePhone: z.string(),
});
