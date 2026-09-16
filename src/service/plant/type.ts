import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { ZodStatusCode } from '@/configs/codes';
import { fileSchema, fileToRemoveSchema, pagingParamsSchema } from '@/service/common';

export const NAME_MAX = 120;

/** 대표이미지 장수 상한 — 필수가 아니라 0장도 된다 */
export const PHOTO_MAX_COUNT = 2;

/** 기관 구분. 계약은 문자열로 받지만 화면이 고를 수 있는 것은 이 여섯이다 */
export const plantTypeSchema = z.enum(['유치원', '초등학교', '중학교', '고등학교', '특수학교', '교육기관']);

/** 검색어는 발전소ID·발전소명·사용자명을 훑는다 */
export type ManagePowerPlantPageParams = z.infer<typeof managePowerPlantPageParamsSchema>;
export const managePowerPlantPageParamsSchema = pagingParamsSchema.extend({
  keyword: z.string().optional(),
});

export type ManagePowerPlantPage = z.infer<typeof managePowerPlantPageSchema>;
export const managePowerPlantPageSchema = z.object({
  powerPlantId: z.number().int(),
  powerPlantName: z.string(),
  regionName: z.string(),
  userName: z.string(),
  address: z.string(),
  addressDetail: z.string(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
});

export type ManagePowerPlantDetailParams = z.infer<typeof managePowerPlantDetailParamsSchema>;
export const managePowerPlantDetailParamsSchema = z.object({
  powerPlantId: z.number().int(),
});

export type ManagePowerPlantDetail = z.infer<typeof managePowerPlantDetailSchema>;
export const managePowerPlantDetailSchema = z.object({
  powerPlantId: z.number().int(),
  powerPlantName: z.string(),
  powerPlantType: z.string(),
  regionCode: z.string(),
  address: z.string(),
  addressDetail: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  rtuEnterpriseName: z.string(),
  installerName: z.string(),
  installerPhone: z.string(),
  managerEnterpriseName: z.string(),
  managerEnterprisePhone: z.string(),
  userId: z.number().int().nullable(),
  userName: z.string(),
  irradId: z.number().int().nullable(),
  irradName: z.string(),
  /** 딸린 설비 용량의 합(kW) — 발전소가 직접 갖는 값이 아니라 읽어 오는 값이다 */
  powerPlantCapacity: z.number(),
  etc: z.string(),
  /** 수정 폼이 이미 붙어 있는 대표이미지를 불러오는 자리 */
  photoList: z.array(fileSchema),
});

/**
 * 등록 요청 한 벌. 검증 규칙을 여기 두는 것은 이 스키마가 곧 폼이 지키는 계약이기 때문이다.
 *
 * 위경도는 지도가 마커를 찍는 자리다 — 비우면 그 발전소는 지도에서 사라지므로 규칙을 건다.
 * 시군구 코드는 주소 검색이 함께 돌려주는 값이라 폼에 세우지 않는다: 세우지 않은 칸에 규칙을
 * 걸면 오류를 보여 줄 자리가 없어 「이유 없이 저장이 안 되는 폼」이 된다.
 */
export type ManagePowerPlantAddParams = z.infer<typeof managePowerPlantAddSchema>;
export const managePowerPlantAddSchema = z.object({
  powerPlantName: z.string().trim().min(1, MSG.requiredField('발전소 이름')).max(NAME_MAX, MSG.tooLong('발전소 이름', NAME_MAX)),
  powerPlantType: plantTypeSchema,
  regionCode: z.string(),
  address: z.string().trim().min(1, MSG.requiredField('주소')),
  addressDetail: z.string(),
  latitude: z.number(MSG.requiredField('위도')),
  longitude: z.number(MSG.requiredField('경도')),
  rtuEnterpriseName: z.string().trim().min(1, MSG.requiredField('RTU업체')).max(NAME_MAX, MSG.tooLong('RTU업체', NAME_MAX)),
  installerName: z.string().max(NAME_MAX, MSG.tooLong('시공업체', NAME_MAX)),
  installerPhone: z.string(),
  managerEnterpriseName: z.string().max(NAME_MAX, MSG.tooLong('담당업체', NAME_MAX)),
  managerEnterprisePhone: z.string(),
  userId: z.number().int().nullable(),
  irradId: z.number().int().nullable(),
  etc: z.string(),
  /** 대표이미지 — 필수가 아니다. fileList part 로 개수만큼 반복해 실린다 */
  fileList: z.array(z.instanceof(File)).optional(),
});

export type ManagePowerPlantModifyParams = z.infer<typeof managePowerPlantModifySchema>;
export const managePowerPlantModifySchema = managePowerPlantAddSchema.extend({
  powerPlantId: z.number().int(),
  /** 뺄 대표이미지 — json part 안이다 */
  removeFileList: z.array(fileToRemoveSchema).optional(),
});

export type ManagePowerPlantRemoveParams = z.infer<typeof managePowerPlantRemoveParamsSchema>;
export const managePowerPlantRemoveParamsSchema = z.object({
  powerPlantId: z.number().int(),
});

// ── 폼 ─────────────────────────────────────────────────────

/**
 * 발전소 등록·수정 폼 (SFR-016-01~04).
 *
 * 요청 스키마를 넓혀 쓴다 — 담당 사용자는 서버가 비워 두는 것을 허용하지만 화면은 고르게 하고,
 * `*Label` 은 화면에 보일 이름이라 저장 때 떨군다. 보일 이름에는 규칙을 걸지 않는다:
 * 참조하던 계정이 지워지면 이름만 비는데, 그 칸에는 오류를 보여 줄 자리가 없다.
 *
 * 대표이미지는 폼 밖 state 가 든다 — `File` 객체는 zod 검증 대상이 아니고, 이미 저장된 사진과
 * 방금 고른 사진을 함께 다뤄야 해서 `UploadFile[]` 한 벌로 들고 저장 직전에 갈라 보낸다.
 */
export type PlantFormValues = z.infer<typeof plantFormSchema>;
export const plantFormSchema = managePowerPlantAddSchema.omit({ fileList: true }).extend({
  userId: z.number(MSG.selectRequired('사용자')).int(),
  userLabel: z.string(),
  irradLabel: z.string(),
});
