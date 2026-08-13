import { cn } from '@/utils/cn';
import { TraceBorder } from './ai/TraceBorder';
import styles from './ScanFrame.module.scss';
import type { ReactNode } from 'react';

interface ScanFrameProps {
  /** 지금 AI 가 이 칸을 읽고 있는지 */
  active: boolean;
  /** 무엇을 하고 있는지 — 테두리 위에 붙는다 */
  label: string;
  children: ReactNode;
}

/**
 * AI 가 지금 읽고 있는 칸을 감싸는 틀 (SFR-005-02/07).
 *
 * 가운데 패널에서 게이지만 도는 것으로는 AI 가 **무엇을** 보고 있는지 알 수 없다.
 * 읽는 대상의 테두리를 빛이 한 바퀴 돌게 하면, 단계가 넘어갈 때마다 시선이 옮겨 가는 것이 보인다 —
 * 계측값을 읽을 때는 곡선 칸이, 원인을 따질 때는 계통도 칸이 돈다.
 *
 * 빛을 칸 **위** 가 아니라 **테두리** 로 돌리는 것이 요점이다. 판을 가로지르는 바로 훑으면 곡선과 글자
 * 위로 띠가 지나가 정작 읽어야 할 것을 가린다 — 하루 종일 걸어 두는 화면일수록 더 그렇다.
 *
 * 틀은 감싼 칸 위에 덧대는 장식이라 자리를 차지하지 않는다. 읽지 않는 동안에는 흔적도 남지 않는다.
 */
export function ScanFrame({ active, label, children }: ScanFrameProps) {
  return (
    <div className={cn(styles.frame, { [styles['frame--on']]: active })}>
      {children}

      {/* 테두리를 도는 빛 — 읽는 동안에만 얹힌다 */}
      <span className={styles.veil} aria-hidden="true">
        <TraceBorder radius={12} />
      </span>

      {/* 무엇을 읽는 중인지 말로도 남긴다 — 색과 움직임만으로는 뜻이 전해지지 않는다 (COR-003) */}
      <span className={styles.tag} role="status">{active ? label : ''}</span>
    </div>
  );
}
