import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { AiOrbit } from '@/components/common/AiOrbit';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from '@/components/common/Icon';
import { countOperation, isAbnormal, OPERATION_LABEL, OPERATION_ORDER, OPERATION_TONE } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from './AiDiagnosisPanel.module.scss';

/** 화면이 한 박자 나아가는 간격(ms) */
const TICK_MS = 700;

/** 지역 한 곳을 읽어 볼 시간(ms) */
const REGION_MS = 8400;

/** 지금까지 분석한 계측값 — 박자마다 이만큼씩 늘어난다 */
const ANALYZED_BASE = 1_284_000;
const ANALYZED_STEP = 137;

interface RegionSummary {
  name: string;
  count: number;
  capacityKw: number;
  todayKwh: number;
  hours: number;
  abnormal: number;
  status: Record<string, number>;
  /** 이상이 걸린 곳 가운데 설비가 가장 큰 학교 — 문구에 이름을 하나만 세운다 */
  worst: School | null;
}

/**
 * 지역별 진단 요약.
 *
 * 발전소 낱개의 고장코드는 상황판에 적지 않는다 — 센서와 거리가 먼 설비가 많아 판정 오차를
 * 피할 수 없는데, 코드를 그대로 띄우면 곧바로 조치 요구로 이어진다 (2026-08-21 회의).
 * 대신 가지고 있는 값(개소·설비용량·발전량·상태)만으로 지역 단위 요약을 만든다.
 */
function summarize(plants: School[]): RegionSummary[] {
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
      const abnormalRows = rows.filter((row) => isAbnormal(row.status));

      return {
        name,
        count: rows.length,
        capacityKw,
        todayKwh,
        hours: capacityKw > 0 ? todayKwh / capacityKw : 0,
        abnormal: abnormalRows.length,
        status: countOperation(rows),
        worst: [...abnormalRows].sort((a, b) => b.capacityKw - a.capacityKw)[0] ?? null,
      };
    })
    // 이상이 많은 지역부터. 같으면 큰 지역이 먼저다.
    .sort((a, b) => b.abnormal - a.abnormal || b.capacityKw - a.capacityKw);
}

/** 지역 하나를 사람이 읽는 문장으로 (SFR-011-05) */
function sentenceOf(region: RegionSummary, averageHours: number): string {
  const gap = region.hours - averageHours;
  const compare = Math.abs(gap) < 0.05
    ? '관내 평균과 같은 수준입니다'
    : `관내 평균보다 ${formatNumber(Math.abs(gap), 1)}시간 ${gap > 0 ? '높습니다' : '낮습니다'}`;

  if (region.abnormal === 0) {
    return `${region.name} 설비 ${formatNumber(region.count)}개소가 모두 정상 가동 중입니다. 금일 발전시간은 ${formatNumber(region.hours, 1)}시간으로 ${compare}.`;
  }

  const parts = (['fault', 'degraded', 'commLost'] as const)
    .filter((status) => region.status[status] > 0)
    .map((status) => `${OPERATION_LABEL[status]} ${formatNumber(region.status[status])}건`)
    .join(' · ');

  return `${region.name} ${formatNumber(region.count)}개소 가운데 ${region.worst?.name ?? ''} 외 ${formatNumber(region.abnormal - 1)}개소에서 ${parts}이 확인됩니다. 금일 발전시간은 ${formatNumber(region.hours, 1)}시간으로 ${compare}.`;
}

/**
 * AI 진단 — 지역 단위 요약 (SFR-011-05 / SFR-014-04).
 *
 * 상황판은 훑어보는 화면이라 진단이 돌고 있다는 사실 자체가 읽혀야 한다. 위쪽은 계측값을
 * 쉬지 않고 읽고 있음을, 아래쪽은 그 값으로 지역 한 곳씩을 풀어 말한다.
 * 벽에 걸어 두는 화면이라 스스로 넘기되, 한 지역을 붙잡고 읽을 수 있게 앞뒤 단추를 둔다.
 */
export function AiDiagnosisPanel({ plants }: { plants: School[] }) {
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [step, setStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((at) => at + 1), TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  const regions = useMemo(() => summarize(plants), [plants]);
  const averageHours = useMemo(() => {
    const capacityKw = plants.reduce((sum, plant) => sum + plant.capacityKw, 0);

    return capacityKw > 0 ? plants.reduce((sum, plant) => sum + plant.todayKwh, 0) / capacityKw : 0;
  }, [plants]);

  /*
    자리마다 시계를 새로 건다 — 되풀이 시계 하나로 돌리면 손으로 넘긴 직후에도 가던 시계가
    그대로 울려, 방금 넘긴 지역이 한 박자 만에 또 넘어간다.
  */
  useEffect(() => {
    if (!isPlaying || regions.length === 0) return undefined;

    const timer = window.setTimeout(() => {
      setStep(1);
      setCursor((from) => from + 1);
    }, REGION_MS);

    return () => window.clearTimeout(timer);
  }, [isPlaying, cursor, regions.length]);

  const analyzed = ANALYZED_BASE + tick * ANALYZED_STEP;

  if (regions.length === 0) {
    return (
      <div className={styles.diag}>
        <p className={styles.diag__empty}>조회 조건에 맞는 발전소가 없습니다.</p>
      </div>
    );
  }

  const at = ((cursor % regions.length) + regions.length) % regions.length;
  const region = regions[at];
  const tone = region.abnormal > 0 ? 'critical' : 'ok';

  const go = (delta: number) => {
    setStep(delta);
    setCursor((from) => from + delta);
  };

  return (
    <div className={styles.diag} data-tone={tone}>
      {/* 지켜보는 자리 — 빛이 쉬지 않고 가로지르고 분석한 계측값 수가 계속 오른다 */}
      <div className={styles.deck}>
        <span className={styles.deck__sweep} aria-hidden="true" />

        <svg className={styles.deck__wave} viewBox="0 0 240 40" preserveAspectRatio="none" aria-hidden="true">
          <path
            className={styles.deck__waveLine}
            d="M0 26 L14 26 L20 12 L26 32 L32 20 L40 20 L48 26 L54 26 L60 8 L66 30 L74 22 L84 22 L92 26 L100 26 L106 14 L112 30 L120 24 L132 24 L140 26 L148 26 L154 10 L160 32 L168 20 L180 20 L188 26 L196 26 L202 16 L208 28 L216 22 L240 22"
          />
        </svg>

        <div className={styles.deck__head}>
          <AiOrbit size={34} active />
          <span className={styles.deck__title}>
            <span className={styles.deck__name}>실시간 이상 감지</span>
            <span className={styles.deck__note}>
              계측값 <strong>{formatNumber(analyzed)}</strong>건 분석 중
            </span>
          </span>
          <span className={styles.deck__live}>감시 중</span>
        </div>
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
            aria-pressed={isPlaying}
            aria-label={isPlaying ? '지역 자동 전환 정지' : '지역 자동 전환 재생'}
            onClick={() => setIsPlaying((playing) => !playing)}
          >
            {isPlaying ? <PauseIcon width={12} height={12} /> : <PlayIcon width={12} height={12} />}
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
        </p>

        <p className={styles.card__body}>
          <em className={styles.card__ai}>AI</em>
          {sentenceOf(region, averageHours)}
        </p>

        <dl className={styles.metrics}>
          <div className={styles.metrics__item}>
            <dt>설비용량</dt>
            <dd>{formatNumber(region.capacityKw)}<span>kW</span></dd>
          </div>
          <div className={styles.metrics__item}>
            <dt>금일 발전량</dt>
            <dd>{formatNumber(region.todayKwh)}<span>kWh</span></dd>
          </div>
          <div className={styles.metrics__item}>
            <dt>발전시간</dt>
            <dd>{formatNumber(region.hours, 1)}<span>h</span></dd>
          </div>
          <div className={styles.metrics__item}>
            <dt>이상 설비</dt>
            <dd>{formatNumber(region.abnormal)}<span>개소</span></dd>
          </div>
        </dl>

        {/* 상태 분포 — 이 지역 안에서 무엇이 몇 곳인지 */}
        <div className={styles.mix}>
          <div className={styles.mix__bar} role="img" aria-label={`${region.name} 설비 상태 분포`}>
            {OPERATION_ORDER.filter((status) => region.status[status] > 0).map((status) => (
              <span
                key={status}
                className={`${styles.mix__seg} ${styles[`mix__seg--${OPERATION_TONE[status]}`]}`}
                style={{ width: `${(region.status[status] / region.count) * 100}%` }}
              />
            ))}
          </div>
          <ul className={styles.mix__legend}>
            {OPERATION_ORDER.filter((status) => region.status[status] > 0).map((status) => (
              <li key={status} className={styles.mix__item}>
                <span className={`${styles.mix__dot} ${styles[`mix__dot--${OPERATION_TONE[status]}`]}`} aria-hidden="true" />
                {OPERATION_LABEL[status]}
                <span className={styles.mix__value}>{formatNumber(region.status[status])}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.article>

      <ol className={styles.dots} aria-hidden="true">
        {regions.map((item, index) => (
          <li key={item.name} className={styles.dots__dot} data-state={index === at ? 'on' : undefined} />
        ))}
      </ol>
    </div>
  );
}
