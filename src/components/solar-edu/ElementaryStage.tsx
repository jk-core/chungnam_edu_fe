import { CountUp } from '@/components/common/CountUp';
import { cn } from '@/utils/cn';
import { useEduStoryClock } from '@/hooks/useEduStoryClock';
import type { ElementaryContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import type { SceneReadout } from '@/mocks/eduElementary';
import { BenefitScene } from './scene-art/BenefitScene';
import { ImpactScene } from './scene-art/ImpactScene';
import { JourneyScene } from './scene-art/JourneyScene';
import styles from './ElementaryStage.module.scss';
import type { CSSProperties } from 'react';

/**
 * 걸음 하나가 머무는 시간.
 *
 * 말풍선의 글이 다 찍히고도 읽을 틈이 남아야 해서 넉넉히 잡는다. 이 나이는 읽는 속도가 느려
 * 넘어가는 화면을 따라가지 못한다는 지적을 받아 한 차례 더 늘렸다 (2026-09-04 회의).
 * 글 자체도 한 호흡으로 줄였으니, 남는 시간은 그림을 보는 데 쓰인다.
 */
const STEP_MS = 12_000;

/** 글자 하나가 더 찍히기까지 걸리는 시간(초) */
const TYPE_STEP = 0.03;

/** 말풍선에 담기는 이야기 한 덩이 — 세 장이 같은 모양을 쓴다 */
interface BubbleStory {
  id: string;
  title: string;
  line: string;
  at: { x: number; y: number; tail: 'left' | 'bottom'; tailAt?: number };
  readout?: (stats: EduStats) => SceneReadout;
}

interface ElementaryStageProps {
  stats: EduStats;
  content: ElementaryContent;
}

/**
 * 초등 판 본문 (SFR-005-01/03/04/05/06/07/08).
 *
 * 이야기를 세 장으로 나눠 스스로 넘긴다 — 전기가 오는 길, 무엇이 좋아졌나, 태양광의 좋은 점.
 * 세 장 모두 같은 골격을 쓴다: 위에 큰 그림 하나, 아래에 큰 글씨 한 줄과 설명, 그리고 수치 하나.
 * 골격이 같아야 장이 바뀌어도 아이가 읽는 법을 다시 익히지 않는다.
 */
export function ElementaryStage({ stats, content }: ElementaryStageProps) {
  const clock = useEduStoryClock([
    { id: 'journey', steps: content.scenes.length, stepMs: STEP_MS },
    { id: 'impact', steps: content.impact.items.length, stepMs: STEP_MS },
    { id: 'benefit', steps: content.benefits.length, stepMs: STEP_MS },
  ]);

  const story: BubbleStory = clock.chapter === 0
    ? content.scenes[clock.step]
    : clock.chapter === 1
      ? content.impact.items[clock.step]
      : content.benefits[clock.step];

  // 말풍선은 그림이 제 좌표계 안에 품는다 — 세 장 모두 같은 자리에 같은 모양으로 뜬다.
  const bubble = <SceneBubble key={story.id} story={story} stats={stats} />;
  const steps = clock.chapter === 0
    ? content.scenes.length
    : clock.chapter === 1
      ? content.impact.items.length
      : content.benefits.length;

  return (
    <div className={styles.stage}>
      <div className={styles.canvas}>
        {clock.chapter === 0 ? (
          <JourneyScene
            step={clock.step}
            nowHour={stats.nowHour}
            loadRatio={stats.loadRatio}
            bubbleAt={story.at}
            bubble={bubble}
            sunLabel="햇님"
          />
        ) : null}

        {clock.chapter === 1 ? (
          <ImpactScene
            focus={content.impact.items[clock.step].id}
            bubbleAt={story.at}
            bubble={bubble}
          />
        ) : null}

        {clock.chapter === 2 ? (
          <BenefitScene
            focus={content.benefits[clock.step].art}
            bubbleAt={story.at}
            bubble={bubble}
          />
        ) : null}
      </div>

      <div className={styles.bar}>
        {/* 지금 몇 번째 이야기인지. 눌러서 그 장으로 건너뛸 수 있다 */}
        <ol className={styles.dots}>
          {content.chapters.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={cn(styles.dot, { [styles['dot--active']]: index === clock.chapter })}
                onClick={() => clock.goTo(index)}
                aria-current={index === clock.chapter ? 'true' : undefined}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ol>

        <div className={styles.control}>
          {/*
            걸음 수만큼 칸을 나눈 자. 지나온 칸은 꽉 차 있고 지금 칸만 차오르는 중이라,
            어디까지 왔는지와 다음까지 얼마나 남았는지를 한 줄이 함께 말해 준다.
          */}
          <ol
            className={styles.track}
            aria-label={`${content.chapters[clock.chapter].label} · ${steps}걸음 가운데 ${clock.step + 1}번째`}
          >
            {Array.from({ length: steps }, (_, index) => (
              <li key={index} className={styles.tick}>
                <span
                  className={styles.tick__fill}
                  style={{
                    '--fill': index < clock.step ? '100%' : index === clock.step ? `${clock.stepProgress * 100}%` : '0%',
                  } as CSSProperties}
                />
              </li>
            ))}
          </ol>

          <button
            type="button"
            className={styles.play}
            onClick={clock.togglePause}
            aria-label={clock.paused ? '다시 재생' : '잠깐 멈추기'}
          >
            {clock.paused ? (
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M8 5.5 19 12 8 18.5Z" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M8 5h3.4v14H8ZM12.6 5H16v14h-3.4Z" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 그림 안에 뜨는 말풍선 (SFR-005-01/07).
 *
 * 글자가 한 자씩 찍히듯 나타난다. 다 적힌 글을 통째로 내밀면 아이가 읽기도 전에 눈이 미끄러지는데,
 * 찍히는 동안에는 시선이 그 자리에 머문다. 움직임은 글자마다 시작 시각만 어긋낸 CSS 라,
 * 화면이 가려져도 타임라인이 이어진다.
 */
function SceneBubble({ story, stats }: { story: BubbleStory; stats: EduStats }) {
  const readout = story.readout?.(stats);
  // 제목을 다 찍은 뒤에 설명이 이어져야 두 줄이 한 호흡으로 읽힌다.
  const lineFrom = 0.35 + story.title.length * TYPE_STEP;

  return (
    <div
      className={cn(styles.bubble, styles[`bubble--${story.at.tail}`])}
      style={{ '--tail-at': `${story.at.tailAt ?? 30}px` } as CSSProperties}
      role="status"
    >
      <p className={styles.bubble__title}>
        <Typed text={story.title} from={0.35} />
      </p>
      <p className={styles.bubble__line}>
        <Typed text={story.line} from={lineFrom} />
        <i className={styles.bubble__caret} aria-hidden="true" />
      </p>

      {readout ? (
        <p className={styles.bubble__readout}>
          <span className={styles.bubble__label}>{readout.label}</span>
          <span className={styles.bubble__value}>
            <CountUp value={readout.amount} fractionDigits={readout.fractionDigits} startOnView={false} />
            {readout.countSuffix}
            <span className={styles.bubble__unit}>{readout.unit}</span>
          </span>
        </p>
      ) : null}
    </div>
  );
}

/**
 * 한 자씩 찍히는 글.
 * 글자마다 시작 시각을 어긋낸 것뿐이라 순수 CSS 로 돈다. 읽어 주는 기계에는 통째로 한 번만 넘긴다.
 */
function Typed({ text, from }: { text: string; from: number }) {
  return (
    <>
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true">
        {[...text].map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            className={styles.letter}
            style={{ animationDelay: `${from + index * TYPE_STEP}s` } as CSSProperties}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </span>
    </>
  );
}
