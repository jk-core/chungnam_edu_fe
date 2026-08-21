import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from '@/components/common/Icon';
import styles from './MaskedText.module.scss';

interface MaskedTextProps {
  /** 가려진 표기 */
  masked: string;
  /** 원문 — 권한이 없으면 넘기지 말 것. 넘기면 눌러서 볼 수 있다. */
  original?: string;
  /** 스크린리더용 항목 이름 (예: "계약자 연락처") */
  label: string;
}

/**
 * 개인정보 모자이크 표시.
 * 권한 판단은 호출부가 한다 — original 을 넘긴 경우에만 잠깐 볼 수 있는 토글이 붙는다.
 */
export function MaskedText({ masked, original, label }: MaskedTextProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const canReveal = original !== undefined && original !== masked;

  return (
    <span className={styles.masked}>
      <span aria-label={`${label} (일부 가림)`}>{isRevealed && canReveal ? original : masked}</span>
      {canReveal ? (
        <button
          type="button"
          className={styles.masked__toggle}
          aria-label={isRevealed ? `${label} 다시 가리기` : `${label} 원문 보기`}
          aria-pressed={isRevealed}
          onClick={(event) => {
            // 누르는 줄 자체가 다른 곳으로 들어가는 자리일 수 있다 — 가림만 풀고 거기서 멈춘다.
            event.stopPropagation();
            setIsRevealed((prev) => !prev);
          }}
        >
          {isRevealed ? <EyeOffIcon width={15} height={15} /> : <EyeIcon width={15} height={15} />}
        </button>
      ) : null}
    </span>
  );
}
