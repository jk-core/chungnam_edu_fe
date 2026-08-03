/**
 * 교육용 환산 (SFR-005-03).
 * 계수는 한국전력·산림청이 공개한 대표값을 목업 수준으로 단순화한 것이다.
 */

/** 전력 1kWh 당 CO₂ 배출 계수(kg) */
export const CO2_PER_KWH = 0.4594;

/** 소나무 한 그루가 1년에 흡수하는 CO₂(kg) */
export const CO2_PER_TREE_YEAR = 6.6;

/** 4인 가구 한 달 평균 전력 사용량(kWh) */
const HOUSEHOLD_MONTH_KWH = 350;

/** 발전량으로 줄인 CO₂(kg) */
export const kwhToCarbon = (kwh: number) => kwh * CO2_PER_KWH;

/** 소나무 몇 그루를 심은 효과인지 */
export const kwhToTrees = (kwh: number) => Math.round(kwhToCarbon(kwh) / CO2_PER_TREE_YEAR);

/** 4인 가구 몇 달치 전기인지 */
export const kwhToHouseholdMonths = (kwh: number) => Math.round(kwh / HOUSEHOLD_MONTH_KWH);

/** 4인 가구 몇 집이 하루를 쓸 수 있는지 */
export const kwhToHouseholdDays = (kwh: number) => Math.round(kwh / (HOUSEHOLD_MONTH_KWH / 30));

/** 발전량을 성장 단계 0~4 로 접는다. 나무 그림의 단계에 쓴다. */
export function growthStage(ratio: number): 0 | 1 | 2 | 3 | 4 {
  if (ratio >= 0.9) return 4;
  if (ratio >= 0.68) return 3;
  if (ratio >= 0.44) return 2;
  if (ratio >= 0.18) return 1;

  return 0;
}
