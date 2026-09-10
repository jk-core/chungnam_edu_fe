import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  NoticeCommentAddParams,
  NoticeDetail,
  NoticePage,
  NoticePageParams,
  NoticePopup,
  NoticePopupParams,
} from './type';

/** 공지사항 API */
export const getNoticePage = async (params: NoticePageParams) => {
  const { data } = await apiClient.get<PagingResponse<NoticePage>>('/notice/page', { params });

  return data;
};

export const getNoticeDetail = async (noticeId: number) => {
  const { data } = await apiClient.get<NoticeDetail>('/notice/detail', { params: { noticeId } });

  return data;
};

/** 파일과 본문을 part 로 가른다 — fileList 는 개수만큼 반복, 나머지는 json part 하나 */
export const postNotice = (data: FormData) => apiClient.post('/notice', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

export const putNotice = (data: FormData) => apiClient.put('/notice', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

export const deleteNotice = (noticeId: number) => apiClient.delete('/notice', { params: { noticeId } });

export const postNoticeComment = (data: NoticeCommentAddParams) => apiClient.post('/notice/comment', data);

export const deleteNoticeComment = (commentId: number) =>
  apiClient.delete('/notice/comment', { params: { commentId } });

/** 메인 진입 팝업 */
export const getNoticePopup = async (params: NoticePopupParams) => {
  const { data } = await apiClient.get<NoticePopup[]>('/notice/popup', { params });

  return data;
};
