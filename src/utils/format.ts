/** 천 단위 구분 기호를 넣어 숫자를 문자열로 만든다. */
export function formatNumber(value: number, fractionDigits = 0): string {
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/** 값과 그 값에 붙는 단위. 숫자와 단위를 다른 크기로 그리는 곳이 많아 따로 돌려준다. */
export interface ScaledValue {
  value: string;
  unit: string;
}

/** 문자열로 굳히기 전의 값 — 숫자를 굴려 올리는 CountUp 이 이 형태를 쓴다. */
export interface SiScale {
  amount: number;
  unit: string;
  fractionDigits: number;
}

/**
 * 킬로 단위로 들어온 값을 자릿수에 맞춰 M·G 로 끌어올린다.
 *
 * 이 시스템의 수치는 전부 kW·kWh 로 들어오는데, 도 전체를 더하면 자릿수가 커져
 * 화면마다 제각각 1,000 으로 나누게 된다. 그 계산을 한 곳으로 모아,
 * 어느 화면에서 보든 같은 값이 같은 단위로 보이게 한다.
 *
 * 소수 자릿수는 단위가 올라갈수록 늘린다 — 7,294kW 에서 반올림한 "7MW" 는
 * 정보가 너무 깎이고, "7.29MW" 는 원래 값의 크기를 그대로 전한다.
 */
export function scaleSi(kilo: number, suffix: 'W' | 'Wh', fractionDigits?: number): SiScale {
  const abs = Math.abs(kilo);

  if (abs >= 1_000_000) {
    return { amount: kilo / 1_000_000, unit: `G${suffix}`, fractionDigits: fractionDigits ?? 2 };
  }

  if (abs >= 1_000) {
    return { amount: kilo / 1_000, unit: `M${suffix}`, fractionDigits: fractionDigits ?? 2 };
  }

  return { amount: kilo, unit: `k${suffix}`, fractionDigits: fractionDigits ?? 1 };
}

/** 위 계산을 바로 쓸 수 있는 문자열로 바꾼 것. 숫자를 굴리지 않는 곳에서 쓴다. */
export function formatSi(kilo: number, suffix: 'W' | 'Wh', fractionDigits?: number): ScaledValue {
  const scaled = scaleSi(kilo, suffix, fractionDigits);

  return { value: formatNumber(scaled.amount, scaled.fractionDigits), unit: scaled.unit };
}

/** 발전량(kWh)을 읽기 좋은 단위로 바꾼다. */
export function formatEnergy(kwh: number): ScaledValue {
  return formatSi(kwh, 'Wh', kwh >= 1_000 && kwh < 1_000_000 ? 1 : undefined);
}

/** 설비용량·출력(kW)을 읽기 좋은 단위로 바꾼다. */
export function formatCapacity(kw: number): ScaledValue {
  return formatSi(kw, 'W');
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

/**
 * 전화번호에 하이픈을 넣는다. 적는 중에도 자리에 맞춰 끊어 준다.
 * 지역번호는 02 만 두 자리이고, 국번은 남은 자릿수가 여덟을 넘을 때만 네 자리가 된다.
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  const head = digits.startsWith('02') ? 2 : 3;
  const middle = digits.length - head > 7 ? 4 : 3;

  if (digits.length <= head) return digits;
  if (digits.length <= head + middle) return `${digits.slice(0, head)}-${digits.slice(head)}`;

  return `${digits.slice(0, head)}-${digits.slice(head, head + middle)}-${digits.slice(head + middle)}`;
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

/**
 * 소수 시간(5.5)을 시계 표기(05:30)로 바꾼다.
 *
 * 일출·일몰처럼 정각이 아닌 시각을 「5.5시」 로 적으면 시각이 아니라 소요 시간처럼 읽힌다.
 */
export function clockOf(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
