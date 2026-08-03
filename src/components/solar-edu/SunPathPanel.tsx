import type { EduStats } from '@/mocks/solarEdu';
import { SunPathArt } from './SunPathArt';
import styles from './SolarEdu.module.scss';

/** 해의 높이가 발전량을 가르는 까닭 */
const NOTES = [
  {
    id: 'angle',
    term: '해가 높이 뜰수록 많이 만들어요',
    body:
      '해가 높이 뜨면 햇빛이 판에 똑바로 내리쬐요. 같은 양의 햇빛이 좁은 자리에 모이니 1m² 가 받는 힘이 세지죠. ' +
      '정오 무렵에 가장 많이 만드는 이유예요.',
  },
  {
    id: 'airmass',
    term: '아침·저녁엔 공기층을 길게 지나요',
    body:
      '해가 낮게 뜨면 햇빛이 지나야 할 공기층이 두꺼워져요. 그 사이 먼지와 공기에 부딪혀 흩어지면서, ' +
      '판에 닿기도 전에 힘이 약해져요.',
  },
];

/**
 * 해가 하루 동안 지나가는 길 (SFR-005-03).
 * 왼쪽 그림이 해의 높이가 어떻게 달라지는지 보이고, 오른쪽 글이 그것이 왜 발전량을 가르는지 짚는다.
 */
interface SunPathPanelProps {
  stats: EduStats;
}

export function SunPathPanel({ stats }: SunPathPanelProps) {
  return (
    <section className={styles.panel}>
      <p className={styles.panel__head}>
        해는 하루 동안 이렇게 지나가요
        <span className={styles.panel__note}>햇빛이 기울어 들어오는 각도가 시각마다 달라져요</span>
      </p>

      <div className={styles.split}>
        <div className={styles.split__art}>
          <SunPathArt nowHour={stats.nowHour} />
        </div>

        <div className={styles.split__notes}>
          {NOTES.map((note) => (
            <div key={note.id} className={styles.note}>
              <p className={styles.note__term}>{note.term}</p>
              <p className={styles.note__body}>{note.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
