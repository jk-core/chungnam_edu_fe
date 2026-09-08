import { CountUp } from '@/components/common/CountUp';
import { type PaperScript, paperSteps } from '@/mocks/eduPaper';
import type { EduStats } from '@/mocks/solarEdu';
import { JourneyOverviewArt } from '@/components/solar-edu/JourneyOverviewArt';
import { StepGlyph } from './PaperGlyphs';
import styles from './ChapterPrinciple.module.scss';

interface ChapterPrincipleProps {
  stats: EduStats;
  script: PaperScript;
}

/**
 * 2장 — 햇빛이 전기가 되기까지 (SFR-005-03).
 *
 * 위에 계통도가 서고 아래에 네 걸음이 한 줄로 놓인다. 그림이 「전체가 어떻게 이어지는가」 를
 * 보이고, 글이 그 아래에서 자리마다 무슨 일이 일어나는지를 받는다.
 *
 * 계통도는 다른 교육 화면이 쓰던 것을 그대로 가져왔다 (2026-09-01). 케이블을 타고 흐르는
 * 알갱이가 전기의 방향을 말해 주는 그림이라, 이 장에서 하려는 말과 정확히 같다 —
 * 같은 것을 두 번 그릴 이유가 없다.
 *
 * 그림이 흐름을 맡으므로 걸음 사이를 잇던 실선과 그 위를 건너던 불빛은 두지 않는다.
 * 한 화면에서 두 가지가 동시에 흐르면 어느 쪽을 따라가야 할지가 없어진다.
 *
 * 걸음마다 **지금 재고 있는 값**을 하나씩 얹는다. 원리만 있으면 교과서이고, 오늘의 값이
 * 붙어야 눈앞의 지붕에서 지금 일어나는 일로 읽힌다.
 */
export function ChapterPrinciple({ stats, script }: ChapterPrincipleProps) {
  const steps = paperSteps(stats, script);

  return (
    <div className={styles.principle}>
      <div className={styles.art}>
        <JourneyOverviewArt stats={stats} />
      </div>

      <ol className={styles.flow}>
        {steps.map((step, index) => (
          <li key={step.id} className={styles.step}>
            <span className={styles.step__mark}>
              <StepGlyph id={step.id} />
            </span>

            <p className={styles.step__term}>
              <span className={styles.step__no}>{String(index + 1).padStart(2, '0')}</span>
              {step.term}
            </p>

            <p className={styles.gauge}>
              <span className={styles.gauge__term}>{step.gaugeTerm}</span>
              <span className={styles.gauge__value}>
                <CountUp value={step.amount} fractionDigits={step.fractionDigits} />
                {step.unit}
              </span>
            </p>

            <p className={styles.step__body}>{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
