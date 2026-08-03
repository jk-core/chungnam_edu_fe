import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** 등장 지연(초). 리스트에서는 index * 0.06 형태로 넘긴다. */
  delay?: number;
  /** 시작 위치 오프셋(px) */
  offset?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}

/**
 * 뷰포트에 들어올 때 한 번만 위로 떠오르며 나타난다.
 * 감소 모션 설정은 Provider 의 MotionConfig 가 일괄 처리한다.
 */
export function Reveal({ children, delay = 0, offset = 16, className, as = 'div' }: RevealProps) {
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-64px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 0.68, 0.32, 1] }}
    >
      {children}
    </Component>
  );
}
