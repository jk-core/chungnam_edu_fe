import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { PYRANOMETER_PORT } from '@/mocks/pyranometers';
import { refineStringRows, stringRowSchema } from '@/schemas/stringRow';

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

const array = (label: string) => z
  .number(MSG.numberRange(label, ARRAY_MIN, ARRAY_MAX))
  .int()
  .min(ARRAY_MIN, MSG.numberRange(label, ARRAY_MIN, ARRAY_MAX))
  .max(ARRAY_MAX, MSG.numberRange(label, ARRAY_MIN, ARRAY_MAX));

/**
 * 설비 등록·수정 폼 (SFR-016-01~04, SFR-017-04).
 *
 * `inverterKind`·`takenNumbers`·`*Label` 은 검증이 문맥을 알아야 해서 폼에 함께 싣는 값이다 —
 * 스키마를 갈아 끼우는 대신 값으로 들고 있어야, 검색기가 고른 순간 같은 틱에 다시 판정된다.
 * 보일 이름에는 규칙을 걸지 않는다 — 참조하던 제품·계정이 지워지면 이름만 비는데, 그 칸에는
 * 오류를 보여 줄 자리가 없어 「이유 없이 저장이 안 되는 폼」이 된다. 값이 있는지는 id 가 본다.
 *
 * BE v2.0 에 설비(인버터) 등록 엔드포인트가 아직 없다 — 이것은 화면이 지키는 입력 규칙이다.
 */
export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;
export const equipmentFormSchema = z.object({
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
  inverterId: z.number(MSG.selectRequired('인버터 모델')).int(),
  moduleId: z.number(MSG.selectRequired('모듈 모델')).int(),
  userId: z.number(MSG.selectRequired('사용자')).int(),
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
