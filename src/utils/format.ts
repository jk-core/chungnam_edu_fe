/** 천 단위 구분 기호를 넣어 숫자를 문자열로 만든다. */
export function formatNumber(value: number, fractionDigits = 0): string {
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/**
 * 발전량(kWh)을 읽기 좋은 단위로 바꾼다.
 * 1,000,000 이상은 GWh, 1,000 이상은 MWh, 그 미만은 kWh.
 */
export function formatEnergy(kwh: number): { value: string; unit: string } {
  if (kwh >= 1_000_000) return { value: formatNumber(kwh / 1_000_000, 2), unit: 'GWh' };
  if (kwh >= 1_000) return { value: formatNumber(kwh / 1_000, 1), unit: 'MWh' };

  return { value: formatNumber(kwh, 1), unit: 'kWh' };
}

/** 설비용량(kW)을 1,000kW 이상이면 MW로 바꾼다. */
export function formatCapacity(kw: number): { value: string; unit: string } {
  if (kw >= 1_000) return { value: formatNumber(kw / 1_000, 2), unit: 'MW' };

  return { value: formatNumber(kw, 1), unit: 'kW' };
}

/** CO₂ 저감량(kg)을 t 단위로 바꾼다. */
export function formatCarbon(kg: number): { value: string; unit: string } {
  if (kg >= 1_000) return { value: formatNumber(kg / 1_000, 1), unit: 't' };

  return { value: formatNumber(kg, 0), unit: 'kg' };
}

/** 금액(원)을 만원·억원으로 줄인다. 달력 칸처럼 좁은 곳에 쓴다. */
export function formatCurrency(won: number): { value: string; unit: string } {
  if (won >= 100_000_000) return { value: formatNumber(won / 100_000_000, 1), unit: '억원' };
  if (won >= 10_000) return { value: formatNumber(won / 10_000, 0), unit: '만원' };

  return { value: formatNumber(won, 0), unit: '원' };
}

/** 0.842 → "84.2%" */
export function formatPercent(ratio: number, fractionDigits = 1): string {
  return `${formatNumber(ratio * 100, fractionDigits)}%`;
}

/** 증감률에 부호를 붙인다. 0 이면 부호를 생략한다. */
export function formatDelta(ratio: number): string {
  const sign = ratio > 0 ? '+' : '';

  return `${sign}${formatNumber(ratio * 100, 1)}%`;
}

/** 분 단위 시간을 "2일 3시간" 같은 표기로 바꾼다. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}시간 ${minutes % 60}분`;

  const days = Math.floor(hours / 24);

  return `${days}일 ${hours % 24}시간`;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 2026-07-28 → "2026. 7. 28. (화)" */
export function formatDate(date: Date): string {
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. (${WEEKDAYS[date.getDay()]})`;
}

/** 14:05 형태 */
export function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** "3분 전", "2시간 전", "3일 전" */
export function formatRelative(from: Date, now: Date = new Date()): string {
  const diffMinutes = Math.floor((now.getTime() - from.getTime()) / 60_000);

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) return `${diffHours}시간 전`;

  return `${Math.floor(diffHours / 24)}일 전`;
}
