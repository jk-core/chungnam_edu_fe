import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from '@/components/common/Icon';
import { formatNumber } from '@/utils/format';
import { cn } from '@/utils/cn';
import styles from './PagerBar.module.scss';
import type { CSSProperties } from 'react';

interface PagerBarProps {
  page: number;
  pageCount: number;
  /** 쪽이 넘어갈 때마다 바뀌는 값 — 진행 막대를 되감는다 */
  turnKey: number;
  /** 한 쪽이 머무는 시간(ms) */
  intervalMs: number;
  /** 전체 항목 수 */
  total: number;
  /**
   * 손으로 넘길 수 있게 할 때만 넘긴다.
   * 주지 않으면 지금 어디를 보고 있는지만 알리는 표시로 남는다.
   */
  controls?: {
    paused: boolean;
    onTogglePause: () => void;
    onGo: (page: number) => void;
    onPrev: () => void;
    onNext: () => void;
  };
}

/**
 * 자동으로 넘어가는 목록의 쪽 표시와 조회 이동 (SFR-004).
 * 스크롤바가 없는 화면이라 "지금 어디를 보고 있고 얼마나 더 있는지" 를 여기서만 알 수 있다.
 * 눈에 걸린 쪽을 붙잡아 두고 볼 수 있도록 멈춤과 앞뒤 이동을 함께 둔다.
 */
export function PagerBar({ page, pageCount, turnKey, intervalMs, total, controls }: PagerBarProps) {
  if (pageCount <= 1) {
    return (
      <p className={styles.pager}>
        <span className={styles.pager__count}>전체 {formatNumber(total)}건</span>
      </p>
    );
  }

  const dots = Array.from({ length: pageCount }, (_, index) => {
    const isActive = index === page;
    // 활성 칸은 넘어갈 때마다 다시 만들어야 막대가 처음부터 차오른다
    const key = isActive ? `active-${turnKey}` : `idle-${index}`;
    const className = cn(styles.pager__dot, {
      [styles['pager__dot--active']]: isActive,
      [styles['pager__dot--held']]: isActive && controls?.paused,
    });
    const style = isActive ? ({ '--rotation-ms': `${intervalMs}ms` } as CSSProperties) : undefined;

    if (!controls) return <span key={key} className={className} style={style} />;

    return (
      <button
        key={key}
        type="button"
        className={className}
        style={style}
        onClick={() => controls.onGo(index)}
        aria-label={`${index + 1}페이지 보기`}
        aria-current={isActive ? 'true' : undefined}
      />
    );
  });

  return (
    <p className={styles.pager}>
      <span className={styles.pager__count}>
        전체 {formatNumber(total)}건 · {page + 1} / {pageCount}
      </span>

      <span className={styles.pager__nav}>
        <span className={styles.pager__dots} aria-hidden={controls ? undefined : 'true'}>
          {dots}
        </span>

        {controls ? (
          <span className={styles.pager__buttons}>
            <button
              type="button"
              className={styles.pager__button}
              onClick={controls.onPrev}
              aria-label="이전 페이지"
            >
              <ChevronLeftIcon width={16} height={16} />
            </button>
            <button
              type="button"
              className={cn(styles.pager__button, { [styles['pager__button--on']]: controls.paused })}
              onClick={controls.onTogglePause}
              aria-pressed={controls.paused}
              aria-label={controls.paused ? '자동 전환 재생' : '자동 전환 정지'}
            >
              {controls.paused ? <PlayIcon width={16} height={16} /> : <PauseIcon width={16} height={16} />}
            </button>
            <button
              type="button"
              className={styles.pager__button}
              onClick={controls.onNext}
              aria-label="다음 페이지"
            >
              <ChevronRightIcon width={16} height={16} />
            </button>
          </span>
        ) : null}
      </span>
    </p>
  );
}
