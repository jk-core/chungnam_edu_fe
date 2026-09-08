import { formatNumber } from '@/utils/format';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Badge } from '@/components/common/Badge';
import { useAutoPager } from '@/hooks/useAutoPager';
import type { School } from '@/interface/energy';
import { REGION_CI_COLOR } from '@/assets/geo/chungnamRegions';
import { aggregate } from '../utils/aggregate';
import { PagerBar } from './PagerBar';
import styles from './AggregationPanel.module.scss';
import type { Axis } from '../utils/aggregate';
import type { CSSProperties } from 'react';

/** 한 쪽이 머무는 시간 — 표를 읽어 내려갈 만큼은 준다 */
const PAGE_MS = 7000;

/**
 * 한 쪽에 세우는 줄 수.
 *
 * 축을 바꾸면 줄 수가 달라진다 — 지역은 열다섯, 기관은 넷이다. 담기는 만큼만 그리면 표
 * 높이가 축마다 달라져 아래 판까지 밀리므로, 여섯 줄로 못 박고 모자라면 빈 줄로 채운다.
 */
const PER_PAGE = 6;

/** 1·2·3 위에 얹는 금·은·동 */
const MEDALS = ['gold', 'silver', 'bronze'] as const;

/** 채움이 이만큼 넘으면 숫자가 면 위에 올라선다 — 그때부터 글자색을 뒤집는다 */
const COVER_RATIO = 0.72;

/**
 * 가장 낮은 줄이 남기는 길이.
 *
 * 발전시간은 같은 날 같은 하늘 아래 잰 값이라 크게 벌어지지 않는다 — 0 부터 그리면 여섯 줄이
 * 모두 끝까지 차서 순서가 막대로는 보이지 않는다. 가장 낮은 줄을 이만큼으로 두고 그 위
 * 차이를 편다. 값 자체는 막대 안 숫자가 그대로 말한다.
 */
const FLOOR = 0.18;

/** 금일 발전시간(h) = 금일 발전량 ÷ 설비용량 */
function hoursOf(row: { todayKwh: number; capacityKw: number }): number {
  return row.capacityKw > 0 ? row.todayKwh / row.capacityKw : 0;
}

interface AggregationPanelProps {
  schools: School[];
  /** 무엇으로 묶어 볼지 — 고르개는 판 제목 줄에 있다 */
  axis: Axis;
}

/**
 * 학교별·기관별·지역별 발전 현황 집계와 실적 순위 (SFR-004-03 / SFR-004-09).
 *
 * 줄 세우는 기준은 **발전시간** 이다 — 발전량으로 세우면 개소 수가 많은 쪽이 늘 위에 서서
 * 순위가 규모 순서와 같아진다. 용량으로 나눈 발전시간이라야 큰 곳과 작은 곳을 같은 눈금에
 * 세울 수 있고, 그래서 맨 앞 순위 열이 곧 금일 실적 순위가 된다.
 */
export function AggregationPanel({ schools, axis }: AggregationPanelProps) {
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

  // 벽면 모니터에는 스크롤을 굴려 줄 사람이 없다. 여섯 줄만 두고 나머지는 저절로 넘긴다.
  const {
    frameRef, itemRef, from, to, page, pageCount, turnKey, paused, togglePause, goTo, next, prev,
  } = useAutoPager<HTMLDivElement, HTMLTableRowElement>({ total: rows.length, intervalMs: PAGE_MS, perPage: PER_PAGE });

  const visibleRows = rows.slice(from, to);

  return (
    <div className={styles.agg}>
      <div ref={frameRef} className={styles.agg__frame}>
        <table className={styles.table}>
          <caption className={styles.table__caption}>금일 발전 현황 집계. 발전시간 순입니다.</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.table__rank}>순위</th>
              <th scope="col">구분</th>
              {/* 단위는 머리글이 아니라 값 옆에 붙인다 — 숫자와 단위가 떨어져 있으면 눈이 위아래를 오간다 */}
              <th scope="col" className={styles.table__num}>설비용량</th>
              <th scope="col" className={styles.table__num}>현재 출력</th>
              <th scope="col" className={styles.table__num}>금일 발전량</th>
              <th scope="col" className={styles.table__share}>발전시간</th>
            </tr>
          </thead>

          {/* 쪽이 갈릴 때마다 새로 만들어야 옆에서 밀려 들어오는 움직임이 다시 돈다 */}
          <tbody key={turnKey} className={styles.table__body}>
            {visibleRows.map((row, index) => {
              // 순위는 쪽을 넘겨도 이어져야 한다 — 지금 쪽의 자리가 아니라 전체에서의 자리로 센다.
              const rank = from + index + 1;
              const ratio = FLOOR + (1 - FLOOR) * ((hoursOf(row) - worst) / spread);

              return (
                <tr key={row.key} ref={index === 0 ? itemRef : undefined}>
                  <td className={styles.table__rank}>
                    {/* 세 자리까지만 메달을 얹는다 — 나머지는 숫자만으로 순서가 읽힌다 */}
                    {MEDALS[rank - 1] ? (
                      <span className={`${styles.table__medal} ${styles[`medal--${MEDALS[rank - 1]}`]}`}>{rank}</span>
                    ) : rank}
                  </td>
                  <th scope="row" className={styles.table__name}>
                    {/*
                      가로 놓기는 안쪽 조각이 맡는다.

                      셀에 직접 display:flex 를 주면 그 칸이 표 셀에서 빠져 나와 줄 높이를
                      1px 덜 차지한다 — 같은 줄인데 이 칸의 아래 선만 위로 올라앉아 가로줄이
                      끊겨 보인다.
                    */}
                    <span className={styles.table__nameInner}>
                      <span>{row.name}</span>
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
                    {/*
                      숫자는 늘 오른쪽에 서고, 채움이 그 자리까지 닿으면 글자색을 뒤집는다 —
                      한쪽으로 못 박아 두면 짧은 막대에서는 면 위 글자가, 긴 막대에서는 바탕 위
                      글자가 묻힌다.
                    */}
                    <span className={styles.bar} data-over={ratio >= COVER_RATIO ? '' : undefined}>
                      {/* 지역별로 볼 때만 시·군의 CI 색을 받는다 — 다른 축에서는 시·군이 뜻을 갖지 않는다 */}
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
              {/* 「총계」 는 순위 자리에 세운다 — 구분 칸은 이름이 서는 자리라 비워 둔다 */}
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
  );
}
