import { z } from 'zod';
import { pagingParamsSchema } from '@/service/common';

/** 검색어는 발전소명·설비명을 훑는다 */
export type ManageStringPageParams = z.infer<typeof manageStringPageParamsSchema>;
export const manageStringPageParamsSchema = pagingParamsSchema.extend({
  keyword: z.string().optional(),
});

/**
 * 목록 한 줄은 스트링 한 조가 아니라 **스트링을 가진 설비 한 대**다.
 * 스트링은 설비 단위로 한 판씩 다루므로, 목록도 설비마다 한 줄에 갯수만 보여 준다.
 */
export type ManageStringPage = z.infer<typeof manageStringPageSchema>;
export const manageStringPageSchema = z.object({
  cid: z.number().int(),
  powerPlantName: z.string(),
  equipmentName: z.string(),
  stringCount: z.number().int(),
  /** 직렬 수 × 병렬 수 합계 */
  moduleCount: z.number().int(),
});

/** 저장돼 있는 스트링 한 조 */
export type SolaString = z.infer<typeof solaStringSchema>;
export const solaStringSchema = z.object({
  stringId: z.number().int(),
  stringNumber: z.number().int(),
  stringName: z.string(),
  moduleSerialCount: z.number().int(),
  moduleParallelCount: z.number().int(),
  /** 직렬 수 × 병렬 수 × 모듈 출력 (W) */
  stringCapacity: z.number(),
});

export type ManageStringDetail = z.infer<typeof manageStringDetailSchema>;
export const manageStringDetailSchema = z.object({
  cid: z.number().int(),
  equipmentName: z.string(),
  powerPlantName: z.string(),
  list: z.array(solaStringSchema),
});

/**
 * 설비 한 대의 스트링을 한 판으로 보낸다 — `stringId` 가 없는 줄은 서버가 새로 만들고,
 * 있는 줄은 고친다. **판에서 뺀 줄은 지워지지 않으므로 삭제는 따로 부른다.**
 */
export type ManageStringSaveParams = z.infer<typeof manageStringSaveParamsSchema>;
export const manageStringSaveParamsSchema = z.object({
  cid: z.number().int(),
  list: z.array(z.object({
    stringId: z.number().int().optional(),
    stringNumber: z.number().int(),
    stringName: z.string(),
    moduleSerialCount: z.number().int(),
    moduleParallelCount: z.number().int(),
  })),
});
