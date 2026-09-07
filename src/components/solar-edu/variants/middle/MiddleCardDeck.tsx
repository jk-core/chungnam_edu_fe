import { CountUp } from '@/components/common/CountUp';
import { CARD_SECTIONS, EDU_CARDS } from '@/mocks/eduCards';
import { cn } from '@/utils/cn';
import { useAutoPager } from '@/hooks/useAutoPager';
import type { CardScene } from '@/mocks/eduCards';
import type { EduStats } from '@/mocks/solarEdu';
import { DayCurve } from '../shared/DayCurve';
import { ImpactArt } from '../../scene-art/ImpactArt';
// 좋은 점 셋을 낱개로 그린 것은 초등 그림 쪽에만 있다 — 같은 물건을 두 번 그리지 않는다
import { PictureGoodArt } from '../elementary/art/PictureArt';
import { JourneyScene } from '../../scene-art/JourneyScene';
import styles from './MiddleCardDeck.module.scss';
import type { CSSProperties } from 'react';

/**
 * 한 묶음이 머무는 시간.
 *
 * 낱장으로 넘기던 것을 묶음 단위로 바꾸면서 한 화면에 서너 장이 함께 선다 (2026-09-04 지시).
 * 읽을 것이 그만큼 늘었으므로 머무는 시간도 함께 늘린다 — 다 읽지 못하고 넘어가면 여러 장을
 * 함께 세운 뜻이 없다.
 */
const SECTION_MS = 22_000;

interface MiddleCardDeckProps {
  stats: EduStats;
  nowHour: number;
}

/**
 * 중등 시안 c — 묶음으로 넘겨 읽는 판 (SFR-005-01/03/05/07/08).
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
  const pager = useAutoPager({ total: CARD_SECTIONS.length, perPage: 1, intervalMs: SECTION_MS });
  const section = CARD_SECTIONS[Math.min(pager.page, CARD_SECTIONS.length - 1)];
  const cards = EDU_CARDS.filter((card) => card.section === section.id);

  return (
    <section className={styles.deck} aria-label="묶음으로 넘겨 보는 설명">
      <p className={styles.deck__head}>
        <span className={styles.deck__section}>{section.label}</span>
        <span className={styles.deck__count}>{pager.page + 1} / {CARD_SECTIONS.length}</span>
      </p>

      {/* 묶음이 넘어갈 때 통째로 새로 들어오도록 `key` 를 건다 */}
      <ul key={section.id} className={styles.deck__list} role="status">
        {cards.map((card) => {
          const readout = card.readout?.(stats);

          return (
            <li key={card.id} className={styles.card}>
              <span className={styles.card__art}>
                <CardArt scene={card.scene} stats={stats} nowHour={nowHour} />
              </span>

              <h3 className={styles.card__title}>{card.title}</h3>
              <p className={styles.card__line}>{card.line}</p>

              {readout ? (
                <p className={styles.readout}>
                  <span className={styles.readout__label}>{readout.label}</span>
                  <span className={styles.readout__value}>
                    <CountUp value={readout.amount} fractionDigits={readout.fractionDigits} startOnView={false} />
                    {readout.countSuffix}
                    <span className={styles.readout__unit}>{readout.unit}</span>
                  </span>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* 묶음 셋. 눌러서 바로 갈 수도 있다 */}
      <ol className={styles.dots}>
        {CARD_SECTIONS.map((item, index) => {
          const isOn = index === pager.page;

          return (
            <li key={item.id}>
              {/*
                지금 칸은 넘어갈 때마다 새로 만든다 — CSS 애니메이션은 같은 요소에 다시 걸어도
                되감기지 않으므로, 채움을 처음부터 다시 흐르게 하는 방법이 이것뿐이다.
              */}
              <button
                key={isOn ? `on-${pager.turnKey}` : 'off'}
                type="button"
                className={cn(styles.dot, { [styles['dot--on']]: isOn })}
                style={isOn ? ({ '--rotation-ms': `${SECTION_MS}ms` } as CSSProperties) : undefined}
                onClick={() => pager.goTo(index)}
                aria-label={item.label}
                aria-current={isOn ? 'true' : undefined}
              />
            </li>
          );
        })}
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
    /* 카드의 글과 그림의 이름표가 같은 말을 쓴다 — 글은 「태양전지판」 인데 그림만 「태양전지」 면 어긋난다 */
    return (
      <JourneyScene
        step={scene.step}
        nowHour={nowHour}
        loadRatio={stats.loadRatio}
        sunLabel="해"
        panelLabel="태양전지판"
        focus={scene.focus}
      />
    );
  }

  /*
    묶음으로 세우면서 그림도 낱개로 바꿨다 (2026-09-04 지시).

    `ImpactScene`·`BenefitScene` 은 셋을 늘어놓고 하나만 밝히는 그림이라, 한 장씩 넘길 때는
    「이번엔 이것」 이 보였다. 셋을 나란히 두면 같은 그림이 세 번 서서 무엇이 다른지 알 수 없다.
    카드마다 제 물건만 그린다.
  */
  if (scene.kind === 'impact') {
    return (
      <span className={styles.icon} aria-hidden="true">
        <ImpactArt id={scene.focus === 'gadget' ? 'aircon' : scene.focus} />
      </span>
    );
  }

  if (scene.kind === 'benefit') {
    return (
      <span className={styles.icon} aria-hidden="true">
        <PictureGoodArt id={scene.focus} />
      </span>
    );
  }

  if (scene.kind === 'curve') return <DayCurve stats={stats} showIrradiance />;

  return (
    <span className={styles.icon} aria-hidden="true">
      <ImpactArt id={scene.art} />
    </span>
  );
}
