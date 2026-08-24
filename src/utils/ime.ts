/** SIF-001-05 */
export type ImeMode = 'hangul' | 'latin' | 'numeric';

export function imeProps(ime: ImeMode | undefined) {
  if (ime === 'hangul') return { lang: 'ko', autoCapitalize: 'off' as const };
  if (ime === 'latin') return { lang: 'en', inputMode: 'text' as const, autoCapitalize: 'off' as const };
  if (ime === 'numeric') return { inputMode: 'numeric' as const };

  return {};
}
