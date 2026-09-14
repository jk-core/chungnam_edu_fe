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
import { Panel } from './Panel';
import { StatusMeter } from './StatusMeter';
import { TONE_VAR } from './status';
import styles from './PlantMapPanel.module.scss';
import type { CSSProperties } from 'react';

/** 이름표가 시·군 면 밖으로 밀려나지 않게 두는 여백 */
const EDGE_PAD = 34;

/** 손봐야 할 곳을 몇 곳까지 이름으로 적을지 — 나머지는 「외 N곳」 으로 접는다 */
const NAMED_FAULTS = 3;

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

interface PlantMapPanelProps {
  plants: School[];
  abnormalCount: number;
}

/**
 * 관내 발전소 현황 (SFR-004-01/03/14) — 청사진 판.
 *
 * 기본은 시·군 도형 지도다. 항공사진(「지도」) 위에 점을 찍던 자리를 도형만 남겨 그 면적을
 * 수치의 자리로 쓴다. 열다섯 시·군에 늘 이름·개소를 얹고, 순회가 머무는 한 곳의 상세를 옆에
 * 편다. 도형은 CI 색 실선으로만 둘러 유리 판을 채우지 않는다 — 격자가 지도를 가로질러 이어진다.
 *
 * 항공사진은 카카오 지도 SDK 라 그대로 재사용한다(`FaultMap`). 한 곳을 찾을 때 꺼내 보는
 * 보조 화면이라 기본값은 시·군 쪽이다.
 */
export function PlantMapPanel({ plants, abnormalCount }: PlantMapPanelProps) {
  const [view, setView] = useState<MapView>('region');

  const rows = useMemo((): RegionStat[] => {
    const byRegion = new Map<string, School[]>();

    plants.forEach((school) => {
      const bucket = byRegion.get(school.regionName);

      if (bucket) bucket.push(school);
      else byRegion.set(school.regionName, [school]);
    });

    const provinceCapacity = plants.reduce((sum, school) => sum + school.capacityKw, 0) || 1;
    const provinceToday = plants.reduce((sum, school) => sum + school.todayKwh, 0) || 1;

    // 순회 차례는 옆 판(AI 진단)과 같은 것을 본다 — 두 판이 늘 같은 시·군을 비추게 한다.
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

  const note = (
    <span className={styles.tools}>
      <span>{`${formatNumber(plants.length)}개소 · 이상 ${formatNumber(abnormalCount)}개소`}</span>
      <SegmentedControl label="지도 표시 방식" size="sm" options={MAP_VIEW_OPTIONS} value={view} onChange={setView} />
    </span>
  );

  if (view === 'photo') {
    return (
      <Panel title="관내 발전소 현황" note={note} grow>
        <div className={styles.photo}>
          <FaultMap plants={plants} scope="all" height="100%" selectable tour />
        </div>
      </Panel>
    );
  }

  const capacity = formatCapacity(active.capacityKw);
  const output = formatCapacity(active.outputKw);
  const today = formatEnergy(active.todayKwh);

  // 손봐야 할 곳 — 급한 순으로 세워 앞의 셋만 이름을 적는다.
  const faults = active.schools
    .filter((school) => isAbnormal(school.status))
    .sort((a, b) => OPERATION_RANK[b.status] - OPERATION_RANK[a.status]);

  const figures = [
    { id: 'count', label: '개소', value: formatNumber(active.count), unit: '' },
    { id: 'capacity', label: '설비용량', value: capacity.value, unit: capacity.unit },
    { id: 'output', label: '실시간 출력', value: output.value, unit: output.unit },
    { id: 'today', label: '금일 발전량', value: today.value, unit: today.unit },
    { id: 'hours', label: '발전시간', value: formatNumber(active.hours, 1), unit: 'h' },
    { id: 'util', label: '이용률', value: formatPercent(active.utilization, 1), unit: '' },
  ];

  return (
    <Panel title="관내 발전소 현황" note={note} grow>
      <div className={styles.map}>
        <svg
          className={styles.map__canvas}
          viewBox={`0 0 ${REGION_VIEW.width} ${REGION_VIEW.height}`}
          aria-label={`충청남도 시·군별 현황. 지금 ${active.name}`}
        >
          {REGION_SHAPES.map((shape) => {
            const at = rows.findIndex((row) => row.name === shape.region);

            return (
              <path
                key={shape.id}
                className={styles.map__cell}
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

        {/* 머무는 시·군의 상세 — 지도에 다 얹지 못한 값을 이리로 뺀다 */}
        <div className={styles.now} aria-live="off">
          <div className={styles.now__head}>
            <span className={styles.now__mark} style={{ '--cell': REGION_CI_COLOR[active.name] } as CSSProperties} aria-hidden />
            <strong className={styles.now__name}>{active.name}</strong>
            {active.abnormal > 0 ? (
              <span className={styles.now__abnormal}>이상 {formatNumber(active.abnormal)}</span>
            ) : null}
          </div>

          <dl className={styles.figures}>
            {figures.map((figure) => (
              <div key={figure.id} className={styles.figures__item}>
                <dt className={styles.figures__label}>{figure.label}</dt>
                <dd className={styles.figures__value}>
                  {figure.value}
                  {figure.unit ? <span className={styles.figures__unit}>{figure.unit}</span> : null}
                </dd>
              </div>
            ))}
          </dl>

          {/* 도 전체에서 차지하는 몫 — 설비와 발전을 나란히 두면 어긋남 자체가 읽을거리다 */}
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
                    style={{ width: `${Math.min(100, item.ratio * 100)}%`, '--cell': REGION_CI_COLOR[active.name] } as CSSProperties}
                  />
                </span>
                <span className={styles.share__value}>{formatPercent(item.ratio, 1)}</span>
              </p>
            ))}
          </div>

          <StatusMeter plants={active.schools} />

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
                    <span className={styles.faults__state} style={{ '--seg': TONE_VAR[OPERATION_TONE[school.status]] } as CSSProperties}>
                      {OPERATION_LABEL[school.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 순회 눈금이자 고르개 */}
          <div className={styles.tour}>
            <button
              type="button"
              className={styles.tour__play}
              onClick={() => tour.toggle()}
              aria-label={tour.isPlaying ? '순회 멈춤' : '순회 시작'}
            >
              {tour.isPlaying ? <PauseIcon width={13} height={13} /> : <PlayIcon width={13} height={13} />}
            </button>

            <ol className={styles.tour__dots}>
              {rows.map((row, at) => (
                <li key={row.name}>
                  <button
                    type="button"
                    className={styles.tour__dot}
                    data-on={at === tour.index ? '' : undefined}
                    style={{ '--cell': REGION_CI_COLOR[row.name] } as CSSProperties}
                    onClick={() => tour.goTo(at)}
                    aria-label={row.name}
                    aria-current={at === tour.index ? 'true' : undefined}
                  />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Panel>
  );
}
