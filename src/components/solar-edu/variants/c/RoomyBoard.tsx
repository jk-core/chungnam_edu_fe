import { CountUp } from '@/components/common/CountUp';
import { EDU_ROOMY } from '@/mocks/eduCards';
import { IMPACT_DEFS, impactFigure } from '@/mocks/eduContent';
import { cn } from '@/utils/cn';
import { useAutoPager } from '@/hooks/useAutoPager';
import type { EduStats } from '@/mocks/solarEdu';
import { DayCurve } from '../shared/DayCurve';
import { ImpactArt } from '../../scene-art/ImpactArt';
import { JourneyOverviewArt } from '../../JourneyOverviewArt';
import styles from './RoomyBoard.module.scss';

/** 한 단계가 머무는 시간 — 세 줄 남짓을 읽고도 그림을 볼 틈이 남을 만큼 */
const STEP_MS = 11_000;

interface RoomyBoardProps {
  stats: EduStats;
  level: 'middle' | 'high';
}

/**
 * 시안 C 의 중·고등 본문 — 여러 칸을 한 화면에, 다만 넓게 (SFR-005-01/02/03/07).
 *
 * 초등처럼 한 장씩 넘기지 않는다. 이 나이에는 곡선과 환산을 나란히 놓고 견주는 편이 낫고,
 * 넘겨 읽는 화면에서는 앞뒤를 맞대어 볼 수가 없다 (2026-08-31 지시).
 *
 * 그래서 시안 A 와 같은 구성을 쓰되 **칸을 덜어내고 남은 칸을 키웠다**. 고등 A 가 여섯 칸이라면
 * 여기는 세 칸이고, 곡선에 붙는 읽는 법은 둘에서 하나로, 환산은 넉 장에서 석 장으로 줄였다.
 * 그렇게 비운 자리에 글씨와 그림이 들어선다 — 걸어 두고 멀리서 읽는 화면에서 정작 필요한 것은
 * 항목 수가 아니라 한 항목이 얼마나 크게 서느냐다.
 *
 * 중등과 고등이 같은 골격을 쓴다. 갈리는 것은 대본뿐이라, 두 판을 나란히 놓으면 난이도 차이만
 * 도드라진다 — 어느 쪽이 학생에게 맞는지 고르기 위한 화면이므로 그 편이 낫다.
 */
export function RoomyBoard({ stats, level }: RoomyBoardProps) {
  const script = EDU_ROOMY[level];
  const pager = useAutoPager({
    total: script.principle.stages.length,
    perPage: 1,
    intervalMs: STEP_MS,
  });
  const stage = script.principle.stages[Math.min(pager.page, script.principle.stages.length - 1)];

  return (
    <div className={styles.board}>
      {/* 왼쪽 위 — 계통 네 단계. 그림에서 그 자리만 또렷해지고 글은 한 덩이씩 갈린다 */}
      <section className={styles.card}>
        <p className={styles.card__head}>
          {script.principle.head}
          <span className={styles.card__note}>{script.principle.note}</span>
        </p>

        <div className={styles.principle}>
          <div className={styles.principle__art}>
            <JourneyOverviewArt stats={stats} focus={stage.step} />
          </div>

          {/* 단계가 넘어갈 때 글이 새로 들어오도록 `key` 를 건다 */}
          <div key={stage.id} className={styles.principle__text} role="status">
            <p className={styles.principle__term}>
              <span className={styles.principle__no}>{stage.step}</span>
              {stage.term}
            </p>
            <p className={styles.principle__body}>{stage.body}</p>
          </div>
        </div>

        <ol className={styles.steps}>
          {script.principle.stages.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={cn(styles.step, { [styles['step--on']]: index === pager.page })}
                onClick={() => pager.goTo(index)}
                aria-current={index === pager.page ? 'step' : undefined}
              >
                {item.term}
              </button>
            </li>
          ))}
        </ol>
      </section>

      {/* 왼쪽 아래 — 오늘의 곡선. 읽는 법은 한 줄만 붙인다 */}
      <section className={styles.card}>
        <p className={styles.card__head}>
          {script.production.head}
          <span className={styles.card__note}>{script.production.note(stats)}</span>
        </p>

        <div className={styles.curve}>
          <DayCurve stats={stats} showIrradiance />
        </div>

        <p className={styles.read}>{script.production.read}</p>
      </section>

      {/* 오른쪽 — 환산 석 장 */}
      <section className={styles.card}>
        <p className={styles.card__head}>
          {script.benefit.head}
          <span className={styles.card__note}>{script.benefit.note}</span>
        </p>

        <ul className={styles.benefit}>
          {script.benefit.itemIds.map((id, index) => {
            const def = IMPACT_DEFS[id];
            const figure = impactFigure(def, stats.dayKwh);

            return (
              <li key={id} className={styles.impact}>
                <span className={styles.impact__art} aria-hidden="true">
                  <ImpactArt id={script.benefit.arts[index]} />
                </span>

                <div className={styles.impact__text}>
                  <p className={styles.impact__label}>{def.label}</p>
                  <p className={styles.impact__value}>
                    <CountUp
                      value={figure.amount}
                      fractionDigits={figure.fractionDigits}
                      startOnView={false}
                    />
                    <span>{figure.unit}</span>
                  </p>
                  <p className={styles.impact__line}>{def.line}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
