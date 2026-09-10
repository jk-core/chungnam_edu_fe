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

/*
  ── 2안 (BE 와 정하기 전까지 남겨 둔다) ────────────────────

  갈리는 것은 **diff 를 누가 계산하는가** 하나다. 위 1안은 BE 가 바뀐 항목만 추려 주고,
  2안은 변경 전·후 엔티티를 통째로 던져 FE 가 견준다. 저장은 두 안 모두 tb_sys_log 의
  BEFORE_DATA·AFTER_DATA 에 통짜 JSON 으로 남기는 것을 전제한다.

  BE 는 두 JSON 을 그대로 실어 보내면 되어 구현이 가볍다. 대신 FE 가 넷을 떠안는다.
    - 저장할 때마다 바뀌는 감사 컬럼(updatedDtm·updatedUserId)을 걸러 낼 목록을 FE 가 든다
    - FK 를 이름으로 바꿀 수 없다 — userId 3 을 담당자명으로 보이려면 사용자 목록을 들고 이어야 한다
    - 필드명을 한글 라벨로 옮길 표를 엔티티마다 갖게 되어, 이력 화면이 다시 일곱으로 갈린다
    - 0·null·빈 문자열과 날짜 표기 차이를 FE 가 판정해 안 바뀐 것을 바뀐 것으로 그린다

  위 응답에서 changeList 자리만 아래로 갈린다:

    beforeEntity: Record<string, string | number | boolean | null> | null;   // 등록이면 null
    afterEntity: Record<string, string | number | boolean | null> | null;    // 삭제면 null
*/
