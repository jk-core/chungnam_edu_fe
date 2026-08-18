import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import { FULL_SUN_WM2 } from '@/mocks/solarEdu';
import { IMPACT_DEFS } from '@/mocks/eduContent';
import { formatNumber } from '@/utils/format';
import type { MiddleContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { DayCurve } from '../shared/DayCurve';
import { PrincipleStrip } from '../shared/PrincipleStrip';
import styles from './MiddleCompare.module.scss';
import type { CSSProperties } from 'react';

/**
 * 견줄 짝을 만들 때 쓰는 어림값.
 *
 * 목데이터에는 어제치도 흐린 날치도 없다. 오늘 값에서 **뜻이 통하는 비율** 로 지어 내되,
 * 화면에 "견주기 위해 지어 낸 값" 이라고 밝혀 둔다 — 학생이 보는 화면에서 지어 낸 수를
 * 실측인 척 내놓아서는 안 된다.
 */
const YESTERDAY_RATIO = 0.86;
const CLOUDY_RATIO = 0.34;
const PEER_RATIO = 0.93;

/** 값이 0에 가까워도 기둥이 보이도록 잡아 두는 바닥 */
const MIN_BAR = 8;

interface MiddleCompareProps {
  scopeLabel: string;
  stats: EduStats;
  content: MiddleContent;
}

interface Duel {
  id: string;
  question: string;
  /** 무엇이 달라서 값이 갈렸는지 — 이 줄이 이 시안의 알맹이다 */
  because: string;
  /** 무엇 하나만 달리했는지 */
  variable: string;
  left: { label: string; value: number };
  right: { label: string; value: number };
  unit: string;
  digits: number;
  tone: 'solar' | 'brand' | 'ok';
}

/**
 * 중등 판 · 시안 D — 비교 실험 (SFR-005-02/03).
 *
 * 값 하나만 놓고는 그것이 큰지 작은지 알 수 없다. 현행 시안은 "오늘 42kWh" 를 잘 설명하지만
 * 42 가 좋은 날인지 아쉬운 날인지는 답하지 못한다.
 *
 * 이 시안은 늘 **둘씩 놓는다**. 오늘과 어제, 맑음과 흐림, 우리 학교와 관내 평균. 한 번에 하나씩만
 * 달리해 놓고 견주는 것은 과학 시간에 배우는 변인 통제 그 자체라, 화면을 읽는 방식이 곧 방법론이 된다.
 * 짝마다 "무엇을 달리했나" 와 "무엇이 달라서 이만큼 갈렸나" 를 못 박는 것이 요점이다.
 */
export function MiddleCompare({ scopeLabel, stats, content }: MiddleCompareProps) {
  const duels: Duel[] = [
    {
      id: 'day',
      question: '오늘과 어제, 무엇이 달랐을까?',
      variable: '날씨만 다름',
      because: '설비는 그대로다. 달라진 것은 날씨뿐이므로, 이 차이는 곧 일사량의 차이다.',
      left: { label: '오늘', value: stats.dayKwh },
      right: { label: '어제', value: stats.dayKwh * YESTERDAY_RATIO },
      unit: 'kWh',
      digits: 0,
      tone: 'solar',
    },
    {
      id: 'weather',
      question: '맑은 날과 흐린 날은 얼마나 차이 날까?',
      variable: '구름만 다름',
      because: '구름이 햇빛을 가리면 판에 닿는 에너지 자체가 줄어든다. 설비 고장이 아니다.',
      left: { label: '맑은 날', value: stats.dayKwh },
      right: { label: '흐린 날', value: stats.dayKwh * CLOUDY_RATIO },
      unit: 'kWh',
      digits: 0,
      tone: 'brand',
    },
    {
      id: 'peer',
      question: '우리 학교는 다른 학교와 견주면 어떨까?',
      variable: '설비용량 차이를 지움',
      because: '설비용량이 다르므로 총량으로는 견줄 수 없다. 1kW 가 몇 시간치를 냈는지로 나눠야 한다.',
      left: { label: scopeLabel, value: stats.equivalentHours },
      right: { label: '관내 평균', value: stats.equivalentHours * PEER_RATIO },
      unit: '시간',
      digits: 1,
      tone: 'ok',
    },
  ];

  const impact = IMPACT_DEFS[content.benefit.itemIds[0] ?? 'co2'];

  return (
    <div className={styles.board}>
      <header className={styles.head}>
        <h2 className={styles.head__title}>둘씩 놓고 견줘 보기</h2>
        <p className={styles.head__note}>
          한 번에 하나만 달리해 놓고 견주면, 무엇이 발전량을 바꾸는지가 드러난다
        </p>
      </header>

      {/*
        셋을 가로로 늘어놓는다.
        한 줄씩 아래로 쌓으면 막대가 화면 폭만큼 길어져 — 두 수를 견주는 데 1,400px 짜리 막대가
        필요할 리 없다 — 정작 견줘야 할 세 짝은 서로 멀어진다. 나란히 세워야 짝끼리도 견줘진다.
      */}
      <div className={styles.duels}>
        {duels.map((duel) => (
          <DuelCard key={duel.id} duel={duel} />
        ))}
      </div>

      {/*
        견주기만으로는 태양광을 배울 수 없다.
        이 화면은 "무엇이 값을 바꾸는가" 를 답하는데, 그 값이 애초에 **어떻게 만들어지는가** 는
        다루지 않는다. 걸어 두는 화면의 목적이 태양광 설명이라면 원리가 빠져서는 안 된다.
      */}
      <PrincipleStrip stats={stats} level="middle" heading="견주기 전에 — 햇빛이 전기가 되는 길" />

      <div className={styles.bottom}>
        <section className={styles.curve} aria-label="금일 발전 곡선">
          <header className={styles.panel__head}>
            <h2 className={styles.panel__title}>금일 발전 곡선</h2>
            <p className={styles.panel__note}>{content.production.note(stats)}</p>
          </header>
          <div className={styles.curve__canvas}>
            <DayCurve stats={stats} showIrradiance />
          </div>
        </section>

        <section className={styles.facts} aria-label="견줄 때 쓴 값">
          <header className={styles.panel__head}>
            <h2 className={styles.panel__title}>견줄 때 쓴 값</h2>
            {/* 지어 낸 값을 실측인 척 내놓지 않는다 */}
            <p className={styles.facts__disclaimer}>
              어제·흐린 날·관내 평균은 견주기 위해 어림한 예시값이다
            </p>
          </header>

          <dl className={styles.facts__list}>
            <Fact label="설비용량" value={`${formatNumber(stats.capacityKw)}kW`} />
            <Fact label="일사강도" value={`${Math.round((stats.irradianceNow / FULL_SUN_WM2) * 100)}점`} />
            <Fact label="일조 시간" value={`${formatNumber(SUNSET_HOUR - SUNRISE_HOUR, 1)}시간`} />
            <Fact label="발전시간" value={`${formatNumber(stats.equivalentHours, 1)}시간`} />
            <Fact
              label={impact.label}
              value={`${formatNumber(stats.dayKwh * impact.perKwh, impact.fractionDigits)}${impact.unit}`}
            />
          </dl>
        </section>
      </div>
    </div>
  );
}

/**
 * 견주는 한 짝.
 *
 * 기둥 둘을 나란히 세워 높이로 견준다 — 가로 막대는 길이를 눈으로 재야 하지만, 나란한 기둥은
 * 어느 쪽이 높은지가 재지 않아도 보인다. 두 기둥이 **같은 자** 를 쓰는 것이 핵심이라,
 * 큰 쪽을 꽉 찬 높이로 삼고 작은 쪽을 그 비율로 눕힌다.
 */
function DuelCard({ duel }: { duel: Duel }) {
  const max = Math.max(duel.left.value, duel.right.value, 1);
  const gap = duel.right.value > 0 ? ((duel.left.value - duel.right.value) / duel.right.value) * 100 : 0;

  return (
    <section className={styles.duel} data-tone={duel.tone}>
      <header className={styles.duel__head}>
        <h3 className={styles.duel__question}>{duel.question}</h3>
        <span className={styles.duel__variable}>{duel.variable}</span>
      </header>

      <div className={styles.plot}>
        {[duel.left, duel.right].map((side, index) => (
          <div key={side.label} className={styles.col} data-side={index === 0 ? 'main' : 'other'}>
            <p className={styles.col__value}>
              {formatNumber(side.value, duel.digits)}
              <em>{duel.unit}</em>
            </p>

            <div className={styles.col__track}>
              <span
                className={styles.col__bar}
                style={{ blockSize: `${Math.max(MIN_BAR, (side.value / max) * 100).toFixed(1)}%` } as CSSProperties}
              />
            </div>

            <p className={styles.col__label}>{side.label}</p>
          </div>
        ))}

        {/* 두 기둥 사이에 차이를 못 박는다 — 높이를 눈으로 재지 않아도 되게 */}
        <span className={styles.gap} data-down={gap < 0 ? '' : undefined}>
          {gap >= 0 ? '+' : ''}{formatNumber(gap, 0)}%
        </span>
      </div>

      <p className={styles.duel__because}>{duel.because}</p>
    </section>
  );
}

/** 아래 값 한 줄 */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.fact}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
