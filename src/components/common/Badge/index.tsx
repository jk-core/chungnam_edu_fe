import { cn } from '@/utils/cn';
import type { Severity } from '@/interface/status';
import styles from './Badge.module.scss';
import type { ReactNode } from 'react';

export type BadgeTone = 'ok' | 'caution' | 'critical' | 'offline' | 'brand' | 'neutral';

interface BadgeProps {
  tone?: BadgeTone;
  /** 좌측 점 표시 여부 */
  withDot?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', withDot = false, children, className }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[`badge--${tone}`], { [className ?? '']: !!className })}>
      {withDot ? <span className={styles.badge__dot} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

// 설비 상태·알림 구분의 라벨·색은 mocks/status.ts 가 단일 출처로 갖는다.
// 여기 있는 것은 진단 고장코드 사전의 심각도뿐이다 — 축이 다르다.

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: '긴급',
  caution: '주의',
  info: '참고',
};

export const SEVERITY_TONE: Record<Severity, BadgeTone> = {
  critical: 'critical',
  caution: 'caution',
  info: 'brand',
};
