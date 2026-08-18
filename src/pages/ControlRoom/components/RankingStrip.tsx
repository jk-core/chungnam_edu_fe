import { CrownIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from './RankingStrip.module.scss';

/**
 * 보여 줄 순위.
 * 아래 장애 목록이 더 급한 정보라, 순위는 상위 몇 곳만 짚고 자리를 넘긴다.
 */
const TOP_N = 5;

/** 1·2·3위에 얹는 금·은·동 */
const MEDALS = ['gold', 'silver', 'bronze'] as const;
const MEDAL_LABEL: Record<(typeof MEDALS)[number], string> = {
  gold: '1위',
  silver: '2위',
  bronze: '3위',
};

interface RankingStripProps {
  /** 순위 대상 — 늘 전체 발전소를 받는다 */
  schools: School[];
}

/** 금일 발전시간(h) = 금일 발전량 ÷ 설비용량 */
function hoursOf(school: School): number {
  return school.capacityKw > 0 ? school.todayKwh / school.capacityKw : 0;
}

/**
 * 학교별 발전 실적 순위 (SFR-004-09).
 *
 * 발전량이 아니라 **발전시간**으로 줄 세운다. 발전량으로 세우면 용량 큰 학교가 늘 위에 서서
 * 순위가 설비 크기 순서와 같아진다 — 어느 학교가 오늘 잘 냈는지는 답하지 못한다.
 * 용량으로 나눈 발전시간이라야 큰 학교와 작은 학교를 같은 눈금에 세울 수 있다.
 *
 * 1위 대비 비율을 막대로 그려 차이를 바로 읽히게 하고, 세 자리에는 왕관을 얹는다 —
 * 벽면 모니터를 스쳐 보는 자리라 등수를 숫자로 세는 것보다 모양으로 먼저 읽힌다.
 */
export function RankingStrip({ schools }: RankingStripProps) {
  const ordered = [...schools].sort((a, b) => hoursOf(b) - hoursOf(a));
  const best = hoursOf(ordered[0] ?? schools[0]) || 1;
  const ranked = ordered.slice(0, TOP_N);

  return (
    <ol className={styles.rank}>
      {ranked.map((school, index) => {
        const medal = MEDALS[index];

        return (
          <li key={school.id}>
            <span className={styles.rank__row}>
              {medal ? (
                <span
                  className={cn(styles.rank__medal, styles[`medal--${medal}`])}
                  title={MEDAL_LABEL[medal]}
                >
                  <CrownIcon width={13} height={13} aria-hidden />
                  {/* 색으로만 등수를 가르지 않는다 (COR-003) */}
                  <span className={styles.srOnly}>{MEDAL_LABEL[medal]}</span>
                </span>
              ) : (
                <span className={styles.rank__order}>{index + 1}</span>
              )}
              <span className={styles.rank__body}>
                <span className={styles.rank__name}>{school.name}</span>
                <span className={styles.rank__track}>
                  <span
                    className={styles.rank__bar}
                    style={{ width: `${Math.max(4, (hoursOf(school) / Math.max(best, 0.01)) * 100)}%` }}
                  />
                </span>
              </span>
              <span className={styles.rank__value}>
                {formatNumber(hoursOf(school), 1)}
                <span className={styles.rank__unit}>h</span>
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
