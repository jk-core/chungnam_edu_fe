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
import { TraceBorder } from './ai/TraceBorder';
import styles from './AiScanPanel.module.scss';
import type { CSSProperties } from 'react';

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
  const writing = current === 'reason' || current === 'done';

  return (
    <section
      className={styles.panel}
      style={{ '--ai-stage': scan.stage.color } as CSSProperties}
      aria-label="AI 설비 진단"
    >
      {/* 계측 화면다운 바탕 */}
      <span className={styles.mesh} aria-hidden="true" />

      {/*
        테두리를 도는 빛.
        판을 가로지르던 바를 걷어 낸 자리다 — 이 칸은 글이 많아, 띠가 글 위를 지나가면
        읽는 동안 내내 방해가 된다. 테두리로 물러나면 "돌고 있다" 는 신호만 남는다.
      */}
      <TraceBorder radius={12} />

      <div className={styles.head}>
        <AiNeuralMark />

        <span className={styles.head__text}>
          {content.head}
          <span className={styles.note}>{content.note}</span>
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
