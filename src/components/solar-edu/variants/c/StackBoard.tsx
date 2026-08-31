import { CountUp } from '@/components/common/CountUp';
import { EDU_ROOMY, STAGE_TONE } from '@/mocks/eduCards';
import { IMPACT_DEFS, impactFigure } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { DayCurve } from '../shared/DayCurve';
import { ImpactArt } from '../../scene-art/ImpactArt';
import { JourneyOverviewArt } from '../../JourneyOverviewArt';
import styles from './StackBoard.module.scss';

interface StackBoardProps {
  stats: EduStats;
}

/**
 * 시안 C 의 중등 본문 — 위에서 아래로 읽는 세 단 (SFR-005-01/02/03).
 *
 * 세 단이 모두 가로 전폭이고, 읽는 순서가 곧 이야기 순서다 —
 * **어떻게 만들어지고**(1단) → **오늘 얼마나 만들었고**(2단) → **그래서 뭐가 좋아졌나**(3단).
 * 칸을 좌우로 나눠 놓으면 어디부터 읽을지 눈이 한 번 고르는데, 세로로 쌓으면 고를 것이 없다.
 *
 * 네 단계는 넷을 한꺼번에 보인다. 스스로 넘어가는 판(시안 A)은 지나가다 걸린 사람이 한 단계만
 * 보고 가지만, 넷이 함께 서 있으면 어느 걸음에서 걸려도 앞뒤가 같이 읽힌다.
 */
export function StackBoard({ stats }: StackBoardProps) {
  const script = EDU_ROOMY.middle;

  return (
    <div className={styles.stack}>
      {/* 1단 — 어떻게 만들어지나. 그림 한 장 옆에 네 단계가 넷 다 선다 */}
      <section className={styles.band}>
        <p className={styles.band__head}>
          {script.principle.head}
          <span className={styles.band__note}>{script.principle.note}</span>
        </p>

        <div className={styles.flow}>
          <div className={styles.flow__art}>
            <JourneyOverviewArt stats={stats} />
          </div>

          <ol className={styles.flow__steps}>
            {script.principle.stages.map((stage) => (
              <li key={stage.id} className={styles.stage} data-tone={STAGE_TONE[stage.id]}>
                <p className={styles.stage__term}>
                  <span className={styles.stage__no}>{stage.step}</span>
                  {stage.term}
                </p>
                <p className={styles.stage__body}>{stage.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 2단 — 오늘 얼마나 만들었나 */}
      <section className={styles.band}>
        <p className={styles.band__head}>
          {script.production.head}
          <span className={styles.band__note}>{script.production.note(stats)}</span>
        </p>

        <div className={styles.today}>
          <div className={styles.today__curve}>
            <DayCurve stats={stats} showIrradiance />
          </div>
          <p className={styles.today__read}>{script.production.read}</p>
        </div>
      </section>

      {/* 3단 — 그래서 뭐가 좋아졌나 */}
      <section className={styles.band}>
        <p className={styles.band__head}>
          {script.benefit.head}
          <span className={styles.band__note}>{script.benefit.note}</span>
        </p>

        <ul className={styles.gains}>
          {script.benefit.itemIds.map((id, index) => {
            const def = IMPACT_DEFS[id];
            const figure = impactFigure(def, stats.dayKwh);

            return (
              <li key={id} className={styles.gain}>
                <span className={styles.gain__art} aria-hidden="true">
                  <ImpactArt id={script.benefit.arts[index]} />
                </span>

                <div className={styles.gain__text}>
                  <p className={styles.gain__label}>{def.label}</p>
                  <p className={styles.gain__value}>
                    <CountUp
                      value={figure.amount}
                      fractionDigits={figure.fractionDigits}
                      startOnView={false}
                    />
                    <span>{figure.unit}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
