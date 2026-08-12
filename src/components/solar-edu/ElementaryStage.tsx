import { CountUp } from '@/components/common/CountUp';
import { growthStage } from '@/utils/eco';
import { impactOf } from '@/mocks/eduContent';
import { useAutoPager } from '@/hooks/useAutoPager';
import type { ElementaryContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { IMPACT_ICONS } from './EduIcons';
import { JourneyScene } from './scene-art/JourneyScene';
import styles from './ElementaryStage.module.scss';

/** 한 걸음이 머무는 시간. 지나가며 보는 아이가 한 줄은 온전히 읽을 만큼 둔다. */
const STEP_MS = 11_000;

/** 나무가 다 자라는 기준 — 하루 등가 발전시간 5시간을 만점으로 본다. */
const FULL_GROWTH_HOURS = 5;

interface ElementaryStageProps {
  stats: EduStats;
  content: ElementaryContent;
}

/**
 * 초등 판 본문 (SFR-005-01/04/05/06/07/08).
 *
 * 한 화면에 다 늘어놓으면 아이가 어디부터 볼지 모르고, 장면을 통째로 갈아 끼우면 앞에서 본 것이 사라진다.
 * 그래서 그림은 한 장으로 두고 **이야기가 나아갈 때마다 다음 그림만 더한다** — 해가 뜨고, 판이 놓이고,
 * 인버터가 붙고, 교실에 불이 들어오고, 끝에 나무가 자라 여정 전체가 한 장으로 완성된다.
 * 글은 지금 걸음의 것 하나만 바꿔 단다.
 */
export function ElementaryStage({ stats, content }: ElementaryStageProps) {
  /*
    걸음 넘김은 관제 화면과 같은 장치를 쓴다 — 스스로 넘어가고, 손으로 누르면 그 자리에서 시간이 다시 흐른다.
    `perPage` 를 못 박아 두면 칸을 재는 일은 건너뛴다.
  */
  const pager = useAutoPager({ total: content.scenes.length, perPage: 1, intervalMs: STEP_MS });
  const scene = content.scenes[pager.page];
  const readout = scene.readout?.(stats);
  const isLast = pager.page === content.scenes.length - 1;

  return (
    <div className={styles.stage}>
      {/* 바닥이 되는 그림 한 장. 걸음이 나아가면 그 위에 다음 그림이 더해진다. */}
      <div className={styles.canvas}>
        <JourneyScene
          step={pager.page}
          nowHour={stats.nowHour}
          loadRatio={stats.loadRatio}
          growth={growthStage(stats.equivalentHours / FULL_GROWTH_HOURS)}
        />
      </div>

      <div className={styles.foot}>
        {/*
          글만 갈아 끼운다. `key` 를 걸음으로 두어 요소가 새로 만들어지고 등장 효과가 다시 돈다 —
          그림은 그대로 남아 있으니 바뀐 곳이 어디인지 눈이 바로 찾는다.
        */}
        <div key={scene.id} className={styles.say} role="status">
          <p className={styles.say__step}>
            {pager.page + 1}
            <span className={styles.say__total}>/{content.scenes.length}</span>
          </p>
          <div className={styles.say__body}>
            <p className={styles.say__title}>{scene.title}</p>
            <p className={styles.say__line}>{scene.line}</p>
          </div>

          {readout ? (
            <p className={styles.readout}>
              <span className={styles.readout__label}>{readout.label}</span>
              <span className={styles.readout__value}>
                <CountUp
                  value={readout.value}
                  fractionDigits={readout.fractionDigits}
                  startOnView={false}
                />
                <span className={styles.readout__unit}>{readout.unit}</span>
              </span>
            </p>
          ) : null}
        </div>

        {/* 마지막 걸음에서만 오늘 만든 전기가 무엇이 되었는지 펼친다 (SFR-005-03) */}
        {isLast ? (
          <ul className={styles.chips}>
            {content.impact.itemIds.map((id) => {
              const item = impactOf(id, content.impact.copy?.[id]);

              return (
                <li key={id} className={styles.chip}>
                  <span className={styles.chip__icon}>{IMPACT_ICONS[id]}</span>
                  <span className={styles.chip__label}>{item.label}</span>
                  <span className={styles.chip__value}>
                    <CountUp
                      value={stats.dayKwh * item.perKwh}
                      fractionDigits={item.fractionDigits}
                      startOnView={false}
                    />
                    <span className={styles.chip__unit}>{item.unit}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {/* 지나간 걸음이 궁금하면 눌러서 되돌려 볼 수 있다 */}
      <ol className={styles.dots}>
        {content.scenes.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              className={index === pager.page ? styles['dot--active'] : styles.dot}
              onClick={() => pager.goTo(index)}
              aria-label={`${index + 1}번째 이야기 보기 (전체 ${content.scenes.length}개)`}
              aria-current={index === pager.page ? 'true' : undefined}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
