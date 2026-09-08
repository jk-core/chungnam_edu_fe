import { formatNumber, formatSi } from '@/utils/format';
import type { EduLevel } from '@/interface/edu';
import type { EduStats } from '@/mocks/solarEdu';
import { SceneDefs } from '../../scene-art/SceneDefs';
import { Sun } from '../../scene-art/SceneParts';
import styles from './PrincipleStrip.module.scss';
import type { CSSProperties } from 'react';

type StepId = 'sun' | 'cell' | 'inverter' | 'school';

/**
 * 눈높이마다 다른 말.
 *
 * 값을 만드는 셈은 같고 부르는 이름과 설명만 갈린다 — 초등에게 "직류" 라고 적을 수 없고,
 * 고등에게 "판이 전기를 만들어요" 라고만 적으면 배울 것이 없다. 같은 그림 위에 말만 바꿔 얹는다.
 *
 * 세 줄의 눈높이를 한 칸씩 내렸다 (2026-08-31 검토 의견). 고등 줄이 전문 용어(PN 접합·MPPT·수용가)로
 * 적혀 있어 읽히지 않았고, 중등 줄이 그대로 남으면 두 줄이 같은 말이 되기 때문이다.
 */
const COPY: Record<EduLevel, Record<StepId, { label: string; line: string }>> = {
  elementary: {
    sun: { label: '햇빛', line: '해가 우리 학교 지붕을 비춰요' },
    cell: { label: '태양전지', line: '햇빛을 받으면 패널이 전기를 만들어요' },
    inverter: { label: '인버터', line: '교실에서 쓸 수 있는 전기로 바꿔 줘요' },
    school: { label: '교실', line: '불을 켜고 선풍기를 돌리는 데 써요' },
  },
  middle: {
    sun: { label: '일사량', line: '해가 높이 뜰수록 지붕이 받는 햇빛이 세진다' },
    cell: { label: '태양전지', line: '햇빛을 받으면 전기가 한 방향으로 흐른다' },
    inverter: { label: '인버터', line: '교실에서 쓸 수 있는 전기로 바꾼다' },
    school: { label: '학교', line: '만든 전기는 학교가 그대로 쓴다' },
  },
  high: {
    sun: { label: '일사량', line: '해가 높을수록 패널 1m² 가 받는 에너지가 커진다' },
    cell: { label: '태양전지', line: '햇빛을 받은 전자가 한 방향으로 흘러 직류가 된다' },
    inverter: { label: '인버터', line: '한 방향으로만 흐르는 직류를 교류로 바꾼다' },
    school: { label: '학교', line: '만든 전기는 학교가 그대로 쓴다' },
  },
};

interface PrincipleStripProps {
  stats: EduStats;
  level: EduLevel;
  /** 제목을 붙일지. 이미 위에 제목이 있는 자리에서는 끈다 */
  heading?: string;
}

/**
 * 햇빛이 전기가 되기까지 네 마디 (SFR-005-01/02).
 *
 * 걸어 두는 화면의 목적이 태양광을 설명하는 것이라면, 어느 시안을 보고 있든 **원리가 늘 화면에**
 * 있어야 한다. 숫자만 큼직하게 띄운 화면은 사흘이면 배경이 되고, 지나가는 아이는 그 수가 어디서
 * 왔는지 끝내 모른다.
 *
 * 그래서 마디마다 지금 이 학교의 실측값을 함께 적는다 — 700W/m² 가 들어와 판을 지나 12.4kW 로
 * 나오고 인버터를 거쳐 교실에 닿는다. 원리와 계측값이 같은 줄에 서야 배운 것이 지금 지붕 위에서
 * 벌어지는 일이 된다.
 *
 * 시안마다 자리와 크기만 다르게 품는다. 같은 부품을 쓰되 어디에 놓느냐가 그 시안의 주장이다.
 */
export function PrincipleStrip({ stats, level, heading }: PrincipleStripProps) {
  /*
    모듈 전면에 들어오는 빛의 세기(kW) — 일사량 × 모듈 면적.

    모듈 면적은 계측값이 아니라 설비용량에서 어림한 값이라 화면에 수로 적지 않는다. 적어 두면
    실제로 재어 온 값처럼 읽힌다. 여기서는 다음 마디(출력)와 견주기 위한 밑값으로만 쓴다.
  */
  const sunKw = (stats.irradianceNow * stats.moduleArea) / 1000;
  const copy = COPY[level];

  /*
    마디마다 값 아래에 「맑은 날 정오의 몇 %」 같은 참조 줄을 하나 더 두었는데 걷어냈다
    (2026-08-31 검토 의견). 글씨를 키우고 나니 그 한 줄이 네 마디를 통째로 키워, 이 띠가
    아래 본문에서 가져가는 높이가 곧 잘리는 글이 되었다. 값은 바로 위에 크게 서 있고
    무엇을 뜻하는지는 눈높이 문구가 이미 말한다.
  */
  const steps = [
    {
      id: 'sun' as const,
      value: formatNumber(stats.irradianceNow),
      unit: 'W/m²',
      tone: 'solar',
    },
    // 도 전체를 합치면 kW·kWh 로는 자릿수가 커져 마디를 넘는다 — 자릿수에 맞춰 M·G 로 올린다
    { id: 'cell' as const, ...formatSi(sunKw, 'W'), tone: 'solar' },
    { id: 'inverter' as const, ...formatSi(stats.outputKw, 'W'), tone: 'brand' },
    { id: 'school' as const, ...formatSi(stats.todayKwh, 'Wh'), tone: 'ok' },
  ];

  return (
    <section className={styles.strip} aria-label="햇빛이 전기가 되기까지">
      {heading ? <h2 className={styles.strip__head}>{heading}</h2> : null}

      <ol className={styles.steps}>
        {steps.map((step, index) => (
          <li key={step.id} className={styles.step} data-tone={step.tone}>
            <div className={styles.step__art} aria-hidden="true">
              <StepArt id={step.id} glow={Math.min(1, stats.loadRatio + 0.2)} />
            </div>

            <div className={styles.step__text}>
              <h3 className={styles.step__label}>
                <span className={styles.step__no}>{index + 1}</span>
                {copy[step.id].label}
              </h3>
              <p className={styles.step__value}>
                {step.value}
                <span>{step.unit}</span>
              </p>
              <p className={styles.step__line}>{copy[step.id].line}</p>
            </div>

            {/*
              마디를 잇는 화살표.
              알갱이 하나가 그 위를 건너가게 두어, 네 칸이 나열이 아니라 흐름으로 읽히게 한다.
            */}
            {index < steps.length - 1 ? (
              <span className={styles.link} aria-hidden="true">
                <i className={styles.link__dot} style={{ animationDelay: `${index * 0.5}s` } as CSSProperties} />
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** 마디마다 붙는 작은 그림 — 무엇을 말하는 마디인지 글자보다 먼저 알린다 */
function StepArt({ id, glow }: { id: StepId; glow: number }) {
  if (id === 'sun') {
    return (
      <svg viewBox="0 0 64 64" fill="none" role="presentation">
        <SceneDefs />
        <Sun cx={32} cy={32} r={17} />
      </svg>
    );
  }

  if (id === 'cell') {
    return (
      <svg viewBox="0 0 64 64" fill="none" role="presentation">
        <SceneDefs />
        {/* 비스듬히 선 판 한 장. 셀 격자가 보여야 태양전지로 읽힌다 */}
        <path d="M6 46 22 16h36L42 46Z" fill="var(--brand)" />
        <path d="M6 46 22 16h36L42 46Z" fill="var(--solar)" fillOpacity={glow * 0.35} />
        <g stroke="var(--paper)" strokeOpacity="0.4" strokeWidth="1.2">
          <path d="M16.7 26h36M11.3 36h36M30 16 14 46M42 16 26 46" />
        </g>
        <path d="M6 46 22 16h36L42 46Z" fill="url(#edu-glass)" />
        <path d="M6 46 22 16h36L42 46Z" fill="none" stroke="var(--brand-contrast)" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M6 46h36v4H6Z" fill="var(--brand-contrast)" />
        <path d="M16 50h5v10h-5ZM32 50h5v10h-5Z" fill="var(--text-faint)" />
      </svg>
    );
  }

  if (id === 'inverter') {
    return (
      <svg viewBox="0 0 64 64" fill="none" role="presentation">
        <SceneDefs />
        <rect x="12" y="16" width="40" height="40" rx="8" fill="var(--border-strong)" opacity="0.55" />
        <rect x="10" y="12" width="40" height="40" rx="8" fill="var(--surface)" />
        <rect x="10" y="12" width="40" height="40" rx="8" fill="url(#edu-shine)" />
        <rect x="10" y="12" width="40" height="40" rx="8" fill="url(#edu-shade)" />
        <rect x="10.9" y="12.9" width="38.2" height="38.2" rx="7.5" fill="none" stroke="var(--border-strong)" strokeWidth="1.8" />
        {/* 들쭉날쭉 들어와 매끄럽게 나가는 모양 — 직류가 교류가 되는 일을 한 그림으로 */}
        <path d="M16 34 22 24l6 10" stroke="var(--solar-deep)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 34q5-10 10 0" stroke="var(--ok)" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="18" cy="44" r="3" fill="var(--ok)" />
        <circle cx="27" cy="44" r="3" fill="var(--ok)" opacity="0.45" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" fill="none" role="presentation">
      <SceneDefs />
      <rect x="8" y="24" width="48" height="32" rx="3" fill="var(--surface)" />
      <rect x="8" y="24" width="48" height="32" rx="3" fill="url(#edu-shine)" />
      <rect x="8" y="24" width="48" height="32" rx="3" fill="url(#edu-shade)" />
      {[0, 1, 2].map((slot) => (
        <rect key={`u${slot}`} x={13 + slot * 15} y={30} width="10" height="9" rx="1.5" fill="var(--solar)" fillOpacity="0.85" />
      ))}
      {[0, 1, 2].map((slot) => (
        <rect key={`l${slot}`} x={13 + slot * 15} y={43} width="10" height="9" rx="1.5" fill="var(--solar)" fillOpacity="0.55" />
      ))}
      <rect x="8.9" y="24.9" width="46.2" height="30.2" rx="3" fill="none" stroke="var(--border-strong)" strokeWidth="1.6" />
      {/* 지붕 위 판 — 이 전기가 어디서 왔는지 건물 그림이 되짚는다 */}
      <path d="M4 24h56v-6H4Z" fill="var(--surface-sunken)" />
      <path d="M4 24h56v-6H4Z" fill="url(#edu-shade)" />
      {[0, 1].map((slot) => (
        <path key={slot} d={`M${12 + slot * 24} 18h16l5-6h-16Z`} fill="var(--brand)" />
      ))}
      <path d="M4 24h56v-6H4Z" fill="none" stroke="var(--border-strong)" strokeWidth="1.4" />
    </svg>
  );
}
