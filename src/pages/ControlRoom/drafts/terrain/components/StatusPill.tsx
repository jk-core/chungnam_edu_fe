import type { BadgeTone } from '@/components/common/Badge';
import styles from './StatusPill.module.scss';
import type { ReactNode } from 'react';

/**
 * 상태 알약 — 이 시안 전용.
 *
 * 공용 `Badge` 는 글자를 label-sm(약 11px)로 세워, 보는 사람의 연령을 배려한 이 시안의 글자
 * 크기 제약을 어긴다. 뜻과 색은 그대로 두고 크기만 label-md 이상으로 올린 판을 따로 둔다.
 */
export function StatusPill({ tone, withDot, children }: {
  tone: BadgeTone;
  withDot?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`${styles.pill} ${styles[`pill--${tone}`]}`}>
      {withDot ? <span className={styles.pill__dot} aria-hidden /> : null}
      {children}
    </span>
  );
}
