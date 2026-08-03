/** 마지막 글자에 종성(받침)이 있는지. 한글이 아니면 없는 것으로 본다. */
function finalConsonantOf(word: string): number | null {
  const last = word.trim().at(-1);

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
export function withParticle(word: string, particle: Particle): string {
  const final = finalConsonantOf(word);
  const [withFinal, withoutFinal] = PAIR[particle];
  const useWithFinal = final !== null && final !== 0 && !(particle === '로' && final === 8);

  return `${word}${useWithFinal ? withFinal : withoutFinal}`;
}
