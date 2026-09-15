import { useState } from 'react';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { PauseIcon, PlayIcon } from '@/components/common/Icon';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { formatNumber, formatPercent } from '@/utils/format';
import { useAutoPager } from '@/hooks/useAutoPager';
import type { School } from '@/interface/energy';
import { aggregate, AXIS_OPTIONS } from '@/pages/ControlRoom/utils/aggregate';
import type { Axis } from '@/pages/ControlRoom/utils/aggregate';
import { ExpandButton } from './ExpandButton';
import { StatusPill } from './StatusPill';
import styles from './RegionAggregation.module.scss';

/** 한 쪽이 머무는 시간 — 큰 글씨 표를 읽어 내려갈 만큼은 준다 */
const PAGE_MS = 7000;

/**
 * 한 쪽에 세우는 줄 수 — 자리 크기에 맞춘다.
 *
 * 글자는 어느 자리에서도 줄이지 않고 **줄 수** 로 맞춘다(고객 지시). 작은 띠는 제목·축
 * 고르개·표 머리·쪽 표시까지 들어가야 해 세 줄, 큰 자리는 총계까지 얹고 다섯 줄을 세운다.
 * 축을 바꿔도 표 높이가 같도록 모자라면 빈 줄로 채운다.
 */
const PER_PAGE = { big: 5, small: 3 } as const;

/** 1·2·3 위에 얹는 금·은·동 */
const MEDALS = ['gold', 'silver', 'bronze'] as const;

/**
 * 축별 이용률 — 개소별 이용률의 평균.
 *
 * 상세 판의 이용률과 같은 셈법이라야 한다. 지역별로 볼 때 이 표의 한 줄과 상세 판이 같은
 * 시·군을 가리키는데 셈이 다르면 같은 자리에 다른 수가 뜬다. 집계 함수(`aggregate`)는 실시간
 * 출력·용량만 모으므로, 이용률은 여기서 축과 같은 열쇠로 다시 평균한다.
 */
function utilizationByKey(schools: School[], axis: Axis): (key: string) => number {
  const bucket = new Map<string, { sum: number; n: number }>();

  schools.forEach((school) => {
    const key = axis === 'plant' ? school.id : axis === 'level' ? school.level : school.regionName;
    const cur = bucket.get(key) ?? { sum: 0, n: 0 };

    cur.sum += school.utilization;
    cur.n += 1;
    bucket.set(key, cur);
  });

  return (key) => {
    const entry = bucket.get(key);

    return entry && entry.n > 0 ? entry.sum / entry.n : 0;
  };
}

/**
 * 학교·기관·지역별 발전 현황 집계 (SFR-004-03/09) — 시안 A 의 발전현황집계와 같은 내용.
 *
 * 화면 전체 폭을 받으므로 줄을 넉넉히, 글자를 크게 세운다. 순위는 **이용률** 로 매긴다 —
 * 발전량으로 세우면 개소가 많은 쪽이 늘 위에 서서 순위가 규모 순서와 같아진다. 용량으로 나눈
 * 이용률이라야 큰 곳과 작은 곳을 같은 눈금에 세운다.
 *
 * 벽면 모니터에는 스크롤을 굴려 줄 사람이 없다. 다섯 줄만 두고 나머지는 저절로 넘긴다.
 */
interface RegionAggregationProps {
  plants: School[];
  /** 큰 자리인지 작은 자리인지 — 자리에 따라 줄 수가 갈리고, 작은 자리에는 「크게 보기」 가 선다 */
  variant: 'big' | 'small';
  onExpand?: () => void;
}

export function RegionAggregation({ plants, variant, onExpand }: RegionAggregationProps) {
  const [axis, setAxis] = useState<Axis>('region');
  const perPage = PER_PAGE[variant];

  const utilOf = utilizationByKey(plants, axis);
  const rows = aggregate(plants, axis)
    .map((row) => ({ ...row, utilization: utilOf(row.key) }))
    .sort((a, b) => b.utilization - a.utilization);

  const totals = rows.reduce(
    (sum, row) => ({
      capacityKw: sum.capacityKw + row.capacityKw,
      outputKw: sum.outputKw + row.outputKw,
      todayKwh: sum.todayKwh + row.todayKwh,
    }),
    { capacityKw: 0, outputKw: 0, todayKwh: 0 },
  );
  const totalUtilization = totals.capacityKw > 0 ? totals.outputKw / totals.capacityKw : 0;

  const {
    frameRef, itemRef, from, to, page, pageCount, turnKey, paused, togglePause,
  } = useAutoPager<HTMLDivElement, HTMLTableRowElement>({ total: rows.length, intervalMs: PAGE_MS, perPage });

  const visibleRows = rows.slice(from, to);

  return (
    <section className={styles.agg} aria-label="발전 현황 집계">
      <header className={styles.agg__head}>
        <h2 className={styles.agg__title}>발전 현황 집계</h2>
        <div className={styles.agg__tools}>
          <SegmentedControl
            options={AXIS_OPTIONS}
            value={axis}
            onChange={setAxis}
            label="집계 축"
            className={styles.axis}
          />
          {variant === 'small' && onExpand ? (
            <ExpandButton label="집계표 크게 보기" onClick={onExpand} />
          ) : null}
        </div>
      </header>

      <div ref={frameRef} className={styles.agg__frame}>
        <table className={styles.table}>
          <caption className={styles.table__caption}>금일 발전 현황 집계입니다. 이용률 순으로 세웠습니다.</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.table__rank}>순위</th>
              <th scope="col" className={styles.table__name}>구분</th>
              <th scope="col" className={styles.table__num}>설비용량</th>
              <th scope="col" className={styles.table__num}>현재 출력</th>
              <th scope="col" className={styles.table__num}>금일 발전량</th>
              <th scope="col" className={styles.table__num}>이용률</th>
            </tr>
          </thead>

          {/* 쪽이 갈릴 때마다 새로 만들어야 옆에서 밀려 들어오는 움직임이 다시 돈다 */}
          <tbody key={turnKey}>
            {visibleRows.map((row, index) => {
              const rank = from + index + 1;

              return (
                <tr key={row.key} ref={index === 0 ? itemRef : undefined}>
                  <td className={styles.table__rank}>
                    {MEDALS[rank - 1] ? (
                      <span className={`${styles.table__medal} ${styles[`medal--${MEDALS[rank - 1]}`]}`}>{rank}</span>
                    ) : rank}
                  </td>
                  <th scope="row" className={styles.table__name}>
                    <span className={styles.table__nameInner}>
                      <span className={styles.table__label}>{row.name}</span>
                      {row.count > 1 ? <span className={styles.table__count}>{row.count}개소</span> : null}
                      {row.school ? (
                        <StatusPill tone={OPERATION_TONE[row.school.status]} withDot>
                          {OPERATION_LABEL[row.school.status]}
                        </StatusPill>
                      ) : row.abnormal > 0 ? (
                        <StatusPill tone="critical">이상 {row.abnormal}</StatusPill>
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
                  <td className={styles.table__num}>{formatPercent(row.utilization, 1)}</td>
                </tr>
              );
            })}

            {/* 모자라는 줄은 빈 줄로 채운다 — 축을 바꿔도 표가 차지하는 높이가 같아야 한다 */}
            {Array.from({ length: Math.max(0, perPage - visibleRows.length) }, (_, index) => (
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

          {/*
            총계는 큰 자리에서만 세운다. 작은 띠는 세로가 짧아 총계까지 넣으면 줄 하나를
            더 빼야 하고, 도 전체 합(개소·금일 발전량)은 이미 지도 판 머리가 이고 있다.
          */}
          {variant === 'big' ? (
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
                <td className={styles.table__num}>{formatPercent(totalUtilization, 1)}</td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {/*
        쪽 넘김 표시.
        쪽이 여럿(학교별은 수십 쪽)이라 눈금 점을 다 찍지 않는다 — 지금 쪽·전체 쪽과, 다음
        쪽까지 남은 시간을 채우는 막대만 둔다. 지켜보다 세우고 싶으면 왼쪽 단추로 멈춘다.
      */}
      {pageCount > 1 ? (
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.pager__play}
            onClick={togglePause}
            aria-label={paused ? '자동 넘김 시작' : '자동 넘김 멈춤'}
          >
            {paused ? <PlayIcon width={16} height={16} /> : <PauseIcon width={16} height={16} />}
          </button>
          <span className={styles.pager__count}>
            <strong>{page + 1}</strong> / {pageCount}
          </span>
          <span className={styles.pager__track}>
            <span
              key={turnKey}
              className={styles.pager__fill}
              data-paused={paused ? '' : undefined}
              style={{ animationDuration: `${PAGE_MS}ms` }}
            />
          </span>
        </div>
      ) : null}
    </section>
  );
}
