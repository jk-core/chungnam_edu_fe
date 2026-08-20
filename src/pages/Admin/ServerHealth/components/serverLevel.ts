import type { BadgeTone } from '@/components/common/Badge';
import type { ResourceLevel } from '@/interface/serverHealth';

/** 자원 등급을 부르는 말과 색 — 서버 카드와 이력 표가 같은 이름으로 불러야 한다 */
export const LEVEL_LABEL: Record<ResourceLevel, string> = {
  normal: '정상',
  warning: '주의',
  critical: '위험',
};

export const LEVEL_TONE: Record<ResourceLevel, BadgeTone> = {
  normal: 'ok',
  warning: 'caution',
  critical: 'critical',
};
