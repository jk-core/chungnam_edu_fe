import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { pagingRequest } from '@/service/common';

/** 검색어는 발전소 ID·이름·사용자 이름을 함께 훑는다 */
export const plantListRequestSchema = pagingRequest.extend({
  keyword: z.string().optional(),
});

export const plantListRowSchema = z.object({
  powerPlantId: z.number().int(),
  plantName: z.string(),
  regionName: z.string(),
  /** 이 발전소를 맡은 사용자 이름 */
  userName: z.string(),
  address: z.string(),
  addressDetail: z.string(),
  /** 발전소 운전 상태 코드 — 코드표 미확정 */
  statusCode: z.number().int(),
});

export const plantDetailRequestSchema = z.object({
  powerPlantId: z.number().int(),
});

export const plantTypeSchema = z.enum(['유치원', '초등학교', '중학교', '고등학교', '특수학교', '교육기관']);

export const plantDetailResponseSchema = z.object({
  powerPlantId: z.number().int(),
  plantName: z.string(),
  plantType: plantTypeSchema,
  /** 시·군 코드 — 주소 검색이 함께 돌려주는 값이라 폼에 세우지 않는다 */
  regionCode: z.string(),
  address: z.string(),
  addressDetail: z.string(),
  /** 지도 마커가 서는 자리 */
  latitude: z.number(),
  longitude: z.number(),
  /** RTU 업체 (rtuEntName) */
  rtuEntName: z.string(),
  /** 시공 업체 (installerName) */
  installerName: z.string(),
  installerPhone: z.string(),
  /** 유지보수를 맡은 담당 업체 — 담당자 계정과 다른 것이라 이름을 가른다 */
  managerEnterpriseName: z.string(),
  managerEnterprisePhone: z.string(),
  userId: z.number().int().nullable(),
  userName: z.string(),
  irradId: z.number().int().nullable(),
  irradName: z.string(),
  /** 딸린 설비 용량의 합(kW) — 발전소가 직접 갖는 값이 아니라 읽어 오는 값이다 */
  instCapa: z.number(),
  etc: z.string(),
});

/** `powerPlantId` 가 있으면 수정, 없으면 등록 */
export const plantSaveRequestSchema = plantDetailResponseSchema
  .omit({ userName: true, irradName: true, instCapa: true })
  .partial({ powerPlantId: true });

export const plantDeleteRequestSchema = z.object({
  powerPlantId: z.number().int(),
});

export type PlantListRequest = z.infer<typeof plantListRequestSchema>;
export type PlantListRow = z.infer<typeof plantListRowSchema>;
export type PlantDetailRequest = z.infer<typeof plantDetailRequestSchema>;
export type PlantDetailResponse = z.infer<typeof plantDetailResponseSchema>;
export type PlantSaveRequest = z.infer<typeof plantSaveRequestSchema>;
export type PlantDeleteRequest = z.infer<typeof plantDeleteRequestSchema>;

// ── 폼 ─────────────────────────────────────────────────────

/**
 * 발전소 등록·수정 폼 (SFR-016-01~04).
 *
 * `*Label` 은 화면에 보일 이름이라 저장 때 떨군다 — 검색기가 고른 값과 함께 채워 두면 목록을
 * 다시 뒤지지 않아도 되고, 고를 때 딸려 바뀌는 칸을 한 번에 넘길 수 있다.
 */
export const plantFormSchema = z.object({
  plantName: z.string().trim().min(1, MSG.requiredField('발전소 이름')).max(120, MSG.tooLong('발전소 이름', 120)),
  plantType: plantTypeSchema,
  /*
    주소 검색이 함께 돌려주는 값이라 폼에 세우지 않는다. 세우지 않은 칸에 규칙을 걸면 오류를
    보여 줄 자리가 없어 「이유 없이 저장이 안 되는 폼」이 되므로, 채웠는지는 주소 칸이 본다.
  */
  regionCode: z.string(),
  address: z.string().trim().min(1, MSG.requiredField('주소')),
  addressDetail: z.string(),
  /*
    주소를 고르면 지오코더가 채우고, 옥상이 아닌 부지는 손으로 보정한다. 지도 마커가 이 값으로
    서므로 비우면 그 발전소는 지도에서 사라진다 — 그래서 규칙을 건다.
  */
  latitude: z.string().trim().min(1, MSG.requiredField('위도')),
  longitude: z.string().trim().min(1, MSG.requiredField('경도')),
  rtuEntName: z.string().trim().min(1, MSG.requiredField('RTU업체')).max(120, MSG.tooLong('RTU업체', 120)),
  builderName: z.string().max(120, MSG.tooLong('시공업체', 120)),
  builderPhone: z.string(),
  managerEnterpriseName: z.string().max(120, MSG.tooLong('담당업체', 120)),
  managerEnterprisePhone: z.string(),
  userId: z.string().min(1, MSG.selectRequired('사용자')),
  /** 보일 이름 — 규칙은 id 가 진다 (참조가 지워지면 이름만 비는데 오류를 보여 줄 자리가 없다) */
  userLabel: z.string(),
  /** 빈 문자열이면 잇지 않은 것 */
  irradId: z.string(),
  irradLabel: z.string(),
  etc: z.string(),
});

export type PlantFormValues = z.infer<typeof plantFormSchema>;

export type PlantFormBody = Omit<PlantFormValues, 'userLabel' | 'irradLabel'>;
