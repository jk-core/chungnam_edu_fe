/** SIF-001-06. `full` 은 상한 없음이라 클래스가 없다 */
export type FieldWidth = 'xs' | 'sm' | 'md' | 'lg' | 'full';

/** 칸 안에는 단위를 적을 자리가 없어 도움말 줄에 실어 보낸다 */
export function withUnit(hint: string | undefined, unit: string | undefined) {
  if (!unit) return hint;

  return hint ? `${hint} · 단위 ${unit}` : `단위 ${unit}`;
}
