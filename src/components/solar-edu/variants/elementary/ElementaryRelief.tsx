import { formatNumber, scaleSi } from '@/utils/format';
import type { PictureContent } from '@/mocks/eduPicture';
import type { EduStats } from '@/mocks/solarEdu';
import { ReliefGiftArt, ReliefGoodArt } from './art/ReliefArt';
import { ReliefJourney } from './art/ReliefJourney';
/*
  자리 잡기는 시안 D 의 것을 그대로 가져다 쓴다.

  두 시안은 **같은 화면에 그림만 다르게** 그린 것이라, 여백과 칸 나눔이 조금이라도 어긋나면
  회의 자리에서 「입체가 나은가」 를 묻는 대신 「왜 이쪽이 더 넓지」 를 묻게 된다.
  스타일을 복사해 두 벌로 두면 한쪽만 고쳐지며 반드시 어긋나므로, 한 벌을 나눠 쓴다.
*/
import styles from './ElementaryRelief.module.scss';

interface ElementaryReliefProps {
  stats: EduStats;
  content: PictureContent;
  nowHour: number;
}

/**
 * 초등 시안 c — 한 장에 다, 입체 (SFR-005-01/02/03/04/05/06/07/08).
 *
 * 위에 큰 그림 한 장과 그것을 읽는 네 마디, 아래에 무엇이 좋아졌나와 왜 좋은가.
 * 시안 b 와 같은 것을 말하되 기다리게 하지 않고 한 화면에 모두 편다.
 *
 * 그림은 평면 쪽(`PictureArt`)과 **같은 물건을 같은 자리에** 세우고 명암만 다르다.
 * 평면과 입체 가운데 복도에 어느 쪽이 맞는지는 말로 정할 수 있는 것이 아니라 둘을 나란히
 * 걸어 보고 정해야 하는데, 다른 것이 하나라도 더 있으면 무엇 때문에 나아 보였는지 알 수 없게 된다.
 */
export function ElementaryRelief({ stats, content, nowHour }: ElementaryReliefProps) {
  // 도 전체를 합치면 kW 로는 다섯 자리를 넘긴다 — 자릿수가 커지면 MW·GW 로 올려 적는다.
  const output = scaleSi(stats.outputKw, 'W');

  return (
    <div className={styles.poster}>
      {/* 위 — 전기가 오는 길. 네 마디가 처음부터 전부 켜져 있다 */}
      <section className={styles.scene}>
        <div className={styles.head}>
          <p className={styles.head__label}>{content.chapters[0].label}</p>

          {/*
            지금 얼마나 만들고 있는지 (SFR-005-01).
            이 판은 위쪽 수치 띠를 달지 않으므로 이 한 줄이 그것을 말하는 유일한 자리다.
          */}
          <p className={styles.now}>
            지금 만드는 중
            <strong>{formatNumber(output.amount, output.fractionDigits)}{output.unit}</strong>
          </p>
        </div>

        <div className={styles.scene__canvas}>
          <ReliefJourney nowHour={nowHour} label="햇빛이 전기가 되어 교실에 오기까지" />
        </div>

        {/*
          그림 아래 네 마디.
          그림 위에 말을 얹으면 마디마다 자리가 달라 글씨가 겹치거나 그림을 가린다.
          같은 순서로 아래에 늘어놓으면 눈이 그림과 띠를 오르내리며 짝을 맞춘다.
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
                  <ReliefGiftArt id={gift.id} />
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
                  <ReliefGoodArt id={good.id} />
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
