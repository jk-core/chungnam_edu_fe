import { cn } from '@/utils/cn';
import { DIAGNOSIS_MODEL } from '@/mocks/llmDiagnosis';
import type { EduAiContent } from '@/mocks/eduContent';
import type { EduInsight } from '@/mocks/eduDiagnosis';
import type { EduScan } from '@/hooks/useEduAiScan';
import type { EduStats } from '@/mocks/solarEdu';
import { AiClassifyStage } from './ai/AiClassifyStage';
import { AiNeuralMark } from './ai/AiNeuralMark';
import { AiPipeline } from './ai/AiPipeline';
import { AiScanStage } from './ai/AiScanStage';
import { PlantScanScene } from './ai/PlantScanScene';
import styles from './AiScanPanel.module.scss';
import type { CSSProperties } from 'react';

/** 게이지 호의 반지름과 둘레 — viewBox 100×100 기준 */
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** 링 둘레의 눈금 수. 계기판처럼 보이게 하되, 촘촘하면 뭉개져 이 정도가 한계다. */
const TICKS = 48;

interface AiScanPanelProps {
  content: EduAiContent;
  /** 화면이 이미 만들어 둔 값 — 여기서 다시 계산하면 옆 곡선과 숫자가 갈린다 */
  stats: EduStats;
  insight: EduInsight;
  scan: EduScan;
}

/**
 * AI 가 이 학교 설비를 살펴보는 과정 (SFR-005-02/07/10).
 *
 * 이 회사가 하는 일이 곧 AI 고장진단이라, 학생이 보는 화면에서도 그 일이 실제로 돌아간다.
 * 다만 운영 화면을 줄여 놓은 것이 아니다 — 고장코드 대신 옆 곡선에 있는 값으로 판단하고,
 * 단계마다 "지금 왜 이걸 하는지" 를 한 줄씩 붙여 연출이 아니라 배움이 되게 했다.
 *
 * **본문이 단계마다 통째로 갈린다.** 값을 읽을 때는 24칸 격자에 불이 들어오고 확인한 것이 한 줄씩 쌓이며,
 * 견줄 때는 후보별 확률 막대가 차오르고, 풀어 쓸 때는 문장이 한 줄씩 지어진다.
 * 게이지 하나만 도는 화면으로는 "AI 가 일한다" 가 말로만 남는다 — 단계마다 하는 일이 다르면 보이는 것도 달라야 한다.
 */
export function AiScanPanel({ content, stats, insight, scan }: AiScanPanelProps) {
  const current = scan.stage.stage;
  const shown = insight.lines.slice(0, scan.revealed);
  const litTicks = Math.round((scan.percent / 100) * TICKS);
  const writing = current === 'reason' || current === 'done';

  return (
    <section
      className={styles.panel}
      style={{ '--ai-stage': scan.stage.color } as CSSProperties}
      aria-label="AI 설비 진단"
    >
      {/* 계측 화면다운 바탕 — 옅은 격자 위를 빛줄기가 훑는다 */}
      <span className={styles.mesh} aria-hidden="true" />
      <span className={styles.sweepLine} aria-hidden="true" />

      <div className={styles.head}>
        <AiNeuralMark />

        <span className={styles.head__text}>
          {content.head}
          <span className={styles.note}>{content.note}</span>
        </span>

        {/* 진행은 아래 파이프라인이 자세히 말하므로 여기서는 작은 링으로 몇 %인지만 남긴다 */}
        <span className={styles.dial}>
          <span className={styles.dial__aura} aria-hidden="true" />
          <span className={styles.dial__sweep} aria-hidden="true" />

          <svg className={styles.dial__svg} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
            <g>
              {Array.from({ length: TICKS }, (_, index) => (
                <line
                  key={index}
                  className={cn(styles.tick, { [styles['tick--lit']]: index < litTicks })}
                  x1="50"
                  y1="2.5"
                  x2="50"
                  y2="7"
                  transform={`rotate(${(index * 360) / TICKS} 50 50)`}
                />
              ))}
            </g>
            <circle className={styles.dial__track} cx="50" cy="50" r={RADIUS} strokeWidth="6" />
            <circle
              className={styles.dial__value}
              cx="50"
              cy="50"
              r={RADIUS}
              strokeWidth="6"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - scan.percent / 100)}
              transform="rotate(-90 50 50)"
            />
          </svg>

          <span className={styles.dial__percent}>
            {Math.round(scan.percent)}
            <small>%</small>
          </span>
        </span>
      </div>

      {/* AI 가 들여다보는 설비 한 벌. 단계가 넘어가면 겨냥 상자가 다음 자리로 옮겨 간다 */}
      <div className={styles.plant}>
        <PlantScanScene focus={content.stages[current].spot} />
      </div>

      <AiPipeline current={current} progress={scan.stageProgress} content={content} />

      {/*
        같은 자리를 두고 둘을 나란히 말한다 — 여기서 무슨 일이 일어나는가(태양광 원리)와,
        AI 는 그 자리에서 무엇을 보는가(진단 원리). 붙여 두어야 "AI 가 왜 저기를 보는지" 가 이어진다.
      */}
      <div key={current} className={styles.lesson}>
        <div className={styles.lesson__item}>
          <p className={styles.lesson__tag}>여기서 일어나는 일</p>
          <p className={styles.lesson__body}>{content.stages[current].physics}</p>
        </div>

        <div className={cn(styles.lesson__item, styles['lesson__item--ai'])}>
          <p className={styles.lesson__tag}>AI 가 보는 것</p>
          <p className={styles.lesson__body}>{content.stages[current].diagnosis}</p>
        </div>
      </div>

      {/* 단계마다 하는 일이 다르므로 보이는 것도 갈린다 */}
      <div className={styles.body}>
        {current === 'scan' ? <AiScanStage stats={stats} progress={scan.stageProgress} /> : null}
        {current === 'classify' ? <AiClassifyStage stats={stats} progress={scan.stageProgress} /> : null}

        {writing ? (
          <div className={styles.insight}>
            <p className={styles.insight__head}>
              AI 소견
              {scan.finished ? (
                <span className={cn(styles.verdict, styles[`verdict--${insight.band}`])}>{insight.verdict}</span>
              ) : null}
            </p>

            <ul className={styles.insight__list}>
              {/* 아직 한 줄도 못 썼을 때 자리를 비워 두면 화면이 멈춘 것처럼 보인다 — 커서만 먼저 깜빡인다 */}
              {shown.length === 0 ? (
                <li className={styles.insight__line}>
                  <span className={styles.pending}>
                    문장을 짓는 중이에요
                    <i className={styles.caret} aria-hidden="true" />
                  </span>
                </li>
              ) : null}

              {shown.map((line, index) => (
                <li key={line} className={styles.insight__line}>
                  <span>
                    {line}
                    {/* 아직 쓰는 중이라면 마지막 줄 끝에서 커서가 깜빡인다 */}
                    {!scan.finished && index === shown.length - 1 ? (
                      <i className={styles.caret} aria-hidden="true" />
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <p className={styles.footer}>
        {content.footer}
        <span className={styles.model}>{DIAGNOSIS_MODEL}</span>
      </p>
    </section>
  );
}
