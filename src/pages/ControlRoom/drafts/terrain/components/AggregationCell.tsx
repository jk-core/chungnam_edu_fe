import { useState } from 'react';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Badge } from '@/components/common/Badge';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import { useAutoPager } from '@/hooks/useAutoPager';
import { REGION_CI_COLOR } from '@/assets/geo/chungnamRegions';
import type { School } from '@/interface/energy';
import { Panel } from '@/pages/ControlRoom/components/Panel';
import { PagerBar } from '@/pages/ControlRoom/components/PagerBar';
import { aggregate, AXIS_OPTIONS } from '@/pages/ControlRoom/utils/aggregate';
import type { Axis } from '@/pages/ControlRoom/utils/aggregate';
import aggStyles from '@/pages/ControlRoom/components/AggregationPanel.module.scss';
import { ExpandButton } from './ExpandButton';
import cellStyles from './AggregationCell.module.scss';
import type { CSSProperties } from 'react';

/** 한 쪽이 머무는 시간 — 표를 읽어 내려갈 만큼은 준다 */
const PAGE_MS = 7000;

/**
 * 한 쪽에 세우는 줄 수 — 자리 크기에 맞춘다.
 *
 * 지도를 화면의 주인으로 크게 세우라는 고객 요청(2026-09-15)에 따라, 아래 띠에 눕는 집계는
 * 작은 자리에서 세 줄만 보인다. 자동 넘김이 열다섯 시·군을 다섯 쪽으로 돌리므로 세 줄만
 * 보여도 무엇 하나 빠지지 않는다. 큰 자리로 맞바꿔 서면 다섯 줄에 총계까지 얹는다.
 */
const PER_PAGE = { big: 5, small: 3 } as const;

/** 1·2·3 위에 얹는 금·은·동 */
const MEDALS = ['gold', 'silver', 'bronze'] as const;

/** 채움이 이만큼 넘으면 숫자가 면 위에 올라선다 — 그때부터 글자색을 뒤집는다 */
const COVER_RATIO = 0.72;

/**
 * 가장 낮은 줄이 남기는 길이 — 0 부터 그리면 여섯 줄이 모두 끝까지 차 순서가 막대로 안 보인다.
 * 가장 낮은 줄을 이만큼으로 두고 그 위 차이를 편다.
 */
const FLOOR = 0.18;

/** 금일 발전시간(h) = 금일 발전량 ÷ 설비용량 */
function hoursOf(row: { todayKwh: number; capacityKw: number }): number {
  return row.capacityKw > 0 ? row.todayKwh / row.capacityKw : 0;
}

/**
 * 시안 B 의 발전 현황 집계 칸 (SFR-004-03/09).
 *
 * 시안 A 의 `AggregationPanel` 은 한 쪽을 여섯 줄로 못 박아(`perPage` 고정) 자리에 맞춰 줄이지
 * 못한다 — 짧은 자리에 끼우면 4~6 째 줄이 잘린 채 쪽만 넘어가 그 시·군들이 화면에 아예 안
 * 뜬다. 지도를 크게 세우려면 이 띠를 세 줄까지 줄여야 하므로, A 판을 그대로 쓰지 못하고
 * **그 표의 결(스타일)은 그대로 가져다 쓰되(같은 `AggregationPanel.module.scss` 를 물어 온다)**
 * 마크업만 본떠 줄 수를 자리에 맞춘다 — 상세 판에 쓴 것과 같은 「A 를 본떠 B 에 둔다」 수법이다.
 * 그래서 A 와 나란히 놓아도 표는 같은 화면의 것으로 보인다.
 *
 * 줄 세우는 기준은 A 와 같은 **발전시간**(용량으로 나눈 값)이라, 맨 앞 순위 열이 곧 실적 순위다.
 * 축 상태는 배치가 아니라 이 칸의 것이라 여기서 쥔다.
 */
interface AggregationCellProps {
  plants: School[];
  /** 큰 자리(5줄+총계)인지 작은 띠(3줄)인지 */
  variant: 'big' | 'small';
  /** 작은 자리에 설 때만 준다 — 누르면 이 칸이 큰 자리로 온다 */
  onExpand?: () => void;
}

export function AggregationCell({ plants, variant, onExpand }: AggregationCellProps) {
  const [axis, setAxis] = useState<Axis>('region');
  const perPage = PER_PAGE[variant];

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
    frameRef, itemRef, from, to, page, pageCount, turnKey, paused, togglePause, goTo, next, prev,
  } = useAutoPager<HTMLDivElement, HTMLTableRowElement>({ total: rows.length, intervalMs: PAGE_MS, perPage });

  const visibleRows = rows.slice(from, to);

  return (
    <Panel
      title="발전 현황 집계"
      note={(
        <span className={cellStyles.tools}>
          <SegmentedControl
            label="집계 기준"
            options={AXIS_OPTIONS}
            value={axis}
            onChange={setAxis}
          />
          {onExpand ? <ExpandButton label="집계표 크게 보기" onClick={onExpand} /> : null}
        </span>
      )}
    >
      {/* 축을 바꾸면 표를 처음 쪽부터 다시 읽도록 pager 를 다시 만든다 */}
      <div className={aggStyles.agg} key={axis}>
        <div ref={frameRef} className={aggStyles.agg__frame}>
          <table className={aggStyles.table}>
            <caption className={aggStyles.table__caption}>금일 발전 현황 집계. 발전시간 순입니다.</caption>
            <thead>
              <tr>
                <th scope="col" className={aggStyles.table__rank}>순위</th>
                <th scope="col">구분</th>
                <th scope="col" className={aggStyles.table__num}>설비용량</th>
                <th scope="col" className={aggStyles.table__num}>현재 출력</th>
                <th scope="col" className={aggStyles.table__num}>금일 발전량</th>
                <th scope="col" className={aggStyles.table__share}>발전시간</th>
              </tr>
            </thead>

            {/* 쪽이 갈릴 때마다 새로 만들어야 옆에서 밀려 들어오는 움직임이 다시 돈다 */}
            <tbody key={turnKey} className={aggStyles.table__body}>
              {visibleRows.map((row, index) => {
                const rank = from + index + 1;
                const ratio = FLOOR + (1 - FLOOR) * ((hoursOf(row) - worst) / spread);

                return (
                  <tr key={row.key} ref={index === 0 ? itemRef : undefined}>
                    <td className={aggStyles.table__rank}>
                      {MEDALS[rank - 1] ? (
                        <span className={`${aggStyles.table__medal} ${aggStyles[`medal--${MEDALS[rank - 1]}`]}`}>{rank}</span>
                      ) : rank}
                    </td>
                    <th scope="row" className={aggStyles.table__name}>
                      <span className={aggStyles.table__nameInner}>
                        <span>{row.name}</span>
                        {row.count > 1 ? <span className={aggStyles.table__count}>{row.count}개소</span> : null}
                        {row.school ? (
                          <Badge tone={OPERATION_TONE[row.school.status]} withDot>
                            {OPERATION_LABEL[row.school.status]}
                          </Badge>
                        ) : row.abnormal > 0 ? (
                          <Badge tone="critical">이상 {row.abnormal}</Badge>
                        ) : null}
                      </span>
                    </th>
                    <td className={aggStyles.table__num}>
                      {formatNumber(row.capacityKw, 1)}<span className={aggStyles.table__unit}>kW</span>
                    </td>
                    <td className={aggStyles.table__num}>
                      {formatNumber(row.outputKw, 1)}<span className={aggStyles.table__unit}>kW</span>
                    </td>
                    <td className={aggStyles.table__num}>
                      {formatNumber(row.todayKwh)}<span className={aggStyles.table__unit}>kWh</span>
                    </td>
                    <td className={aggStyles.table__share}>
                      <span className={aggStyles.bar} data-over={ratio >= COVER_RATIO ? '' : undefined}>
                        <span
                          className={aggStyles.bar__fill}
                          style={{
                            width: `${ratio * 100}%`,
                            ...(axis === 'region' ? { '--row': REGION_CI_COLOR[row.name] } : {}),
                          } as CSSProperties}
                        />
                        <span className={aggStyles.bar__value}>
                          {formatNumber(hoursOf(row), 1)}<span className={aggStyles.bar__unit}>h</span>
                        </span>
                      </span>
                    </td>
                  </tr>
                );
              })}

              {/* 모자라는 줄은 빈 줄로 채운다 — 축을 바꿔도 표가 차지하는 높이가 같아야 한다 */}
              {Array.from({ length: Math.max(0, perPage - visibleRows.length) }, (_, index) => (
                <tr key={`filler-${index}`} className={aggStyles.table__filler} aria-hidden="true">
                  <td>&nbsp;</td>
                  <th scope="row">&nbsp;</th>
                  <td />
                  <td />
                  <td />
                  <td />
                </tr>
              ))}
            </tbody>

            {/*
              총계는 큰 자리에서만 세운다. 작은 띠는 세로가 짧아 총계까지 넣으면 줄 하나를 더
              빼야 하고, 도 전체 합(개소·금일 발전량)은 이미 지도 판 머리가 이고 있다.
            */}
            {variant === 'big' ? (
              <tfoot className={aggStyles.table__foot}>
                <tr>
                  <th scope="row" className={aggStyles.table__rank}>총계</th>
                  <td className={aggStyles.table__name} />
                  <td className={aggStyles.table__num}>
                    {formatNumber(totals.capacityKw, 1)}<span className={aggStyles.table__unit}>kW</span>
                  </td>
                  <td className={aggStyles.table__num}>
                    {formatNumber(totals.outputKw, 1)}<span className={aggStyles.table__unit}>kW</span>
                  </td>
                  <td className={aggStyles.table__num}>
                    {formatNumber(totals.todayKwh)}<span className={aggStyles.table__unit}>kWh</span>
                  </td>
                  <td className={aggStyles.table__share}>
                    {formatNumber(hoursOf(totals), 1)}<span className={aggStyles.table__unit}>h</span>
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>

        <PagerBar
          page={page}
          pageCount={pageCount}
          turnKey={turnKey}
          intervalMs={PAGE_MS}
          total={rows.length}
          controls={{ paused, onTogglePause: togglePause, onGo: goTo, onPrev: prev, onNext: next }}
        />
      </div>
    </Panel>
  );
}
