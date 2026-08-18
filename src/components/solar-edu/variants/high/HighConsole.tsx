import { useMemo } from 'react';
import { buildEduInsight } from '@/mocks/eduDiagnosis';
import { useEduAiScan } from '@/hooks/useEduAiScan';
import { FULL_SUN_WM2 } from '@/mocks/solarEdu';
import { formatNumber, formatPercent } from '@/utils/format';
import type { AnalysisStage } from '@/interface/diagnosis';
import type { HighContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { DayCurve } from '../shared/DayCurve';
import { PrincipleStrip } from '../shared/PrincipleStrip';
import styles from './HighConsole.module.scss';
import type { CSSProperties } from 'react';

/** 신경망 그림의 층 구성 — 입력 넷, 은닉 다섯·넷, 출력 셋 */
const LAYERS = [4, 5, 4, 3];

/** 진단이 지나는 차례. 로그와 신경망이 같은 순서를 봐야 둘이 어긋나지 않는다 */
const STAGE_ORDER: AnalysisStage[] = ['scan', 'classify', 'reason', 'done'];

interface HighConsoleProps {
  scopeLabel: string;
  stats: EduStats;
  content: HighContent;
}

/**
 * 고등 판 · 시안 B — AI 콘솔 (SFR-005-02/07).
 *
 * 현행 시안은 AI 를 화면 **가운데 한 칸** 에 앉힌다. 자료와 의미 사이에 AI 가 있다는 배치는 옳지만,
 * AI 가 실제로 무엇을 하는지는 게이지 하나로 줄어든다.
 *
 * 이 시안은 화면 전체를 진단 콘솔로 삼는다. 왼쪽에서 특징량이 신경망으로 흘러 들어가고, 가운데에
 * 판단이 로그로 쌓이며, 오른쪽에서 결론이 확률로 맺힌다. 진단이 "돌고 있다" 가 아니라
 * "무엇을 입력받아 어떤 근거로 무엇이라 판정했다" 가 보이는 것이 이 시안이 노리는 바다.
 *
 * 어두운 바탕은 취향이 아니라 대비 문제다 — 흐르는 로그와 신호선이 흰 종이 위에서는 잡티로 보인다.
 */
export function HighConsole({ scopeLabel, stats, content }: HighConsoleProps) {
  const insight = useMemo(() => buildEduInsight(stats, scopeLabel), [stats, scopeLabel]);
  const scan = useEduAiScan(insight.lines.length);
  const stage = scan.stage.stage;

  // 신경망에 넣는 특징량. 실제 진단이 보는 값들을 0~1 로 눕혀 막대로 세운다.
  const achieved = stats.expectedKwh > 0 ? stats.dayKwh / stats.expectedKwh : 0;
  const features = [
    { id: 'irradiance', label: '일사강도', raw: `${formatNumber(stats.irradianceNow)} W/m²`, ratio: stats.irradianceNow / FULL_SUN_WM2 },
    { id: 'load', label: '출력 / 설비용량', raw: formatPercent(stats.loadRatio), ratio: stats.loadRatio },
    { id: 'achieved', label: '기대 대비 달성률', raw: formatPercent(achieved), ratio: achieved },
    { id: 'hours', label: '발전시간', raw: `${formatNumber(stats.equivalentHours, 1)} h`, ratio: stats.equivalentHours / 8 },
  ];

  // 결론. 목데이터에는 확률이 없으므로 달성률을 그대로 신뢰도로 삼되, 무엇으로 셈했는지 밝힌다.
  const confidence = Math.min(0.99, Math.max(0.4, achieved));

  return (
    <div className={styles.shell} data-theme="dark">
      {/*
        진단 이야기 위에 태양광 원리를 먼저 세운다.

        이 화면은 AI 가 무엇을 어떻게 판단하는지를 잘 보여 주지만, 정작 **판단의 대상인 태양광**
        자체는 특징량 네 줄로만 스친다. 걸어 두는 화면의 목적이 태양광 설명이라면 진단은
        그 위에 얹히는 이야기여야지 그것을 밀어내서는 안 된다.
      */}
      <PrincipleStrip stats={stats} level="high" heading="진단하는 대상 — 햇빛이 전기가 되는 길" />

      <div className={styles.console}>
        {/* 왼쪽 — 무엇을 입력받는가 */}
        <section className={styles.panel} aria-label="진단에 넣는 특징량">
          <h2 className={styles.panel__title}>
            INPUT
            <span>특징량 {features.length}종</span>
          </h2>

          <ul className={styles.features}>
            {features.map((feature) => (
              <li key={feature.id} className={styles.feature}>
                <span className={styles.feature__label}>{feature.label}</span>
                <span className={styles.feature__raw}>{feature.raw}</span>
                <div className={styles.feature__track}>
                  <span
                    className={styles.feature__fill}
                    style={{ inlineSize: `${(Math.min(1, Math.max(0, feature.ratio)) * 100).toFixed(1)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className={styles.curve}>
            <p className={styles.curve__label}>시간대별 계측 시계열</p>
            <DayCurve stats={stats} showIrradiance showNow />
          </div>
        </section>

        {/* 가운데 — 무엇을 하고 있는가 */}
        <section className={styles.panel} aria-label="진단 진행">
          <h2 className={styles.panel__title}>
            MODEL
            <span>{content.ai.stages[stage].label}</span>
          </h2>

          <div className={styles.net}>
            <NeuralGraph stage={stage} />
          </div>

          {/*
            진행 로그.
            단계 이름만 바뀌는 게이지로는 AI 가 무엇을 보고 있는지 알 수 없다. 단계마다
            "그 자리에서 무슨 일이 일어나는가" 와 "AI 는 거기서 무엇을 보는가" 를 나란히 적는다.
          */}
          <ol className={styles.log}>
            {STAGE_ORDER.map((key, index) => {
              const item = content.ai.stages[key];
              const passed = STAGE_ORDER.indexOf(stage) >= index;

              return (
                <li key={key} className={styles.log__row} data-on={passed ? '' : undefined}>
                  <span className={styles.log__key}>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{item.label}</strong>
                    <p className={styles.log__physics}>{item.physics}</p>
                    <p className={styles.log__diagnosis}>{item.diagnosis}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className={styles.progress} role="img" aria-label={`진단 ${scan.percent}퍼센트`}>
            <span style={{ inlineSize: `${scan.percent}%` }} />
          </div>
        </section>

        {/* 오른쪽 — 그래서 무엇이라 판정했는가 */}
        <section className={styles.panel} aria-label="진단 결과">
          <h2 className={styles.panel__title}>
            OUTPUT
            <span>{insight.verdict}</span>
          </h2>

          <div className={styles.verdict} data-band={insight.band}>
            <p className={styles.verdict__value}>{formatPercent(confidence)}</p>
            <p className={styles.verdict__label}>기대 대비 달성률로 셈한 신뢰도</p>
          </div>

          {/*
            소견은 진행에 맞춰 한 줄씩 드러난다.
            다 적어 두고 흐리게 두면 읽는 사람이 아직 안 나온 줄을 먼저 읽어 버려, 판단이 쌓이는
            과정을 보여 주려던 것이 무너진다.

            다만 추론에 들어서기 전(주기의 앞 10초쯤)에는 드러날 줄이 하나도 없어 칸이 통째로 빈다.
            걸어 두는 화면에서 빈 칸은 고장으로 읽히므로, 그동안 무엇을 하고 있는지를 대신 적는다.
          */}
          {scan.revealed === 0 ? (
            <p className={styles.waiting}>
              {insight.detail[stage]}
              <span>판단이 서면 근거가 한 줄씩 쌓인다</span>
            </p>
          ) : null}

          <ul className={styles.lines}>
            {insight.lines.map((line, index) => (
              <li
                key={line}
                className={styles.line}
                data-on={index < scan.revealed ? '' : undefined}
                style={{ transitionDelay: `${(index * 0.08).toFixed(2)}s` } as CSSProperties}
              >
                {index < scan.revealed ? line : null}
              </li>
            ))}
          </ul>

          <p className={styles.footer}>{content.ai.footer}</p>
        </section>
      </div>
    </div>
  );
}

/**
 * 층 사이로 신호가 흐르는 신경망 그림.
 *
 * 실제 모델의 구조는 아니다 — 층을 지나며 값이 합쳐진다는 것만 보이면 되는 그림이라,
 * 노드 수를 적게 두어 선이 뭉치지 않게 했다. 지금 단계에 해당하는 층이 밝아진다.
 */
function NeuralGraph({ stage }: { stage: AnalysisStage }) {
  const active = STAGE_ORDER.indexOf(stage);
  const width = 260;
  const height = 150;
  const gap = width / (LAYERS.length - 1);

  const nodes = LAYERS.map((count, layer) =>
    Array.from({ length: count }, (_, index) => ({
      x: layer * gap,
      y: (height / (count + 1)) * (index + 1),
    })));

  return (
    <svg className={styles.graph} viewBox={`-6 0 ${width + 12} ${height}`} fill="none" role="presentation">
      {nodes.slice(0, -1).map((layer, layerIndex) =>
        layer.map((from) =>
          nodes[layerIndex + 1].map((to) => (
            <line
              key={`${layerIndex}-${from.y}-${to.y}`}
              className={styles.graph__edge}
              data-on={layerIndex <= active ? '' : undefined}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            />
          ))))}

      {nodes.map((layer, layerIndex) =>
        layer.map((node) => (
          <circle
            key={`${layerIndex}-${node.y}`}
            className={styles.graph__node}
            data-on={layerIndex <= active ? '' : undefined}
            cx={node.x}
            cy={node.y}
            r={5}
          />
        )))}
    </svg>
  );
}
