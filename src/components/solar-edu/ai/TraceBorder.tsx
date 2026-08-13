import styles from './TraceBorder.module.scss';

/**
 * 테두리를 한 바퀴 도는 빛 (SFR-005-02/07).
 *
 * "지금 AI 가 이 칸을 읽고 있다" 를 말하는 표식이다. 판 위를 가로지르는 바로 훑으면 글자 위로 띠가
 * 지나가 읽는 것을 방해하는데, 테두리를 타고 돌면 같은 말을 하면서도 안쪽 내용을 건드리지 않는다.
 *
 * 머리와 꼬리 두 줄로 그린다. 한 줄만 두면 그저 점 하나가 도는 것이고, 뒤에 옅은 꼬리가 딸려 와야
 * **어느 쪽으로** 도는지가 보인다. 꼬리는 같은 움직임을 음수 지연으로 밀어 만든다 — 길이도 속도도
 * 한 곳에서 정해지므로 둘이 어긋날 일이 없다.
 *
 * 감싼 쪽이 `position: relative` 를 맡는다. 자리는 차지하지 않는다.
 */
export function TraceBorder({ radius = 12 }: { radius?: number }) {
  return (
    <svg className={styles.trace} aria-hidden="true" focusable="false">
      {/*
        둘레를 100 으로 눕혀 둔다.
        칸 크기가 저마다 달라도 점선 길이를 백분율로 적을 수 있어, 큰 칸이든 작은 칸이든
        같은 비율의 빛이 같은 속도로 돈다.
      */}
      <rect className={styles.trace__tail} pathLength={100} rx={radius} />
      <rect className={styles.trace__head} pathLength={100} rx={radius} />
    </svg>
  );
}
