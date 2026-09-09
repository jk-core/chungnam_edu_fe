import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type { InquiryCommentAddParams, InquiryDetail, InquiryPage, InquiryPageParams } from './type';

/** 문의하기 API */
export const getInquiryPage = async (params: InquiryPageParams) => {
  const { data } = await apiClient.get<PagingResponse<InquiryPage>>('/inquiry/page', { params });

  return data;
};

export const getInquiryDetail = async (inquiryId: number) => {
  const { data } = await apiClient.get<InquiryDetail>('/inquiry/detail', { params: { inquiryId } });

  return data;
};

/** 파일과 본문을 part 로 가른다 — fileList 는 개수만큼 반복, 나머지는 json part 하나 */
export const postInquiry = (data: FormData) => apiClient.post('/inquiry', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

export const putInquiry = (data: FormData) => apiClient.put('/inquiry', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

export const deleteInquiry = (inquiryId: number) => apiClient.delete('/inquiry', { params: { inquiryId } });

export const postInquiryComment = (data: InquiryCommentAddParams) => apiClient.post('/inquiry/comment', data);

export const deleteInquiryComment = (commentId: number) =>
  apiClient.delete('/inquiry/comment', { params: { commentId } });
