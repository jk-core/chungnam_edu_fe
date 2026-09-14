import styles from './FixedDigits.module.scss';

interface FixedDigitsProps {
  /** 이미 자리 구분 기호까지 넣어 굳힌 문자열 — 셈은 바깥에서 하고 여기선 세우기만 한다 */
  text: string;
}

/**
 * 자릿수마다 같은 폭의 칸을 주고 숫자를 세운다.
 *
 * 이 시안의 수치 글꼴은 Orbitron 이라 자릿수 폭이 고르지 않다 (30px 기준 `1` 11.7px, `0`
 * 25.0px). 매 박자 바뀌는 수치를 그대로 두면 값이 바뀔 때마다 옆 글자가 흔들리고, 그 옆에
 * 붙은 라벨까지 밀린다. 벽시계(`RoomClock` 의 `bar__digit`)가 쓰는 것과 같은 방식으로,
 * 숫자만 고정폭 칸에 가운데 세우고 쉼표 같은 좁은 글자는 칸을 주지 않는다.
 *
 * 문자열을 받는다 — 자리 구분 기호(`,`)까지 이미 넣은 값이라야, 세 자리마다 끊긴 그대로
 * 칸에 앉힐 수 있다.
 */
export function FixedDigits({ text }: FixedDigitsProps) {
  return (
    <span className={styles.digits}>
      {[...text].map((char, index) => (
        <span
          key={`${index}-${char}`}
          className={/[0-9]/.test(char) ? styles.digits__cell : styles.digits__sep}
        >
          {char}
        </span>
      ))}
    </span>
  );
}
