import apiClient from '@/service';
import type {
  InstallationTypeItem,
  InverterTypeDropdown,
  PhaseTypeDropdown,
  StatusCodeItem,
  UserRoleDropdown,
} from './type';

/** 공통 코드 API — 드롭다운은 `{ id, name }`, 목록은 `{ codeNo, codeVal }` 로 온다 */
export const getUserRoleDropdownList = async (name?: string) => {
  const { data } = await apiClient.get<UserRoleDropdown[]>('/common/code/userRole/list/dropdown', { params: { name } });

  return data;
};

export const getPhaseTypeDropdownList = async (name?: string) => {
  const { data } = await apiClient.get<PhaseTypeDropdown[]>('/common/code/phaseType/list/dropdown', { params: { name } });

  return data;
};

export const getInverterTypeDropdownList = async (name?: string) => {
  const { data } = await apiClient.get<InverterTypeDropdown[]>('/common/code/inverterType/list/dropdown', { params: { name } });

  return data;
};

export const getStatusCodeList = async () => {
  const { data } = await apiClient.get<StatusCodeItem[]>('/common/code/status/list');

  return data;
};

export const getInstallationTypeList = async () => {
  const { data } = await apiClient.get<InstallationTypeItem[]>('/common/code/installationType/list');

  return data;
};
