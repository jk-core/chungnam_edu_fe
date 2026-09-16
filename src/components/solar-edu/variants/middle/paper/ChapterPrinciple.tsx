import { CountUp } from '@/components/common/CountUp';
import { formatNumber } from '@/utils/format';
import { type PaperScript, paperSteps } from '@/mocks/eduPaper';
import type { EduLevel } from '@/interface/edu';
import type { EduStats } from '@/mocks/solarEdu';
import { JourneyOverviewArt } from '@/components/solar-edu/JourneyOverviewArt';
import { PlantScanScene } from '@/components/solar-edu/ai/PlantScanScene';
import { StepGlyph } from './PaperGlyphs';
import styles from './ChapterPrinciple.module.scss';

interface ChapterPrincipleProps {
  stats: EduStats;
  script: PaperScript;
  level: EduLevel;
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
 *
 * 위 그림은 눈높이가 가른다 (2026-09-16 지시 — 「중·고등이 아예 다른 시안처럼 보이길」).
 *
 * 중등까지는 계통도가 서서 「어디를 거쳐 흐르는가」 를 한 줄로 보인다. 고등은 그 자리에 고등 b
 * 「햇빛이 전기가 되기까지」 가 쓰던 **설비 그림**(`PlantScanScene`)이 서서, 네 자리를 한 자리씩
 * 당겨 들여다본다 — 흐름을 멀리서 훑는 대신 그 자리에서 무슨 일이 일어나는지로 좁혀 본다.
 *
 * 계통도를 그대로 두면 중등 a 와 같은 장이 되어 눈높이가 무엇을 바꾸는지가 문장 길이로만 남는다.
 * 고등 b 의 `JourneyPanel` 은 이 장과 **같은** 계통도를 쓰므로 그쪽에서 가져와 봐야 달라지지
 * 않는다 — 그래서 같은 판의 다른 그림을 가져왔다.
 *
 * 한 자리씩 당겨 넘기지 않고 **넷을 한 번에** 보인다. 넘기면 보는 사람이 넷을 다 볼 때까지
 * 기다려야 하고, 그동안 그림이 가리키는 자리와 아래 네 걸음의 글이 서로 어긋난다 — 이 장이
 * 말하려는 것은 한 자리의 속내가 아니라 **넷이 한 줄로 이어져 있다는 것**이다.
 */
export function ChapterPrinciple({ stats, script, level }: ChapterPrincipleProps) {
  const steps = paperSteps(stats, script);

  /*
    그림에 얹을 번호와 값.

    아래 네 걸음이 쓰는 것과 **같은 수**를 넘긴다 — 그림과 글이 각자 셈하면 같은 자리에 다른 수가
    적히는 날이 온다. 그림의 자리 이름(`grid`)과 걸음의 이름(`school`)만 서로 다르므로 여기서 맞춘다.
  */
  const marks = {
    sun: `${formatNumber(steps[0].amount, steps[0].fractionDigits)}${steps[0].unit}`,
    cell: `${formatNumber(steps[1].amount, steps[1].fractionDigits)}${steps[1].unit}`,
    inverter: `${formatNumber(steps[2].amount, steps[2].fractionDigits)}${steps[2].unit}`,
    grid: `${formatNumber(steps[3].amount, steps[3].fractionDigits)}${steps[3].unit}`,
  };

  return (
    <div className={styles.principle}>
      <div className={styles.art} data-kind={level === 'high' ? 'plant' : 'journey'}>
        {level === 'high'
          ? <PlantScanScene marks={marks} />
          : <JourneyOverviewArt stats={stats} />}
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
