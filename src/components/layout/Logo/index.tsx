import styles from './Logo.module.scss';

interface LogoProps {
  /** 축약형은 상징 마크와 짧은 이름만 보여준다. */
  compact?: boolean;
}

/**
 * 상징 마크는 시그니처인 태양 궤적의 축소판이다.
 * 지평선 위로 호를 그리고 그 정점에 해를 놓았다.
 */
export function Logo({ compact = false }: LogoProps) {
  return (
    <span className={styles.logo}>
      <svg className={styles.logo__mark} viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
        <rect width="36" height="36" rx="11" className={styles.logo__plate} />
        <path
          d="M8 25.5a10 10 0 0 1 20 0"
          fill="none"
          className={styles.logo__arc}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="18" cy="15.2" r="3.6" className={styles.logo__sun} />
        <path d="M7 26.6h22" className={styles.logo__horizon} strokeWidth="1.8" strokeLinecap="round" />
      </svg>

      <span className={styles.logo__text}>
        <span className={styles.logo__org}>충청남도교육청</span>
        {!compact ? <span className={styles.logo__service}>신·재생에너지 통합관리시스템</span> : null}
      </span>
    </span>
  );
}
