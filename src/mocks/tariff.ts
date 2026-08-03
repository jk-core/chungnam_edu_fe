/**
 * 발전 단가 (SFR-007-02 예상 수익금).
 * 실제로는 월별 SMP 와 REC 가중치가 계속 바뀌지만, 목업에서는 대표값을 고정해 둔다.
 */
export const SMP_PER_KWH = 140;
export const REC_PER_KWH = 80;
export const REVENUE_PER_KWH = SMP_PER_KWH + REC_PER_KWH;

export const TARIFF_NOTE = `SMP ${SMP_PER_KWH}원 + REC ${REC_PER_KWH}원 = ${REVENUE_PER_KWH}원/kWh 기준`;

/** 발전량(kWh) → 예상 수익금(원) */
export const estimateRevenue = (kwh: number) => Math.round(kwh * REVENUE_PER_KWH);
