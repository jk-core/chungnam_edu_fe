import apiClient from '@/service';
import type {
  DiagnosisInverterParams,
  DiagnosisInverterRaw,
  DiagnosisInverterRow,
  DiagnosisPowerPlantParams,
  DiagnosisStringParams,
  DiagnosisStringRaw,
  DiagnosisStringRow,
  InverterEfficiency,
  PowerPlantEfficiency,
} from './type';

/** AI 진단 API — 조회 대상마다 경로가 갈린다 (발전소 `powerPlantId` · 인버터 `cid` · 스트링 `stringId`) */
export const getDiagnosisInverterList = async (params: DiagnosisPowerPlantParams) => {
  const { data } = await apiClient.get<DiagnosisInverterRow[]>('/diagnosis/powerPlant/inverter/list', { params });

  return data;
};

export const getDiagnosisPowerPlantEfficiency = async (params: DiagnosisPowerPlantParams) => {
  const { data } = await apiClient.get<PowerPlantEfficiency[]>('/diagnosis/powerPlant/efficiency', { params });

  return data;
};

export const getDiagnosisStringList = async (params: DiagnosisInverterParams) => {
  const { data } = await apiClient.get<DiagnosisStringRow[]>('/diagnosis/inverter/string/list', { params });

  return data;
};

export const getDiagnosisInverterEfficiency = async (params: DiagnosisInverterParams) => {
  const { data } = await apiClient.get<InverterEfficiency[]>('/diagnosis/inverter/string/efficiency', { params });

  return data;
};

export const getDiagnosisInverterRaw = async (params: DiagnosisInverterParams) => {
  const { data } = await apiClient.get<DiagnosisInverterRaw>('/diagnosis/inverter/raw', { params });

  return data;
};

export const getDiagnosisStringRaw = async (params: DiagnosisStringParams) => {
  const { data } = await apiClient.get<DiagnosisStringRaw>('/diagnosis/string/raw', { params });

  return data;
};
