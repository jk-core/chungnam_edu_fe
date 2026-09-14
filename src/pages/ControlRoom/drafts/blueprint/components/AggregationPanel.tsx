import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from '@/components/common/Icon';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { REGION_CI_COLOR } from '@/assets/geo/chungnamRegions';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import { useAutoPager } from '@/hooks/useAutoPager';
import type { School } from '@/interface/energy';
import { aggregate, AXIS_OPTIONS } from '@/pages/ControlRoom/utils/aggregate';
import type { Axis } from '@/pages/ControlRoom/utils/aggregate';
import { Panel } from './Panel';
import { TONE_VAR } from './status';
import styles from './AggregationPanel.module.scss';
import type { CSSProperties } from 'react';

/** 한 쪽이 머무는 시간 — 표를 읽어 내려갈 만큼은 준다 */
const PAGE_MS = 7000;

/** 한 쪽에 세우는 줄 수 — 축마다 줄 수가 달라도 표 높이가 같도록 못 박고 모자라면 빈 줄로 채운다 */
const PER_PAGE = 5;

/** 가장 낮은 줄이 남기는 막대 길이 — 0 부터 그리면 다 차서 순서가 안 보인다 */
const FLOOR = 0.18;

/** 금일 발전시간(h) = 금일 발전량 ÷ 설비용량 */
function hoursOf(row: { todayKwh: number; capacityKw: number }): number {
  return row.capacityKw > 0 ? row.todayKwh / row.capacityKw : 0;
}

/**
 * 발전 현황 집계 (SFR-004-03 / SFR-004-09) — 청사진 판.
 *
 * 줄 세우는 기준은 발전시간이다 — 발전량으로 세우면 개소 많은 쪽이 늘 위에 서서 순위가 규모
 * 순서와 같아진다. 축(지역/학교급/기관)은 제목 줄에서 고르고, 표는 도면의 표처럼 세로 괘선
 * 없이 가로 파선으로만 줄을 가른다. 발전시간은 마지막 열에서 눈금 막대로 편다.
 */
export function AggregationPanel({ plants }: { plants: School[] }) {
  const [axis, setAxis] = useState<Axis>('region');

  return (
    <Panel
      title="발전 현황 집계"
      note={<SegmentedControl label="집계 기준" size="sm" options={AXIS_OPTIONS} value={axis} onChange={setAxis} />}
    >
      {/* 축을 바꾸면 표를 처음 쪽부터 다시 읽는다 — key 로 페이저를 새로 세운다 */}
      <AggregationTable key={axis} schools={plants} axis={axis} />
    </Panel>
  );
}

function AggregationTable({ schools, axis }: { schools: School[]; axis: Axis }) {
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

  const {
    from, to, page, pageCount, turnKey, paused, togglePause, goTo, next, prev,
  } = useAutoPager<HTMLDivElement, HTMLTableRowElement>({ total: rows.length, intervalMs: PAGE_MS, perPage: PER_PAGE });

  const visibleRows = rows.slice(from, to);

  return (
    <div className={styles.agg}>
      <div className={styles.agg__frame}>
        <table className={styles.table}>
          <caption className={styles.table__caption}>금일 발전 현황 집계. 발전시간 순입니다.</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.table__rank}>순위</th>
              <th scope="col">구분</th>
              <th scope="col" className={styles.table__num}>설비용량</th>
              <th scope="col" className={styles.table__num}>현재 출력</th>
              <th scope="col" className={styles.table__num}>금일 발전량</th>
              <th scope="col" className={styles.table__share}>발전시간</th>
            </tr>
          </thead>

          <tbody key={turnKey}>
            {visibleRows.map((row, index) => {
              const rank = from + index + 1;
              const ratio = FLOOR + (1 - FLOOR) * ((hoursOf(row) - worst) / spread);

              return (
                <tr key={row.key}>
                  <td className={styles.table__rank} data-lead={rank <= 3 ? '' : undefined}>{rank}</td>
                  <th scope="row" className={styles.table__name}>
                    <span className={styles.table__nameInner}>
                      <span className={styles.table__label}>{row.name}</span>
                      {row.count > 1 ? <span className={styles.table__count}>{row.count}개소</span> : null}
                      {row.school ? (
                        <span className={styles.table__state} style={{ '--seg': TONE_VAR[OPERATION_TONE[row.school.status]] } as CSSProperties}>
                          {OPERATION_LABEL[row.school.status]}
                        </span>
                      ) : row.abnormal > 0 ? (
                        <span className={styles.table__state} style={{ '--seg': TONE_VAR.critical } as CSSProperties}>이상 {row.abnormal}</span>
                      ) : null}
                    </span>
                  </th>
                  <td className={styles.table__num}>
                    {formatNumber(row.capacityKw, 1)}<span className={styles.table__unit}>kW</span>
                  </td>
                  <td className={styles.table__num}>
                    {formatNumber(row.outputKw, 1)}<span className={styles.table__unit}>kW</span>
                  </td>
                  <td className={styles.table__num}>
                    {formatNumber(row.todayKwh)}<span className={styles.table__unit}>kWh</span>
                  </td>
                  <td className={styles.table__share}>
                    <span className={styles.bar}>
                      <span
                        className={styles.bar__fill}
                        style={{ width: `${ratio * 100}%`, ...(axis === 'region' ? { '--row': REGION_CI_COLOR[row.name] } : {}) } as CSSProperties}
                      />
                      <span className={styles.bar__value}>
                        {formatNumber(hoursOf(row), 1)}<span className={styles.bar__unit}>h</span>
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}

            {/* 모자라는 줄은 빈 줄로 채운다 — 축을 바꿔도 표 높이가 같아야 한다 */}
            {Array.from({ length: Math.max(0, PER_PAGE - visibleRows.length) }, (_, index) => (
              <tr key={`filler-${index}`} className={styles.table__filler} aria-hidden="true">
                <td>&nbsp;</td>
                <th scope="row">&nbsp;</th>
                <td />
                <td />
                <td />
                <td />
              </tr>
            ))}
          </tbody>

          <tfoot className={styles.table__foot}>
            <tr>
              <th scope="row" className={styles.table__rank}>총계</th>
              <td className={styles.table__name} />
              <td className={styles.table__num}>{formatNumber(totals.capacityKw, 1)}<span className={styles.table__unit}>kW</span></td>
              <td className={styles.table__num}>{formatNumber(totals.outputKw, 1)}<span className={styles.table__unit}>kW</span></td>
              <td className={styles.table__num}>{formatNumber(totals.todayKwh)}<span className={styles.table__unit}>kWh</span></td>
              <td className={styles.table__share}>{formatNumber(hoursOf(totals), 1)}<span className={styles.table__unit}>h</span></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 쪽 넘김 — 벽면에는 스크롤을 굴려 줄 사람이 없어 스스로 넘긴다 */}
      {pageCount > 1 ? (
        <div className={styles.pager}>
          <button type="button" className={styles.pager__step} onClick={prev} aria-label="이전 쪽">
            <ChevronLeftIcon width={13} height={13} />
          </button>
          <button
            type="button"
            className={styles.pager__step}
            onClick={togglePause}
            aria-pressed={paused}
            aria-label={paused ? '자동 넘김 재생' : '자동 넘김 정지'}
          >
            {paused ? <PlayIcon width={12} height={12} /> : <PauseIcon width={12} height={12} />}
          </button>

          <ol className={styles.pager__dots}>
            {Array.from({ length: pageCount }, (_, at) => (
              <li key={at}>
                <button
                  type="button"
                  className={styles.pager__dot}
                  data-on={at === page ? '' : undefined}
                  onClick={() => goTo(at)}
                  aria-label={`${at + 1}쪽`}
                  aria-current={at === page ? 'true' : undefined}
                />
              </li>
            ))}
          </ol>

          <span className={styles.pager__count}>{page + 1} / {pageCount}</span>
          <button type="button" className={styles.pager__step} onClick={next} aria-label="다음 쪽">
            <ChevronRightIcon width={13} height={13} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
