import { CountUp } from '@/components/common/CountUp';
import { EDU_ROOMY, STAGE_TONE } from '@/mocks/eduCards';
import { IMPACT_DEFS, impactFigure } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { DayCurve } from '../shared/DayCurve';
import { ImpactArt } from '../../scene-art/ImpactArt';
import { JourneyOverviewArt } from '../../JourneyOverviewArt';
import styles from './TwoColumnBoard.module.scss';

interface TwoColumnBoardProps {
  stats: EduStats;
}

/**
 * 시안 C 의 중등 본문 — 왼쪽은 원리, 오른쪽은 오늘 (SFR-005-01/02/03).
 *
 * 처음에는 세 단을 위에서 아래로 쌓았는데, 단마다 높이가 얕아져 곡선이 제 크기를 못 받고
 * 잘렸다 (2026-08-31). 그림과 곡선은 **세로가 있어야 읽히는 것**이라, 화면을 좌우로 가르고
 * 세로를 통째로 내주는 편이 맞다.
 *
 * 왼쪽 한 칸이 위아래를 다 쓴다 — 계통도가 크게 서고 그 아래 네 단계가 차례로 놓인다.
 * 오른쪽은 위가 오늘의 곡선, 아래가 환산이다. 왼쪽이 **늘 같은 것**(원리), 오른쪽이
 * **날마다 바뀌는 것**(값)이라 읽는 사람이 어느 쪽을 다시 볼지 고르기 쉽다.
 *
 * 네 단계는 넷을 한꺼번에 보인다. 스스로 넘어가는 판(시안 A)은 걸린 순간의 한 단계만
 * 읽히지만, 넷이 함께 서 있으면 어디에서 걸려도 앞뒤가 같이 읽힌다.
 */
export function TwoColumnBoard({ stats }: TwoColumnBoardProps) {
  const script = EDU_ROOMY.middle;

  return (
    <div className={styles.board}>
      {/* 왼쪽 — 늘 같은 것. 계통도가 세로를 통째로 받아 크게 선다 */}
      <section className={styles.card}>
        <p className={styles.card__head}>
          {script.principle.head}
          <span className={styles.card__note}>{script.principle.note}</span>
        </p>

        <div className={styles.flow__art}>
          <JourneyOverviewArt stats={stats} />
        </div>

        <ol className={styles.steps}>
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
      </section>

      {/* 오른쪽 위 — 오늘 얼마나 만들었나 */}
      <section className={styles.card}>
        <p className={styles.card__head}>
          {script.production.head}
          <span className={styles.card__note}>{script.production.note(stats)}</span>
        </p>

        <div className={styles.today}>
          <div className={styles.curve}>
            <DayCurve stats={stats} showIrradiance />
          </div>

          <p className={styles.read}>{script.production.read}</p>
        </div>
      </section>

      {/* 오른쪽 아래 — 그래서 뭐가 좋아졌나 */}
      <section className={styles.card}>
        <p className={styles.card__head}>
          {script.benefit.head}
          <span className={styles.card__note}>{script.benefit.note}</span>
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
