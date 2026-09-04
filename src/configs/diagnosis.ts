/**
 * 진단 효율 판정 기준.
 *
 * 진단 효율 = 실측 DC 전력 / 모델 예측 DC 전력. 발전량은 날씨에 따라 크게 흔들려 추이 판단이
 * 어려워, 진단에서는 이 값을 본다.
 *
 * 서버는 효율 숫자만 주고 어디부터 주의·경고인지는 화면이 정한다 — 기준을 응답에 실으면
 * 화면과 서버에 같은 값이 두 벌 서게 되고, 기준을 바꿀 때 한쪽만 바뀐다.
 */

/** 이 아래는 주의 (%) */
export const DIAG_EFFICIENCY_WARN = 85;

/** 이 아래는 경고 (%) */
export const DIAG_EFFICIENCY_CRITICAL = 50;

/** 정상으로 보는 구간 (SFR-013-03). 차트에 띠로 깔린다 */
export const NORMAL_BAND = { min: DIAG_EFFICIENCY_WARN, max: 105 };
