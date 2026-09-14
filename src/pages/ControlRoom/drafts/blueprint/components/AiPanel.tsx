import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AiOrbit } from '@/components/common/AiOrbit';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from '@/components/common/Icon';
import { countOperation, isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { currentOutputOf } from '@/mocks/schoolOutput';
import { formatNumber, formatPercent } from '@/utils/format';
import { withParticle } from '@/utils/korean';
import type { BadgeTone } from '@/components/common/Badge';
import type { School } from '@/interface/energy';
import { orderRegionNames, useRegionTour } from '@/pages/ControlRoom/utils/regionTour';
import { Briefing } from './Briefing';
import { Panel } from './Panel';
import { RegionLocator } from './RegionLocator';
import styles from './AiPanel.module.scss';
import type { BriefLine, BriefToken } from './Briefing';

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
  worst: School | null;
}

/**
 * 지역별 진단 요약.
 * 발전소 낱개의 고장코드는 적지 않는다 — 센서와 거리가 먼 설비가 많아 판정 오차를 피할 수 없다
 * (2026-08-21 회의). 가지고 있는 값(개소·용량·발전량·상태)으로 지역 단위 요약만 만든다.
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
    // 차례는 옆 판(시·군 지도)과 같은 것을 본다 — 이상 많은 곳부터, 같으면 큰 곳부터.
    .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
}

/** 관내 평균과 견준 발전시간의 색 — 눈에 띄게 낮으면 살펴볼 거리, 높으면 잘 도는 것 */
function hoursTone(gap: number): BadgeTone | undefined {
  if (gap < -0.3) return 'caution';
  if (gap > 0.3) return 'ok';

  return undefined;
}

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
 * AI 진단 (SFR-011-05 / SFR-014-04) — 청사진 판.
 *
 * 위쪽은 계측값을 쉬지 않고 읽고 있음을, 아래쪽은 그 값으로 지역 한 곳씩을 풀어 말한다.
 * 벽에 걸어 두는 화면이라 스스로 넘기되 앞뒤 단추로 한 지역을 붙잡을 수 있다.
 * 판 이름은 반드시 「AI 진단」 이어야 스킨이 이 판만 유리 대신 면을 돌려주고 테두리를 세운다.
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

  const tour = useRegionTour(regions.length);
  const analyzed = ANALYZED_BASE + tick * ANALYZED_STEP;

  if (regions.length === 0) {
    return (
      <Panel title="AI 진단" note={`관내 ${formatNumber(plants.length)}개소`}>
        <p className={styles.empty}>조회 조건에 맞는 발전소가 없습니다.</p>
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
    <Panel title="AI 진단" note={`관내 ${formatNumber(plants.length)}개소`}>
      <div className={styles.diag} data-tone={tone}>
        {/* 지켜보는 자리 — 분석한 계측값 수가 계속 오른다 */}
        <div className={styles.deck}>
          <AiOrbit size={30} active />
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

        {/* 지역 한 곳 — 키가 바뀌면 넘어온 방향에서 밀려 들어온다 */}
        <motion.article
          key={region.name}
          className={styles.card}
          initial={reduceMotion ? false : { x: step * 40 }}
          animate={{ x: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.36, ease: [0.22, 0.68, 0.32, 1] }}
        >
          <div className={styles.card__body}>
            <RegionLocator name={region.name} plants={region.plants} />

            <div className={styles.card__text}>
              <p className={styles.card__top}>
                <span className={styles.card__name}>{region.name}</span>
                <span className={styles.card__meta}>{formatNumber(region.count)}개소</span>
                <span className={styles.card__state} data-tone={tone}>
                  {region.abnormal > 0 ? `이상 ${formatNumber(region.abnormal)}개소` : '전체 정상'}
                </span>
              </p>

              <Briefing key={region.name} lines={briefingOf(region, averageHours)} instant={Boolean(reduceMotion)} />
            </div>
          </div>
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
