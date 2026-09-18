import { z } from 'zod';
import {
  ZodInverterTypeCode,
  ZodPhaseTypeCode,
  ZodStatusCode,
  ZodUserTypeCode,
} from '@/configs/codes';
import { dropdownSchema } from '@/service/common';

/*
  코드 테이블을 서버에서 받아 오는 자리. 값은 `configs/codes.ts` 가 단일 출처로 들고 있으므로
  여기서는 그 스키마를 그대로 걸어 서버가 주는 것과 맞대 본다 — 어긋나면 파싱에서 드러난다.

  설치 유형만 codes.ts 에 축이 없어 숫자·문자로 둔다.
*/

/** 사용자 권한 드롭다운 */
export type UserRoleDropdown = z.infer<typeof userRoleDropdownSchema>;
export const userRoleDropdownSchema = dropdownSchema(ZodUserTypeCode.CODE).extend({
  name: ZodUserTypeCode.NAME,
});

/** 위상 타입 드롭다운 (단상·삼상) */
export type PhaseTypeDropdown = z.infer<typeof phaseTypeDropdownSchema>;
export const phaseTypeDropdownSchema = dropdownSchema(ZodPhaseTypeCode.CODE).extend({
  name: ZodPhaseTypeCode.NAME,
});

/** 인버터 타입 드롭다운 */
export type InverterTypeDropdown = z.infer<typeof inverterTypeDropdownSchema>;
export const inverterTypeDropdownSchema = dropdownSchema(ZodInverterTypeCode.CODE).extend({
  name: ZodInverterTypeCode.NAME,
});

/** 운전상태 목록. 드롭다운과 달리 `codeNo`·`codeVal` 로 온다 */
export type StatusCodeItem = z.infer<typeof statusCodeItemSchema>;
export const statusCodeItemSchema = z.object({
  codeNo: ZodStatusCode.CODE,
  codeVal: ZodStatusCode.NAME,
});

/** 설치 유형 목록 (지상형 등) — codes.ts 에 아직 축이 없다 */
export type InstallationTypeItem = z.infer<typeof installationTypeItemSchema>;
export const installationTypeItemSchema = z.object({
  codeNo: z.number().int(),
  codeVal: z.string(),
});
