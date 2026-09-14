import styles from './CyberPanel.module.scss';
import type { ReactNode } from 'react';

interface CyberPanelProps {
  /** 판 이름 — 제목이자 보조기술이 읽는 이름이다 */
  title: string;
  /** 제목 오른쪽 한 마디. 아래 내용이 이미 말하는 것은 적지 않는다 */
  note?: ReactNode;
  /**
   * 스스로 돌고 있는 판임을 머리 표시등으로 알린다 — AI 진단처럼 살아 있는 판에만 준다.
   * 시안 A 는 테두리를 도는 빛으로 알렸지만, 계측 장비의 결에서는 채널이 「켜져 있다」 를
   * 깜빡이는 표시등 하나로 읽히게 하는 편이 맞다.
   */
  live?: boolean;
  children: ReactNode;
}

/**
 * 시안 E 의 판 한 칸.
 *
 * 판 껍데기의 골격(테두리 + 머리 줄 + 내용)은 시안 A 의 `Panel` 과 같다 — 일곱 판이 같은
 * 골격을 되풀이하면 머리 줄 생김새를 고칠 때 일곱 곳을 함께 고쳐야 한다. 다만 A 의 것을
 * 그대로 부르지 않고 이 폴더 안에 다시 둔다 (고객 지시 — 판 내부까지 시안마다 새로).
 *
 * 판의 색·바탕·머리에 켜지는 빛 한 줄은 `_skins.scss` 의 `@mixin cyber` 가 `section[aria-label]`
 * 로 이미 쥐고 있다. 그래서 여기서는 **배경도 테두리도 다시 적지 않는다** — 적으면 스킨이 세운
 * 계기판 표면을 덮어 이 판만 결이 달라진다. 여기 몫은 머리 줄과 안쪽 여백뿐이다.
 *
 * 제목을 `aria-label` 로도 쓴다 — 둘을 따로 적으면 제목만 고치고 이름표는 옛말로 남는다.
 */
export function CyberPanel({ title, note, live, children }: CyberPanelProps) {
  return (
    <section className={styles.panel} aria-label={title}>
      <div className={styles.panel__head}>
        <h2 className={styles.panel__title}>
          <span className={styles.panel__mark} data-live={live ? '' : undefined} aria-hidden="true" />
          {title}
        </h2>
        {note ? <div className={styles.panel__note}>{note}</div> : null}
      </div>

      <div className={styles.panel__body}>{children}</div>
    </section>
  );
}
