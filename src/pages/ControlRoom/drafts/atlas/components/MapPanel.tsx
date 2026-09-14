import { useMemo, useState } from 'react';
import { REGION_CI_COLOR, REGION_SHAPE_BOX, REGION_SHAPES, REGION_VIEW } from '@/assets/geo/chungnamRegions';
import { PauseIcon, PlayIcon } from '@/components/common/Icon';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { isAbnormal, OPERATION_LABEL, OPERATION_RANK, OPERATION_TONE } from '@/mocks/status';
import { currentOutputOf } from '@/mocks/schoolOutput';
import { formatCapacity, formatEnergy, formatNumber, formatPercent } from '@/utils/format';
import type { School } from '@/interface/energy';
import { orderRegionNames, useRegionTour } from '@/pages/ControlRoom/utils/regionTour';
import { FaultMap } from '@/pages/ControlRoom/components/FaultMap';
import { StatusRule } from './StatusRule';
import { Panel } from './Panel';
import styles from './MapPanel.module.scss';
import type { CSSProperties } from 'react';

/** 이름표가 시·군 면 밖으로 밀려나지 않게 두는 여백 */
const EDGE_PAD = 34;

/** 손봐야 할 곳을 몇 곳까지 이름으로 적을지 — 나머지는 「외 N곳」 으로 접는다 */
const NAMED_FAULTS = 4;

/** 관내 발전소 현황을 그리는 두 방식 */
type MapView = 'region' | 'photo';

const MAP_VIEW_OPTIONS: { value: MapView; label: string }[] = [
  { value: 'region', label: '시·군' },
  { value: 'photo', label: '지도' },
];

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
 * 관내 발전소 현황 (SFR-004-01/03/14) — 아틀라스 판.
 *
 * 두 가지로 볼 수 있는 것은 A 와 같다. 기본인 **시·군** 은 도형만 남기고 면을 수치의 자리로
 * 쓰고, **지도** 는 항공사진 위에 발전소를 점으로 찍는다. 사진 지도는 카카오 SDK 연동이라
 * 공용 `FaultMap` 을 그대로 재사용하고, 새로 짜는 것은 시·군 도형 쪽뿐이다.
 */
export function MapPanel({ plants, abnormalCount }: { plants: School[]; abnormalCount: number }) {
  const [view, setView] = useState<MapView>('region');

  return (
    <Panel
      title="관내 발전소 현황"
      note={(
        <span className={styles.tools}>
          <span className={styles.tools__count}>{`${formatNumber(plants.length)}개소 · 이상 ${formatNumber(abnormalCount)}개소`}</span>
          <SegmentedControl
            label="지도 표시 방식"
            size="sm"
            options={MAP_VIEW_OPTIONS}
            value={view}
            onChange={setView}
          />
        </span>
      )}
    >
      {view === 'region'
        ? <RegionAtlas plants={plants} />
        : <div className={styles.photo}><FaultMap plants={plants} scope="all" height="100%" selectable tour /></div>}
    </Panel>
  );
}

/**
 * 시·군 도형 지도 + 머무는 시·군 상세.
 *
 * A 의 `RegionStatMap` 은 오른쪽 372px 고정폭에 상세를 세로로 쌓았는데, 이 시안의 지도 칸은
 * 세로가 800px 이라 그 상세 아래가 크게 비었다(고객 지적). 여기서는 상세 난을 판 높이에 맞춰
 * **위에서 아래로 고르게 편다** — 개요 수치를 큰 눈금으로 세우고, 도 대비 몫·상태 분포·손봐야 할
 * 곳을 사이를 벌려 채워, 빈 여백이 남지 않게 한다. 지도 도형은 왼쪽 면을 크게 쓰고 그 아래
 * 순회 눈금을 둔다.
 *
 * 순회 차례·자리는 옆 판(AI 진단)과 같은 `regionTour` 를 본다 — 두 판이 늘 같은 시·군을 비춘다.
 */
function RegionAtlas({ plants }: { plants: School[] }) {
  const rows = useMemo((): RegionStat[] => {
    const byRegion = new Map<string, School[]>();

    plants.forEach((school) => {
      const bucket = byRegion.get(school.regionName);

      if (bucket) bucket.push(school);
      else byRegion.set(school.regionName, [school]);
    });

    const provinceCapacity = plants.reduce((sum, school) => sum + school.capacityKw, 0) || 1;
    const provinceToday = plants.reduce((sum, school) => sum + school.todayKwh, 0) || 1;

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

  const tour = useRegionTour(rows.length);
  const active = rows[tour.index] ?? rows[0];

  const capacity = formatCapacity(active.capacityKw);
  const output = formatCapacity(active.outputKw);
  const today = formatEnergy(active.todayKwh);

  // 급한 순으로 세워 앞의 몇만 이름을 적는다 — 전부는 옆 판(장애 발생 현황)이 도 전체로 맡는다.
  const faults = active.schools
    .filter((school) => isAbnormal(school.status))
    .sort((a, b) => OPERATION_RANK[b.status] - OPERATION_RANK[a.status]);

  const figures = [
    { key: 'count', label: '개소', value: formatNumber(active.count), unit: '' },
    { key: 'capacity', label: '설비용량', value: capacity.value, unit: capacity.unit },
    { key: 'output', label: '실시간 출력', value: output.value, unit: output.unit },
    { key: 'today', label: '금일 발전량', value: today.value, unit: today.unit },
    { key: 'hours', label: '발전시간', value: formatNumber(active.hours, 1), unit: 'h' },
    { key: 'util', label: '이용률', value: formatPercent(active.utilization, 1), unit: '' },
  ];

  return (
    <div className={styles.atlas}>
      {/* 왼쪽 면 — 도형 지도와 그 아래 순회 눈금 */}
      <div className={styles.plate}>
        <svg
          className={styles.plate__canvas}
          viewBox={`0 0 ${REGION_VIEW.width} ${REGION_VIEW.height}`}
          aria-label={`충청남도 시·군별 현황. 지금 ${active.name}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {REGION_SHAPES.map((shape) => {
            const to = rows.findIndex((row) => row.name === shape.region);

            return (
              <path
                key={shape.id}
                className={styles.cell}
                style={{ '--cell': REGION_CI_COLOR[shape.region] } as CSSProperties}
                data-on={shape.region === active.name ? '' : undefined}
                data-pick={to >= 0 ? '' : undefined}
                role={to >= 0 ? 'button' : undefined}
                tabIndex={to >= 0 ? 0 : undefined}
                aria-label={to >= 0 ? `${shape.region} 보기` : undefined}
                aria-current={shape.region === active.name ? 'true' : undefined}
                onClick={to >= 0 ? () => tour.goTo(to) : undefined}
                onKeyDown={to >= 0 ? (event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;

                  event.preventDefault();
                  tour.goTo(to);
                } : undefined}
                d={shape.d}
                transform={shape.transform}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* 이름표는 면을 다 그린 뒤 얹는다 — 섞어 그리면 뒤 면이 앞 이름표를 덮는다 */}
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
                <text className={styles.tag__count} y={16} textAnchor="middle">
                  {row.count > 0 ? `${formatNumber(row.count)}개소` : '-'}
                </text>
              </g>
            );
          })}
        </svg>

        <div className={styles.plate__tour}>
          <button
            type="button"
            className={styles.plate__play}
            onClick={() => tour.toggle()}
            aria-label={tour.isPlaying ? '순회 멈춤' : '순회 시작'}
          >
            {tour.isPlaying ? <PauseIcon width={13} height={13} /> : <PlayIcon width={13} height={13} />}
          </button>

          <ol className={styles.dots}>
            {rows.map((row, at) => (
              <li key={row.name}>
                <button
                  type="button"
                  className={styles.dots__dot}
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

      {/* 오른쪽 상세 난 — 판 높이에 맞춰 위에서 아래로 고르게 편다 */}
      <div className={styles.detail}>
        <div className={styles.detail__head}>
          <span className={styles.detail__swatch} style={{ backgroundColor: REGION_CI_COLOR[active.name] }} aria-hidden="true" />
          <strong className={styles.detail__name}>{active.name}</strong>
          {active.abnormal > 0 ? (
            <span className={styles.detail__abnormal}>이상 {formatNumber(active.abnormal)}</span>
          ) : null}
        </div>

        <dl className={styles.figures}>
          {figures.map((item) => (
            <div key={item.key} className={styles.figures__cell}>
              <dt className={styles.figures__label}>{item.label}</dt>
              <dd className={styles.figures__value}>
                {item.value}{item.unit ? <span className={styles.figures__unit}>{item.unit}</span> : null}
              </dd>
            </div>
          ))}
        </dl>

        {/* 도 전체에서 차지하는 몫 — 설비와 발전을 나란히 둔다. 둘이 어긋나면 그 자체가 읽을거리다 */}
        <div className={styles.share}>
          {[
            { id: 'capacity', label: '도 대비 설비', ratio: active.capacityShare },
            { id: 'today', label: '도 대비 발전', ratio: active.todayShare },
          ].map((item) => (
            <p key={item.id} className={styles.share__row}>
              <span className={styles.share__label}>{item.label}</span>
              <span className={styles.share__rule}>
                <span
                  className={styles.share__fill}
                  style={{ width: `${Math.min(100, item.ratio * 100)}%`, backgroundColor: REGION_CI_COLOR[active.name] }}
                />
              </span>
              <span className={styles.share__value}>{formatPercent(item.ratio, 1)}</span>
            </p>
          ))}
        </div>

        <div className={styles.detail__mix}>
          <StatusRule plants={active.schools} />
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
