/**
 * 수집 한 건의 상태 — 결측·이상은 표에서 갈라 보여 준다 (SFR-009-04).
 *
 * 서버 `dataStateCode` 는 열 단계다 (`configs/codes.ts` 의 `DATA_STATE`). 열을 이 셋으로
 * 접는 규칙은 어느 코드가 어느 칸인지 BE 와 맞춘 뒤에 정한다 — 지금 정하면 추측이 표에 박힌다.
 */
export type RawDataState = 'normal' | 'missing' | 'abnormal';

/**
 * 인버터에서 수집주기마다 올라오는 계측 한 줄 (SFR-010-03).
 * 값이 들어오지 않은 항목은 null 로 두어 0 과 구분한다.
 */
export interface OperationRaw {
  /** 'YYYY-MM-DD HH:mm:ss' */
  at: string;
  state: RawDataState;
  /** 누적 발전량(Wh) */
  accumWh: number;
  /** 경사면 일사량(W/㎡) */
  irradiance: number | null;
  /** 모듈 표면 온도(℃) */
  moduleTemp: number | null;
  /** 인버터 내부 온도(℃) */
  inverterTemp: number | null;
  /** DC 입력 */
  dcVolt: number | null;
  dcAmp: number | null;
  dcWatt: number | null;
  /** AC 출력 — 단상이면 단일 값, 삼상이면 상별 값 */
  acVolt: number | null;
  acAmp: number | null;
  acVoltR: number | null;
  acVoltS: number | null;
  acVoltT: number | null;
  acAmpR: number | null;
  acAmpS: number | null;
  acAmpT: number | null;
  acWatt: number | null;
  /** 계통 주파수(Hz) */
  frequency: number | null;
  /** 역률(%) */
  powerFactor: number | null;
}
