import { useMemo } from 'react';
import { REGION_CI_COLOR, REGION_SHAPE_BOX, REGION_SHAPES, REGION_VIEW } from '@/assets/geo/chungnamRegions';
import { PauseIcon, PlayIcon } from '@/components/common/Icon';
import { isAbnormal, OPERATION_LABEL, OPERATION_RANK, OPERATION_TONE } from '@/mocks/status';
import { currentOutputOf } from '@/mocks/schoolOutput';
import { formatCapacity, formatEnergy, formatNumber, formatPercent } from '@/utils/format';
import type { School } from '@/interface/energy';
import { orderRegionNames, useRegionTour } from '../utils/regionTour';
import { StatusMix } from './StatusMix';
import styles from './RegionStatMap.module.scss';

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
  /** 금일 발전시간(h) = 금일 발전량 ÷ 설비용량. 큰 지역과 작은 지역을 같은 눈금에 세운다 */
  hours: number;
  /** 지금 이용률 = 실시간 출력 ÷ 설비용량 */
  utilization: number;
  /** 도 전체에서 이 시·군이 차지하는 몫 */
  capacityShare: number;
  todayShare: number;
}

interface RegionStatMapProps {
  /** 조회 조건에 걸린 발전소 전부 */
  plants: School[];
}

/**
 * 시·군별 현황 지도 (SFR-004-01/03/08/09/14).
 *
 * 항공사진 위에 점을 찍던 자리를 대신한다 (2026-09-04 노트 — 「지도 대신 충남만 띄워서 각
 * 지역별로 통계자료를 보여주는 게 어떨지」). 걸어 두고 보는 화면에서 항공사진은 배경일 뿐
 * 아무것도 말해 주지 않는데, 면적을 통째로 쓴다. 도형만 남기면 그 면적이 전부 수치의 자리가 된다.
 *
 * 두 가지를 한꺼번에 한다 — 열다섯 시·군에 **늘** 이름과 개소를 얹어 두고, 그 위를 한 곳씩
 * **순회**하며 머무는 곳의 상세를 옆에 편다. 둘 중 하나만 하면 한쪽이 아쉽다. 상시 표기만 두면
 * 수치를 모두 얹어야 해 열다섯 곳이 글자로 덮이고, 순회만 두면 지금 비치지 않는 열네 곳은
 * 화면에 없는 것과 같다.
 *
 * 면 색은 충청남도 CI 여섯 색을 돌려 쓴다 (조치사항 #8). 값의 크기를 뜻하지 않는다 — 크기는
 * 이름표의 수치가 말하고, 색은 시·군을 가르는 구실만 한다. 그래서 단계색(`--map-scale-*`)을
 * 쓰지 않는다. 값에 따라 진해지는 색과 섞이면 둘 다 읽히지 않는다.
 */
export function RegionStatMap({ plants }: RegionStatMapProps) {
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
      순회 차례는 옆 판(AI 진단)과 같은 것을 본다 (2026-09-07 지시).

      전에는 도형 차례대로 돌았다 — 지도를 훑는 느낌은 좋지만, 두 판이 같은 시각에 서로 다른
      시·군을 비추어 「왼쪽 지도의 저 곳」 과 「오른쪽 진단의 저 곳」 을 눈이 따로 좇아야 했다.
      발전소가 없는 시·군이 순회에서 빠지는 것도 같은 규칙을 쓰기 때문이다. 도형은 열다섯을
      그대로 다 그린다 — 도의 모양이 조회 조건에 따라 이지러질 수는 없다.
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

  // 자리는 벽시계에서 셈한다 — 옆 판(AI 진단)도 같은 식을 써서 늘 같은 시·군을 본다
  const tour = useRegionTour(rows.length);
  const active = rows[tour.index] ?? rows[0];

  const capacity = formatCapacity(active.capacityKw);
  const output = formatCapacity(active.outputKw);
  const today = formatEnergy(active.todayKwh);

  /*
    손봐야 할 곳.

    급한 순으로 세워 앞의 셋만 이름을 적는다. 이름을 다 적으면 스물 몇 줄이 되어 위의 수치를
    밀어내고, 그 목록은 옆 판(장애 발생 현황)이 도 전체로 이미 맡고 있다. 여기서 답해야 할 것은
    「이 시·군에서 지금 무엇이」 이지 「전부 무엇이」 가 아니다.
  */
  const faults = active.schools
    .filter((school) => isAbnormal(school.status))
    .sort((a, b) => OPERATION_RANK[b.status] - OPERATION_RANK[a.status]);

  return (
    <div className={styles.map}>
      <svg
        className={styles.map__canvas}
        viewBox={`0 0 ${REGION_VIEW.width} ${REGION_VIEW.height}`}
        aria-label={`충청남도 시·군별 현황. 지금 ${active.name}`}
      >
        {/*
          면을 눌러 그 시·군으로 (2026-09-07 지시).

          순회를 기다리지 않고 보고 싶은 곳으로 바로 간다. 아래 눈금으로도 갈 수 있지만 그쪽은
          열다섯 칸이 이름 없이 늘어서 있어 어느 칸이 어디인지 세어야 한다 — 지도에서는 짚으면 된다.

          발전소가 없어 순회에 들지 않은 시·군은 누를 것이 없다. 눌러도 갈 자리가 없으므로
          단추로 만들지 않는다.
        */}
        {REGION_SHAPES.map((shape) => {
          const at = rows.findIndex((row) => row.name === shape.region);

          return (
            <path
              key={shape.id}
              className={styles.map__cell}
              style={{ '--cell': REGION_CI_COLOR[shape.region] } as React.CSSProperties}
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

        {/*
          이름표는 면을 다 그린 뒤에 얹는다.

          면과 섞어 그리면 뒤에 오는 시·군의 면이 앞서 그린 이름표를 덮는다 — 경계가 맞물린
          지도에서는 어느 이름이 덮일지가 도형 차례에 달리게 되어, 볼 때마다 다른 이름이 사라진다.
        */}
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
              <text className={styles.tag__count} y={17} textAnchor="middle">
                {row.count > 0 ? `${formatNumber(row.count)}개소` : '-'}
              </text>
            </g>
          );
        })}
      </svg>

      {/*
        머무는 시·군의 상세.

        지도 위 이름표에 다 얹지 않고 이리로 뺀 값들이다 — 열다섯 곳에 이만큼씩 얹으면 도형이
        글자에 덮이고, 좁은 시·군(계룡시 44×40)에서는 애초에 들어가지도 않는다.
      */}
      <div className={styles.now} aria-live="off">
        <div className={styles.now__head}>
          <span className={styles.now__color} style={{ backgroundColor: REGION_CI_COLOR[active.name] }} aria-hidden />
          <strong className={styles.now__name}>{active.name}</strong>
          {active.abnormal > 0 ? (
            <span className={styles.now__abnormal}>이상 {formatNumber(active.abnormal)}</span>
          ) : null}
        </div>

        <dl className={styles.now__figures}>
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
          {/*
            발전시간과 이용률은 나눈 값이라 개소 수에 휘둘리지 않는다 — 천안시(68개소)와
            계룡시(7개소)를 같은 눈금에 세우는 것이 이 둘이다. 위의 넷만으로는 늘 큰 시가 이긴다.
          */}
          <div>
            <dt>발전시간</dt>
            <dd>{formatNumber(active.hours, 1)}<span>h</span></dd>
          </div>
          <div>
            <dt>이용률</dt>
            <dd>{formatPercent(active.utilization, 1)}</dd>
          </div>
        </dl>

        {/*
          도 전체에서 차지하는 몫.

          설비와 발전을 나란히 둔다. 둘이 어긋나 있는 것 자체가 읽을거리다 — 설비 몫보다 발전
          몫이 작으면 그 시·군이 오늘 제 몫을 못 낸 것이고, 까닭은 날씨거나 고장이다.
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

        {/* 설비 상태 분포 — 도 전체를 보여 주던 부품을 이 시·군만으로 다시 그린다 */}
        <div className={styles.now__mix}>
          <StatusMix plants={active.schools} />
        </div>

        <div className={styles.faults}>
          {/*
            남은 곳의 수를 제목 줄 오른쪽에 붙인다.

            목록의 넷째 줄로 두었더니 이상이 많은 시·군에서 칸을 7px 넘겼다. 제목 줄은 어차피
            오른쪽이 비어 있고, 「손봐야 할 곳 … 외 4곳」 은 한 문장으로 이어 읽히기도 한다.
          */}
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
                  <span
                    className={`${styles.faults__state} ${styles[`faults__state--${OPERATION_TONE[school.status]}`]}`}
                  >
                    {OPERATION_LABEL[school.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/*
          순회 눈금이자 고르개.
          지켜보다 한 곳에 눈이 머물면 그 자리에서 세울 수 있어야 한다 — 다음 곳으로 넘어가기를
          기다렸다가 한 바퀴를 다시 돌게 하면, 그 한 바퀴 동안 화면 앞을 떠난다.
        */}
        <div className={styles.now__tour}>
          <button
            type="button"
            className={styles.now__play}
            onClick={() => tour.toggle()}
            aria-label={tour.isPlaying ? '순회 멈춤' : '순회 시작'}
          >
            {tour.isPlaying ? <PauseIcon width={13} height={13} /> : <PlayIcon width={13} height={13} />}
          </button>

          <ol className={styles.now__dots}>
            {rows.map((row, at) => (
              <li key={row.name}>
                <button
                  type="button"
                  className={styles.now__dot}
                  data-on={at === tour.index ? '' : undefined}
                  style={{ '--dot': REGION_CI_COLOR[row.name] } as React.CSSProperties}
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
  );
}
