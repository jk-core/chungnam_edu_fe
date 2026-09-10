import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { ZodInverterTypeCode } from '@/configs/codes';
import { pagingParamsSchema } from '@/service/common';
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

export const NAME_MAX = 120;
export const COMMUNICATION_ID_MAX = 255;

/** 검색어는 설비명·CID·RTU통신ID·발전소명을 훑는다 */
export type ManageEquipmentPageParams = z.infer<typeof manageEquipmentPageParamsSchema>;
export const manageEquipmentPageParamsSchema = pagingParamsSchema.extend({
  keyword: z.string().optional(),
  powerPlantId: z.number().int().optional(),
  inverterTypeCode: ZodInverterTypeCode.CODE.optional(),
});

export type ManageEquipmentPage = z.infer<typeof manageEquipmentPageSchema>;
export const manageEquipmentPageSchema = z.object({
  cid: z.number().int(),
  powerPlantName: z.string(),
  equipmentName: z.string(),
  inverterName: z.string(),
  inverterEnterpriseName: z.string(),
  inverterTypeCode: ZodInverterTypeCode.CODE,
  inverterTypeName: ZodInverterTypeCode.NAME,
  equipmentCapacity: z.number(),
  rtuCommunicationId: z.string(),
  rtuPort: z.number().int().nullable(),
});

export type ManageEquipmentDetailParams = z.infer<typeof manageEquipmentDetailParamsSchema>;
export const manageEquipmentDetailParamsSchema = z.object({
  cid: z.number().int(),
});

export type ManageEquipmentDetail = z.infer<typeof manageEquipmentDetailSchema>;
export const manageEquipmentDetailSchema = z.object({
  cid: z.number().int(),
  powerPlantId: z.number().int(),
  powerPlantName: z.string(),
  userId: z.number().int().nullable(),
  userName: z.string(),
  equipmentName: z.string(),
  rtuCommunicationId: z.string(),
  rtuPort: z.number().int().nullable(),
  inverterId: z.number().int().nullable(),
  moduleId: z.number().int().nullable(),
  azimuth: z.number(),
  inclinedAngle: z.number(),
  equipmentCapacity: z.number(),
  moduleSerialCount: z.number().int(),
  moduleParallelCount: z.number().int(),
  moduleSerialCountSecond: z.number().int(),
  moduleParallelCountSecond: z.number().int(),
  asExpiryDate: z.string(),
  etc: z.string(),
  installDate: z.string(),
  /** 아래는 폼이 고치지 않고 읽기만 하는 값이다 */
  rtuEnterpriseName: z.string(),
  installerName: z.string(),
  pwrMp: z.number(),
  inverterCapacity: z.number(),
  firstGathDtm: z.string().nullable(),
  lastGathDtm: z.string().nullable(),
});

const array = (label: string) => z
  .number(MSG.numberRange(label, ARRAY_MIN, ARRAY_MAX))
  .int()
  .min(ARRAY_MIN, MSG.numberRange(label, ARRAY_MIN, ARRAY_MAX))
  .max(ARRAY_MAX, MSG.numberRange(label, ARRAY_MIN, ARRAY_MAX));

/**
 * 등록 요청 한 벌. 담당 사용자는 발전소가 결정한다 — 설비가 따로 받지 않는다.
 *
 * 검증 규칙을 여기 두는 것은 이 스키마가 곧 폼이 지키는 계약이기 때문이다 — 폼은 이것을
 * 넓혀 쓸 뿐이라, 서버가 받는 모양과 화면이 막는 모양이 갈리지 않는다.
 */
export type ManageEquipmentAddParams = z.infer<typeof manageEquipmentAddSchema>;
export const manageEquipmentAddSchema = z.object({
  powerPlantId: z.number(MSG.selectRequired('발전소')).int(),
  equipmentName: z.string().trim().min(1, MSG.requiredField('설비 이름')).max(NAME_MAX, MSG.tooLong('설비 이름', NAME_MAX)),
  rtuCommunicationId: z.string().trim().max(COMMUNICATION_ID_MAX, MSG.tooLong('RTU 통신 ID', COMMUNICATION_ID_MAX)),
  rtuPort: z
    .number()
    .int()
    .min(PORT_MIN, MSG.numberRange('RTU 포트', PORT_MIN, PORT_MAX))
    .max(PORT_MAX, MSG.numberRange('RTU 포트', PORT_MIN, PORT_MAX))
    .refine((value) => value !== PYRANOMETER_PORT, `${PYRANOMETER_PORT}번 포트는 일사량계 몫이라 쓸 수 없습니다.`)
    .nullable(),
  inverterId: z.number().int().nullable(),
  moduleId: z.number().int().nullable(),
  azimuth: z
    .number(MSG.numberRange('방위각', AZIMUTH_MIN, AZIMUTH_MAX))
    .min(AZIMUTH_MIN, MSG.numberRange('방위각', AZIMUTH_MIN, AZIMUTH_MAX))
    .max(AZIMUTH_MAX, MSG.numberRange('방위각', AZIMUTH_MIN, AZIMUTH_MAX)),
  inclinedAngle: z
    .number(MSG.numberRange('경사각', INCLINE_MIN, INCLINE_MAX))
    .min(INCLINE_MIN, MSG.numberRange('경사각', INCLINE_MIN, INCLINE_MAX))
    .max(INCLINE_MAX, MSG.numberRange('경사각', INCLINE_MIN, INCLINE_MAX)),
  equipmentCapacity: z.number(MSG.requiredField('설비용량')).gt(0, MSG.requiredField('설비용량')),
  moduleSerialCount: array('직렬 1'),
  moduleParallelCount: array('병렬 1'),
  moduleSerialCountSecond: array('직렬 2'),
  moduleParallelCountSecond: array('병렬 2'),
  asExpiryDate: z.string(),
  etc: z.string(),
  installDate: z.string(),
});

export type ManageEquipmentModifyParams = z.infer<typeof manageEquipmentModifySchema>;
export const manageEquipmentModifySchema = manageEquipmentAddSchema.extend({
  cid: z.number().int(),
});

export type ManageEquipmentRemoveParams = z.infer<typeof manageEquipmentRemoveParamsSchema>;
export const manageEquipmentRemoveParamsSchema = z.object({
  cid: z.number().int(),
});

// ── 폼 ─────────────────────────────────────────────────────

/**
 * 설비 등록·수정 폼 (SFR-016-01~04, SFR-017-04).
 *
 * 요청 스키마를 넓혀 쓴다 — 제품은 서버가 비워 두는 것을 허용하지만 화면은 고르게 하고,
 * 소속·보일 이름·스트링 판처럼 요청에 실리지 않는 칸을 여기서만 더한다.
 * 저장할 때는 `manageEquipmentAddSchema.parse(values)` 가 그 칸들을 떨군다.
 *
 * `inverterKind`·`takenNumbers`·`*Label` 은 검증이 문맥을 알아야 해서 폼에 함께 싣는 값이다 —
 * 스키마를 갈아 끼우는 대신 값으로 들고 있어야, 검색기가 고른 순간 같은 틱에 다시 판정된다.
 */
export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;
export const equipmentFormSchema = manageEquipmentAddSchema.extend({
  inverterId: z.number(MSG.selectRequired('인버터 모델')).int(),
  moduleId: z.number(MSG.selectRequired('모듈 모델')).int(),
  userId: z.number(MSG.selectRequired('사용자')).int(),
  /*
    보일 이름에는 규칙을 걸지 않는다 — 참조하던 제품·계정이 지워지면 이름만 비는데, 그 칸에는
    오류를 보여 줄 자리가 없어 「이유 없이 저장이 안 되는 폼」이 된다. 값이 있는지는 id 가 본다.
  */
  userLabel: z.string(),
  powerPlantLabel: z.string(),
  inverterLabel: z.string(),
  moduleLabel: z.string(),
  /** 스트링 인버터인지 — 스트링 줄을 요구할지 여기서 갈린다 */
  inverterKind: z.enum(['general', 'string', 'central', 'micro', '']),
  rows: z.array(stringRowSchema),
  takenNumbers: z.array(z.number().int()),
}).superRefine((values, ctx) => {
  // 스트링 구조는 스트링 기종에만 있다.
  if (values.inverterKind !== 'string') return;

  if (values.rows.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['rows'], message: '스트링을 한 줄 이상 추가해 주세요.' });
  }

  refineStringRows(values, ctx);
});
