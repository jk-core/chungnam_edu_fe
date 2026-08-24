import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { pagingRequest } from '@/service/common';

/** 인버터 용량 범위(kW) */
export const CAPACITY_MIN = 0;
export const CAPACITY_MAX = 5000;

/** 검색어는 인버터 이름·업체 이름을 함께 훑는다 */
export const inverterListRequestSchema = pagingRequest.extend({
  keyword: z.string().optional(),
  /** 스트링 인버터만 고를 때처럼 타입으로 좁힐 때 (inverterTypeCode) */
  inverterTypeCode: z.number().int().optional(),
});

export const inverterListRowSchema = z.object({
  inverterId: z.number().int(),
  /** 인버터 모델명 (inverterTerm) */
  name: z.string(),
  /** 인버터 업체명 (inverterEntName) */
  maker: z.string(),
  /** 인버터 용량(kW) (inverterCapa) */
  inverterCapa: z.number(),
  inverterTypeCode: z.number().int(),
  /** 위상 종류 코드 (phaseTypeCode) */
  phaseTypeCode: z.number().int(),
});

export const inverterDetailRequestSchema = z.object({
  inverterId: z.number().int(),
});

export const inverterDetailResponseSchema = z.object({
  inverterId: z.number().int(),
  name: z.string(),
  maker: z.string(),
  inverterCapa: z.number(),
  inverterTypeCode: z.number().int(),
  phaseTypeCode: z.number().int(),
});

/** `inverterId` 가 있으면 수정, 없으면 등록 */
export const inverterSaveRequestSchema = inverterDetailResponseSchema.partial({ inverterId: true });

export const inverterDeleteRequestSchema = z.object({
  inverterId: z.number().int(),
});

export type InverterListRequest = z.infer<typeof inverterListRequestSchema>;
export type InverterListRow = z.infer<typeof inverterListRowSchema>;
export type InverterDetailRequest = z.infer<typeof inverterDetailRequestSchema>;
export type InverterDetailResponse = z.infer<typeof inverterDetailResponseSchema>;
export type InverterSaveRequest = z.infer<typeof inverterSaveRequestSchema>;
export type InverterDeleteRequest = z.infer<typeof inverterDeleteRequestSchema>;

// ── 폼 ─────────────────────────────────────────────────────

/**
 * 인버터 제품 등록·수정 폼 (SFR-017-04).
 * 서버 번호(`inverterId`)는 폼이 만지는 값이 아니라 여기 없다 — 저장할 때 다시 얹는다.
 */
export const inverterFormSchema = z.object({
  maker: z.string().trim().min(1, MSG.requiredField('업체 이름')).max(120, MSG.tooLong('업체 이름', 120)),
  name: z.string().trim().min(1, MSG.requiredField('인버터 이름')).max(120, MSG.tooLong('인버터 이름', 120)),
  capacityKw: z
    .number(MSG.numberRange('인버터 용량', CAPACITY_MIN, CAPACITY_MAX))
    .gt(CAPACITY_MIN, MSG.numberRange('인버터 용량', CAPACITY_MIN, CAPACITY_MAX))
    .max(CAPACITY_MAX, MSG.numberRange('인버터 용량', CAPACITY_MIN, CAPACITY_MAX)),
  kind: z.enum(['string', 'central', 'micro']),
  phase: z.enum(['단상', '삼상']),
});

export type InverterFormValues = z.infer<typeof inverterFormSchema>;
