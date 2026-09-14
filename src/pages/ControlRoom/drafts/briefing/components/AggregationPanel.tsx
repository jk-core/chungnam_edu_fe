import { useState } from 'react';
import { REGION_CI_COLOR } from '@/assets/geo/chungnamRegions';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from '@/components/common/Icon';
import { Badge } from '@/components/common/Badge';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import { useAutoPager } from '@/hooks/useAutoPager';
import { cn } from '@/utils/cn';
import type { School } from '@/interface/energy';
import { aggregate, AXIS_OPTIONS } from '@/pages/ControlRoom/utils/aggregate';
import type { Axis } from '@/pages/ControlRoom/utils/aggregate';
import { Panel } from './Panel';
import styles from './AggregationPanel.module.scss';
import type { CSSProperties } from 'react';

/** 한 쪽이 머무는 시간 — 표를 읽어 내려갈 만큼은 준다 */
const PAGE_MS = 7000;

/**
 * 한 쪽에 세우는 줄 수. 축마다 줄 수가 달라도 표 높이가 같아야 아래가 밀리지 않는다.
 * 이 시안의 낮은 칸에서는 다섯 줄에 머리·총계·쪽 표시까지가 판에 꼭 든다 — 여섯이면 넘친다.
 */
const PER_PAGE = 5;

/** 1·2·3 위에 얹는 금·은·동 */
const MEDALS = ['gold', 'silver', 'bronze'] as const;

/**
 * 가장 낮은 줄이 남기는 막대 길이.
 * 발전시간은 크게 벌어지지 않아 0 부터 그리면 순서가 막대로 보이지 않는다 — 바닥을 들어 편다.
 */
const FLOOR = 0.18;

/** 금일 발전시간(h) = 금일 발전량 ÷ 설비용량 */
function hoursOf(row: { todayKwh: number; capacityKw: number }): number {
  return row.capacityKw > 0 ? row.todayKwh / row.capacityKw : 0;
}

/**
 * 발전 현황 집계 (SFR-004-03 / SFR-004-09).
 *
 * 무엇으로 묶어 볼지는 판 머리의 고르개에서 고른다. 표는 발전시간 순으로 세운다 — 발전량으로
 * 세우면 개소 수가 많은 쪽이 늘 위에 서서 순위가 규모 순서와 같아진다. 용량으로 나눈 발전시간
 * 이라야 큰 곳과 작은 곳을 같은 눈금에 세울 수 있어 맨 앞 순위 열이 곧 금일 실적 순위가 된다.
 *
 * 벽면 모니터에는 스크롤을 굴려 줄 사람이 없다. 여섯 줄만 두고 나머지는 저절로 넘기되, 눈에
 * 걸린 쪽은 붙잡아 볼 수 있게 멈춤과 앞뒤 이동을 함께 둔다.
 */
export function AggregationPanel({ plants }: { plants: School[] }) {
  const [axis, setAxis] = useState<Axis>('region');

  return (
    <Panel
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
      {/*
        축을 바꾸면 표를 처음 쪽부터 다시 읽는다 — key 로 새로 세워 쪽 번호와 넘어가는 움직임을
        되감는다. 쪽 번호를 그대로 두면 셋째 쪽에서 축만 갈려 열한째 줄부터 보이기 시작한다.
      */}
      <AggregationTable key={axis} plants={plants} axis={axis} />
    </Panel>
  );
}

function AggregationTable({ plants, axis }: { plants: School[]; axis: Axis }) {
  const rows = aggregate(plants, axis).sort((a, b) => hoursOf(b) - hoursOf(a));
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
    page, pageCount, turnKey, paused, togglePause, next, prev,
  } = useAutoPager<HTMLDivElement, HTMLTableRowElement>({
    total: rows.length,
    intervalMs: PAGE_MS,
    perPage: PER_PAGE,
  });

  const from = page * PER_PAGE;
  const visibleRows = rows.slice(from, from + PER_PAGE);

  return (
    <div className={styles.agg}>
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

        {/* 쪽이 갈릴 때마다 새로 세워야 옆에서 밀려 들어오는 움직임이 다시 돈다 */}
        <tbody key={turnKey}>
          {visibleRows.map((row, index) => {
            // 순위는 쪽을 넘겨도 이어진다 — 지금 쪽의 자리가 아니라 전체에서의 자리로 센다.
            const rank = from + index + 1;
            const ratio = FLOOR + (1 - FLOOR) * ((hoursOf(row) - worst) / spread);

            return (
              <tr key={row.key}>
                <td className={styles.table__rank}>
                  {MEDALS[rank - 1] ? (
                    <span className={cn(styles.table__medal, styles[`medal--${MEDALS[rank - 1]}`])}>{rank}</span>
                  ) : rank}
                </td>
                <th scope="row" className={styles.table__name}>
                  <span className={styles.table__nameInner}>
                    <span className={styles.table__label}>{row.name}</span>
                    {row.count > 1 ? <span className={styles.table__count}>{row.count}개소</span> : null}
                    {row.school ? (
                      <Badge tone={OPERATION_TONE[row.school.status]} withDot>
                        {OPERATION_LABEL[row.school.status]}
                      </Badge>
                    ) : row.abnormal > 0 ? (
                      <Badge tone="critical">이상 {row.abnormal}</Badge>
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
                      style={{
                        width: `${ratio * 100}%`,
                        ...(axis === 'region' ? { '--row': REGION_CI_COLOR[row.name] } : {}),
                      } as CSSProperties}
                    />
                    <span className={styles.bar__value}>
                      {formatNumber(hoursOf(row), 1)}<span className={styles.bar__unit}>h</span>
                    </span>
                  </span>
                </td>
              </tr>
            );
          })}

          {/* 모자라는 줄은 빈 줄로 채운다 — 축을 바꿔도 표가 차지하는 높이가 같아야 한다 */}
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

        {/* 총계는 맨 아래 — 줄을 다 읽고 난 자리에서 관내 전체를 받는다 */}
        <tfoot className={styles.table__foot}>
          <tr>
            <th scope="row" className={styles.table__rank}>총계</th>
            <td className={styles.table__name} />
            <td className={styles.table__num}>
              {formatNumber(totals.capacityKw, 1)}<span className={styles.table__unit}>kW</span>
            </td>
            <td className={styles.table__num}>
              {formatNumber(totals.outputKw, 1)}<span className={styles.table__unit}>kW</span>
            </td>
            <td className={styles.table__num}>
              {formatNumber(totals.todayKwh)}<span className={styles.table__unit}>kWh</span>
            </td>
            <td className={styles.table__share}>
              {formatNumber(hoursOf(totals), 1)}<span className={styles.table__unit}>h</span>
            </td>
          </tr>
        </tfoot>
      </table>

      {pageCount > 1 ? (
        <div className={styles.pager}>
          <span className={styles.pager__count}>전체 {formatNumber(rows.length)}건 · {page + 1} / {pageCount}</span>

          <span className={styles.pager__nav}>
            <span className={styles.pager__dots} aria-hidden="true">
              {Array.from({ length: pageCount }, (_, index) => (
                <span
                  key={index === page ? `on-${turnKey}` : `off-${index}`}
                  className={cn(styles.pager__dot, { [styles['pager__dot--on']]: index === page })}
                  style={index === page ? ({ '--rotation-ms': `${PAGE_MS}ms` } as CSSProperties) : undefined}
                  data-held={index === page && paused ? '' : undefined}
                />
              ))}
            </span>

            <button type="button" className={styles.pager__button} onClick={prev} aria-label="이전 페이지">
              <ChevronLeftIcon width={15} height={15} />
            </button>
            <button
              type="button"
              className={styles.pager__button}
              onClick={togglePause}
              aria-pressed={paused}
              aria-label={paused ? '자동 전환 재생' : '자동 전환 정지'}
            >
              {paused ? <PlayIcon width={15} height={15} /> : <PauseIcon width={15} height={15} />}
            </button>
            <button type="button" className={styles.pager__button} onClick={next} aria-label="다음 페이지">
              <ChevronRightIcon width={15} height={15} />
            </button>
          </span>
        </div>
      ) : (
        <p className={styles.pager}>
          <span className={styles.pager__count}>전체 {formatNumber(rows.length)}건</span>
        </p>
      )}
    </div>
  );
}
