import { buildEduClasses } from '@/mocks/eduDiagnosis';
import { formatPercent } from '@/utils/format';
import type { EduStats } from '@/mocks/solarEdu';
import styles from './AiParts.module.scss';
import type { CSSProperties } from 'react';

interface AiClassifyStageProps {
  stats: EduStats;
  /** 이 단계 안에서 얼마나 왔는지 (0~1) — 막대가 이 값에 맞춰 차오른다 */
  progress: number;
}

/**
 * 오늘 곡선이 무엇에 가까운지 견주는 단계 (SFR-005-02).
 *
 * AI 는 "고장이다/아니다" 로 딱 잘라 답하지 않는다. 후보마다 얼마나 그럴듯한지를 함께 내놓고,
 * 사람이 그걸 보고 판단한다. 막대 넷을 세운 까닭이 그것이다 — 학생이 배울 것은 답이 아니라 이 방식이다.
 */
export function AiClassifyStage({ stats, progress }: AiClassifyStageProps) {
  const classes = buildEduClasses(stats);

  return (
    <div className={styles.classify}>
      <p className={styles.classify__head}>오늘 곡선과 견준 결과</p>

      <ul className={styles.bars}>
        {classes.map((item, index) => {
          // 위에서부터 차례로 차오르게 해 계산이 한 번에 끝나지 않는다는 것을 보인다.
          const eased = Math.min(1, Math.max(0, progress * classes.length - index));

          return (
            <li key={item.id} className={styles.bar}>
              <p className={styles.bar__head}>
                {item.label}
                <span className={styles.bar__value}>{formatPercent(item.probability * eased)}</span>
              </p>
              <span
                className={styles.bar__track}
                style={{ '--fill': `${Math.round(item.probability * eased * 100)}%` } as CSSProperties}
                aria-hidden="true"
              >
                <span className={styles.bar__fill} />
              </span>
              <p className={styles.bar__note}>{item.note}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
