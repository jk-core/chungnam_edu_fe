import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { useEduStoryClock } from '@/hooks/useEduStoryClock';
import type { KinderContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { KinderGiftArt, KinderGoodArt, KinderWord } from './kinder/KinderArt';
import { KinderJourney } from './kinder/KinderJourney';
import styles from './KinderStage.module.scss';

/**
 * 한 걸음이 머무는 시간.
 *
 * 초등 판(8초)보다 길게 잡는다. 초등은 그 시간에 두 줄을 읽어야 하지만 유치원은 읽을 것이 없다 —
 * 대신 그림이 나타나 자리를 잡고, 아이가 그것을 알아보고, 옆의 선생님이 아랫줄을 한 번 읽어 줄
 * 틈까지가 한 걸음이다. 짧게 두면 알아보기도 전에 다음 그림이 덮는다.
 */
const STEP_MS = 9_000;

interface KinderStageProps {
  stats: EduStats;
  content: KinderContent;
}

/**
 * 유치원 판 본문 (SFR-005-01/02/03/04/05/06/07/08).
 *
 * 초등 판과 같은 뼈대다 — 이야기를 세 장으로 나눠 스스로 넘긴다. 전기가 오는 길, 무엇이
 * 좋아졌나, 태양광은 왜 좋은가. 세 장 모두 골격이 같아야 장이 바뀌어도 아이가 보는 법을 다시 익히지 않는다.
 *
 * 다른 것은 한 걸음에 얹히는 글의 양이다. 초등이 말풍선에 제목 한 줄과 설명 한 줄을 찍는 자리에,
 * 여기는 큰 한 마디와 짧은 한 줄을 둔다 — 멀리서는 한 마디만 읽히고, 가까이 선 아이에게는
 * 선생님이 아랫줄을 읽어 준다.
 *
 * 누르는 곳을 두지 않는다. 복도에 걸어 두고 아무도 만지지 않는 화면이라, 멈춤·건너뜀 단추는
 * 쓰이지 않으면서 아이 손이 닿는 자리만 만든다. 아래 칸들은 눌리지 않는 표시일 뿐이다.
 */
export function KinderStage({ stats, content }: KinderStageProps) {
  const clock = useEduStoryClock([
    { id: 'journey', steps: content.scenes.length, stepMs: STEP_MS },
    { id: 'gift', steps: content.gifts.length, stepMs: STEP_MS },
    { id: 'good', steps: content.goods.length, stepMs: STEP_MS },
  ]);

  const scene = content.scenes[clock.step];
  const gift = content.gifts[clock.step];
  const good = content.goods[clock.step];

  const say = clock.chapter === 0 ? scene : clock.chapter === 1 ? gift : good;
  const word = clock.chapter === 0 ? scene.word : clock.chapter === 1 ? gift.name : good.name;
  const steps = clock.chapter === 0
    ? content.scenes.length
    : clock.chapter === 1
      ? content.gifts.length
      : content.goods.length;

  return (
    <div className={styles.stage}>
      {/*
        머리줄.

        왼쪽은 지금 무슨 이야기 중인지, 오른쪽은 지금 얼마나 만들고 있는지다. 둘 다 아이가
        읽으라고 둔 줄이 아니라 옆에 선 선생님과 화면 앞을 지나는 어른이 읽는 줄이라, 작게 둔다.

        오른쪽 수치는 걷어낼 수 없다 — 유치원 판은 위쪽 수치 띠를 달지 않으므로, 이 한 줄이
        「지금 얼마나 만들고 있는가」(SFR-005-01)를 말하는 유일한 자리다.
      */}
      <div className={styles.header}>
        <p className={styles.chapter}>{content.chapters[clock.chapter].label}</p>
        <p className={styles.now}>
          지금 만드는 중
          <strong>{formatNumber(stats.outputKw, 1)}kW</strong>
        </p>
      </div>

      <div className={styles.canvas}>
        {clock.chapter === 0 ? <KinderJourney step={clock.step} nowHour={stats.nowHour} label={scene.line} /> : null}
        {clock.chapter === 1 ? <GiftCut gift={gift} stats={stats} /> : null}
        {clock.chapter === 2 ? <GoodCut good={good} /> : null}
      </div>

      <div className={styles.foot}>
        <KinderWord word={word} line={say.line} />

        {/*
          지금 몇 번째 걸음인지.
          누르는 단추가 아니라 표시다 — 지나온 것은 차 있고 지금 것만 차오르는 중이라,
          어디까지 왔는지와 다음까지 얼마나 남았는지를 한 줄이 함께 말한다.
        */}
        <ol
          className={styles.dots}
          aria-label={`${content.chapters[clock.chapter].label} · ${steps}걸음 가운데 ${clock.step + 1}번째`}
        >
          {Array.from({ length: steps }, (_, index) => (
            <li key={index} className={cn(styles.dot, { [styles['dot--done']]: index < clock.step })}>
              {index === clock.step ? (
                <span className={styles.dot__fill} style={{ width: `${clock.stepProgress * 100}%` }} />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/**
 * 2장 — 오늘 만든 전기로 무엇을 할 수 있나.
 *
 * 그림 하나와 수 하나만 세운다. 유치원에서 수는 글이 아니라 배우는 중인 것이라, 크게 두면
 * 아이가 자릿수를 세어 보려 든다 — 화면에서 유일하게 아이가 **하려고 드는** 자리다.
 */
function GiftCut({ gift, stats }: { gift: KinderContent['gifts'][number]; stats: EduStats }) {
  return (
    <div className={styles.gift}>
      <span className={styles.gift__art}>
        <KinderGiftArt id={gift.id} />
      </span>

      {/*
        수는 굴려 올리지 않고 그대로 적는다.

        `CountUp` 은 첫 rAF 프레임이 돌기 전까지 0 을 내보낸다. 사람이 앉아서 보는 화면이라면
        찰나라 문제가 없지만, 무인으로 걸어 두는 화면에서 그 프레임이 늦으면 「0 그루」 가 굳는다 —
        오늘 아무것도 만들지 못했다는 뜻이 되어, 굴러 올라가는 재미와 바꿀 수 있는 것이 아니다.
      */}
      <p className={styles.gift__value}>
        {formatNumber(gift.value(stats))}
        <span className={styles.gift__unit}>{gift.unit}</span>
      </p>
    </div>
  );
}

/** 3장 — 태양광은 왜 좋은가. 걸음마다 그림 하나로 한 가지씩 */
function GoodCut({ good }: { good: KinderContent['goods'][number] }) {
  return (
    <div className={styles.good}>
      <KinderGoodArt id={good.id} />
    </div>
  );
}
