import { cn } from '@/utils/cn';
import { EDU_SCAN_STAGES } from '@/mocks/eduDiagnosis';
import type { AnalysisStage } from '@/interface/diagnosis';
import type { EduAiContent } from '@/mocks/eduContent';
import styles from './AiParts.module.scss';
import type { CSSProperties } from 'react';

interface AiPipelineProps {
  current: AnalysisStage;
  /** 지금 단계 안에서 얼마나 왔는지 (0~1) */
  progress: number;
  content: EduAiContent;
}

/**
 * 네 단계를 가로로 이은 파이프라인.
 *
 * 목록으로 세워 두면 그저 할 일 목록으로 읽힌다. 마디를 선으로 이어 두면 값이 왼쪽에서 들어와
 * 오른쪽으로 빠져나가는 흐름이 되고, 지금 어느 마디에 있는지가 한눈에 짚인다.
 * 마디 사이 선은 지나간 만큼 차오른다.
 */
export function AiPipeline({ current, progress, content }: AiPipelineProps) {
  const at = EDU_SCAN_STAGES.findIndex((item) => item.stage === current);

  return (
    <ol className={styles.pipe}>
      {EDU_SCAN_STAGES.map((item, index) => {
        const done = index < at;
        const active = index === at;
        // 지나온 마디는 선이 다 찼고, 지금 마디는 진행한 만큼만 찬다.
        const fill = done ? 1 : active ? progress : 0;

        return (
          <li
            key={item.stage}
            className={cn(styles.pipe__step, {
              [styles['pipe__step--done']]: done,
              [styles['pipe__step--active']]: active,
            })}
            style={{ '--ai-stage': item.color, '--fill': `${Math.round(fill * 100)}%` } as CSSProperties}
          >
            {index > 0 ? <span className={styles.pipe__wire} aria-hidden="true" /> : null}
            <span className={styles.pipe__node} aria-hidden="true" />
            <span className={styles.pipe__label}>{content.stages[item.stage].label}</span>
          </li>
        );
      })}
    </ol>
  );
}
