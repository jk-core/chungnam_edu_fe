import { ExpandIcon } from '@/components/common/Icon';
import styles from './ExpandButton.module.scss';

/**
 * 「크게 보기」 손잡이 — 작은 자리에 선 판을 큰 자리로 올린다.
 *
 * 지도와 집계표가 큰 자리를 맞바꾸는 손잡이다(고객 요청 2026-09-14). 벽에 걸어 두는 화면이라
 * 작은 아이콘 하나로 두지 않고 브랜드색 알약으로 크게 세운다 — 「누르면 이 판이 큰 자리로 온다」
 * 가 멀리서도 읽혀야 한다. 지도·집계표가 같은 생김새를 나눠 쓰도록 한 곳에 둔다.
 */
export function ExpandButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.expand} onClick={onClick}>
      <ExpandIcon width={18} height={18} aria-hidden />
      {label}
    </button>
  );
}
