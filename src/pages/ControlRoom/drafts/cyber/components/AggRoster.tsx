import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from '@/components/common/Icon';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { formatCapacity, formatEnergy, formatNumber } from '@/utils/format';
import { useAutoPager } from '@/hooks/useAutoPager';
import { REGION_CI_COLOR } from '@/assets/geo/chungnamRegions';
import { aggregate, AXIS_OPTIONS } from '@/pages/ControlRoom/utils/aggregate';
import type { School } from '@/interface/energy';
import type { BadgeTone } from '@/components/common/Badge';
import type { Axis } from '@/pages/ControlRoom/utils/aggregate';
import { CyberPanel } from './CyberPanel';
import styles from './AggRoster.module.scss';
import type { CSSProperties } from 'react';

/*
  한 쪽에 세우는 줄 수.

  고객 요구로 셋만 둔다 (「3개씩 보여주고 각 박스의 크기를 좀 늘려서 공간을」). 넷을 욱여넣어
  값이 서로 붙던 것을, 카드마다 세 계측값을 라벨과 함께 제 칸에 앉히도록 키운다.
*/
const PER_PAGE = 3;

/** 한 쪽이 머무는 시간 — 카드를 읽어 내려갈 만큼은 준다 */
const PAGE_MS = 7000;

/**
 * 가장 낮은 줄이 남기는 길이 — 0 부터 그리면 넉 줄이 모두 차서 순서가 막대로 보이지 않는다.
 */
const FLOOR = 0.2;

/** 금일 발전시간(h) = 금일 발전량 ÷ 설비용량 */
function hoursOf(row: { todayKwh: number; capacityKw: number }): number {
  return row.capacityKw > 0 ? row.todayKwh / row.capacityKw : 0;
}

/**
 * 발전 현황 집계 (SFR-004-03 / SFR-004-09).
 *
 * 담는 것은 시안 A 의 `AggregationPanel` 과 같다 — 축(지역/학교급/기관) 전환, 순위·구분·
 * 설비용량·현재 출력·금일 발전량·발전시간, 합계 줄, 페이지 넘김. 줄 세우는 기준은 발전시간이다.
 *
 * A 는 여섯 칸짜리 가로 표였지만 이 판은 300px 폭이라 그대로 두면 줄이 접힌다. 한 줄을 카드로
 * 눕혀 순위·구분을 위에, 발전시간 막대를 가운데, 설비·출력·발전량 세 계측값을 아래 한 줄에
 * 세운다 — 좁은 폭에서도 값이 접히지 않고, 발전시간 막대가 그대로 순위 눈금이 된다.
 */
export function AggRoster({ plants }: { plants: School[] }) {
  const [axis, setAxis] = useState<Axis>('region');

  return (
    <CyberPanel
      title="발전 현황 집계"
      note={(
        <SegmentedControl
          label="집계 기준"
          size="sm"
          options={AXIS_OPTIONS}
          value={axis}
          onChange={setAxis}
        />
      )}
    >
      {/* 축을 바꾸면 표를 처음 쪽부터 다시 읽는다 — key 로 새로 세워 페이지와 진행 막대를 되감는다 */}
      <AggTable key={axis} schools={plants} axis={axis} />
    </CyberPanel>
  );
}

function AggTable({ schools, axis }: { schools: School[]; axis: Axis }) {
  const rows = aggregate(schools, axis).sort((a, b) => hoursOf(b) - hoursOf(a));
  const best = hoursOf(rows[0] ?? { todayKwh: 0, capacityKw: 1 });
  const worst = hoursOf(rows[rows.length - 1] ?? { todayKwh: 0, capacityKw: 1 });
  const spread = Math.max(best - worst, 0.01);

  const totals = rows.reduce(
    (sum, row) => ({
      capacityKw: sum.capacityKw + row.capacityKw,
      outputKw: sum.outputKw + row.outputKw,
      todayKwh: sum.todayKwh + row.todayKwh,
    }),
    { capacityKw: 0, outputKw: 0, todayKwh: 0 },
  );

  const { from, to, page, pageCount, paused, togglePause, next, prev } = useAutoPager({
    total: rows.length,
    intervalMs: PAGE_MS,
    perPage: PER_PAGE,
  });

  const visible = rows.slice(from, to);
  const totalCap = formatCapacity(totals.capacityKw);
  const totalOut = formatCapacity(totals.outputKw);
  const totalGen = formatEnergy(totals.todayKwh);

  return (
    <div className={styles.agg}>
      <ol className={styles.agg__list}>
        {visible.map((row, index) => {
          const rank = from + index + 1;
          const ratio = FLOOR + (1 - FLOOR) * ((hoursOf(row) - worst) / spread);
          const cap = formatCapacity(row.capacityKw);
          const out = formatCapacity(row.outputKw);
          const gen = formatEnergy(row.todayKwh);
          const tone: BadgeTone | null = row.school
            ? OPERATION_TONE[row.school.status]
            : row.abnormal > 0 ? 'critical' : null;
          const tag = row.school
            ? OPERATION_LABEL[row.school.status]
            : row.abnormal > 0 ? `이상 ${formatNumber(row.abnormal)}` : null;

          return (
            <li key={row.key} className={styles.card} data-rank={rank <= 3 ? rank : undefined}>
              <p className={styles.card__top}>
                <span className={styles.card__rank}>{rank}</span>
                <span className={styles.card__name}>{row.name}</span>
                {tag ? <span className={styles.card__tag} data-tone={tone ?? undefined}>{tag}</span> : null}
              </p>

              {/* 발전시간 — 줄 세우는 기준이라 카드에서 가장 큰 수치로 세운다 */}
              <p className={styles.card__metric}>
                <span className={styles.card__metricLabel}>
                  발전시간{row.count > 1 ? ` · ${formatNumber(row.count)}개소` : ''}
                </span>
                <span className={styles.card__hours}>
                  {formatNumber(hoursOf(row), 1)}<span className={styles.card__unit}>h</span>
                </span>
              </p>

              <span className={styles.card__track}>
                <span
                  className={styles.card__fill}
                  style={{
                    width: `${ratio * 100}%`,
                    ...(axis === 'region' ? { '--row': REGION_CI_COLOR[row.name] } : {}),
                  } as CSSProperties}
                />
              </span>

              {/* 세 계측값을 라벨과 값으로 갈라 줄줄이 앉힌다 — 넓어진 카드가 값을 서로 떼어 놓는다 */}
              <dl className={styles.card__figures}>
                <div>
                  <dt>설비용량</dt>
                  <dd>{cap.value}<span>{cap.unit}</span></dd>
                </div>
                <div>
                  <dt>현재 출력</dt>
                  <dd>{out.value}<span>{out.unit}</span></dd>
                </div>
                <div>
                  <dt>금일 발전량</dt>
                  <dd>{gen.value}<span>{gen.unit}</span></dd>
                </div>
              </dl>
            </li>
          );
        })}

        {/* 모자라는 줄은 빈 카드로 채운다 — 마지막 쪽에서도 표가 차지하는 높이가 같아야 한다 */}
        {Array.from({ length: Math.max(0, PER_PAGE - visible.length) }, (_, index) => (
          <li key={`filler-${index}`} className={styles.card} data-filler="" aria-hidden="true" />
        ))}
      </ol>

      <div className={styles.agg__foot}>
        <p className={styles.agg__totals}>
          <span className={styles.agg__totalLabel}>총계</span>
          <span>설비 <strong>{totalCap.value}{totalCap.unit}</strong></span>
          <span>출력 <strong>{totalOut.value}{totalOut.unit}</strong></span>
          <span>발전 <strong>{totalGen.value}{totalGen.unit}</strong></span>
        </p>

        {pageCount > 1 ? (
          <div className={styles.pager}>
            <button type="button" className={styles.pager__btn} aria-label="이전 쪽" onClick={prev}>
              <ChevronLeftIcon width={13} height={13} />
            </button>
            <button
              type="button"
              className={styles.pager__btn}
              aria-pressed={paused}
              aria-label={paused ? '자동 넘김 재생' : '자동 넘김 정지'}
              onClick={togglePause}
            >
              {paused ? <PlayIcon width={12} height={12} /> : <PauseIcon width={12} height={12} />}
            </button>
            <span className={styles.pager__count}>{page + 1} / {pageCount}</span>
            <button type="button" className={styles.pager__btn} aria-label="다음 쪽" onClick={next}>
              <ChevronRightIcon width={13} height={13} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
