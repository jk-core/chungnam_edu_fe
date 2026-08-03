import styles from './SkipLink.module.scss';

/** 키보드 사용자가 반복되는 헤더를 건너뛰고 본문으로 이동한다. */
export function SkipLink() {
  return (
    <a href="#main" className={styles.skip}>
      본문 바로가기
    </a>
  );
}
