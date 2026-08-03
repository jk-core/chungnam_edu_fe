import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from './RankingStrip.module.scss';

/** 한 줄이 차지하는 높이(px). 간격까지 포함한 값으로, scss 와 짝을 맞춘다. */
const ROW_HEIGHT = 41;

/** 자리가 아무리 좁아도 이만큼은 보여 준다. */
const MIN_ROWS = 3;

interface RankingStripProps {
  /** 순위 대상 — 필터와 무관하게 전체 발전소를 받는다 */
  schools: School[];
  selectedId: string | null;
  onSelect: (school: School) => void;
}

/**
 * 학교별 발전 실적 순위 (SFR-004-09).
 * 1위 대비 비율을 막대로 그려 차이를 바로 읽히게 한다.
 * 스크롤을 만들지 않고, 칸에 들어가는 만큼만 잘라 보여 준다.
 */
export function RankingStrip({ schools, selectedId, onSelect }: RankingStripProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const [capacity, setCapacity] = useState(MIN_ROWS);

  // 목록 높이는 패널이 정하고 내용에 영향받지 않으므로(height:100% + overflow:hidden)
  // 관찰해도 되먹임이 생기지 않는다.
  // entry.contentRect 은 레이아웃이 잡히기 전 값이 실려 올 수 있어 실측값을 다시 읽는다.
  useEffect(() => {
    const node = listRef.current;

    if (!node) return;

    const apply = () => {
      const height = node.clientHeight;

      if (height > 0) setCapacity(Math.max(MIN_ROWS, Math.floor(height / ROW_HEIGHT)));
    };

    apply();

    const observer = new ResizeObserver(apply);

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const ordered = [...schools].sort((a, b) => b.todayKwh - a.todayKwh);
  const best = ordered[0]?.todayKwh ?? 1;
  const ranked = ordered.slice(0, capacity);

  return (
    <ol className={styles.rank} ref={listRef}>
      {ranked.map((school, index) => (
        <li key={school.id}>
          <button
            type="button"
            className={styles.rank__row}
            onClick={() => onSelect(school)}
            aria-pressed={selectedId === school.id}
          >
            <span className={styles.rank__order}>{index + 1}</span>
            <span className={styles.rank__body}>
              <span className={styles.rank__name}>{school.name}</span>
              <span className={styles.rank__track}>
                <span
                  className={styles.rank__bar}
                  style={{ width: `${Math.max(4, (school.todayKwh / Math.max(best, 1)) * 100)}%` }}
                />
              </span>
            </span>
            <span className={styles.rank__value}>{formatNumber(school.todayKwh)}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
