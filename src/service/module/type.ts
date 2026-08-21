import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { pagingRequest } from '@/service/common';

export type NumericKey =
  | 'wattPerPanel'
  | 'maxVoltage'
  | 'maxCurrent'
  | 'openVoltage'
  | 'shortCurrent'
  | 'voltTempCoeff'
  | 'currentTempCoeff';

/** 숫자 항목의 허용 범위 — 입력 칸, 검증, 이력 라벨을 같은 표에서 뽑는다 (SFR-017-05). */
export const NUMERIC: { key: NumericKey; label: string; min: number; max: number; unit: string }[] = [
  { key: 'wattPerPanel', label: '모듈 용량', min: 0, max: 700, unit: 'W' },
  { key: 'maxVoltage', label: '최대 전압', min: 0, max: 100, unit: 'V' },
  { key: 'maxCurrent', label: '최대 전류', min: 0, max: 100, unit: 'A' },
  { key: 'openVoltage', label: '개방 전압', min: 0, max: 100, unit: 'V' },
  { key: 'shortCurrent', label: '단락 전류', min: 0, max: 100, unit: 'A' },
  { key: 'voltTempCoeff', label: '전압 온도계수', min: -1, max: 0, unit: '%/℃' },
  { key: 'currentTempCoeff', label: '전류 온도계수', min: 0, max: 1, unit: '%/℃' },
];

/** 검색어는 모듈 이름·업체 이름을 함께 훑는다 */
export const moduleListRequestSchema = pagingRequest.extend({
  keyword: z.string().optional(),
});

export const moduleListRowSchema = z.object({
  moduleId: z.number().int(),
  name: z.string(),
  maker: z.string(),
  /** 모듈 1장 출력(W) (pwrMp) */
  wattPerPanel: z.number(),
  /** 0 = 단면, 1 = 양면 */
  cellType: z.number().int(),
});

export const moduleDetailRequestSchema = z.object({
  moduleId: z.number().int(),
});

export const moduleDetailResponseSchema = moduleListRowSchema.extend({
  /** 최대 출력 동작 전압(V) (vltMp) */
  maxVoltage: z.number(),
  /** 최대 출력 동작 전류(A) (curMp) */
  maxCurrent: z.number(),
  /** 개방 전압(V) (vltOc) */
  openVoltage: z.number(),
  /** 단락 전류(A) (curSc) */
  shortCurrent: z.number(),
  /** 전압 온도계수(%/℃) (tempVltCof) — 음수다 */
  voltTempCoeff: z.number(),
  /** 전류 온도계수(%/℃) (tempCurCof) */
  currentTempCoeff: z.number(),
});

/** `moduleId` 가 있으면 수정, 없으면 등록 */
export const moduleSaveRequestSchema = moduleDetailResponseSchema.partial({ moduleId: true });

export const moduleDeleteRequestSchema = z.object({
  moduleId: z.number().int(),
});

export type ModuleListRequest = z.infer<typeof moduleListRequestSchema>;
export type ModuleListRow = z.infer<typeof moduleListRowSchema>;
export type ModuleDetailRequest = z.infer<typeof moduleDetailRequestSchema>;
export type ModuleDetailResponse = z.infer<typeof moduleDetailResponseSchema>;
export type ModuleSaveRequest = z.infer<typeof moduleSaveRequestSchema>;
export type ModuleDeleteRequest = z.infer<typeof moduleDeleteRequestSchema>;

// ── 폼 ─────────────────────────────────────────────────────

const numericShape = Object.fromEntries(NUMERIC.map(({ key, label, min, max }) => [
  key,
  z.number(MSG.numberRange(label, min, max))
    .min(min, MSG.numberRange(label, min, max))
    .max(max, MSG.numberRange(label, min, max)),
])) as Record<NumericKey, z.ZodNumber>;

/** 모듈 제품 등록·수정 폼 (SFR-017-05) */
export const moduleFormSchema = z.object({
  name: z.string().trim().min(1, MSG.requiredField('모듈명')),
  maker: z.string().trim().min(1, MSG.requiredField('업체명')),
  cellType: z.enum(['single', 'double']),
  ...numericShape,
});

export type ModuleFormValues = z.infer<typeof moduleFormSchema>;
