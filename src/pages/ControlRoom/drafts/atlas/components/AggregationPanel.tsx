import { useState } from 'react';
import { REGION_CI_COLOR } from '@/assets/geo/chungnamRegions';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import { useAutoPager } from '@/hooks/useAutoPager';
import type { School } from '@/interface/energy';
import { aggregate, AXIS_OPTIONS } from '@/pages/ControlRoom/utils/aggregate';
import type { AggregationRow, Axis } from '@/pages/ControlRoom/utils/aggregate';
import { Panel } from './Panel';
import styles from './AggregationPanel.module.scss';
import type { CSSProperties } from 'react';

/** 한 쪽이 머무는 시간 — 표를 읽어 내려갈 만큼은 준다 */
const PAGE_MS = 7000;

/**
 * 한 쪽에 세우는 줄 수.
 *
 * 이 시안의 집계는 화면 전체 폭을 받지만 세로가 240px 로 얕다. 그래서 한 표를 세로로 길게
 * 늘이는 대신 **두 단** 으로 갈라, 얕은 자리에서도 열네 줄을 한 번에 보인다 — A(여섯 줄)보다
 * 곱절 넘게 담긴다. 폭이 남으니 넓이로 줄 수를 버는 이 시안의 이점을 그대로 쓴다.
 */
const PER_COLUMN = 3;
const PER_PAGE = PER_COLUMN * 2;

/** 금일 발전시간(h) = 금일 발전량 ÷ 설비용량 */
function hoursOf(row: { todayKwh: number; capacityKw: number }): number {
  return row.capacityKw > 0 ? row.todayKwh / row.capacityKw : 0;
}

/**
 * 발전 현황 집계 (SFR-004-03 / SFR-004-09) — 아틀라스 판.
 *
 * 담는 것은 A 와 같다 — 축(학교별·기관별·지역별) 전환, 순위·구분·설비용량·현재 출력·금일
 * 발전량·발전시간의 표, 맨 아래 총계, 그리고 저절로 넘어가는 쪽. 줄 세우는 기준도 그대로
 * **발전시간** 이다 — 발전량으로 세우면 개소 수 많은 쪽이 늘 위에 서 순위가 규모 순서와 같아진다.
 *
 * 그리기는 장부 두 단으로 바꾼다. 표제 줄의 고르개로 축을 갈고, 축이 바뀌면 표를 처음 쪽부터
 * 다시 읽도록 안쪽 표를 `key` 로 새로 세운다.
 *
 * 자리가 세로로 얕다(판 높이 약 205px, 머리·총계·쪽 표시를 빼면 표에 남는 높이가 90px 남짓).
 * 한 단에 세 줄씩 두 단이면 여섯 줄 — 넓이를 나눠 쓰되, 총계와 쪽 표시까지 판 안에 들어오는
 * 선에서 멈춘다. 쪽 눈금은 A 의 큼직한 `PagerBar` 대신 한 줄짜리 표시로 줄여 높이를 아꼈다
 * (벽에 걸어 두고 저절로 넘기는 화면이라 손잡이가 없어도 된다).
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
      <AggregationTable key={axis} schools={plants} axis={axis} />
    </Panel>
  );
}

/** 한 단짜리 표 하나 — 왼쪽·오른쪽 단이 같은 머리글로 각자 그린다 */
function Column({
  axis, rows, fromRank,
}: {
  axis: Axis;
  rows: AggregationRow[];
  /** 이 단 첫 줄의 전체 순위 — 쪽을 넘겨도 순위가 이어지도록 */
  fromRank: number;
}) {
  const fillers = Math.max(0, PER_COLUMN - rows.length);

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th scope="col" className={styles.table__rank}>순위</th>
          <th scope="col" className={styles.table__name}>구분</th>
          <th scope="col" className={styles.table__num}>설비용량</th>
          <th scope="col" className={styles.table__num}>현재 출력</th>
          <th scope="col" className={styles.table__num}>금일 발전량</th>
          <th scope="col" className={styles.table__num}>발전시간</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.key}>
            <td className={styles.table__rank}>{fromRank + index}</td>
            <th scope="row" className={styles.table__name}>
              <span className={styles.table__nameInner}>
                {axis === 'region' ? (
                  <span
                    className={styles.table__swatch}
                    style={{ '--row': REGION_CI_COLOR[row.name] } as CSSProperties}
                    aria-hidden="true"
                  />
                ) : null}
                <span className={styles.table__label}>{row.name}</span>
                {row.count > 1 ? <span className={styles.table__count}>{formatNumber(row.count)}개소</span> : null}
                {/*
                  상태는 알약(Badge) 대신 점+글씨로 적는다 — 알약은 세로로 부풀어 얕은 자리에서
                  줄 높이를 밀어낸다. 담는 뜻(상태색·라벨)은 그대로다.
                */}
                {row.school ? (
                  <span className={styles.table__stat} data-tone={OPERATION_TONE[row.school.status]}>
                    <span className={styles.table__statDot} aria-hidden="true" />
                    {OPERATION_LABEL[row.school.status]}
                  </span>
                ) : row.abnormal > 0 ? (
                  <span className={styles.table__stat} data-tone="critical">
                    <span className={styles.table__statDot} aria-hidden="true" />
                    이상 {formatNumber(row.abnormal)}
                  </span>
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
            <td className={styles.table__num}>
              <strong className={styles.table__hours}>{formatNumber(hoursOf(row), 1)}</strong>
              <span className={styles.table__unit}>h</span>
            </td>
          </tr>
        ))}

        {/* 모자라는 줄은 빈 줄로 채운다 — 축을 바꿔도 두 단의 높이가 같아야 한다 */}
        {Array.from({ length: fillers }, (_, index) => (
          <tr key={`filler-${index}`} className={styles.table__filler} aria-hidden="true">
            <td colSpan={6}>&nbsp;</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AggregationTable({ schools, axis }: { schools: School[]; axis: Axis }) {
  const rows = aggregate(schools, axis).sort((a, b) => hoursOf(b) - hoursOf(a));

  const totals = rows.reduce(
    (sum, row) => ({
      capacityKw: sum.capacityKw + row.capacityKw,
      outputKw: sum.outputKw + row.outputKw,
      todayKwh: sum.todayKwh + row.todayKwh,
    }),
    { capacityKw: 0, outputKw: 0, todayKwh: 0 },
  );

  // 벽면 모니터에는 스크롤을 굴려 줄 사람이 없다. 여덟 줄만 두고 나머지는 저절로 넘긴다.
  const {
    frameRef, from, to, page, pageCount, turnKey,
  } = useAutoPager<HTMLDivElement, HTMLTableRowElement>({ total: rows.length, intervalMs: PAGE_MS, perPage: PER_PAGE });

  const visible = rows.slice(from, to);
  const left = visible.slice(0, PER_COLUMN);
  const right = visible.slice(PER_COLUMN, PER_PAGE);
  // 오른쪽 단이 통째로 비면(한 쪽에 일곱 줄 이하) 한 단으로 펴 폭을 다 쓴다
  const twoColumns = right.length > 0;

  return (
    <div className={styles.agg}>
      <div ref={frameRef} className={styles.agg__frame} data-cols={twoColumns ? 'two' : 'one'} key={turnKey}>
        <Column axis={axis} rows={left} fromRank={from + 1} />
        {twoColumns ? <Column axis={axis} rows={right} fromRank={from + PER_COLUMN + 1} /> : null}
      </div>

      {/* 총계는 두 단 아래 한 줄로 — 줄을 다 읽고 난 자리에서 관내 전체를 받는다 */}
      <dl className={styles.total}>
        <dt className={styles.total__term}>총계</dt>
        <dd className={styles.total__cell}>
          <span className={styles.total__label}>설비용량</span>
          {formatNumber(totals.capacityKw, 1)}<span className={styles.table__unit}>kW</span>
        </dd>
        <dd className={styles.total__cell}>
          <span className={styles.total__label}>현재 출력</span>
          {formatNumber(totals.outputKw, 1)}<span className={styles.table__unit}>kW</span>
        </dd>
        <dd className={styles.total__cell}>
          <span className={styles.total__label}>금일 발전량</span>
          {formatNumber(totals.todayKwh)}<span className={styles.table__unit}>kWh</span>
        </dd>
        <dd className={styles.total__cell}>
          <span className={styles.total__label}>발전시간</span>
          {formatNumber(hoursOf(totals), 1)}<span className={styles.table__unit}>h</span>
        </dd>
      </dl>

      {/* 쪽 표시 — 큰 눈금 대신 한 줄로. 저절로 넘어가는 자리를 점으로만 알린다 */}
      <p className={styles.pageline}>
        <span className={styles.pageline__count}>전체 {formatNumber(rows.length)}건</span>
        {pageCount > 1 ? (
          <>
            <span className={styles.pageline__dots} aria-hidden="true">
              {Array.from({ length: pageCount }, (_, at) => (
                <span key={at} className={styles.pageline__dot} data-on={at === page ? '' : undefined} />
              ))}
            </span>
            <span className={styles.pageline__pos}>{page + 1} / {pageCount}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
