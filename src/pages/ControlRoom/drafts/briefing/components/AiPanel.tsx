import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import {
  REGION_BOUNDS, REGION_BOX, REGION_SHAPE_BOX, REGION_SHAPES, REGION_VIEW,
} from '@/assets/geo/chungnamRegions';
import { PLANT_MAP_POINTS } from '@/assets/geo/plantMapPoints';
import { AiOrbit } from '@/components/common/AiOrbit';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from '@/components/common/Icon';
import { countOperation, isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { currentOutputOf } from '@/mocks/schoolOutput';
import { formatNumber, formatPercent } from '@/utils/format';
import { withParticle } from '@/utils/korean';
import type { BadgeTone } from '@/components/common/Badge';
import type { School } from '@/interface/energy';
import { orderRegionNames, useRegionTour } from '@/pages/ControlRoom/utils/regionTour';
import { Panel } from './Panel';
import styles from './AiPanel.module.scss';

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
    // 차례는 옆 판(시·군 지도)과 같은 규칙을 한 곳에서 정한다 — 이상 많은 곳부터, 같으면 큰 곳부터
    .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
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

/** 관내 평균과 견준 발전시간의 색 — 눈에 띄게 낮으면 살펴볼 거리로, 높으면 잘 도는 것으로 */
function hoursTone(gap: number): BadgeTone | undefined {
  if (gap < -0.3) return 'caution';
  if (gap > 0.3) return 'ok';

  return undefined;
}

/**
 * 지역 하나를 규모 → 지금 내는 힘 → 오늘 실적 → 설비 상태 네 줄로 풀어낸다 (SFR-011-05).
 * 값을 칸에 나눠 담으면 「그래서 어떻다는 것인가」 는 읽는 사람이 이어 붙여야 한다. 줄을 갈라
 * 왼쪽에 이름표를 세우면 그 줄만 떼어 봐도 뜻이 서고, 눈에 걸릴 조각(이름·숫자)은 굵게 남긴다.
 */
function briefingOf(region: RegionSummary, averageHours: number): BriefLine[] {
  const load = region.capacityKw > 0 ? region.outputKw / region.capacityKw : 0;
  const gap = region.hours - averageHours;
  const normal = region.count - region.abnormal;
  const faults: BriefToken[] = (['fault', 'degraded', 'commLost'] as const)
    .filter((status) => region.status[status] > 0)
    .flatMap((status, index) => [
      ...(index > 0 ? [{ text: ' · ' }] : []),
      {
        text: `${OPERATION_LABEL[status]} ${formatNumber(region.status[status])}건`,
        strong: true,
        tone: OPERATION_TONE[status],
      },
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
          {
            text: region.worst?.name ?? '',
            strong: true,
            tone: region.worst ? OPERATION_TONE[region.worst.status] : undefined,
          },
          { text: region.abnormal > 1 ? ` 외 ${formatNumber(region.abnormal - 1)}개소에서 ` : '에서 ' },
          ...faults,
          { text: '이 확인됩니다.' },
        ],
    },
  ];
}

/**
 * AI 진단 (SFR-011-05 / SFR-014-04).
 *
 * 세로로 긴 칸이라 A 에서 판 밖으로 넘치던 네 줄 브리핑을 끝까지 담을 수 있다. 위쪽 고정 높이
 * 부품(감시 헤더·순회 캡션·지역 이름·위치 지도)을 못 박고, 브리핑만 남는 높이를 받게 두면
 * 네 줄이 늘 판 안에 든다 — 지도가 높이를 고정으로 가져가므로 글을 밀어내지 않는다.
 *
 * 상황판은 훑어보는 화면이라 진단이 돌고 있다는 사실 자체가 읽혀야 한다. 위쪽은 계측값을 쉬지
 * 않고 읽고 있음을, 아래쪽은 그 값으로 지역 한 곳씩을 풀어 말한다. 스스로 넘기되 한 지역을
 * 붙잡아 읽을 수 있게 앞뒤 단추를 둔다.
 */
export function AiPanel({ plants }: { plants: School[] }) {
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((at) => at + 1), TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  const regions = useMemo(() => summarize(plants), [plants]);
  const averageHours = useMemo(() => {
    const capacityKw = plants.reduce((sum, plant) => sum + plant.capacityKw, 0);

    return capacityKw > 0 ? plants.reduce((sum, plant) => sum + plant.todayKwh, 0) / capacityKw : 0;
  }, [plants]);

  // 자리는 벽시계에서 셈한다 — 옆 판(시·군 지도)도 같은 식을 써서 늘 같은 시·군을 본다
  const tour = useRegionTour(regions.length);

  const analyzed = ANALYZED_BASE + tick * ANALYZED_STEP;

  const note = `관내 ${formatNumber(plants.length)}개소`;

  if (regions.length === 0) {
    return (
      <Panel title="AI 진단" note={note}>
        <div className={styles.diag}>
          <p className={styles.diag__empty}>조회 조건에 맞는 발전소가 없습니다.</p>
        </div>
      </Panel>
    );
  }

  const at = tour.index;
  const region = regions[at];
  const tone = region.abnormal > 0 ? 'critical' : 'ok';

  const go = (delta: number) => {
    setStep(delta);
    tour.step(delta);
  };

  return (
    <Panel title="AI 진단" note={note}>
      <div className={styles.diag} data-tone={tone}>
        {/* 지켜보는 자리 — 빛이 쉬지 않고 가로지르고 분석한 계측값 수가 계속 오른다 */}
        <div className={styles.deck}>
          <span className={styles.deck__sweep} aria-hidden="true" />
          <AiOrbit size={34} active />
          <span className={styles.deck__title}>
            <span className={styles.deck__name}>실시간 이상 감지</span>
            <span className={styles.deck__note}>
              계측값 <strong>{formatNumber(analyzed)}</strong>건 분석 중
            </span>
          </span>
          <span className={styles.deck__live}>감시 중</span>
        </div>

        <div className={styles.caption}>
          <span className={styles.caption__label}>지역 요약</span>
          <span className={styles.caption__count}>{at + 1} / {formatNumber(regions.length)}개 지역</span>

          <span className={styles.caption__controls}>
            <button type="button" className={styles.caption__step} aria-label="이전 지역" onClick={() => go(-1)}>
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
            <button type="button" className={styles.caption__step} aria-label="다음 지역" onClick={() => go(1)}>
              <ChevronRightIcon width={13} height={13} />
            </button>
          </span>
        </div>

        {/* 지역 한 곳. 키가 바뀌면 넘어온 방향에서 밀려 들어온다 */}
        <motion.article
          key={region.name}
          className={styles.card}
          initial={reduceMotion ? false : { x: step * 46 }}
          animate={{ x: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.36, ease: [0.22, 0.68, 0.32, 1] }}
        >
          <p className={styles.card__top}>
            <span className={styles.card__name}>{region.name}</span>
            <span className={styles.card__count}>{formatNumber(region.count)}개소</span>
            <span className={styles.card__state} data-tone={tone}>
              {region.abnormal > 0 ? `이상 ${formatNumber(region.abnormal)}개소` : '전체 정상'}
            </span>
          </p>

          {/* 글보다 자리가 먼저다 — 도 안에서 어디인지 보고 나서 숫자를 읽는다 */}
          <RegionLocatorMap name={region.name} plants={region.plants} />

          <TypingBrief key={region.name} lines={briefingOf(region, averageHours)} instant={Boolean(reduceMotion)} />
        </motion.article>

        <ol className={styles.dots} aria-hidden="true">
          {regions.map((item, index) => (
            <li key={item.name} className={styles.dots__dot} data-state={index === at ? 'on' : undefined} />
          ))}
        </ol>
      </div>
    </Panel>
  );
}

/* ── 위치 지도 ─────────────────────────────────────────────────────────── */

/** 그 시·군의 면이 판 안에 다 들어오도록 당기되, 가장자리 여백은 남긴다 */
const ZOOM_FILL = 0.78;
const ZOOM_MAX = 6;
const DOT_R = 11;
const DOT_STROKE = 2.6;
const EDGE_PAD = 6;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** 위경도를 지도 판 좌표로 옮긴다 */
function project(point: { lng: number; lat: number }) {
  const lngRatio = (point.lng - REGION_BOUNDS.minLng) / (REGION_BOUNDS.maxLng - REGION_BOUNDS.minLng);
  const latRatio = (REGION_BOUNDS.maxLat - point.lat) / (REGION_BOUNDS.maxLat - REGION_BOUNDS.minLat);

  return {
    x: clamp(REGION_BOX.x + lngRatio * REGION_BOX.width, EDGE_PAD, REGION_VIEW.width - EDGE_PAD),
    y: clamp(REGION_BOX.y + latRatio * REGION_BOX.height, EDGE_PAD, REGION_VIEW.height - EDGE_PAD),
  };
}

/** 발전소 한 곳이 판에서 앉는 자리 — 경계에 붙은 학교는 미리 재 둔 값을 쓴다 */
function pointOf(plant: School) {
  const fixed = PLANT_MAP_POINTS[plant.id];

  return fixed ? { x: fixed[0], y: fixed[1] } : project(plant.location);
}

/**
 * 지역 위치 지도 (SFR-004-01).
 * 시·군으로 나뉜 도를 두고 지금 읽는 지역만 물들인 뒤 그쪽으로 당기면, 글을 읽기 전에 자리부터
 * 잡힌다. 그 지역 발전소는 상태 색 점으로 찍어 요약 글의 「N개소 정상·이상」 이 지도 위에서
 * 세어진다. 이 시안에서 새로 그리므로 A 의 RegionMap 을 불러 쓰지 않는다.
 */
function RegionLocatorMap({ name, plants }: { name: string; plants: School[] }) {
  const box = REGION_SHAPE_BOX[name] ?? null;
  const zoom = box
    ? clamp(Math.min(REGION_VIEW.width / box.width, REGION_VIEW.height / box.height) * ZOOM_FILL, 1, ZOOM_MAX)
    : 1;
  const centerX = box ? box.x + box.width / 2 : REGION_VIEW.width / 2;
  const centerY = box ? box.y + box.height / 2 : REGION_VIEW.height / 2;
  const shiftX = REGION_VIEW.width / 2 - centerX * zoom;
  const shiftY = REGION_VIEW.height / 2 - centerY * zoom;

  return (
    <svg
      className={styles.map}
      viewBox={`0 0 ${REGION_VIEW.width} ${REGION_VIEW.height}`}
      role="img"
      aria-label={`${name} 위치와 발전소 ${plants.length}개소 상태`}
      preserveAspectRatio="xMidYMid slice"
    >
      {/* 뷰박스는 부드럽게 바뀌지 않아 안쪽 묶음을 옮기고 키운다 — 지역이 넘어갈 때 미끄러진다 */}
      <g className={styles.map__zoom} style={{ transform: `translate(${shiftX}px, ${shiftY}px) scale(${zoom})` }}>
        {REGION_SHAPES.map((shape) => (
          <path
            key={shape.id}
            className={styles.map__cell}
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
              className={styles.map__dot}
              data-tone={OPERATION_TONE[plant.status]}
              cx={point.x}
              cy={point.y}
              r={DOT_R / zoom}
              strokeWidth={DOT_STROKE / zoom}
            >
              <title>{`${plant.name} · ${OPERATION_LABEL[plant.status]}`}</title>
            </circle>
          );
        })}
      </g>
    </svg>
  );
}

/* ── 타자기로 찍히는 브리핑 ────────────────────────────────────────────── */

/** 한 글자가 찍히는 간격(ms)과 한 번에 찍는 글자 수 */
const TYPE_MS = 22;
const TYPE_STEP = 2;

/** 앞에서부터 shown 글자까지만 잘라 낸다 — 조각 경계를 지나도 굵은 조각은 굵게 남는다 */
function cut(tokens: BriefToken[], shown: number): BriefToken[] {
  const out: BriefToken[] = [];
  let at = 0;

  for (const token of tokens) {
    const text = token.text.slice(0, Math.max(0, Math.min(token.text.length, shown - at)));

    at += token.text.length;

    if (text) out.push({ text, strong: token.strong, tone: token.tone });
    if (at >= shown) break;
  }

  return out;
}

/** 줄마다 글이 시작하는 자리 — 앞 줄들의 길이를 모두 더한 값 */
function offsetsOf(lines: BriefLine[]): number[] {
  const out: number[] = [];
  let at = 0;

  for (const line of lines) {
    out.push(at);
    at += line.tokens.reduce((sum, token) => sum + token.text.length, 0);
  }

  return out;
}

/**
 * 지역 요약을 진단이 방금 쓴 것처럼 한 글자씩 찍는다. 완성된 글이 통째로 나타나면 미리 적어 둔
 * 안내문과 구분되지 않는다. 찍은 글자 수는 흐른 시간으로 센다 — 다른 탭에 가려 시계가 늦춰져도
 * 깨어날 때 그 사이만큼 한 번에 따라잡는다. 부모가 지역마다 key 로 새로 세우므로 여기서는
 * 처음부터 찍기만 한다.
 */
function TypingBrief({ lines, instant }: { lines: BriefLine[]; instant: boolean }) {
  const total = lines.reduce(
    (sum, line) => sum + line.tokens.reduce((inner, token) => inner + token.text.length, 0),
    0,
  );
  const [typed, setTyped] = useState(instant ? total : 0);

  useEffect(() => {
    if (instant) return undefined;

    const began = performance.now();
    const timer = window.setInterval(
      () => setTyped(Math.round(((performance.now() - began) / TYPE_MS) * TYPE_STEP)),
      TYPE_MS,
    );

    return () => window.clearInterval(timer);
  }, [instant]);

  const shown = Math.min(typed, total);
  const offsets = offsetsOf(lines);

  return (
    <div className={styles.brief}>
      {lines.map((line, index) => {
        const pieces = cut(line.tokens, shown - offsets[index]);

        if (pieces.length === 0) return null;

        // 다음 줄이 시작됐다면 이 줄은 다 찍힌 것이다 — 커서는 지금 찍는 줄에만 선다.
        const done = shown >= (index + 1 < offsets.length ? offsets[index + 1] : total);

        return (
          <p key={line.label} className={styles.brief__line}>
            <span className={styles.brief__label}>{line.label}</span>
            <span className={styles.brief__text}>
              {pieces.map((piece, cursor) => (piece.strong
                ? <strong key={cursor} className={styles.brief__key} data-tone={piece.tone}>{piece.text}</strong>
                : <span key={cursor}>{piece.text}</span>))}
              {done ? null : <span className={styles.brief__caret} aria-hidden="true" />}
            </span>
          </p>
        );
      })}
    </div>
  );
}
