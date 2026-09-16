import { z } from 'zod';
import { boardCommentSchema, boardFileSchema } from '@/service/notice/type';
import { fileToRemoveSchema, pagingParamsSchema } from '@/service/common';

/**
 * 최신순 정렬. 고정 글이 없어 공지사항과 정렬 규칙이 다르다.
 * 읽을 수 있는 범위는 서버가 자른다 — 기관담당자·그룹관리자는 자기가 쓴 것만 본다.
 */
export type InquiryPageParams = z.infer<typeof inquiryPageParamsSchema>;
export const inquiryPageParamsSchema = pagingParamsSchema.extend({
  keyword: z.string().optional(),
});

export type InquiryPage = z.infer<typeof inquiryPageSchema>;
export const inquiryPageSchema = z.object({
  inquiryId: z.number().int(),
  title: z.string(),
  userName: z.string(),
  createdDtm: z.string(),
  viewCount: z.number().int(),
  /** 답변수 */
  commentCount: z.number().int(),
  fileCount: z.number().int(),
  imageCount: z.number().int(),
});

export type InquiryDetailParams = z.infer<typeof inquiryDetailParamsSchema>;
export const inquiryDetailParamsSchema = z.object({
  inquiryId: z.number().int(),
});

/**
 * 이전·다음 글을 응답에 함께 담는다 — 목록에 보이는 차례 그대로여야 하는데, 프론트가 목록을
 * 다시 불러 계산하면 페이징 경계에서 어긋난다.
 *
 * 조회수는 이 API 가 불릴 때마다 서버가 올린다 — 응답 viewCount 는 올린 뒤의 값이다.
 */
export type InquiryDetail = z.infer<typeof inquiryDetailSchema>;
export const inquiryDetailSchema = z.object({
  inquiryId: z.number().int(),
  title: z.string(),
  content: z.string(),
  userName: z.string(),
  createdDtm: z.string(),
  viewCount: z.number().int(),
  fileList: z.array(boardFileSchema),
  commentList: z.array(boardCommentSchema),
  previous: z.object({
    inquiryId: z.number().int(),
    title: z.string(),
  }).nullable(),
  next: z.object({
    inquiryId: z.number().int(),
    title: z.string(),
  }).nullable(),
});

/**
 * 누구나 쓴다. 쓴 사람은 토큰에서 서버가 집는다.
 * 파일은 fileList part 로 개수만큼 반복하고 나머지 본문은 json part 하나다.
 */
export type InquiryAddParams = z.infer<typeof inquiryAddSchema>;
export const inquiryAddSchema = z.object({
  title: z.string(),
  content: z.string(),
  fileList: z.array(z.instanceof(File)).optional(),
});

/** 쓴 사람과 관리자만 고칠 수 있다 */
export type InquiryModifyParams = z.infer<typeof inquiryModifySchema>;
export const inquiryModifySchema = inquiryAddSchema.extend({
  inquiryId: z.number().int(),
  removeFileList: z.array(fileToRemoveSchema).optional(),
});

export type InquiryRemoveParams = z.infer<typeof inquiryRemoveParamsSchema>;
export const inquiryRemoveParamsSchema = z.object({
  inquiryId: z.number().int(),
});

/** 쓴 사람은 토큰에서 서버가 집는다 */
export type InquiryCommentAddParams = z.infer<typeof inquiryCommentAddSchema>;
export const inquiryCommentAddSchema = z.object({
  inquiryId: z.number().int(),
  content: z.string(),
});

export type InquiryCommentRemoveParams = z.infer<typeof inquiryCommentRemoveParamsSchema>;
export const inquiryCommentRemoveParamsSchema = z.object({
  commentId: z.number().int(),
});
