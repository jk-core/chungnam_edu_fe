/**
 * 목업 전용 결정적 난수기(mulberry32).
 * 같은 seed면 항상 같은 수열이 나오므로 리렌더마다 수치가 흔들리지 않는다.
 */
export function createRandom(seed: number) {
  let state = seed >>> 0;

  return function next(): number {
    state += 0x6d2b79f5;
    let t = state;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** min~max 사이 값을 소수점 자리수만큼 반올림해 돌려준다. */
export function pickNumber(next: () => number, min: number, max: number, digits = 0): number {
  const value = min + next() * (max - min);
  const factor = 10 ** digits;

  return Math.round(value * factor) / factor;
}

export function pickOne<T>(next: () => number, items: readonly T[]): T {
  return items[Math.floor(next() * items.length) % items.length];
}

/** 문자열 키에서 안정적인 시드를 뽑는다. 발전소 id 처럼 문자열로 구분되는 데이터에 쓴다. */
export function hashSeed(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
