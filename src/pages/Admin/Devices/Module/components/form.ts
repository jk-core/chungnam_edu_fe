import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { ZodCellTypeCode } from '@/configs/codes';

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

const numericShape = Object.fromEntries(NUMERIC.map(({ key, label, min, max }) => [
  key,
  z.number(MSG.numberRange(label, min, max))
    .min(min, MSG.numberRange(label, min, max))
    .max(max, MSG.numberRange(label, min, max)),
])) as Record<NumericKey, z.ZodNumber>;

/**
 * 모듈 제품 등록·수정 폼 (SFR-017-05).
 *
 * 저장 계약(`SaveSolaModuleEquipmentInfo`)과 칸이 하나 어긋난다 — BE 는 셀 종류를
 * `cellType` 으로 받는데 화면은 `cellTypeCode` 로 든다. 보낼 때 이름을 갈아 끼운다.
 */
export type ModuleFormValues = z.infer<typeof moduleFormSchema>;
export const moduleFormSchema = z.object({
  moduleName: z.string().trim().min(1, MSG.requiredField('모듈명')),
  moduleEnterpriseName: z.string().trim().min(1, MSG.requiredField('업체명')),
  cellTypeCode: ZodCellTypeCode.CODE,
  ...numericShape,
});
