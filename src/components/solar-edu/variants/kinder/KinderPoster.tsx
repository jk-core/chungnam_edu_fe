import { formatNumber } from '@/utils/format';
import type { KinderContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { KinderGiftArt, KinderGoodArt } from '../../kinder/KinderArt';
import { KinderJourney } from '../../kinder/KinderJourney';
import styles from './KinderPoster.module.scss';

/** 그림의 마지막 걸음. 이 값을 넘겨 네 마디를 처음부터 모두 켠다 */
const ALL_STEPS = 3;

interface KinderPosterProps {
  stats: EduStats;
  content: KinderContent;
  nowHour: number;
}

/**
 * 유치원 판 · 시안 D — 한 장 그림 (SFR-005-01/02/03/04/05/06/07/08).
 *
 * 현행 시안은 그림을 한 걸음씩 쌓아 올린다. 잘 읽히지만 **기다려야** 한다 — 유치원 아이가
 * 복도에서 화면 앞에 머무는 시간은 몇 초이고, 그 몇 초에 걸린 걸음 하나만 보고 지나간다.
 *
 * 이 시안은 기다리게 하지 않는다. 같은 그림의 마지막 걸음을 처음부터 켜 두어 해부터 교실까지가
 * 늘 한 장에 있고, 그 아래에 무엇이 좋아졌나와 왜 좋은가를 나란히 편다. 언제 와서 봐도 화면이
 * 말하려는 것 전부가 거기 있다.
 *
 * 처음에는 이 시안을 카드 열한 장짜리 격자로 짰는데, 그러자 그림책이 아니라 게시판이 됐다 —
 * 같은 크기의 네모가 열한 개 늘어서면 어느 것도 주인공이 아니게 되고, 유치원 화면에서 주인공이
 * 없다는 것은 볼 것이 없다는 뜻이다. 큰 그림 하나를 위에 세우고 나머지를 아래 띠로 낮췄다.
 */
export function KinderPoster({ stats, content, nowHour }: KinderPosterProps) {
  return (
    <div className={styles.poster}>
      {/* 위 — 전기가 오는 길. 네 마디가 처음부터 전부 켜져 있다 */}
      <section className={styles.scene}>
        <div className={styles.head}>
          <p className={styles.head__label}>{content.chapters[0].label}</p>

          {/*
            지금 얼마나 만들고 있는지 (SFR-005-01).
            유치원 판은 위쪽 수치 띠를 달지 않으므로 이 한 줄이 그것을 말하는 유일한 자리다.
          */}
          <p className={styles.now}>
            지금 만드는 중
            <strong>{formatNumber(stats.outputKw, 1)}kW</strong>
          </p>
        </div>

        <div className={styles.scene__canvas}>
          <KinderJourney step={ALL_STEPS} nowHour={nowHour} label="햇빛이 전기가 되어 교실에 오기까지" />
        </div>

        {/*
          그림 아래 네 마디.

          그림 위에 말을 얹으면 마디마다 자리가 달라 글씨가 겹치거나 그림을 가린다. 같은 순서로
          아래에 늘어놓으면 눈이 그림과 띠를 오르내리며 짝을 맞춘다 — 초등 시안 D 가 쓰는 방식이다.
        */}
        <ol className={styles.marks}>
          {content.scenes.map((scene, index) => (
            <li key={scene.id} className={styles.mark}>
              <span className={styles.mark__no} aria-hidden="true">{index + 1}</span>
              <span className={styles.mark__text}>
                <strong className={styles.mark__word}>{scene.word}</strong>
                <span className={styles.mark__line}>{scene.line}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className={styles.bottom}>
        {/* 아래 왼쪽 — 그래서 무엇이 좋아졌나 */}
        <section className={styles.gifts}>
          <p className={styles.head__label}>{content.chapters[1].label}</p>

          <ul className={styles.gifts__list}>
            {content.gifts.map((gift) => (
              <li key={gift.id} className={styles.gift}>
                <span className={styles.gift__art}>
                  <KinderGiftArt id={gift.id} />
                </span>
                <span className={styles.gift__text}>
                  {/* 수는 굴려 올리지 않는다 — 무인 화면에서 첫 프레임이 늦으면 「0」 이 굳는다 */}
                  <strong className={styles.gift__value}>
                    {formatNumber(gift.value(stats))}
                    <span className={styles.gift__unit}>{gift.unit}</span>
                  </strong>
                  <span className={styles.gift__line}>{gift.line}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* 아래 오른쪽 — 태양광은 왜 좋은가 */}
        <section className={styles.goods}>
          <p className={styles.head__label}>{content.chapters[2].label}</p>

          <ul className={styles.goods__list}>
            {content.goods.map((good) => (
              <li key={good.id} className={styles.good}>
                <span className={styles.good__art}>
                  <KinderGoodArt id={good.id} />
                </span>
                <span className={styles.good__text}>
                  <strong className={styles.good__name}>{good.name}</strong>
                  <span className={styles.good__line}>{good.line}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
