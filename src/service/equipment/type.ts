import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { pagingRequest } from '@/service/common';
import { PYRANOMETER_PORT } from '@/mocks/pyranometers';
import { refineStringRows, stringRowSchema } from '@/service/string/type';

/** RTU 포트 범위. 3번은 일사량계 몫이라 설비가 못 쓴다. */
export const PORT_MIN = 0;
export const PORT_MAX = 10;

/** 방위각은 동에서 서까지만 — 정남이 180 이다 */
export const AZIMUTH_MIN = 90;
export const AZIMUTH_MAX = 270;
export const INCLINE_MIN = 0;
export const INCLINE_MAX = 90;

/** 모듈 직·병렬 장수 */
export const ARRAY_MIN = 0;
export const ARRAY_MAX = 1000;

/** 검색어는 설비 이름·CID·RTU 통신 ID·발전소 이름을 함께 훑는다 */
export const equipmentListRequestSchema = pagingRequest.extend({
  keyword: z.string().optional(),
  /** 한 발전소의 설비만 볼 때 */
  powerPlantId: z.number().int().optional(),
});

export const equipmentListRowSchema = z.object({
  cid: z.number().int(),
  plantName: z.string(),
  /** 설비 이름 (meainName) */
  name: z.string(),
  inverterName: z.string(),
  inverterMaker: z.string(),
  /** 인버터 타입 코드 (inverterTypeCode) */
  inverterTypeCode: z.number().int(),
  /** 설비용량(kW) (instCapa) */
  instCapa: z.number(),
  /** RTU 통신 ID (rtuCommuId) */
  rtuCommId: z.string(),
  rtuPort: z.number().int().nullable(),
});

export const equipmentDetailRequestSchema = z.object({
  cid: z.number().int(),
});

export const equipmentDetailResponseSchema = z.object({
  cid: z.number().int(),
  powerPlantId: z.number().int(),
  plantName: z.string(),
  userId: z.number().int().nullable(),
  userName: z.string(),
  name: z.string(),
  rtuCommId: z.string(),
  /** 3번은 일사량계 몫이라 설비가 쓸 수 없다 */
  rtuPort: z.number().int().nullable(),
  /** 고른 인버터 제품 번호 (inverterId) */
  inverterId: z.number().int().nullable(),
  /** 고른 모듈 제품 번호 (solaModuleId) */
  moduleId: z.number().int().nullable(),
  /** 방위각(도). 정남이 180 이다 */
  azimuth: z.number(),
  /** 경사각(도) (incliAngle) */
  incliAngle: z.number(),
  instCapa: z.number(),
  /** MPPT 1번 직렬·병렬 (modulSeriCnt / modulArowCnt) */
  series1: z.number().int(),
  parallel1: z.number().int(),
  /** MPPT 2번. 안 쓰면 0 */
  series2: z.number().int(),
  parallel2: z.number().int(),
  asExpiresAt: z.string(),
  etc: z.string(),
  /** 설치일시 (meainInstDtm) */
  installedAt: z.string(),
  /** 아래는 폼이 고치지 않고 읽기만 하는 값이다 */
  rtuEntName: z.string(),
  installerName: z.string(),
  /** 모듈 1장 출력(W) */
  wattPerPanel: z.number(),
  /** 인버터 제품 용량(kW) */
  inverterCapa: z.number(),
  firstReceivedAt: z.string().nullable(),
  lastReceivedAt: z.string().nullable(),
});

/** `cid` 가 있으면 수정, 없으면 등록 */
export const equipmentSaveRequestSchema = equipmentDetailResponseSchema
  .omit({
    plantName: true,
    userName: true,
    rtuEntName: true,
    installerName: true,
    wattPerPanel: true,
    inverterCapa: true,
    firstReceivedAt: true,
    lastReceivedAt: true,
  })
  .partial({ cid: true });

export const equipmentDeleteRequestSchema = z.object({
  cid: z.number().int(),
});

export type EquipmentListRequest = z.infer<typeof equipmentListRequestSchema>;
export type EquipmentListRow = z.infer<typeof equipmentListRowSchema>;
export type EquipmentDetailRequest = z.infer<typeof equipmentDetailRequestSchema>;
export type EquipmentDetailResponse = z.infer<typeof equipmentDetailResponseSchema>;
export type EquipmentSaveRequest = z.infer<typeof equipmentSaveRequestSchema>;
export type EquipmentDeleteRequest = z.infer<typeof equipmentDeleteRequestSchema>;

// ── 폼 ─────────────────────────────────────────────────────

const array = (label: string) => z
  .number(MSG.numberRange(label, ARRAY_MIN, ARRAY_MAX))
  .int()
  .min(ARRAY_MIN, MSG.numberRange(label, ARRAY_MIN, ARRAY_MAX))
  .max(ARRAY_MAX, MSG.numberRange(label, ARRAY_MIN, ARRAY_MAX));

/**
 * 설비 등록·수정 폼 (SFR-016-01~04, SFR-017-04).
 *
 * `inverterKind`·`takenSeqs`·`*Label` 은 검증이 문맥을 알아야 해서 폼에 함께 싣는 값이다 —
 * 스키마를 갈아 끼우는 대신 값으로 들고 있어야, 검색기가 고른 순간 같은 틱에 다시 판정된다.
 */
export const equipmentFormSchema = z.object({
  userId: z.string().min(1, MSG.selectRequired('사용자')),
  /*
    보일 이름에는 규칙을 걸지 않는다 — 참조하던 제품·계정이 지워지면 이름만 비는데, 그 칸에는
    오류를 보여 줄 자리가 없어 「이유 없이 저장이 안 되는 폼」이 된다. 값이 있는지는 id 가 본다.
  */
  userLabel: z.string(),
  plantId: z.string().min(1, MSG.selectRequired('발전소')),
  plantLabel: z.string(),
  name: z.string().trim().min(1, MSG.requiredField('설비 이름')).max(120, MSG.tooLong('설비 이름', 120)),
  rtuCommId: z.string().trim().max(255, MSG.tooLong('RTU 통신 ID', 255)),
  rtuPort: z
    .number()
    .int()
    .min(PORT_MIN, MSG.numberRange('RTU 포트', PORT_MIN, PORT_MAX))
    .max(PORT_MAX, MSG.numberRange('RTU 포트', PORT_MIN, PORT_MAX))
    .refine((value) => value !== PYRANOMETER_PORT, `${PYRANOMETER_PORT}번 포트는 일사량계 몫이라 쓸 수 없습니다.`)
    .nullable(),
  inverterProductId: z.string().min(1, MSG.selectRequired('인버터 모델')),
  inverterLabel: z.string(),
  /** 스트링 인버터인지 — 스트링 줄을 요구할지 여기서 갈린다 */
  inverterKind: z.enum(['string', 'central', 'micro', '']),
  moduleProductId: z.string().min(1, MSG.selectRequired('모듈 모델')),
  moduleLabel: z.string(),
  azimuth: z
    .number(MSG.numberRange('방위각', AZIMUTH_MIN, AZIMUTH_MAX))
    .min(AZIMUTH_MIN, MSG.numberRange('방위각', AZIMUTH_MIN, AZIMUTH_MAX))
    .max(AZIMUTH_MAX, MSG.numberRange('방위각', AZIMUTH_MIN, AZIMUTH_MAX)),
  inclineAngle: z
    .number(MSG.numberRange('경사각', INCLINE_MIN, INCLINE_MAX))
    .min(INCLINE_MIN, MSG.numberRange('경사각', INCLINE_MIN, INCLINE_MAX))
    .max(INCLINE_MAX, MSG.numberRange('경사각', INCLINE_MIN, INCLINE_MAX)),
  series1: array('직렬 1'),
  parallel1: array('병렬 1'),
  series2: array('직렬 2'),
  parallel2: array('병렬 2'),
  equipmentCapacity: z.number(MSG.requiredField('설비용량')).gt(0, MSG.requiredField('설비용량')),
  asExpiresAt: z.string(),
  note: z.string(),
  installedAt: z.string(),
  operatedAt: z.string(),
  rows: z.array(stringRowSchema),
  takenSeqs: z.array(z.number().int()),
}).superRefine((values, ctx) => {
  // 스트링 구조는 스트링 기종에만 있다.
  if (values.inverterKind !== 'string') return;

  if (values.rows.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['rows'], message: '스트링을 한 줄 이상 추가해 주세요.' });
  }

  refineStringRows(values, ctx);
});

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

export type EquipmentFormBody = Omit<
  EquipmentFormValues,
  'userLabel' | 'plantLabel' | 'inverterLabel' | 'moduleLabel' | 'inverterKind' | 'takenSeqs'
>;
