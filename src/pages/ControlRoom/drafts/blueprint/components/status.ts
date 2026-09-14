import type { BadgeTone } from '@/components/common/Badge';

/**
 * 상태 색을 CSS 변수로 옮기는 표.
 *
 * 도면에서도 상태색은 서비스가 정한 한 벌(`--ok`·`--caution`·…)을 그대로 쓴다 — 청사진이라고
 * 경고색을 파랗게 바꾸면 「급한 것」 이 읽히지 않는다. 값을 하드코딩하지 않으려고 변수 이름만
 * 짝지어 두고, 칠하는 자리에서는 이 변수를 `--seg` 같은 지역 프로퍼티에 실어 넘긴다.
 */
export const TONE_VAR: Record<BadgeTone, string> = {
  ok: 'var(--ok)',
  caution: 'var(--caution)',
  critical: 'var(--critical)',
  offline: 'var(--offline)',
  brand: 'var(--brand)',
  neutral: 'var(--text-muted)',
};
