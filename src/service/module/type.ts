import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { ZodCellTypeCode } from '@/configs/codes';
import { pagingParamsSchema } from '@/service/common';

/**
 * 전기특성 항목의 허용 범위 — 입력 칸, 검증, 이력 라벨을 같은 표에서 뽑는다 (SFR-017-05).
 * 키는 BE 컬럼명을 그대로 쓴다 — 바꾸면 BE 와 필드를 맞대볼 수 없다.
 */
export type NumericKey = 'pwrMp' | 'vltMp' | 'curMp' | 'vltOc' | 'curSc' | 'tempVltCof' | 'tempCurCof';

export const NUMERIC: { key: NumericKey; label: string; min: number; max: number; unit: string }[] = [
  { key: 'pwrMp', label: '모듈 용량', min: 0, max: 700, unit: 'W' },
  { key: 'vltMp', label: '최대 전압', min: 0, max: 100, unit: 'V' },
  { key: 'curMp', label: '최대 전류', min: 0, max: 100, unit: 'A' },
  { key: 'vltOc', label: '개방 전압', min: 0, max: 100, unit: 'V' },
  { key: 'curSc', label: '단락 전류', min: 0, max: 100, unit: 'A' },
  { key: 'tempVltCof', label: '전압 온도계수', min: -1, max: 0, unit: '%/℃' },
  { key: 'tempCurCof', label: '전류 온도계수', min: 0, max: 1, unit: '%/℃' },
];

/** 검색어는 모듈명·업체명을 훑는다 */
export type ManageModulePageParams = z.infer<typeof manageModulePageParamsSchema>;
export const manageModulePageParamsSchema = pagingParamsSchema.extend({
  keyword: z.string().optional(),
});

export type ManageModulePage = z.infer<typeof manageModulePageSchema>;
export const manageModulePageSchema = z.object({
  moduleId: z.number().int(),
  moduleName: z.string(),
  moduleEnterpriseName: z.string(),
  pwrMp: z.number(),
  cellTypeCode: ZodCellTypeCode.CODE,
  cellTypeName: ZodCellTypeCode.NAME,
});

export type ManageModuleDetailParams = z.infer<typeof manageModuleDetailParamsSchema>;
export const manageModuleDetailParamsSchema = z.object({
  moduleId: z.number().int(),
});

export type ManageModuleDetail = z.infer<typeof manageModuleDetailSchema>;
export const manageModuleDetailSchema = manageModulePageSchema.extend({
  vltMp: z.number(),
  curMp: z.number(),
  vltOc: z.number(),
  curSc: z.number(),
  tempVltCof: z.number(),
  tempCurCof: z.number(),
});

const numericShape = Object.fromEntries(NUMERIC.map(({ key, label, min, max }) => [
  key,
  z.number(MSG.numberRange(label, min, max))
    .min(min, MSG.numberRange(label, min, max))
    .max(max, MSG.numberRange(label, min, max)),
])) as Record<NumericKey, z.ZodNumber>;

/**
 * 등록 요청 한 벌. 검증 규칙을 여기 두는 것은 이 스키마가 곧 폼이 지키는 계약이기 때문이다.
 */
export type ManageModuleAddParams = z.infer<typeof manageModuleAddSchema>;
export const manageModuleAddSchema = z.object({
  moduleName: z.string().trim().min(1, MSG.requiredField('모듈명')),
  moduleEnterpriseName: z.string().trim().min(1, MSG.requiredField('업체명')),
  cellTypeCode: ZodCellTypeCode.CODE,
  ...numericShape,
});

export type ManageModuleModifyParams = z.infer<typeof manageModuleModifySchema>;
export const manageModuleModifySchema = manageModuleAddSchema.extend({
  moduleId: z.number().int(),
});

export type ManageModuleRemoveParams = z.infer<typeof manageModuleRemoveParamsSchema>;
export const manageModuleRemoveParamsSchema = z.object({
  moduleId: z.number().int(),
});

// ── 폼 ─────────────────────────────────────────────────────

/** 모듈 제품 등록·수정 폼 (SFR-017-05). 요청 스키마를 그대로 쓴다 — 폼 전용 칸이 없다 */
export type ModuleFormValues = z.infer<typeof moduleFormSchema>;
export const moduleFormSchema = manageModuleAddSchema;
