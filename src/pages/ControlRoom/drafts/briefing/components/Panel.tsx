import styles from './Panel.module.scss';
import type { ReactNode } from 'react';

interface PanelProps {
  /** 판 이름 — 제목이자 보조기술이 읽는 이름이다 */
  title: string;
  /** 제목 오른쪽 한 마디. 아래 내용이 이미 말하는 것은 적지 않는다 */
  note?: ReactNode;
  children: ReactNode;
}

/**
 * 브리핑 보드의 판 한 칸.
 *
 * 골격은 시안 A 의 Panel 과 같다 — `<section aria-label>` 안에 제목 줄 `<div><h2></div>` 를
 * 세우고 그 아래로 내용을 받는다. 판 껍데기(테두리·그림자·모서리)와 판 머리의 남색 색면
 * 띠는 브리핑 스킨(`_skins.scss`)이 이 골격을 짚어 입히므로 여기서는 다시 그리지 않는다.
 *
 * A 의 Panel 을 불러 쓰지 않고 새로 두는 까닭은, 이 시안이 배치도 판 안도 제 폴더 안에서
 * 끝까지 쥐어야 배치를 갈아 낄 때 A 를 건드리지 않기 때문이다.
 *
 * grow·accent 를 받지 않는다 — 판이 열 높이를 받을지는 배치(`.cell > section:only-child`)가
 * 정하고, AI 진단의 호박 띠는 스킨이 `aria-label` 로 짚어 세운다.
 */
export function Panel({ title, note, children }: PanelProps) {
  return (
    <section className={styles.panel} aria-label={title}>
      <div className={styles.panel__head}>
        <h2 className={styles.panel__title}>{title}</h2>
        {note ? <span className={styles.panel__note}>{note}</span> : null}
      </div>
      {children}
    </section>
  );
}
