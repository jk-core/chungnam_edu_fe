import { CountUp } from '@/components/common/CountUp';
import { EDU_ROOMY, STAGE_TONE } from '@/mocks/eduCards';
import { IMPACT_DEFS, impactFigure } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { DayCurve } from '../shared/DayCurve';
import { ImpactArt } from '../../scene-art/ImpactArt';
import { JourneyOverviewArt } from '../../JourneyOverviewArt';
import styles from './SplitBoard.module.scss';

interface SplitBoardProps {
  stats: EduStats;
}

/**
 * 시안 C 의 고등 본문 — 위는 오늘, 아래는 원리 (SFR-005-01/02/03).
 *
 * 화면을 가로로 한 번 자른다. 위에서는 **오늘 무슨 일이 있었나** 를 답하고
 * (왼쪽에 큰 곡선, 오른쪽에 환산 석 장), 아래 전폭에서는 **왜 그렇게 되나** 를 답한다
 * (왼쪽에 계통도, 오른쪽에 네 단계).
 *
 * 값과 원리를 세로로 가른 것은, 값은 날마다 바뀌지만 원리는 늘 같기 때문이다. 매일 달라지는
 * 것을 위에 두면 지나가며 보는 사람이 먼저 보고, 어제와 무엇이 다른지가 한눈에 잡힌다.
 *
 * 네 단계는 넷을 한꺼번에 보인다. 스스로 넘어가는 판(시안 A)은 걸린 순간의 한 단계만
 * 읽히지만, 넷이 함께 서 있으면 어디에서 걸려도 앞뒤가 같이 읽힌다.
 *
 * 아래 단 안에서 계통도와 네 단계를 좌우로 가른 것은, 계통도가 세로가 있는 그림이기
 * 때문이다 (2026-08-31). 그 앞에는 가로 전폭의 납작한 띠 위에 얹혀 있었는데, 높이에 맞춰
 * 줄어드는 바람에 149px 폭의 실루엣만 남았다. 좌우로 가르면 그림이 아래 단의 세로를
 * 통째로 받아 제 크기(395×239)로 선다.
 */
export function SplitBoard({ stats }: SplitBoardProps) {
  const script = EDU_ROOMY.high;

  return (
    <div className={styles.split}>
      {/* 위 왼쪽 — 오늘의 곡선 */}
      <section className={styles.panel}>
        <p className={styles.panel__head}>
          {script.production.head}
          <span className={styles.panel__note}>{script.production.note(stats)}</span>
        </p>

        <div className={styles.today}>
          <div className={styles.curve}>
            <DayCurve stats={stats} showIrradiance />
          </div>

          <p className={styles.read}>{script.production.read}</p>
        </div>
      </section>

      {/*
        위 오른쪽 — 환산 석 장. 곡선과 같은 단에 두어 「얼마나」와 「그래서」가 마주 본다.
        값 아래 설명 줄은 두지 않는다 — 「소나무로 환산하면 5,165그루」 처럼 이름이 이미 설명이고,
        곡선과 나란히 서는 자리라 글이 길면 그림 쪽이 눌린다.
      */}
      <section className={styles.panel}>
        <p className={styles.panel__head}>
          {script.benefit.head}
          <span className={styles.panel__note}>{script.benefit.note}</span>
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

      {/* 아래 전폭 — 왜 그렇게 되나. 왼쪽에 계통도, 오른쪽에 네 단계 */}
      <section className={styles.panel}>
        <p className={styles.panel__head}>
          {script.principle.head}
          <span className={styles.panel__note}>{script.principle.note}</span>
        </p>

        <div className={styles.principle}>
          <div className={styles.line}>
            <JourneyOverviewArt stats={stats} />
          </div>

          <ol className={styles.stages}>
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
    </div>
  );
}
