import type { ModuleProduct } from '@/interface/deviceMaster';

/** 초안에서는 숫자 칸을 비워 둘 수 있다 — 검증 전까지 빈 문자열을 허용한다. */
export type ModuleDraft = Omit<ModuleProduct, 'id' | 'moduleId' | NumericKey> & {
  [K in NumericKey]: number | '';
};

export type NumericKey =
  | 'wattPerPanel'
  | 'maxVoltage'
  | 'maxCurrent'
  | 'openVoltage'
  | 'shortCurrent'
  | 'voltTempCoeff'
  | 'currentTempCoeff';

/** 숫자 항목의 허용 범위 — 입력 칸, 검증, 이력 라벨을 같은 표에서 뽑는다 (SFR-017-05). */
export const NUMERIC: { key: NumericKey; label: string; min: number; max: number; unit: string }[] = [
  { key: 'wattPerPanel', label: '모듈 용량', min: 0, max: 700, unit: 'W' },
  { key: 'maxVoltage', label: '최대 전압', min: 0, max: 100, unit: 'V' },
  { key: 'maxCurrent', label: '최대 전류', min: 0, max: 100, unit: 'A' },
  { key: 'openVoltage', label: '개방 전압', min: 0, max: 100, unit: 'V' },
  { key: 'shortCurrent', label: '단락 전류', min: 0, max: 100, unit: 'A' },
  { key: 'voltTempCoeff', label: '전압 온도계수', min: -1, max: 0, unit: '%/℃' },
  { key: 'currentTempCoeff', label: '전류 온도계수', min: 0, max: 1, unit: '%/℃' },
];

export const EMPTY_DRAFT: ModuleDraft = {
  name: '',
  maker: '',
  wattPerPanel: '',
  maxVoltage: '',
  maxCurrent: '',
  openVoltage: '',
  shortCurrent: '',
  voltTempCoeff: '',
  currentTempCoeff: '',
  cellType: 'single',
};
