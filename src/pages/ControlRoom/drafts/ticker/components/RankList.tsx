import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { AXIS_OPTIONS } from '@/pages/ControlRoom/utils/aggregate';
import { formatNumber } from '@/utils/format';
import { cn } from '@/utils/cn';
import { AXIS_NOUN } from '../useTickerBoard';
import styles from './RankList.module.scss';
import type { TickerBoard } from '../useTickerBoard';

/**
 * 가장 낮은 줄에도 남기는 막대 길이.
 * 발전시간은 같은 하늘 아래 잰 값이라 대상끼리 크게 벌어지지 않는다 — 0부터 그리면 모든 줄이
 * 끝까지 차서 순위가 막대로 보이지 않는다. RegionOutput 과 같은 이유로 바닥을 띄운다.
 */
const FLOOR = 0.16;

/** 오름/내림과 그 표기. 국내 증시 관례대로 오른 쪽(도 평균 위)이 ▲, 내린 쪽이 ▼. */
function deltaOf(delta: number): { tone: 'rise' | 'fall' | 'flat'; text: string } {
  if (Math.abs(delta) < 0.05) return { tone: 'flat', text: '±0.0' };

  return {
    tone: delta > 0 ? 'rise' : 'fall',
    text: `${delta > 0 ? '▲' : '▼'} ${formatNumber(Math.abs(delta), 1)}`,
  };
}

/**
 * 발전 순위 (왼쪽).
 *
 * 증권 앱의 종목 리스트처럼 고른 축의 대상들이 발전시간순으로 선다. 대상이 많은 축(학교별은
 * 300개소가 넘는다)은 자동 순회만으로는 원하는 곳에 닿을 수 없어, 목록을 스크롤로 직접 훑을
 * 수 있게 둔다 — 자동 순회는 없애지 않고 함께 둔다(2026-09-14 고객 피드백). 순회로 대상이
 * 바뀌면 그 줄이 보이는 자리로 따라 스크롤되고, 사람이 손대면 잠시 멈췄다가 손을 뗀 뒤 다시 돈다.
 *
 * 한 줄에는 이름·발전시간·도 평균 대비·막대 넷만 둔다. 그리기만 하는 판이라 값은 상위에서
 * 받은 board 하나로만 그린다.
 */
export function RankList({ board }: { board: TickerBoard }) {
  const { axis, setAxis, rows, selected, selectKey, holdTour, isPlaying, togglePlay } = board;
  const reduceMotion = useReducedMotion();

  const best = rows[0]?.hours ?? 1;
  const worst = rows[rows.length - 1]?.hours ?? 0;
  const spread = Math.max(best - worst, 0.01);

  // 순회로 대상이 바뀌면 그 줄을 보이는 자리로 끌어 온다. 이 스크롤은 프로그램이 거는 것이라
  // 사람의 손길(onWheel·onPointerDown)로는 잡지 않는다 — 그러지 않으면 따라 스크롤이 곧바로
  // 순회를 멈춰 세운다.
  const selectedRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selected?.key]);

  return (
    <section className={styles.panel} aria-label="발전 순위">
      <div className={styles.panel__head}>
        <h2>발전 순위</h2>
        <button
          type="button"
          className={styles.panel__toggle}
          aria-pressed={isPlaying}
          onClick={togglePlay}
        >
          {isPlaying ? '자동 전환 중' : '전환 멈춤'}
        </button>
      </div>

      <div className={styles.picker}>
        <SegmentedControl
          label="집계 기준"
          size="md"
          options={AXIS_OPTIONS}
          value={axis}
          onChange={setAxis}
        />
      </div>

      <p className={styles.sub}>{`발전시간이 높은 ${AXIS_NOUN[axis]}부터 · ${formatNumber(rows.length)}개`}</p>

      {/* 손으로 훑는 동안(휠·스크롤바 끌기·터치) 순회를 붙잡는다 */}
      <ol className={styles.list} onWheel={holdTour} onPointerDown={holdTour}>
        {rows.map((row, index) => {
          const ratio = FLOOR + (1 - FLOOR) * ((row.hours - worst) / spread);
          const isActive = row.key === selected?.key;
          const delta = deltaOf(row.deltaHours);

          return (
            <li
              key={row.key}
              ref={isActive ? selectedRef : undefined}
              className={cn(styles.row, { [styles['row--active']]: isActive })}
            >
              <button type="button" className={styles.row__button} onClick={() => selectKey(row.key)}>
                {/* 고른 줄 표시가 줄에서 줄로 미끄러져 옮겨 간다 — 자동 전환으로 대상이 바뀔 때 눈이 따라간다.
                    감소 모션이면 이 조각을 렌더하지 않고, 아래 CSS 의 `row--active` 배경만 즉시 켜진다. */}
                {isActive && !reduceMotion ? (
                  <motion.span
                    layoutId="ticker-active-row"
                    className={styles.row__marker}
                    transition={{ duration: 0.3, ease: [0.22, 0.68, 0.32, 1] }}
                  />
                ) : null}
                <span className={styles.row__rank}>{index + 1}</span>
                <span className={styles.row__name}>{row.name}</span>
                <span className={styles.row__value}>
                  {formatNumber(row.hours, 1)}
                  <span className={styles.row__unit}>h</span>
                </span>
                <span className={cn(styles.row__delta, styles[`row__delta--${delta.tone}`])}>
                  {delta.text}
                </span>
                <span className={styles.row__track}>
                  <span className={styles.row__bar} style={{ width: `${ratio * 100}%` }} />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
