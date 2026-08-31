import { FULL_SUN_WM2 } from '@/mocks/solarEdu';
import { useAutoPager } from '@/hooks/useAutoPager';
import { formatNumber } from '@/utils/format';
import type { MiddleContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { CastShadow, SceneDefs } from '../../scene-art/SceneDefs';
import { Box, Building, RoofPanel, SolarPanel, Sun, Window } from '../../scene-art/SceneParts';
import { DayCurve } from '../shared/DayCurve';
import styles from './MiddleFlow.module.scss';
import type { CSSProperties } from 'react';

/** 흐름 그림의 좌표계 */
const VIEW = { width: 1180, height: 300 };

/** 마디가 서는 가로 자리 — 네 칸이 고르게 벌어져야 흐름으로 읽힌다 */
const STATION = [140, 420, 700, 980];

/** 땅금이 지나는 높이 */
const GROUND = 262;

/** 원리 한 단계가 머무는 시간 */
const STEP_MS = 11_000;

interface MiddleFlowProps {
  stats: EduStats;
  content: MiddleContent;
}

/**
 * 중등 판 · 시안 B — 흐름도 한 장 (SFR-005-02/03).
 *
 * 현행 시안은 원리를 네 단계로 나눠 **한 토막씩 넘겨** 보여 준다. 잘 읽히지만 네 토막이 서로
 * 어떻게 이어지는지는 머릿속에서 다시 이어 붙여야 한다.
 *
 * 이 시안은 넷을 한 줄로 잇는다. 설비를 실제 모양으로 그려 놓고 그 사이를 빛과 전기가 흐르게 하되,
 * 마디마다 **지금 이 학교의 계측값** 을 붙인다 — 햇빛 700W/m² 가 들어와 판을 지나 12.4kW 로 나오고
 * 인버터를 거쳐 교실에 닿는 식이다. 원리와 계측값이 같은 줄 위에 서면, 배운 것이 지금 지붕 위에서
 * 벌어지는 일이라는 것이 보인다.
 */
export function MiddleFlow({ stats, content }: MiddleFlowProps) {
  /*
    모듈 전면에 들어오는 빛의 세기(kW) — 일사강도 × 모듈 면적.
    모듈 면적은 계측값이 아니라 설비용량에서 어림한 값이라 화면에 수로 적지 않는다.
  */
  const sunKw = (stats.irradianceNow * stats.moduleArea) / 1000;
  // 빛이 전기가 되는 비율. 계측값끼리 나눈 값이라 날씨에 따라 오르내린다.
  const efficiency = sunKw > 0 ? (stats.outputKw / sunKw) * 100 : 0;
  /*
    원리 네 단계는 한 번에 하나만 편다.
    넷을 늘어놓으면 칸을 넘겨 안쪽에 스크롤이 생기는데, 걸어 두는 화면에는 그것을 굴려 줄 사람이 없다.
  */
  const pager = useAutoPager({ total: content.principle.stages.length, perPage: 1, intervalMs: STEP_MS });
  const stage = content.principle.stages[pager.page];

  const nodes = [
    {
      id: 'sun',
      step: 1,
      label: '일사강도',
      value: formatNumber(stats.irradianceNow),
      unit: 'W/m²',
      note: `맑은 날 정오(${formatNumber(FULL_SUN_WM2)})의 ${Math.round((stats.irradianceNow / FULL_SUN_WM2) * 100)}%`,
      tone: 'solar',
    },
    {
      id: 'cell',
      step: 2,
      label: '태양전지',
      value: formatNumber(sunKw, 1),
      unit: 'kW',
      note: '패널 앞면에 들어오는 햇빛의 세기',
      tone: 'solar',
    },
    {
      id: 'inverter',
      step: 3,
      label: '인버터',
      value: formatNumber(stats.outputKw, 1),
      unit: 'kW',
      note: `들어온 빛의 ${formatNumber(efficiency, 1)}% 가 전기로 · 직류를 교류로`,
      tone: 'brand',
    },
    {
      id: 'school',
      step: 4,
      label: '학교',
      value: formatNumber(stats.todayKwh, 0),
      unit: 'kWh',
      note: '금일 지금까지 쌓인 발전량',
      tone: 'ok',
    },
  ];

  return (
    <div className={styles.board}>
      <section className={styles.flow} aria-label={content.principle.head}>
        <header className={styles.flow__head}>
          <h2 className={styles.title}>{content.principle.head}</h2>
          <p className={styles.note}>빛이 들어와 전기가 되어 나가기까지 · 마디마다 지금 이 학교의 실측값이다</p>
        </header>

        {/*
          흐름 그림.

          네 마디를 상자로만 세우면 도표지 흐름이 아니다. 설비를 실제 모양으로 그리고 그 사이에
          흐르는 것을 알갱이로 보여야, 무언가가 왼쪽에서 오른쪽으로 옮겨 간다는 것이 읽힌다.
        */}
        <div className={styles.canvas}>
          <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} fill="none" role="presentation" preserveAspectRatio="xMidYMid meet">
            <SceneDefs />

            <path d={`M20 ${GROUND}h${VIEW.width - 40}`} stroke="var(--border-subtle)" strokeWidth="4" strokeLinecap="round" />

            {/* ① 햇빛 — 판을 향해 비스듬히 쏟아진다 */}
            <path
              d={`M${STATION[0] - 44} 96L${STATION[0] + 44} 96 ${STATION[1] + 70} 214H${STATION[1] - 96}Z`}
              fill="var(--solar)"
              fillOpacity="0.16"
            />
            <Sun cx={STATION[0]} cy={96} r={46} glowClass={styles.sunGlow} rayClass={styles.sunRays} />

            {/* 빛 알갱이 — 해에서 판으로 */}
            <g fill="var(--solar-deep)">
              {[0, 0.5, 1].map((at) => (
                <circle key={at} className={styles.photon} r="8" style={delay(at)} />
              ))}
            </g>

            {/* ② 태양전지 */}
            <SolarPanel x={STATION[1] - 100} y={130} scale={0.95} glow={0.18 + stats.loadRatio * 0.4} />

            {/* 직류 — 한 방향으로만 흐른다 */}
            <path
              d={`M${STATION[1] + 62} 246 ${STATION[2] - 96} 246`}
              stroke="var(--solar-deep)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <text className={styles.wire} x={(STATION[1] + STATION[2]) / 2 - 16} y={234}>DC</text>
            <g fill="var(--solar)">
              {[0, 0.9].map((at) => (
                <circle key={at} className={styles.dc} r="7" style={delay(at)} />
              ))}
            </g>

            {/* ③ 인버터 */}
            <Box x={STATION[2] - 90} y={166} w={96} h={92} radius={14}>
              <rect x="14" y="16" width="68" height="34" rx="4" fill="var(--brand)" fillOpacity="0.24" />
              <rect x="14" y="16" width="68" height="34" rx="4" fill="url(#edu-shade)" />
              <path d="M18 40 28 24 38 40 48 24" stroke="var(--solar-deep)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M52 34q7 -14 14 0t14 0" stroke="var(--ok)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <circle className={styles.blink} cx="20" cy="70" r="5" fill="var(--ok)" />
              <circle className={styles.blink} cx="38" cy="70" r="5" fill="var(--ok)" style={delay(0.7)} />
            </Box>

            {/* 교류 — 방향이 번갈아 바뀐다 */}
            <path
              d={`M${STATION[2] + 12} 214 ${STATION[3] - 130} 214`}
              stroke="var(--ok)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <text className={styles.wire} x={(STATION[2] + STATION[3]) / 2 - 44} y={202}>AC</text>
            <g fill="var(--ok)">
              {[0, 0.65].map((at) => (
                <circle key={at} className={styles.ac} r="7" style={delay(at)} />
              ))}
            </g>

            {/* ④ 학교 — 지붕 위 판이 흐름의 시작과 끝을 잇는다 */}
            <Building x={STATION[3] - 126} y={150} w={180} h={112} depth={20}>
              {[0, 1, 2, 3].map((slot) => (
                <Window
                  key={`w-${slot}`}
                  x={16 + slot * 40}
                  y={22}
                  w={26}
                  h={28}
                  className={styles.window}
                  style={delay(slot * 0.24)}
                />
              ))}
              {[0, 1, 2, 3].map((slot) => (
                <Window
                  key={`l-${slot}`}
                  x={16 + slot * 40}
                  y={66}
                  w={26}
                  h={28}
                  className={styles.window}
                  style={delay(1.1 + slot * 0.24)}
                />
              ))}
              {[0, 1, 2].map((slot) => (
                <RoofPanel key={slot} x={12 + slot * 58} y={-18} w={50} d={13} />
              ))}
            </Building>

            <CastShadow cx={STATION[0]} cy={GROUND} rx={70} ry={8} />
          </svg>
        </div>

        {/*
          그림 아래 값 띠.
          숫자를 그림 위에 얹으면 설비마다 자리가 달라 글씨가 겹치거나 그림을 가린다.
          같은 순서로 아래에 늘어놓으면 눈이 그림과 띠를 오르내리며 짝을 맞춘다.
        */}
        <ol className={styles.readouts}>
          {nodes.map((node) => (
            <li key={node.id} className={styles.readout} data-tone={node.tone}>
              <span className={styles.readout__step}>{node.step}</span>
              <div className={styles.readout__text}>
                <h3 className={styles.readout__label}>{node.label}</h3>
                <p className={styles.readout__value}>
                  {node.value}
                  <span>{node.unit}</span>
                </p>
                <p className={styles.readout__note}>{node.note}</p>
              </div>

            </li>
          ))}
        </ol>
      </section>

      <div className={styles.bottom}>
        {/* 왼쪽 아래 — 마디마다 무슨 일이 일어나는가 */}
        <section className={styles.steps} aria-label="단계별 설명">
          {/*
            빛의 대부분이 어디로 가는지.
            흐름도는 남는 것만 따라가느라 잃는 것을 말하지 않는다 — 받은 빛의 여덟 할이 열이 되어
            흩어진다는 사실이야말로 태양광을 이해하는 데 빠질 수 없는 대목이다.
          */}
          <p className={styles.loss}>
            패널이 받은 빛 가운데 전기가 되는 몫은 <strong>{formatNumber(efficiency, 1)}%</strong> 이다.
            나머지는 대부분 열이 되어 흩어지고, 일부는 표면에서 되튕겨 나간다.
            이와 별개로 패널이 뜨거워지면 전압이 낮아져, 같은 빛을 받아도 효율이 떨어진다.
          </p>

          {/* 글이 갈릴 때 요소가 새로 만들어지도록 `key` 를 단계로 둔다 */}
          <div key={stage.id} className={styles.steps__body} role="status">
            <p className={styles.steps__term}>
              <span className={styles.steps__no}>{stage.step}</span>
              {stage.term}
            </p>
            <p className={styles.steps__text}>{stage.body}</p>
          </div>

          {/* 지나간 단계로 되돌아갈 수 있게 이름을 늘어놓는다 */}
          <ol className={styles.tabs}>
            {content.principle.stages.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={index === pager.page ? styles['tab--active'] : styles.tab}
                  onClick={() => pager.goTo(index)}
                  aria-current={index === pager.page ? 'true' : undefined}
                >
                  {item.term}
                </button>
              </li>
            ))}
          </ol>
        </section>

        {/* 오른쪽 아래 — 그 흐름이 하루 동안 그린 모양 */}
        <section className={styles.curve} aria-label={content.production.head}>
          <header>
            <h2 className={styles.title}>{content.production.head}</h2>
            <p className={styles.note}>{content.production.note(stats)}</p>
          </header>

          <div className={styles.curve__canvas}>
            <DayCurve stats={stats} showIrradiance />
          </div>

          <ul className={styles.curve__notes}>
            {content.production.notes.map((item) => (
              <li key={item.id}>
                <strong>{item.term}</strong>
                {item.body}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** 알갱이가 줄지어 흐르게 시작 시각을 어긋낸다 */
function delay(seconds: number): CSSProperties {
  return { animationDelay: `${seconds}s` } as CSSProperties;
}
