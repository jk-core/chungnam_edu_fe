import { formatNumber } from '@/utils/format';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Badge } from '@/components/common/Badge';
import { useAutoPager } from '@/hooks/useAutoPager';
import type { School } from '@/interface/energy';
import { aggregate } from '../utils/aggregate';
import { PagerBar } from './PagerBar';
import styles from './AggregationPanel.module.scss';
import type { Axis } from '../utils/aggregate';

/** 한 쪽이 머무는 시간 — 표를 읽어 내려갈 만큼은 준다 */
const PAGE_MS = 7000;

/**
 * 한 쪽에 세우는 줄 수.
 *
 * 축을 바꾸면 줄 수가 달라진다 — 지역은 열다섯, 기관은 넷이다. 담기는 만큼만 그리면 표
 * 높이가 축마다 달라져 아래 판까지 밀리므로, 여섯 줄로 못 박고 모자라면 빈 줄로 채운다.
 */
const PER_PAGE = 6;

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
              <th scope="col" className={styles.table__num}>
                설비용량<span className={styles.table__unit}>kW</span>
              </th>
              <th scope="col" className={styles.table__num}>
                현재 출력<span className={styles.table__unit}>kW</span>
              </th>
              <th scope="col" className={styles.table__num}>
                금일 발전량<span className={styles.table__unit}>kWh</span>
              </th>
              <th scope="col" className={styles.table__share}>
                발전시간<span className={styles.table__unit}>h</span>
              </th>
            </tr>
          </thead>

          {/* 쪽이 갈릴 때마다 새로 만들어야 옆에서 밀려 들어오는 움직임이 다시 돈다 */}
          <tbody key={turnKey} className={styles.table__body}>
            {visibleRows.map((row, index) => {
              // 순위는 쪽을 넘겨도 이어져야 한다 — 지금 쪽의 자리가 아니라 전체에서의 자리로 센다.
              const rank = from + index + 1;

              return (
                <tr key={row.key} ref={index === 0 ? itemRef : undefined}>
                  <td className={styles.table__rank} data-lead={rank <= 3 ? '' : undefined}>{rank}</td>
                  <th scope="row" className={styles.table__name}>
                    <span>{row.name}</span>
                    {row.count > 1 ? <span className={styles.table__count}>{row.count}개소</span> : null}
                    {row.school ? (
                      <Badge tone={OPERATION_TONE[row.school.status]} withDot>
                        {OPERATION_LABEL[row.school.status]}
                      </Badge>
                    ) : row.abnormal > 0 ? (
                      <Badge tone="critical">이상 {row.abnormal}</Badge>
                    ) : null}
                  </th>
                  <td className={styles.table__num}>{formatNumber(row.capacityKw, 1)}</td>
                  <td className={styles.table__num}>{formatNumber(row.outputKw, 1)}</td>
                  <td className={styles.table__num}>{formatNumber(row.todayKwh)}</td>
                  <td className={styles.table__share}>
                    {/* 채운 면은 옅게, 끝선은 진하게 — 면을 진하게 채우면 그 위 숫자가 묻힌다 */}
                    <span className={styles.bar}>
                      <span
                        className={styles.bar__fill}
                        style={{ width: `${Math.max(4, (hoursOf(row) / Math.max(best, 0.01)) * 100)}%` }}
                      />
                      <span className={styles.bar__value}>{formatNumber(hoursOf(row), 1)}</span>
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
              <td className={styles.table__rank} />
              <th scope="row" className={styles.table__name}>총계</th>
              <td className={styles.table__num}>{formatNumber(totals.capacityKw, 1)}</td>
              <td className={styles.table__num}>{formatNumber(totals.outputKw, 1)}</td>
              <td className={styles.table__num}>{formatNumber(totals.todayKwh)}</td>
              <td className={styles.table__share}>{formatNumber(hoursOf(totals), 1)}</td>
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
