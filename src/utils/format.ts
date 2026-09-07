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
  /**
   * 숫자에 바로 붙는 우리말 자릿이름 — 「만」·「억」.
   *
   * 단위(`unit`)와 따로 두는 까닭은 붙는 자리가 다르기 때문이다. 값과 단위 사이는 한 칸을
   * 띄우는 것이 이 시스템의 규칙이지만(「51.0 kt」), 「만」 은 수사의 일부라 숫자에 붙어야
   * 한다 — 「773 만 그루」 가 아니라 「773만 그루」 다.
   */
  countSuffix?: string;
}

/**
 * 세는 수를 만·억으로 접는다 (2026-09-07 지시).
 *
 * 그루·년처럼 올릴 윗단위가 없는 것들이다. 「7,726,603그루」 는 자릿수를 세어야 크기가 잡히는데,
 * 걸어 두고 몇 걸음 떨어져서 보는 화면에서 그 셈을 할 사람은 없다 — 우리말이 원래 네 자리마다
 * 이름을 갈아 끼우므로 「773만 그루」 로 적으면 읽는 즉시 크기가 온다.
 *
 * 10만이 되기 전에는 그대로 둔다. 「2만 6천」 보다 「26,068」 이 빨리 읽히고, 만 단위로 접으면
 * 이 구간에서는 되레 정밀도만 잃는다.
 *
 * 만 자리에서 소수를 버리는 것은 「773.4만」 이 소수점과 만이 겹쳐 한 번 더 생각하게 만들기
 * 때문이다. 억은 값이 커 한 자리를 남긴다 — 「1억」 과 「1.4억」 은 4천만 차이다.
 *
 * 접은 이름은 `countSuffix` 로 따로 돌려준다 — 숫자에 붙는 것이라 단위와 자리가 다르다.
 */
export function scaleKoCount(amount: number, unit: string): SiScale {
  const size = Math.abs(amount);

  if (size >= 100_000_000) {
    return { amount: amount / 100_000_000, unit, fractionDigits: 1, countSuffix: '억' };
  }

  if (size >= 100_000) return { amount: amount / 10_000, unit, fractionDigits: 0, countSuffix: '만' };

  return { amount, unit, fractionDigits: 0 };
}

/**
 * 세는 단위를 자릿수에 맞춰 올린다 — 「9,514,693일」 은 아무도 읽지 않는다.
 *
 * 기준을 누적으로 옮기면서 필요해졌다. `scaleSi` 가 kW·kWh 에 하는 일을 날수·시간수에 한다.
 * 그림 판처럼 환산 레지스트리를 거치지 않고 직접 세는 자리도 이 함수를 지나야 화면마다
 * 같은 값이 다른 단위로 적히지 않는다.
 *
 * 햇수로 올리고도 여섯 자리가 남는 자리가 있어(도 전체 누적이면 「316,794년」) 만·억까지 잇는다.
 */
export function scaleCount(amount: number, unit: '일' | '시간'): SiScale {
  if (unit === '일' && amount >= 730) return scaleKoCount(amount / 365, '년');
  if (unit === '시간' && amount >= 8_760) return scaleKoCount(amount / 8_760, '년');

  return scaleKoCount(amount, unit);
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

/**
 * CO₂ 저감량(kg)을 자릿수에 맞춰 t · kt · Mt 으로 끌어올린다.
 *
 * t 에서 멈춰 두었더니 도 전체 누적에서 「50,995.6 t」 이 되어, 좁은 칸에서 숫자와 단위가
 * 두 줄로 접혔다 (2026-09-07 지시). 발전량을 kWh 에서 MWh·GWh 로 올리는 것과 같은 이치다 —
 * 자릿수가 넘치면 단위를 올리지 값을 늘어놓지 않는다.
 *
 * 소수 한 자리를 유지한다. 단위를 올릴수록 한 자리가 뜻하는 양이 커지지만, 이 화면들이
 * 답하는 것은 「몇 kg 인가」 가 아니라 「얼마나 큰가」 라 자릿수보다 크기가 먼저다.
 *
 * `scaleSi` 와 같은 형태로 돌려주어, 숫자를 굴려 올리는 곳이 같은 방식으로 쓸 수 있다.
 */
export function scaleCarbon(kg: number): SiScale {
  const size = Math.abs(kg);

  if (size >= 1_000_000_000) return { amount: kg / 1_000_000_000, unit: 'Mt', fractionDigits: 1 };
  if (size >= 1_000_000) return { amount: kg / 1_000_000, unit: 'kt', fractionDigits: 1 };
  if (size >= 1_000) return { amount: kg / 1_000, unit: 't', fractionDigits: 1 };

  return { amount: kg, unit: 'kg', fractionDigits: 0 };
}

/** CO₂ 저감량(kg)을 t 단위로 바꾼다. */
export function formatCarbon(kg: number): ScaledValue {
  const scaled = scaleCarbon(kg);

  return { value: formatNumber(scaled.amount, scaled.fractionDigits), unit: scaled.unit };
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

/**
 * 시간(h)을 「N시간 M분」 으로.
 *
 * 「4.0시간」 은 소수를 읽을 줄 알아야 뜻이 잡힌다 — 초등 화면에서는 0.4시간이 24분이라는 것을
 * 스스로 셈해야 하고, 그 셈이 이 나이의 몫이 아니다 (2026-09-07 지시). 시계로 읽히는 말로 바꾼다.
 *
 * 한 시간이 안 되면 시간 자리를 적지 않는다 — 「0시간 24분」 은 0 을 읽느라 한 박자 걸린다.
 */
export function formatHourMinute(hours: number): string {
  const total = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(total / 60);
  const m = total % 60;

  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;

  return `${h}시간 ${m}분`;
}

/** 숫자와 단위를 한 덩이로 쓰는 자리를 위한 문자열 판 — 「773만」 처럼 접은 이름이 숫자에 붙는다 */
export function formatKoCount(value: number): string {
  const scaled = scaleKoCount(value, '');

  return `${formatNumber(scaled.amount, scaled.fractionDigits)}${scaled.countSuffix ?? ''}`;
}
