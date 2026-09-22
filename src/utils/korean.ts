/**
 * 마지막 글자에 종성(받침)이 있는지. 한글이 아니면 없는 것으로 본다.
 *
 * 빈 값도 받는다. 앞말이 데이터에서 오므로 `null` 이 섞여 들어오는데, 최하단인 이 함수가
 * 막는 비용은 한 줄이고 터지는 자리는 이 함수를 쓰는 문장 전부다 (2026-09-22).
 */
function finalConsonantOf(word: string | null | undefined): number | null {
  const last = word?.trim().at(-1);

  if (last === undefined) return null;

  const code = last.charCodeAt(0);

  if (code < 0xac00 || code > 0xd7a3) return null;

  return (code - 0xac00) % 28;
}

/** 종성 있는 짝 → 종성 없는 짝 */
const PAIR = {
  로: ['으로', '로'],
  을: ['을', '를'],
  이: ['이', '가'],
  은: ['은', '는'],
  와: ['과', '와'],
} as const;

export type Particle = keyof typeof PAIR;

/**
 * 앞말의 받침에 맞춰 조사를 골라 붙인다.
 * 설비명·고장명이 데이터에서 오므로 문장을 조립할 때 필요하다.
 * 'ㄹ' 받침은 '으로' 가 아니라 '로' 를 쓴다.
 */
export function withParticle(word: string | null | undefined, particle: Particle): string {
  const final = finalConsonantOf(word);
  const [withFinal, withoutFinal] = PAIR[particle];
  const useWithFinal = final !== null && final !== 0 && !(particle === '로' && final === 8);

  return `${word ?? ''}${useWithFinal ? withFinal : withoutFinal}`;
}

/**
 * 앞말에 붙을 조사만.
 *
 * 부르는 쪽이 `withParticle(name, '은').slice(name.length)` 로 잘라 쓰고 있었는데, 그 `name`
 * 이 비면 `.length` 를 읽는 자리에서 먼저 터진다 — 조사를 고르는 함수가 빈 값을 견디게 해도
 * 부르는 쪽이 같은 값을 한 번 더 만지면 막은 뜻이 없다. 자르는 셈을 여기로 들인다.
 */
export function particleFor(word: string | null | undefined, particle: Particle): string {
  return withParticle(word, particle).slice((word ?? '').length);
}
