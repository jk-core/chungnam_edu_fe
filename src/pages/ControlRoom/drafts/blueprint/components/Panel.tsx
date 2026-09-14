import styles from './Panel.module.scss';
import type { ReactNode } from 'react';

interface PanelProps {
  /** 판 이름 — 제목이자 보조기술이 읽는 이름이다 */
  title: string;
  /** 제목 오른쪽 한 마디 — 개소 수·평균처럼 아래가 이미 말하지 않는 것만 */
  note?: ReactNode;
  /** 열에 남는 높이를 이 판이 받을지 */
  grow?: boolean;
  children: ReactNode;
}

/**
 * 청사진의 판 한 칸.
 *
 * A 의 `Panel` 을 불러 쓰지 않고 여기 다시 둔다 — 담기는 내용은 같아도 이 시안은 판을
 * 유리로 두어 바탕 격자가 판을 가로지르게 하고, 색면 대신 선으로 값을 가른다. A 의 판은
 * 불투명 색면과 스캔 라인을 전제로 짜여 있어 그대로 들이면 격자가 끊긴다.
 *
 * 껍데기의 생김새(유리 바탕·파선 밑줄·제목 앞 치수 표식)는 `_skins.scss` 의 `blueprint`
 * 믹스인이 `section[aria-label]` 을 짚어 이미 쥐고 있다. 여기서는 그 믹스인이 기대하는 DOM
 * 모양(`section > div:has(> h2)`)만 그대로 세우고, 골격에 필요한 자리(안쪽 여백·머리와 본문의
 * 흐름)만 보탠다.
 */
export function Panel({ title, note, grow, children }: PanelProps) {
  return (
    <section
      className={grow ? `${styles.panel} ${styles['panel--grow']}` : styles.panel}
      aria-label={title}
    >
      {/* 제목 줄은 반드시 `div > h2` 여야 스킨의 파선 밑줄·치수 표식이 붙는다 */}
      <div className={styles.panel__head}>
        <h2 className={styles.panel__title}>{title}</h2>
        {note ? <span className={styles.panel__note}>{note}</span> : null}
      </div>

      <div className={styles.panel__body}>{children}</div>
    </section>
  );
}
