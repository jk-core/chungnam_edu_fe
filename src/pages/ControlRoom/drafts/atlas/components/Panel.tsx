import styles from './Panel.module.scss';
import type { ReactNode } from 'react';

interface PanelProps {
  /** 판 이름 — 표제이자 보조기술이 읽는 이름이다 */
  title: string;
  /** 표제 오른쪽 한 마디. 아래 내용이 이미 말하는 것은 적지 않는다 */
  note?: ReactNode;
  children: ReactNode;
}

/**
 * 아틀라스의 판 한 칸.
 *
 * A 의 `Panel` 을 불러 쓰지 않고 여기 다시 둔다 — 그쪽은 판 위를 훑는 빛과 오른쪽 위 번짐을
 * 껍데기에 함께 지녀 계측 화면의 결인데, 이 시안은 선 한 줄로만 두른 인쇄면이라 그 장식이
 * 결과 다툰다. 껍데기를 갈라 두어야 A 를 손대지 않고 이 시안만 인쇄물로 남길 수 있다.
 *
 * DOM 골격은 A 와 같게 맞춘다 — 스킨(`_skins.scss`)이 `section[aria-label]` 과 그 안의
 * 「h2 를 가진 첫 div」 를 짚어 세리프 표제와 그 아래 굵은 괘선을 덧그리므로, 이 구조가
 * 어긋나면 스킨이 판을 못 찾는다. 그래서 표제 아래 실선은 여기서 다시 긋지 않는다.
 */
export function Panel({ title, note, children }: PanelProps) {
  return (
    <section className={styles.panel} aria-label={title}>
      <div className={styles.panel__head}>
        <h2 className={styles.panel__title}>{title}</h2>
        {note ? <span className={styles.panel__note}>{note}</span> : null}
      </div>
      <div className={styles.panel__body}>{children}</div>
    </section>
  );
}
