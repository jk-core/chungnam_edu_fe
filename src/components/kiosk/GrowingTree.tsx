import { cn } from '@/utils/cn';
import styles from './Kiosk.module.scss';

interface GrowingTreeProps {
  /** 발전량 단계 0~4 */
  stage: 0 | 1 | 2 | 3 | 4;
  trees: number;
}

/** 잎 덩이 — 아래에서 위로 차례로 켜진다. */
const LEAVES = [
  { cx: 100, cy: 122, r: 34, level: 1 },
  { cx: 136, cy: 104, r: 29, level: 2 },
  { cx: 64, cy: 104, r: 29, level: 2 },
  { cx: 118, cy: 74, r: 28, level: 3 },
  { cx: 82, cy: 68, r: 25, level: 4 },
];

/**
 * 발전량에 따라 자라는 나무 (SFR-005-05).
 * 단계 변화는 애니메이션이 아니라 클래스로 표현한다 — rAF 없이도 값이 바뀌면 바로 반영된다.
 */
export function GrowingTree({ stage, trees }: GrowingTreeProps) {
  return (
    <svg
      className={styles.tree}
      viewBox="0 0 200 200"
      role="img"
      aria-label={`오늘 발전량은 나무 ${trees}그루를 심은 효과입니다. 성장 단계 ${stage} 단계 중 4 단계.`}
    >
      <path className={styles.tree__trunk} d="M92 190h16l-3-74h-10z" />
      <path className={styles.tree__trunk} d="M99 152l-24-16 3-6 23 14zM101 134l22-14 3 6-23 14z" />

      {LEAVES.map((leaf, index) => (
        <circle
          key={index}
          className={cn(
            styles.tree__leaf,
            styles[`tree__leaf--${(index % 3) + 1}`],
            { [styles['tree__leaf--dim']]: leaf.level > stage },
          )}
          cx={leaf.cx}
          cy={leaf.cy}
          r={leaf.r}
        />
      ))}
    </svg>
  );
}
