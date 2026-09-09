import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  InspectionReportDetail,
  InspectionReportListItem,
  InspectionReportListParams,
  InspectionReportRepeatIssue,
  InspectionReportRepeatIssueParams,
  InspectionReportSchedule,
  InspectionReportScheduleParams,
  InspectionReportTemplateDetail,
  ManageInspectionReportModifyParams,
  ManageInspectionReportPage,
  ManageInspectionReportPageParams,
  ManageInspectionReportTemplateAddParams,
  ManageInspectionReportTemplateModifyParams,
  ManageInspectionReportTemplatePage,
  ManageInspectionReportTemplatePageParams,
  ManageInspectionReportTemplateRevision,
} from './type';

/** 현장보고서 API */
export const getInspectionReportSchedule = async (params: InspectionReportScheduleParams) => {
  const { data } = await apiClient.get<InspectionReportSchedule[]>('/inspectionReport/schedule', { params });

  return data;
};

export const getInspectionReportTemplateDetail = async (templateId: number) => {
  const { data } = await apiClient.get<InspectionReportTemplateDetail>(
    '/inspectionReport/template/detail',
    { params: { templateId } },
  );

  return data;
};

export const getInspectionReportList = async (params: InspectionReportListParams) => {
  const { data } = await apiClient.get<InspectionReportListItem[]>('/inspectionReport/list', { params });

  return data;
};

export const getInspectionReportDetail = async (inspectionReportId: number) => {
  const { data } = await apiClient.get<InspectionReportDetail>(
    '/inspectionReport/detail',
    { params: { inspectionReportId } },
  );

  return data;
};

/** 사진과 본문을 part 로 가른다 — fileList 는 개수만큼 반복, 나머지는 json part 하나 */
export const postInspectionReport = (data: FormData) => apiClient.post('/inspectionReport', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

export const putInspectionReport = (data: FormData) => apiClient.put('/inspectionReport', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

export const getInspectionReportRepeatIssue = async (params: InspectionReportRepeatIssueParams) => {
  const { data } = await apiClient.get<InspectionReportRepeatIssue[]>('/inspectionReport/repeatIssue', { params });

  return data;
};

/** 관리자 콘솔 - 점검보고서 관리 API */
export const getManageInspectionReportPage = async (params: ManageInspectionReportPageParams) => {
  const { data } = await apiClient.get<PagingResponse<ManageInspectionReportPage>>(
    '/manage/inspectionReport/page',
    { params },
  );

  return data;
};

export const patchManageInspectionReport = (data: ManageInspectionReportModifyParams) =>
  apiClient.patch('/manage/inspectionReport', data);

export const getManageInspectionReportTemplatePage = async (params: ManageInspectionReportTemplatePageParams) => {
  const { data } = await apiClient.get<PagingResponse<ManageInspectionReportTemplatePage>>(
    '/manage/inspectionReport/template/page',
    { params },
  );

  return data;
};

export const postManageInspectionReportTemplate = (data: ManageInspectionReportTemplateAddParams) =>
  apiClient.post('/manage/inspectionReport/template', data);

export const putManageInspectionReportTemplate = (data: ManageInspectionReportTemplateModifyParams) =>
  apiClient.put('/manage/inspectionReport/template', data);

export const deleteManageInspectionReportTemplate = (templateId: number) =>
  apiClient.delete('/manage/inspectionReport/template', { params: { templateId } });

export const getManageInspectionReportTemplateRevision = async (templateId: number) => {
  const { data } = await apiClient.get<ManageInspectionReportTemplateRevision[]>(
    '/manage/inspectionReport/template/revision',
    { params: { templateId } },
  );

  return data;
};
