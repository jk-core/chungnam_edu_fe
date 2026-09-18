import { z } from 'zod';

/**
 * 페이지네이션 요청 한 벌 (BE `CustomPageable`).
 *
 * 명세에는 `customPageable` 이 객체 한 덩이로 적혀 있지만 Spring 이 평탄화해 받으므로
 * 실제로 실리는 것은 `page`·`size`·`sortField`·`sortDirection` 네 개의 평평한 쿼리다.
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

/**
 * 드롭다운 한 줄. 코드·지역·모듈·일사량계가 모두 `{ id, name }` 한 모양으로 내려온다.
 *
 * 식별자 타입만 갈려 감싸 쓴다 — 사용자 드롭다운만 `id` 가 문자열(로그인 ID)이고
 * 나머지는 숫자다. 한 모양으로 뭉뚱그리면 그 차이가 화면에서 드러난다.
 */
export function dropdownSchema<T extends z.ZodType>(id: T) {
  return z.object({ id, name: z.string() });
}

/** 응답에 실려 오는 첨부 한 건 (BE `PowerPlantPhotoResponse`) */
export type FileMeta = z.infer<typeof fileSchema>;
export const fileSchema = z.object({
  fileId: z.string(),
  fileSeq: z.number().int(),
  fileName: z.string(),
  url: z.string(),
});

/**
 * 뺄 파일은 상세 응답의 `fileId`·`fileSeq` 를 그대로 돌려보낸다.
 * `fileId` 는 한 건의 첨부 묶음을 가리켜 혼자서는 파일 한 장을 특정하지 못한다.
 *
 * v2.0 에는 아직 첨부를 받는 엔드포인트가 없다 — 첨부판(`components/common/Form/FileUpload`)이
 * 지킬 모양으로만 남겨 둔다.
 */
export type FileToRemove = z.infer<typeof fileToRemoveSchema>;
export const fileToRemoveSchema = fileSchema.pick({ fileId: true, fileSeq: true });
