import { z } from 'zod';

/**
 * 페이지네이션 요청 한 벌.
 *
 * 목록 파라미터는 `pagingParamsSchema.extend({ 그 화면만의 조건 })` 으로 적는다.
 * 정렬은 표에 정렬 UI 가 있을 때만 실린다 — 그래서 선택이다.
 */
export type PagingParams = z.infer<typeof pagingParamsSchema>;
export const pagingParamsSchema = z.object({
  page: z.number().int().min(0),
  size: z.number().int().positive(),
  sortField: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
});

/** 행 타입만 갈리고 나머지는 Spring Page 를 그대로 받는다 */
const pagingEnvelopeSchema = z.object({
  totalElements: z.number().int(),
  totalPages: z.number().int(),
  number: z.number().int(),
  numberOfElements: z.number().int(),
  size: z.number().int(),
  first: z.boolean(),
  last: z.boolean(),
  empty: z.boolean(),
  sort: z.object({
    empty: z.boolean(),
    sorted: z.boolean(),
    unsorted: z.boolean(),
  }),
  pageable: z.object({
    offset: z.number().int(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    paged: z.boolean(),
    unpaged: z.boolean(),
    sort: z.object({
      empty: z.boolean(),
      sorted: z.boolean(),
      unsorted: z.boolean(),
    }),
  }),
});

/**
 * 목록 응답 한 벌. 행 스키마를 감싸 쓴다.
 *
 * 전체 건수·페이지 수는 이 껍데기가 이미 갖고 있어 응답마다 totalCount 를 따로 둘 이유가 없다.
 */
export function pagingResponseSchema<T extends z.ZodType>(content: T) {
  return pagingEnvelopeSchema.extend({ content: z.array(content) });
}
export type PagingResponse<T> = z.infer<typeof pagingEnvelopeSchema> & { content: Array<T> };
