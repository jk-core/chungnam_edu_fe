import { CountUp } from '@/components/common/CountUp';
import { paperFactors, type PaperScript } from '@/mocks/eduPaper';
import type { EduStats } from '@/mocks/solarEdu';
import type { WeatherKind } from '@/interface/weather';

import styles from './ChapterFactors.module.scss';

interface ChapterFactorsProps {
  stats: EduStats;
  weather: WeatherKind;
  /** 오늘이 몇 월인지 (0 = 1월). 판의 온도가 계절을 타기 때문에 필요하다. */
  month: number;
  script: PaperScript;
}

/** 막대가 가장 길 때 반쪽의 몇 할까지 뻗을지 */
const BAR_MAX = 0.92;

/**
 * 4장 — 발전량을 무엇이 늘리고 무엇이 줄이나 (SFR-005-03).
 *
 * 가운데 기준선을 세우고, 밀어 올린 것은 오른쪽으로 끌어내린 것은 왼쪽으로 뻗게 한다.
 * 목록으로 적으면 다섯 가지가 나란한 항목이 되어 어느 것이 큰지 알 수 없지만, 좌우로
 * 가르면 방향과 크기가 한눈에 잡힌다.
 *
 * 막대 길이는 가장 큰 것을 기준으로 잡는다. 절댓값을 그대로 폭으로 쓰면 어떤 날은 다섯 개가
 * 모두 짧아 아무 말도 하지 못한다 — 여기서 봐야 하는 것은 절대 크기가 아니라 서로 견준 크기다.
 */
export function ChapterFactors({ stats, weather, month, script }: ChapterFactorsProps) {
  const factors = paperFactors(stats, weather, month, script);
  const widest = Math.max(...factors.map((factor) => Math.abs(factor.delta)), 0.01);

  return (
    <div className={styles.factors}>
      <ol className={styles.list}>
        <li className={styles.head} aria-hidden="true">
          <span />

          <span className={styles.head__scale}>
            <span className={styles.head__side}>발전량을 줄인다</span>
            <span />
            <span className={styles.head__side}>발전량을 늘린다</span>
            <span />
          </span>
        </li>

        {factors.map((factor) => {
          const up = factor.delta >= 0;
          const width = `${(Math.abs(factor.delta) / widest) * BAR_MAX * 100}%`;

          return (
            <li key={factor.id} className={styles.factor}>
              <div className={styles.factor__label}>
                <p className={styles.factor__term}>{factor.term}</p>
                <p className={styles.factor__reading}>{factor.reading}</p>
              </div>

              <div className={styles.bar} data-direction={up ? 'up' : 'down'}>
                <span className={styles.bar__half}>
                  {!up && <span className={styles.bar__fill} style={{ inlineSize: width }} />}
                </span>

                <span className={styles.bar__axis} />

                <span className={styles.bar__half}>
                  {up && <span className={styles.bar__fill} style={{ inlineSize: width }} />}
                </span>

                {/* 부호는 고정으로 두고 크기만 굴러 오른다 — 방향이 세는 동안 바뀌면 안 된다 */}
                <span className={styles.bar__value}>
                  {up ? '+' : '−'}
                  <CountUp value={Math.abs(factor.delta) * 100} fractionDigits={1} />%
                </span>
              </div>

              <p className={styles.factor__note}>{factor.note}</p>
            </li>
          );
        })}
      </ol>

      <p className={styles.closing}>{script.closing}</p>
    </div>
  );
}
