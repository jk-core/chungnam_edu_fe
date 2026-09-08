import { PLANT_SPOT_LABEL, PLANT_SPOTS } from '@/mocks/eduContent';
import { cn } from '@/utils/cn';
import { useAutoPager } from '@/hooks/useAutoPager';
import type { EduStageContent } from '@/mocks/eduContent';
import { PlantScanScene } from './ai/PlantScanScene';
import styles from './StagePanel.module.scss';

/** 한 단계가 머무는 시간 — 세 줄 남짓한 설명을 읽고도 여유가 남을 만큼 */
const STEP_MS = 11_000;

interface StagePanelProps {
  content: EduStageContent;
}

/**
 * 햇빛이 전기가 되기까지, 단계마다 무슨 일이 일어나는가 (SFR-005-01/02/03).
 *
 * 왼쪽 셀에서 오른쪽 학교까지가 전기가 만들어져 흘러가는 차례다. 그림 한 장에 네 자리를 늘어놓고
 * 한 자리씩 당겨 보면서 그 자리에서 실제로 무슨 일이 일어나는지를 적는다 — 그림이 곧 차례라,
 * 글을 읽기 전에 어디를 말하는지부터 잡힌다.
 *
 * 스스로 넘어가되 단추로 골라 볼 수도 있다. 복도에 걸어 두면 지나가는 사람이 아무 데나 걸려도
 * 한 단계는 읽고 가고, 붙잡고 보는 사람은 원하는 자리로 바로 갈 수 있다.
 */
export function StagePanel({ content }: StagePanelProps) {
  const pager = useAutoPager({ total: PLANT_SPOTS.length, perPage: 1, intervalMs: STEP_MS });
  const spot = PLANT_SPOTS[Math.min(pager.page, PLANT_SPOTS.length - 1)];

  return (
    <section className={styles.panel} aria-label="태양광 발전 단계별 설명">
      <div className={styles.head}>
        <h2 className={styles.head__title}>{content.head}</h2>
        <p className={styles.head__note}>{content.note}</p>
      </div>

      {/* 지금 말하는 자리를 그림에서 당겨 보여 준다 */}
      <div className={styles.plant}>
        <PlantScanScene focus={spot} />
      </div>

      {/*
        네 자리를 늘어놓은 차례표.
        전기가 흐르는 순서 그대로라, 지금 어디쯤을 보고 있는지가 번호를 세지 않아도 읽힌다.
      */}
      <ol className={styles.steps}>
        {PLANT_SPOTS.map((key, index) => (
          <li key={key}>
            <button
              type="button"
              className={cn(styles.step, { [styles['step--on']]: key === spot })}
              onClick={() => pager.goTo(index)}
              aria-current={key === spot ? 'step' : undefined}
            >
              <em className={styles.step__no}>{index + 1}</em>
              {PLANT_SPOT_LABEL[key]}
            </button>
          </li>
        ))}
      </ol>

      {/* 단계가 넘어갈 때 글이 새로 들어오도록 key 를 건다 */}
      <div key={spot} className={styles.lesson}>
        <p className={styles.lesson__part}>{PLANT_SPOT_LABEL[spot]}</p>
        <p className={styles.lesson__body}>{content.spots[spot]}</p>
      </div>
    </section>
  );
}
