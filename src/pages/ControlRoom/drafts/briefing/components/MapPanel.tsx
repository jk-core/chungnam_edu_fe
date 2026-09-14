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
import { StatusBar } from './StatusBar';
import styles from './MapPanel.module.scss';
import type { CSSProperties } from 'react';

/** 관내 발전소 현황을 그리는 두 방식 */
type MapView = 'region' | 'photo';

const MAP_VIEW_OPTIONS: { value: MapView; label: string }[] = [
  { value: 'region', label: '시·군' },
  { value: 'photo', label: '지도' },
];

/** 손봐야 할 곳을 몇 곳까지 이름으로 적을지 — 나머지는 「외 N곳」 으로 접는다 */
const NAMED_FAULTS = 4;

/** 이름표가 시·군 면 밖으로 밀려나지 않게 두는 여백 */
const EDGE_PAD = 34;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** 시·군 면의 한가운데 — 이름표가 앉는 자리다 */
function centerOf(region: string) {
  const box = REGION_SHAPE_BOX[region];

  if (!box) return { x: REGION_VIEW.width / 2, y: REGION_VIEW.height / 2 };

  return {
    x: clamp(box.x + box.width / 2, EDGE_PAD, REGION_VIEW.width - EDGE_PAD),
    y: clamp(box.y + box.height / 2, 14, REGION_VIEW.height - 14),
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
 * 관내 발전소 현황 (SFR-004-01/03/08/09/14).
 *
 * 두 가지로 볼 수 있다. **시·군**은 도형만 남기고 그 면적을 전부 수치의 자리로 쓰고 (2026-09-04
 * 노트 — 「지도 대신 충남만 띄워서 각 지역별로 통계자료를」), **지도**는 항공사진 위에 발전소를
 * 점으로 찍는다. 걸어 두는 화면의 기본값은 시·군 쪽이다 — 종일 지켜보는 사람에게는 수치가
 * 먼저이고 사진은 한 곳을 찾을 때 꺼내 본다.
 *
 * 이 시안의 이 칸은 가로로 아주 넓다. A 는 좁은 세로 칸에 지도와 상세를 위아래로 쌓아 지도가
 * 손톱만 해졌는데, 여기서는 지도를 왼쪽에 크게 세우고 상세를 오른쪽 폭에 가로로 편다 —
 * 넓은 폭이 지도를 키우는 데도, 열다섯 수치를 늘어놓는 데도 함께 쓰인다.
 */
export function MapPanel({
  plants, abnormalCount,
}: { plants: School[]; abnormalCount: number }) {
  const [view, setView] = useState<MapView>('region');

  const note = (
    <>
      <span className={styles.count}>{formatNumber(plants.length)}개소 · 이상 {formatNumber(abnormalCount)}</span>
      <SegmentedControl
        label="지도 표시 방식"
        size="sm"
        options={MAP_VIEW_OPTIONS}
        value={view}
        onChange={setView}
      />
    </>
  );

  return (
    <Panel title="관내 발전소 현황" note={note}>
      {view === 'region'
        ? <RegionStatMap plants={plants} />
        : (
          <div className={styles.photo}>
            <FaultMap plants={plants} scope="all" height="100%" selectable tour />
          </div>
        )}
    </Panel>
  );
}

/** 시·군 도형 지도 + 머무는 시·군의 상세 */
function RegionStatMap({ plants }: { plants: School[] }) {
  const rows = useMemo((): RegionStat[] => {
    const byRegion = new Map<string, School[]>();

    plants.forEach((school) => {
      const bucket = byRegion.get(school.regionName);

      if (bucket) bucket.push(school);
      else byRegion.set(school.regionName, [school]);
    });

    const provinceCapacity = plants.reduce((sum, school) => sum + school.capacityKw, 0) || 1;
    const provinceToday = plants.reduce((sum, school) => sum + school.todayKwh, 0) || 1;

    /*
      순회 차례는 옆 판(AI 진단)과 같은 것을 본다 (2026-09-07 지시) — 같은 목록을 같은 차례로
      돌아야 두 판이 늘 같은 시·군을 비춘다. 도형은 열다섯을 다 그리되 순회는 발전소가 있는
      곳만 돈다.
    */
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

  const figures = [
    { id: 'count', label: '개소', value: formatNumber(active.count), unit: '' },
    { id: 'capacity', label: '설비용량', value: capacity.value, unit: capacity.unit },
    { id: 'output', label: '실시간 출력', value: output.value, unit: output.unit },
    { id: 'today', label: '금일 발전량', value: today.value, unit: today.unit },
    { id: 'hours', label: '발전시간', value: formatNumber(active.hours, 1), unit: 'h' },
    { id: 'util', label: '이용률', value: formatPercent(active.utilization, 1), unit: '' },
  ];

  // 손봐야 할 곳 — 급한 순으로 앞의 넷만 이름을 적는다. 도 전체 목록은 옆 판이 맡는다.
  const faults = active.schools
    .filter((school) => isAbnormal(school.status))
    .sort((a, b) => OPERATION_RANK[b.status] - OPERATION_RANK[a.status]);

  return (
    <div className={styles.map}>
      <div className={styles.map__canvas}>
        <svg
          className={styles.canvas}
          viewBox={`0 0 ${REGION_VIEW.width} ${REGION_VIEW.height}`}
          aria-label={`충청남도 시·군별 현황. 지금 ${active.name}`}
        >
          {/* 면을 눌러 그 시·군으로 (2026-09-07 지시). 발전소가 없는 시·군은 갈 자리가 없어 누르지 못한다 */}
          {REGION_SHAPES.map((shape) => {
            const at = rows.findIndex((row) => row.name === shape.region);

            return (
              <path
                key={shape.id}
                className={styles.cell}
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

          {/* 이름표는 면을 다 그린 뒤에 얹는다 — 섞어 그리면 뒤 시·군 면이 앞 이름표를 덮는다 */}
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
      </div>

      {/* 머무는 시·군의 상세 — 넓은 폭을 살려 수치를 가로로 편다 */}
      <div className={styles.detail} aria-live="off">
        <div className={styles.detail__head}>
          <span className={styles.detail__color} style={{ backgroundColor: REGION_CI_COLOR[active.name] }} aria-hidden />
          <strong className={styles.detail__name}>{active.name}</strong>
          {active.abnormal > 0 ? (
            <span className={styles.detail__abnormal}>이상 {formatNumber(active.abnormal)}</span>
          ) : (
            <span className={styles.detail__ok}>전체 정상</span>
          )}

          <span className={styles.tour}>
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
                    style={{ '--dot': REGION_CI_COLOR[row.name] } as CSSProperties}
                    onClick={() => tour.goTo(at)}
                    aria-label={row.name}
                    aria-current={at === tour.index ? 'true' : undefined}
                  />
                </li>
              ))}
            </ol>
          </span>
        </div>

        <div className={styles.detail__body}>
          <dl className={styles.figures}>
            {figures.map((figure) => (
              <div key={figure.id} className={styles.figure}>
                <dt className={styles.figure__label}>{figure.label}</dt>
                <dd className={styles.figure__value}>
                  {figure.value}
                  {figure.unit ? <span className={styles.figure__unit}>{figure.unit}</span> : null}
                </dd>
              </div>
            ))}
          </dl>

          <div className={styles.detail__side}>
            {/*
              도 전체에서 차지하는 몫. 설비와 발전을 나란히 둔다 — 둘이 어긋나 있는 것 자체가
              읽을거리다. 설비 몫보다 발전 몫이 작으면 그 시·군이 오늘 제 몫을 못 낸 것이다.
            */}
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
                      style={{
                        width: `${Math.min(100, item.ratio * 100)}%`,
                        backgroundColor: REGION_CI_COLOR[active.name],
                      }}
                    />
                  </span>
                  <span className={styles.share__value}>{formatPercent(item.ratio, 1)}</span>
                </p>
              ))}
            </div>

            <StatusBar plants={active.schools} />
          </div>
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
                <li key={school.id} className={styles.faults__item} data-tone={OPERATION_TONE[school.status]}>
                  <span className={styles.faults__name} title={school.name}>{school.name}</span>
                  <span className={styles.faults__state}>{OPERATION_LABEL[school.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
