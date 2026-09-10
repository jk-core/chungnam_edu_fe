import { z } from 'zod';

/** 이력을 볼 대상. 필수다 — 전체 조회는 열지 않는다 */
export type ManageHistoryTarget = z.infer<typeof manageHistoryTargetSchema>;
export const manageHistoryTargetSchema = z.enum([
  'powerPlant',
  'equipment',
  'string',
  'irrad',
  'inverter',
  'module',
  'user',
]);

export type ManageHistoryParams = z.infer<typeof manageHistoryParamsSchema>;
export const manageHistoryParamsSchema = z.object({
  targetType: manageHistoryTargetSchema,
});

/**
 * 한 번의 등록·수정·삭제가 한 줄이다 — 주소와 담당자를 같이 고쳐도 한 줄이고, 무엇이 바뀌었는지는
 * 그 줄을 펼쳐 본다. 최근 10건만 준다.
 *
 * changeList 가 비어 있으면 화면이 펼침 표시를 그리지 않는다 — 등록·삭제가 그 자리다.
 * 수정이면 비지 않는다: 바뀐 것이 없으면 이력을 남기지 않는다.
 *
 * beforeValue·afterValue 는 엔티티 필드의 타입을 그대로 따른다. 등록이면 before 가, 삭제면
 * after 가 null 이다 — 값이 지워진 것과 0·false 는 갈라야 한다.
 * fieldName 은 컬럼 comment 를 그대로 쓰고 단위가 있는 값은 여기에 적는다 (설비용량(kW)).
 * FK 는 값이 아니라 이름으로 준다 — userId 3 이 아니라 담당자명이다.
 */
export type ManageHistory = z.infer<typeof manageHistorySchema>;
export const manageHistorySchema = z.object({
  historyId: z.number().int(),
  changeDtm: z.string(),
  userName: z.string(),
  targetId: z.number().int(),
  targetName: z.string(),
  operation: z.enum(['create', 'update', 'delete']),
  changeList: z.array(z.object({
    fieldName: z.string(),
    beforeValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    afterValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  })),
});
