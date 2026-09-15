import { z } from 'zod';
import { fileSchema, fileToRemoveSchema, pagingParamsSchema } from '@/service/common';

/** 게시판 첨부는 이미지와 문서를 함께 받아 구분이 따라온다 */
export type BoardFile = z.infer<typeof boardFileSchema>;
export const boardFileSchema = fileSchema.extend({
  fileType: z.enum(['image', 'file']),
});

/** 게시판이 답변·댓글에 함께 쓰는 한 줄 */
export type BoardComment = z.infer<typeof boardCommentSchema>;
export const boardCommentSchema = z.object({
  commentId: z.number().int(),
  userName: z.string(),
  content: z.string(),
  createdDtm: z.string(),
});

/** 정렬은 고정 글 먼저, 그다음 최신순 */
export type NoticePageParams = z.infer<typeof noticePageParamsSchema>;
export const noticePageParamsSchema = pagingParamsSchema.extend({
  keyword: z.string().optional(),
});

export type NoticePage = z.infer<typeof noticePageSchema>;
export const noticePageSchema = z.object({
  noticeId: z.number().int(),
  title: z.string(),
  userName: z.string(),
  createdDtm: z.string(),
  isPinned: z.boolean(),
  isPopup: z.boolean(),
  viewCount: z.number().int(),
  commentCount: z.number().int(),
  fileCount: z.number().int(),
  imageCount: z.number().int(),
});

export type NoticeDetailParams = z.infer<typeof noticeDetailParamsSchema>;
export const noticeDetailParamsSchema = z.object({
  noticeId: z.number().int(),
});

/**
 * 이전·다음 글을 응답에 함께 담는다 — 목록에 보이는 차례 그대로여야 하는데, 프론트가 목록을
 * 다시 불러 계산하면 페이징 경계에서 어긋난다.
 *
 * 조회수는 이 API 가 불릴 때마다 서버가 올린다 — 응답 viewCount 는 올린 뒤의 값이다.
 */
export type NoticeDetail = z.infer<typeof noticeDetailSchema>;
export const noticeDetailSchema = z.object({
  noticeId: z.number().int(),
  title: z.string(),
  content: z.string(),
  userName: z.string(),
  createdDtm: z.string(),
  viewCount: z.number().int(),
  isPinned: z.boolean(),
  fileList: z.array(boardFileSchema),
  commentList: z.array(boardCommentSchema),
  popup: z.object({
    startDate: z.string(),
    endDate: z.string(),
  }).nullable(),
  previous: z.object({
    noticeId: z.number().int(),
    title: z.string(),
  }).nullable(),
  next: z.object({
    noticeId: z.number().int(),
    title: z.string(),
  }).nullable(),
});

/**
 * 관리자만 쓴다 — 주소로 들어와도 막아야 하므로 서버가 판정한다.
 * 파일은 fileList part 로 개수만큼 반복하고 나머지 본문은 json part 하나다.
 */
export type NoticeAddParams = z.infer<typeof noticeAddSchema>;
export const noticeAddSchema = z.object({
  title: z.string(),
  content: z.string(),
  fileList: z.array(z.instanceof(File)).optional(),
  isPinned: z.boolean().optional(),
  popupStartDate: z.string().optional(),
  popupEndDate: z.string().optional(),
});

export type NoticeModifyParams = z.infer<typeof noticeModifySchema>;
export const noticeModifySchema = noticeAddSchema.extend({
  noticeId: z.number().int(),
  removeFileList: z.array(fileToRemoveSchema).optional(),
});

export type NoticeRemoveParams = z.infer<typeof noticeRemoveParamsSchema>;
export const noticeRemoveParamsSchema = z.object({
  noticeId: z.number().int(),
});

/** 쓴 사람은 토큰에서 서버가 집는다 */
export type NoticeCommentAddParams = z.infer<typeof noticeCommentAddSchema>;
export const noticeCommentAddSchema = z.object({
  noticeId: z.number().int(),
  content: z.string(),
});

export type NoticeCommentRemoveParams = z.infer<typeof noticeCommentRemoveParamsSchema>;
export const noticeCommentRemoveParamsSchema = z.object({
  commentId: z.number().int(),
});

/** 기준일에 걸린 팝업 공지. 팝업 기간은 공지에만 붙어 문의하기에는 짝이 없다 */
export type NoticePopupParams = z.infer<typeof noticePopupParamsSchema>;
export const noticePopupParamsSchema = z.object({
  targetDate: z.string(),
});

export type NoticePopup = z.infer<typeof noticePopupSchema>;
export const noticePopupSchema = z.object({
  noticeId: z.number().int(),
  title: z.string(),
  content: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});
