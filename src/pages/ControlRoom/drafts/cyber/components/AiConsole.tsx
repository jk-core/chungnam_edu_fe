import { useEffect, useMemo, useState } from 'react';
import { AiOrbit } from '@/components/common/AiOrbit';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from '@/components/common/Icon';
import { countOperation, isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { currentOutputOf } from '@/mocks/schoolOutput';
import { formatNumber, formatPercent } from '@/utils/format';
import { withParticle } from '@/utils/korean';
import {
  REGION_BOUNDS, REGION_BOX, REGION_SHAPE_BOX, REGION_SHAPES, REGION_VIEW,
} from '@/assets/geo/chungnamRegions';
import { PLANT_MAP_POINTS } from '@/assets/geo/plantMapPoints';
import type { BadgeTone } from '@/components/common/Badge';
import type { School } from '@/interface/energy';
import { orderRegionNames, useRegionTour } from '@/pages/ControlRoom/utils/regionTour';
import { CyberPanel } from './CyberPanel';
import { FixedDigits } from './FixedDigits';
import styles from './AiConsole.module.scss';

/** 화면이 한 박자 나아가는 간격(ms) */
const TICK_MS = 700;

/** 지금까지 분석한 계측값 — 박자마다 이만큼씩 늘어난다 */
const ANALYZED_BASE = 1_284_000;
const ANALYZED_STEP = 137;

interface RegionSummary {
  name: string;
  plants: School[];
  count: number;
  capacityKw: number;
  outputKw: number;
  todayKwh: number;
  hours: number;
  abnormal: number;
  status: Record<string, number>;
  /** 이상이 걸린 곳 가운데 설비가 가장 큰 학교 — 문구에 이름을 하나만 세운다 */
  worst: School | null;
}

interface BriefToken {
  text: string;
  strong?: boolean;
  tone?: BadgeTone;
}

interface BriefLine {
  label: string;
  tokens: BriefToken[];
}

/**
 * 지역별 진단 요약.
 * 발전소 낱개의 고장코드는 적지 않는다 — 판정 오차를 피할 수 없어 곧바로 조치 요구로 이어진다
 * (2026-08-21 회의). 가지고 있는 값(개소·설비용량·발전량·상태)만으로 지역 단위 요약을 만든다.
 */
function summarize(plants: School[]): RegionSummary[] {
  const order = orderRegionNames(plants);
  const buckets = new Map<string, School[]>();

  plants.forEach((plant) => {
    const bucket = buckets.get(plant.regionName) ?? [];

    bucket.push(plant);
    buckets.set(plant.regionName, bucket);
  });

  return [...buckets.entries()]
    .map(([name, rows]) => {
      const capacityKw = rows.reduce((sum, row) => sum + row.capacityKw, 0);
      const todayKwh = rows.reduce((sum, row) => sum + row.todayKwh, 0);
      const outputKw = rows.reduce((sum, row) => sum + currentOutputOf(row), 0);
      const abnormalRows = rows.filter((row) => isAbnormal(row.status));

      return {
        name,
        plants: rows,
        count: rows.length,
        capacityKw,
        outputKw,
        todayKwh,
        hours: capacityKw > 0 ? todayKwh / capacityKw : 0,
        abnormal: abnormalRows.length,
        status: countOperation(rows),
        worst: [...abnormalRows].sort((a, b) => b.capacityKw - a.capacityKw)[0] ?? null,
      };
    })
    // 차례는 옆의 시·군 지도와 같은 것을 본다 — `orderRegionNames` 한 곳에서 정한다.
    .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
}

/** 관내 평균과 견준 발전시간의 색 — 눈에 띄게 낮으면 살펴볼 거리로, 높으면 잘 도는 것으로 읽는다 */
function hoursTone(gap: number): BadgeTone | undefined {
  if (gap < -0.3) return 'caution';
  if (gap > 0.3) return 'ok';

  return undefined;
}

/**
 * 지역 한 곳을 사람이 읽는 글로 풀어낸다 (SFR-011-05).
 * 규모 → 지금 내는 힘 → 오늘 실적 → 설비 상태 순으로 줄을 갈라, 지역 하나를 훑고 지나가면
 * 그 지역의 오늘이 남게 한다. 눈에 걸려야 하는 조각(이름·숫자)은 굵게 남긴다.
 */
function briefingOf(region: RegionSummary, averageHours: number): BriefLine[] {
  const load = region.capacityKw > 0 ? region.outputKw / region.capacityKw : 0;
  const gap = region.hours - averageHours;
  const normal = region.count - region.abnormal;
  const faults: BriefToken[] = (['fault', 'degraded', 'commLost'] as const)
    .filter((status) => region.status[status] > 0)
    .flatMap((status, index) => [
      ...(index > 0 ? [{ text: ' · ' }] : []),
      { text: `${OPERATION_LABEL[status]} ${formatNumber(region.status[status])}건`, strong: true, tone: OPERATION_TONE[status] },
    ]);
  // 이름이 데이터에서 오므로 받침을 보고 조사를 고른다 — 「보령시은」 이 되지 않게.
  const subject = withParticle(region.name, '은').slice(region.name.length);

  return [
    {
      label: '규모',
      tokens: [
        { text: region.name, strong: true },
        { text: `${subject} 설비용량 ` },
        { text: `${formatNumber(region.capacityKw)}kW`, strong: true },
        { text: ' 규모의 ' },
        { text: `${formatNumber(region.count)}개소`, strong: true },
        { text: '를 운영하고 있습니다.' },
      ],
    },
    {
      label: '출력',
      tokens: [
        { text: '지금 ' },
        { text: `${formatNumber(region.outputKw, 1)}kW`, strong: true },
        { text: `를 내고 있어 설비용량의 ${formatPercent(load, 0)} 수준입니다.` },
      ],
    },
    {
      label: '실적',
      tokens: [
        { text: '금일 ' },
        { text: `${formatNumber(region.todayKwh)}kWh`, strong: true },
        { text: ', 발전시간 ' },
        { text: `${formatNumber(region.hours, 1)}시간`, strong: true, tone: hoursTone(gap) },
        {
          text: Math.abs(gap) < 0.05
            ? '으로 관내 평균과 같은 수준입니다.'
            : `으로 관내 평균보다 ${formatNumber(Math.abs(gap), 1)}시간 ${gap > 0 ? '높습니다' : '낮습니다'}.`,
        },
      ],
    },
    {
      label: '상태',
      tokens: region.abnormal === 0
        ? [
          { text: `${formatNumber(region.count)}개소`, strong: true, tone: 'ok' },
          { text: ' 모두 정상 가동 중이며 조치가 필요한 곳은 없습니다.' },
        ]
        : [
          { text: `${formatNumber(normal)}개소`, strong: true, tone: 'ok' },
          { text: '가 정상 가동 중이고, ' },
          { text: region.worst?.name ?? '', strong: true, tone: region.worst ? OPERATION_TONE[region.worst.status] : undefined },
          { text: region.abnormal > 1 ? ` 외 ${formatNumber(region.abnormal - 1)}개소에서 ` : '에서 ' },
          ...faults,
          { text: '이 확인됩니다.' },
        ],
    },
  ];
}

// ── 지역 위치 지도 ─────────────────────────────────────────
/*
  지도 상자의 가로:세로.

  이 판은 세로로 길어 지도가 받는 자리가 넓고 납작하다(판 폭 408 × 높이 ~200). 충남 도형은
  거의 정사각(600×516)이라 그 상자에 통째로 맞추면(meet) 세로에 걸려 좌우가 크게 빈다 —
  가로의 절반만 쓰게 된다. 그래서 도형 전체가 아니라 **머무는 시·군 둘레로 뷰박스를 좁혀**
  그 상자와 같은 가로:세로로 잘라 낸다. 좁힌 뷰박스가 상자 비율과 같으므로 여백 없이 폭을
  다 쓰고, 도형은 왜곡되지 않는다 (시안 D 가 쓴 방식). SVG 의 `aspect-ratio` 도 이 값으로 맞춘다.
*/
const MAP_ASPECT = 2.4;

/** 좁힌 뷰박스 안에서 시·군이 차지하는 정도 — 남는 테두리로 이웃 윤곽이 함께 보인다 */
const ZOOM_FILL = 0.72;

/** 좁게 조이는 데 상한 — 계룡시처럼 작은 곳에서 배율이 끝없이 오르지 않게 */
const ZOOM_MAX = 6;

/** 점·획 굵기는 뷰박스 높이에 비례시킨다 — 어느 배율에서도 화면 위 크기가 같아진다 */
const DOT_FRAC = 0.042;
const STROKE_FRAC = 0.011;

/** 판 가장자리에서 점이 잘리지 않게 두는 여백 */
const EDGE_PAD = 6;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** 위경도를 지도 판 좌표로 옮긴다 — 미리 재 둔 값이 있으면 그것을 쓴다(경계에 붙은 학교 보정) */
function pointOf(plant: School) {
  const fixed = PLANT_MAP_POINTS[plant.id];

  if (fixed) return { x: fixed[0], y: fixed[1] };

  const lngRatio = (plant.location.lng - REGION_BOUNDS.minLng) / (REGION_BOUNDS.maxLng - REGION_BOUNDS.minLng);
  const latRatio = (REGION_BOUNDS.maxLat - plant.location.lat) / (REGION_BOUNDS.maxLat - REGION_BOUNDS.minLat);

  return {
    x: clamp(REGION_BOX.x + lngRatio * REGION_BOX.width, EDGE_PAD, REGION_VIEW.width - EDGE_PAD),
    y: clamp(REGION_BOX.y + latRatio * REGION_BOX.height, EDGE_PAD, REGION_VIEW.height - EDGE_PAD),
  };
}

/**
 * 지역 위치 지도 (SFR-004-01).
 * 요약 글만으로는 「어느 지역」 이 도 안에서 어디쯤인지 알 수 없다. 도를 두고 지금 읽는 지역만
 * 물들인 뒤 그쪽으로 당기면, 글을 읽기 전에 자리부터 잡힌다. 발전소는 상태 색 점으로 찍는다.
 */
function Locator({ name, plants }: { name: string; plants: School[] }) {
  const box = REGION_SHAPE_BOX[name] ?? null;

  /*
    머무는 시·군을 상자 비율(MAP_ASPECT)로 감싸는 뷰박스를 낸다.

    시·군을 가로·세로 어느 쪽에 걸든 상자에 담기게 높이를 잡고 ZOOM_FILL 로 여백을 두른 뒤,
    폭은 높이 × 비율로 정한다. 시·군이 상자 한가운데 오도록 좌상단을 옮긴다. 배율은 뷰박스가
    도 전체를 넘지 않는 선(작을수록 확대)에서 상한을 둔다. 도형이 없으면 도 전체를 담는다.
  */
  const minHeight = REGION_VIEW.height / ZOOM_MAX;
  const viewH = box
    ? clamp(Math.max(box.height, box.width / MAP_ASPECT) / ZOOM_FILL, minHeight, REGION_VIEW.height)
    : REGION_VIEW.height;
  const viewW = viewH * MAP_ASPECT;
  const centerX = box ? box.x + box.width / 2 : REGION_VIEW.width / 2;
  const centerY = box ? box.y + box.height / 2 : REGION_VIEW.height / 2;
  const viewX = centerX - viewW / 2;
  const viewY = centerY - viewH / 2;

  // 점·획은 뷰박스 높이에 비례시켜 어느 배율에서도 화면 위 크기가 일정하게 보인다
  const dotR = viewH * DOT_FRAC;
  const dotStroke = viewH * STROKE_FRAC;

  return (
    <svg
      className={styles.locator}
      viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${name} 위치와 발전소 ${plants.length}개소 상태`}
    >
      {REGION_SHAPES.map((shape) => (
        <path
          key={shape.id}
          className={styles.locator__cell}
          data-on={shape.region === name ? '' : undefined}
          d={shape.d}
          transform={shape.transform}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {plants.map((plant) => {
        const point = pointOf(plant);

        return (
          <circle
            key={plant.id}
            className={styles.locator__dot}
            data-tone={OPERATION_TONE[plant.status]}
            cx={point.x}
            cy={point.y}
            r={dotR}
            strokeWidth={dotStroke}
          >
            <title>{`${plant.name} · ${OPERATION_LABEL[plant.status]}`}</title>
          </circle>
        );
      })}
    </svg>
  );
}

/**
 * AI 진단 — 지역 단위 요약 (SFR-011-05 / SFR-014-04).
 *
 * 담는 것은 시안 A 의 `AiDiagnosisPanel` 과 같다 — 실시간 감시 헤더(분석한 계측값 수가 계속
 * 오름), 지역 순회(앞/뒤/재생·정지), 지역 위치 지도, 규모·출력·실적·상태 네 줄 브리핑.
 *
 * A 는 브리핑을 한 글자씩 타자기로 찍었지만, 이 시안에서는 네 줄을 계측기의 판독 로그처럼
 * 라벨과 함께 통째로 세운다 — 벽에 걸어 두고 훑어보는 화면에서 네 줄이 **늘 끝까지 보여야**
 * 하므로, 찍는 도중에 잘릴 여지를 두지 않는다. 살아 있다는 신호는 머리의 감시 표시등과 오르는
 * 계측값 수, 그리고 마지막 줄 끝의 깜빡이는 커서가 대신 낸다.
 */
export function AiConsole({ plants }: { plants: School[] }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((at) => at + 1), TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  const regions = useMemo(() => summarize(plants), [plants]);
  const averageHours = useMemo(() => {
    const capacityKw = plants.reduce((sum, plant) => sum + plant.capacityKw, 0);

    return capacityKw > 0 ? plants.reduce((sum, plant) => sum + plant.todayKwh, 0) / capacityKw : 0;
  }, [plants]);

  const tour = useRegionTour(regions.length);
  const analyzed = ANALYZED_BASE + tick * ANALYZED_STEP;
  const note = `관내 ${formatNumber(plants.length)}개소`;

  if (regions.length === 0) {
    return (
      <CyberPanel title="AI 진단" note={note} live>
        <p className={styles.empty}>조회 조건에 맞는 발전소가 없습니다.</p>
      </CyberPanel>
    );
  }

  const at = tour.index;
  const region = regions[at] ?? regions[0];
  const tone = region.abnormal > 0 ? 'critical' : 'ok';
  const lines = briefingOf(region, averageHours);

  return (
    <CyberPanel title="AI 진단" note={note} live>
      <div className={styles.ai} data-tone={tone}>
        {/* 지켜보는 자리 — 분석한 계측값 수가 계속 오른다(고정폭으로 세워 흔들리지 않게) */}
        <div className={styles.deck}>
          <AiOrbit size={30} active />
          <span className={styles.deck__title}>
            <span className={styles.deck__name}>실시간 이상 감지</span>
            <span className={styles.deck__note}>
              계측값 <strong className={styles.deck__value}><FixedDigits text={formatNumber(analyzed)} /></strong>건 분석 중
            </span>
          </span>
          <span className={styles.deck__live}>감시 중</span>
        </div>

        <div className={styles.caption}>
          <span className={styles.caption__label}>지역 요약</span>
          <span className={styles.caption__count}>{at + 1} / {formatNumber(regions.length)}개 지역</span>

          <span className={styles.caption__controls}>
            <button type="button" className={styles.caption__step} aria-label="이전 지역" onClick={() => tour.step(-1)}>
              <ChevronLeftIcon width={13} height={13} />
            </button>
            <button
              type="button"
              className={styles.caption__step}
              aria-pressed={tour.isPlaying}
              aria-label={tour.isPlaying ? '지역 자동 전환 정지' : '지역 자동 전환 재생'}
              onClick={tour.toggle}
            >
              {tour.isPlaying ? <PauseIcon width={12} height={12} /> : <PlayIcon width={12} height={12} />}
            </button>
            <button type="button" className={styles.caption__step} aria-label="다음 지역" onClick={() => tour.step(1)}>
              <ChevronRightIcon width={13} height={13} />
            </button>
          </span>
        </div>

        <div className={styles.card}>
          <p className={styles.card__top}>
            <span className={styles.card__name}>{region.name}</span>
            <span className={styles.card__count}>{formatNumber(region.count)}개소</span>
            <span className={styles.card__state} data-tone={tone}>
              {region.abnormal > 0 ? `이상 ${formatNumber(region.abnormal)}개소` : '전체 정상'}
            </span>
          </p>

          {/* 글보다 자리가 먼저다 — 도 안에서 어디인지 보고 나서 숫자를 읽는다 */}
          <Locator name={region.name} plants={region.plants} />
        </div>

        {/* 규모·출력·실적·상태 네 줄 — 라벨을 세우고 통째로 보인다 */}
        <ol className={styles.brief}>
          {lines.map((line, lineIndex) => (
            <li key={line.label} className={styles.brief__line}>
              <span className={styles.brief__label}>{line.label}</span>
              <span className={styles.brief__text}>
                {line.tokens.map((token, index) => (token.strong
                  ? <strong key={index} className={styles.brief__key} data-tone={token.tone}>{token.text}</strong>
                  : <span key={index}>{token.text}</span>))}
                {lineIndex === lines.length - 1 ? <span className={styles.brief__caret} aria-hidden="true" /> : null}
              </span>
            </li>
          ))}
        </ol>

        <ol className={styles.dots} aria-hidden="true">
          {regions.map((item, index) => (
            <li key={item.name} className={styles.dots__dot} data-on={index === at ? '' : undefined} />
          ))}
        </ol>
      </div>
    </CyberPanel>
  );
}
