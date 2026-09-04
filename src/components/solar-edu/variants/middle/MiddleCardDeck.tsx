import { CountUp } from '@/components/common/CountUp';
import { EDU_CARDS } from '@/mocks/eduCards';
import { cn } from '@/utils/cn';
import { useAutoPager } from '@/hooks/useAutoPager';
import type { CardScene } from '@/mocks/eduCards';
import type { EduStats } from '@/mocks/solarEdu';
import { BenefitScene } from '../../scene-art/BenefitScene';
import { DayCurve } from '../shared/DayCurve';
import { ImpactArt } from '../../scene-art/ImpactArt';
import { ImpactScene } from '../../scene-art/ImpactScene';
import { JourneyScene } from '../../scene-art/JourneyScene';
import styles from './MiddleCardDeck.module.scss';

/**
 * 한 장이 머무는 시간.
 * 큰 글씨 한 줄과 설명 한 줄을 읽고도 그림을 볼 틈이 남아야 해서 넉넉히 잡는다.
 */
const CARD_MS = 9_000;

interface MiddleCardDeckProps {
  stats: EduStats;
  nowHour: number;
}

/**
 * 시안 C 의 초등 본문 — 한 장씩 넘겨 읽는 판 (SFR-005-01/03/05/07/08).
 *
 * 한 번에 한 장만 세운다. 왼쪽에 그림 한 장, 오른쪽에 큰 글씨. 걸어 두고 멀리서 보는 화면에서
 * 읽을 곳이 하나면 눈이 어디부터 볼지 고르지 않아도 된다 — 지나가며 보는 아이도 한 장은 읽고 간다.
 *
 * 글을 그림 **밖에** 두는 것이 시안 A 와 갈리는 지점이다. A 는 말풍선으로 그림 안에서 가리키고,
 * 여기서는 그림과 글이 좌우로 나뉜다. 그래서 글씨를 그림 크기와 무관하게 키울 수 있다.
 *
 * 중·고등은 이렇게 넘기지 않는다 — 그 나이에는 곡선과 환산을 나란히 놓고 견주는 편이 낫다
 * (`RoomyBoard`).
 */
export function MiddleCardDeck({ stats, nowHour }: MiddleCardDeckProps) {
  const deck = EDU_CARDS;
  const pager = useAutoPager({ total: deck.length, perPage: 1, intervalMs: CARD_MS });
  const card = deck[Math.min(pager.page, deck.length - 1)];
  const readout = card.readout?.(stats);

  return (
    <section className={styles.deck} aria-label="한 장씩 넘겨 보는 설명">
      <div className={styles.deck__art}>
        <CardArt scene={card.scene} stats={stats} nowHour={nowHour} />
      </div>

      {/* 장이 넘어갈 때 글이 새로 들어오도록 `key` 를 건다 — 바뀐 것이 눈에 걸려야 다시 읽는다 */}
      <div key={card.id} className={styles.deck__text} role="status">
        <p className={styles.deck__count}>
          {pager.page + 1}
          <span> / {deck.length}</span>
        </p>
        <h2 className={styles.deck__title}>{card.title}</h2>
        <p className={styles.deck__line}>{card.line}</p>

        {readout ? (
          <p className={styles.readout}>
            <span className={styles.readout__label}>{readout.label}</span>
            <span className={styles.readout__value}>
              <CountUp
                value={readout.amount}
                fractionDigits={readout.fractionDigits}
                startOnView={false}
              />
              <span className={styles.readout__unit}>{readout.unit}</span>
            </span>
          </p>
        ) : null}
      </div>

      {/* 지금 몇 번째인지. 눌러서 원하는 장으로 바로 갈 수도 있다 */}
      <ol className={styles.dots}>
        {deck.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              className={cn(styles.dot, { [styles['dot--on']]: index === pager.page })}
              onClick={() => pager.goTo(index)}
              aria-label={item.title}
              aria-current={index === pager.page ? 'true' : undefined}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * 카드에 세우는 그림.
 *
 * 장면 부품들은 말풍선을 받지 않으면 그림만 그리도록 이미 만들어져 있다(`VIEW_ART_ONLY`).
 * 그 자리를 그대로 쓴다 — 시안마다 그림을 새로 그리면 같은 설비가 화면마다 다르게 생긴다.
 */
function CardArt({ scene, stats, nowHour }: { scene: CardScene; stats: EduStats; nowHour: number }) {
  if (scene.kind === 'journey') {
    return <JourneyScene step={scene.step} nowHour={nowHour} loadRatio={stats.loadRatio} />;
  }

  if (scene.kind === 'impact') return <ImpactScene focus={scene.focus} />;

  if (scene.kind === 'benefit') return <BenefitScene focus={scene.focus} />;

  if (scene.kind === 'curve') return <DayCurve stats={stats} showIrradiance />;

  return (
    <span className={styles.icon} aria-hidden="true">
      <ImpactArt id={scene.art} />
    </span>
  );
}
