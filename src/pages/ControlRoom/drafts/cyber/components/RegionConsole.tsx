import { useMemo } from 'react';
import { REGION_CI_COLOR, REGION_SHAPE_BOX, REGION_SHAPES, REGION_VIEW } from '@/assets/geo/chungnamRegions';
import { PauseIcon, PlayIcon } from '@/components/common/Icon';
import { isAbnormal, OPERATION_LABEL, OPERATION_RANK, OPERATION_TONE } from '@/mocks/status';
import { currentOutputOf } from '@/mocks/schoolOutput';
import { formatCapacity, formatEnergy, formatNumber, formatPercent } from '@/utils/format';
import type { School } from '@/interface/energy';
import { orderRegionNames, useRegionTour } from '@/pages/ControlRoom/utils/regionTour';
import { CyberStatusMix } from './CyberStatusMix';
import styles from './RegionConsole.module.scss';
import type { CSSProperties } from 'react';

/** 이름표가 시·군 면 밖으로 밀려나지 않게 두는 여백 */
const EDGE_PAD = 34;

/** 손봐야 할 곳을 몇 곳까지 이름으로 적을지 — 나머지는 「외 N곳」 으로 접는다 */
const NAMED_FAULTS = 3;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** 시·군 면의 한가운데 — 이름표가 앉는 자리다 */
function centerOf(region: string) {
  const box = REGION_SHAPE_BOX[region];

  if (!box) return { x: REGION_VIEW.width / 2, y: REGION_VIEW.height / 2 };

  return {
    x: clamp(box.x + box.width / 2, EDGE_PAD, REGION_VIEW.width - EDGE_PAD),
    y: clamp(box.y + box.height / 2, 12, REGION_VIEW.height - 12),
  };
}

/** 한 시·군이 화면에 내놓는 것 전부 */
interface RegionStat {
  name: string;
  schools: School[];
  count: number;
  capacityKw: number;
  todayKwh: number;
  outputKw: number;
  abnormal: number;
  hours: number;
  utilization: number;
  capacityShare: number;
  todayShare: number;
}

/**
 * 시·군별 현황 지도 (SFR-004-01/03/08/09/14) — 기본(시·군) 보기.
 *
 * 담는 것은 시안 A 의 `RegionStatMap` 과 같다 — 시·군 도형 지도(개소 수·상태색·순회)와 머무는
 * 시·군 상세(개소/설비용량/실시간 출력/금일 발전량/발전시간/이용률/도 대비 몫/상태 분포/손봐야
 * 할 곳), 순회 재생·정지·점 눈금.
 *
 * A 는 가로로 긴 칸에 도형과 상세를 좌우로 갈랐다. 이 판은 1150×940 의 큰 칸을 세로로
 * 통째로 받으므로, 도형을 계측기의 표시창(눈금 바탕에 모서리 표식을 두른 화면)에 담아 왼쪽에
 * 세우고 상세를 오른쪽 판독대에 세운다 — 도형의 세로가 칸을 다 쓰고, 판독대는 넉넉한 높이를
 * 받아 여섯 계측값과 상태 분포·목록이 접히지 않는다.
 */
export function RegionConsole({ plants }: { plants: School[] }) {
  const rows = useMemo((): RegionStat[] => {
    const byRegion = new Map<string, School[]>();

    plants.forEach((school) => {
      const bucket = byRegion.get(school.regionName);

      if (bucket) bucket.push(school);
      else byRegion.set(school.regionName, [school]);
    });

    const provinceCapacity = plants.reduce((sum, school) => sum + school.capacityKw, 0) || 1;
    const provinceToday = plants.reduce((sum, school) => sum + school.todayKwh, 0) || 1;

    // 순회 차례는 옆 판(AI 진단)과 같은 것을 본다 — `orderRegionNames` 한 곳에서 정한다.
    return orderRegionNames(plants).map((region): RegionStat => {
      const schools = byRegion.get(region) ?? [];
      const capacityKw = schools.reduce((sum, school) => sum + school.capacityKw, 0);
      const todayKwh = schools.reduce((sum, school) => sum + school.todayKwh, 0);
      const outputKw = schools.reduce((sum, school) => sum + currentOutputOf(school), 0);

      return {
        name: region,
        schools,
        count: schools.length,
        capacityKw,
        todayKwh,
        outputKw,
        abnormal: schools.filter((school) => isAbnormal(school.status)).length,
        hours: capacityKw > 0 ? todayKwh / capacityKw : 0,
        utilization: capacityKw > 0 ? outputKw / capacityKw : 0,
        capacityShare: capacityKw / provinceCapacity,
        todayShare: todayKwh / provinceToday,
      };
    });
  }, [plants]);

  // 자리는 벽시계에서 셈한다 — 옆 판(AI 진단)도 같은 식을 써 늘 같은 시·군을 본다
  const tour = useRegionTour(rows.length);
  const active = rows[tour.index] ?? rows[0];

  const capacity = formatCapacity(active.capacityKw);
  const output = formatCapacity(active.outputKw);
  const today = formatEnergy(active.todayKwh);

  // 손봐야 할 곳 — 급한 순으로 세워 앞의 셋만 이름을 적는다.
  const faults = active.schools
    .filter((school) => isAbnormal(school.status))
    .sort((a, b) => OPERATION_RANK[b.status] - OPERATION_RANK[a.status]);

  return (
    <div className={styles.console}>
      <div className={styles.display}>
        <svg
          className={styles.display__canvas}
          viewBox={`0 0 ${REGION_VIEW.width} ${REGION_VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-label={`충청남도 시·군별 현황. 지금 ${active.name}`}
        >
          {/* 면을 눌러 그 시·군으로 — 순회를 기다리지 않고 보고 싶은 곳으로 바로 간다 */}
          {REGION_SHAPES.map((shape) => {
            const at = rows.findIndex((row) => row.name === shape.region);

            return (
              <path
                key={shape.id}
                className={styles.display__cell}
                style={{ '--cell': REGION_CI_COLOR[shape.region] } as CSSProperties}
                data-on={shape.region === active.name ? '' : undefined}
                data-pick={at >= 0 ? '' : undefined}
                role={at >= 0 ? 'button' : undefined}
                tabIndex={at >= 0 ? 0 : undefined}
                aria-label={at >= 0 ? `${shape.region} 보기` : undefined}
                aria-current={shape.region === active.name ? 'true' : undefined}
                onClick={at >= 0 ? () => tour.goTo(at) : undefined}
                onKeyDown={at >= 0 ? (event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;

                  event.preventDefault();
                  tour.goTo(at);
                } : undefined}
                d={shape.d}
                transform={shape.transform}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* 이름표는 면을 다 그린 뒤에 얹는다 — 뒤에 오는 면이 앞서 그린 이름표를 덮지 않게 */}
          {rows.map((row) => {
            const at = centerOf(row.name);

            return (
              <g
                key={row.name}
                className={styles.tag}
                data-on={row.name === active.name ? '' : undefined}
                transform={`translate(${at.x} ${at.y})`}
              >
                <text className={styles.tag__name} y={0} textAnchor="middle">{row.name}</text>
                <text className={styles.tag__count} y={18} textAnchor="middle">
                  {row.count > 0 ? `${formatNumber(row.count)}개소` : '-'}
                </text>
              </g>
            );
          })}
        </svg>

        {/* 순회 눈금이자 고르개 — 한 곳에 눈이 머물면 그 자리에서 세울 수 있어야 한다 */}
        <div className={styles.tour}>
          <button
            type="button"
            className={styles.tour__play}
            onClick={() => tour.toggle()}
            aria-label={tour.isPlaying ? '순회 멈춤' : '순회 시작'}
          >
            {tour.isPlaying ? <PauseIcon width={14} height={14} /> : <PlayIcon width={14} height={14} />}
          </button>

          <ol className={styles.tour__dots}>
            {rows.map((row, at) => (
              <li key={row.name}>
                <button
                  type="button"
                  className={styles.tour__dot}
                  data-on={at === tour.index ? '' : undefined}
                  style={{ '--dot': REGION_CI_COLOR[row.name] } as CSSProperties}
                  onClick={() => tour.goTo(at)}
                  aria-label={row.name}
                  aria-current={at === tour.index ? 'true' : undefined}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* 머무는 시·군의 판독대 */}
      <div className={styles.readout} aria-live="off">
        <div className={styles.readout__head}>
          <span className={styles.readout__color} style={{ backgroundColor: REGION_CI_COLOR[active.name] }} aria-hidden />
          <strong className={styles.readout__name}>{active.name}</strong>
          {active.abnormal > 0 ? (
            <span className={styles.readout__abnormal}>이상 {formatNumber(active.abnormal)}</span>
          ) : null}
        </div>

        <dl className={styles.figures}>
          <div>
            <dt>개소</dt>
            <dd>{formatNumber(active.count)}</dd>
          </div>
          <div>
            <dt>설비용량</dt>
            <dd>{capacity.value}<span>{capacity.unit}</span></dd>
          </div>
          <div>
            <dt>실시간 출력</dt>
            <dd>{output.value}<span>{output.unit}</span></dd>
          </div>
          <div>
            <dt>금일 발전량</dt>
            <dd>{today.value}<span>{today.unit}</span></dd>
          </div>
          <div>
            <dt>발전시간</dt>
            <dd>{formatNumber(active.hours, 1)}<span>h</span></dd>
          </div>
          <div>
            <dt>이용률</dt>
            <dd>{formatPercent(active.utilization, 1)}</dd>
          </div>
        </dl>

        {/* 도 전체에서 차지하는 몫 — 설비와 발전을 나란히 둬 어긋남 자체가 읽을거리다 */}
        <div className={styles.share}>
          {[
            { id: 'capacity', label: '도 대비 설비', ratio: active.capacityShare },
            { id: 'today', label: '도 대비 발전', ratio: active.todayShare },
          ].map((item) => (
            <p key={item.id} className={styles.share__row}>
              <span className={styles.share__label}>{item.label}</span>
              <span className={styles.share__track}>
                <span
                  className={styles.share__bar}
                  style={{ width: `${Math.min(100, item.ratio * 100)}%`, backgroundColor: REGION_CI_COLOR[active.name] }}
                />
              </span>
              <span className={styles.share__value}>{formatPercent(item.ratio, 1)}</span>
            </p>
          ))}
        </div>

        <div className={styles.readout__mix}>
          <CyberStatusMix plants={active.schools} />
        </div>

        <div className={styles.faults}>
          <p className={styles.faults__title}>
            손봐야 할 곳
            {faults.length > NAMED_FAULTS ? (
              <span className={styles.faults__more}>외 {formatNumber(faults.length - NAMED_FAULTS)}곳</span>
            ) : null}
          </p>

          {faults.length === 0 ? (
            <p className={styles.faults__none}>없습니다</p>
          ) : (
            <ul className={styles.faults__list}>
              {faults.slice(0, NAMED_FAULTS).map((school) => (
                <li key={school.id} className={styles.faults__item}>
                  <span className={styles.faults__name}>{school.name}</span>
                  <span className={styles.faults__state} data-tone={OPERATION_TONE[school.status]}>
                    {OPERATION_LABEL[school.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
