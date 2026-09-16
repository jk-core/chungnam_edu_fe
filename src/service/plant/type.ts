import { z } from 'zod';
import { pagingParamsSchema } from '@/service/common';

/** 발전소 ID 와 이름으로 좁힌다 — 둘 다 비우면 전체다 */
export type ManagePowerPlantPageParams = z.infer<typeof managePowerPlantPageParamsSchema>;
export const managePowerPlantPageParamsSchema = pagingParamsSchema.extend({
  powerPlantId: z.number().int().optional(),
  powerPlantName: z.string().optional(),
});

export type ManagePowerPlantPage = z.infer<typeof managePowerPlantPageSchema>;
export const managePowerPlantPageSchema = z.object({
  powerPlantId: z.number().int(),
  powerPlantName: z.string(),
  userName: z.string(),
  /** 딸린 설비 용량의 합(kW) — 발전소가 직접 갖는 값이 아니라 읽어 오는 값이다 */
  powerPlantCapacity: z.number(),
});

/**
 * 상세는 저장 계약에 없는 짝 이름(`irradName`·`userName`)과 읽기 전용 용량을 함께 준다.
 *
 * 등록 화면이 쥐는 기관구분·위경도·RTU업체·시공업체·대표이미지는 여기에도 없다 —
 * v2.0 이 아직 그 칸들을 다루지 않는다.
 */
export type ManagePowerPlantDetail = z.infer<typeof managePowerPlantDetailSchema>;
export const managePowerPlantDetailSchema = z.object({
  powerPlantId: z.number().int(),
  powerPlantName: z.string(),
  regionCode: z.string(),
  address: z.string(),
  addressDetail: z.string(),
  manageEnterpriseName: z.string(),
  manageEnterprisePhone: z.string(),
  etc: z.string(),
  irradId: z.number().int().nullable(),
  irradName: z.string(),
  userId: z.number().int(),
  userName: z.string(),
  powerPlantCapacity: z.number(),
});

/**
 * 등록 요청 한 벌.
 *
 * `regionCode` 는 문자열이다 — 지역 드롭다운(`/area/list/dropdown`)이 숫자 `id` 를 주므로
 * 그대로 실어 보내면 형이 어긋난다. 고른 값을 문자열로 바꿔 넣는다.
 */
export type ManagePowerPlantAddParams = z.infer<typeof managePowerPlantAddParamsSchema>;
export const managePowerPlantAddParamsSchema = z.object({
  powerPlantName: z.string(),
  userId: z.number().int(),
  regionCode: z.string(),
  address: z.string(),
  addressDetail: z.string().optional(),
  manageEnterpriseName: z.string(),
  manageEnterprisePhone: z.string().optional(),
  etc: z.string().optional(),
  irradId: z.number().int().optional(),
});

export type ManagePowerPlantModifyParams = z.infer<typeof managePowerPlantModifyParamsSchema>;
export const managePowerPlantModifyParamsSchema = managePowerPlantAddParamsSchema.extend({
  powerPlantId: z.number().int(),
});
