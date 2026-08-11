/**
 * 전기요금 절감 단가 (SFR-007-02).
 *
 * 관내 학교 설비는 모두 자가용이다 — 만든 전기를 팔지 않고 학교가 그대로 쓴다.
 * 그래서 SMP·REC 같은 판매 단가가 아니라, 그만큼 덜 낸 전기요금이 이득이다.
 * 실제 단가는 계약종별·계절·시간대로 갈리지만 목업에서는 교육용(을) 대표값을 고정해 둔다.
 */
export const ELECTRICITY_PER_KWH = 128;

export const TARIFF_NOTE = `교육용(을) 전력 ${ELECTRICITY_PER_KWH}원/kWh 기준 · 자가소비 절감액`;

/** 발전량(kWh) → 전기요금 절감액(원) */
export const estimateSaving = (kwh: number) => Math.round(kwh * ELECTRICITY_PER_KWH);
