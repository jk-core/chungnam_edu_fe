/*
  컨트롤이 공통으로 아는 것.

  라벨·필수·힌트·오류는 여기 없다 — 그것은 `FormField` 의 몫이고, 컨트롤은 상자 하나만 그린다.
*/

/** 입력 성격에 맞는 자판 힌트 (SIF-001-05) */
export type ImeMode = 'hangul' | 'latin' | 'numeric';

/** 담기는 데이터 길이에 맞춘 입력창 크기 (SIF-001-06). `full` 은 상한 없음이라 클래스가 없다 */
export type FieldWidth = 'xs' | 'sm' | 'md' | 'lg' | 'full';

/** 자판 힌트를 실제 속성으로 옮긴다. */
export function imeProps(ime: ImeMode | undefined) {
  if (ime === 'hangul') return { lang: 'ko', autoCapitalize: 'off' as const };
  if (ime === 'latin') return { lang: 'en', inputMode: 'text' as const, autoCapitalize: 'off' as const };
  if (ime === 'numeric') return { inputMode: 'numeric' as const };

  return {};
}
