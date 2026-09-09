import apiClient from '@/service';
import type {
  DiagnosisInverterParams,
  DiagnosisInverterRaw,
  DiagnosisInverterString,
  DiagnosisInverterStringEfficiency,
  DiagnosisPowerPlantInverter,
  DiagnosisPowerPlantInverterEfficiency,
  DiagnosisPowerPlantParams,
  DiagnosisStringParams,
  DiagnosisStringRaw,
} from './type';

/** 발전진단 API — 발전소로 열 때 */
export const getDiagnosisPowerPlantInverterList = async (params: DiagnosisPowerPlantParams) => {
  const { data } = await apiClient.get<DiagnosisPowerPlantInverter[]>(
    '/diagnosis/powerPlant/inverter/list',
    { params },
  );

  return data;
};

export const getDiagnosisPowerPlantInverterEfficiency = async (params: DiagnosisPowerPlantParams) => {
  const { data } = await apiClient.get<DiagnosisPowerPlantInverterEfficiency[]>(
    '/diagnosis/powerPlant/inverter/efficiency',
    { params },
  );

  return data;
};

/** 발전진단 API — 설비로 열 때 */
export const getDiagnosisInverterStringList = async (params: DiagnosisInverterParams) => {
  const { data } = await apiClient.get<DiagnosisInverterString[]>('/diagnosis/inverter/string/list', { params });

  return data;
};

export const getDiagnosisInverterStringEfficiency = async (params: DiagnosisInverterParams) => {
  const { data } = await apiClient.get<DiagnosisInverterStringEfficiency[]>(
    '/diagnosis/inverter/string/efficiency',
    { params },
  );

  return data;
};

export const getDiagnosisInverterRaw = async (params: DiagnosisInverterParams) => {
  const { data } = await apiClient.get<DiagnosisInverterRaw>('/diagnosis/inverter/raw', { params });

  return data;
};

/** 발전진단 API — 스트링으로 열 때 */
export const getDiagnosisStringRaw = async (params: DiagnosisStringParams) => {
  const { data } = await apiClient.get<DiagnosisStringRaw>('/diagnosis/string/raw', { params });

  return data;
};
