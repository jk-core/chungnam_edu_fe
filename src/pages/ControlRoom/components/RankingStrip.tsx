import { useEffect, useMemo, useState } from 'react';
import { CrownIcon } from '@/components/common/Icon';
import { REGIONS } from '@/mocks/regions';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from './RankingStrip.module.scss';

/**
 * 한 시·군에서 보여 줄 등수.
 *
 * 세 자리면 족하다 — 4·5위는 순위표를 길게 할 뿐, 지나가며 보는 사람에게 새로 알려 주는 것이
 * 없다. 자리를 아껴 아래 장애 목록에 넘긴다.
 */
const TOP_N = 3;

/** 시·군 하나가 머무는 시간 — 세 줄을 읽고 넘어갈 만큼 */
const ROTATE_MS = 7000;

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
 * 시·군별 발전 실적 순위 (SFR-004-09).
 *
 * 발전량이 아니라 **발전시간** 으로 줄 세운다. 발전량으로 세우면 용량 큰 학교가 늘 위에 서서
 * 순위가 설비 크기 순서와 같아진다 — 오늘 어디가 잘 냈는지는 답하지 못한다. 용량으로 나눈
 * 발전시간이라야 큰 학교와 작은 학교를 같은 눈금에 세울 수 있다.
 *
 * 도 전체에서 셋을 뽑으면 늘 같은 몇 곳이 위에 앉아 사흘이면 배경이 된다. 시·군을 하나씩
 * 돌면서 그 안의 1·2·3등을 보이면, 열다섯 시·군이 차례로 제 이름을 걸고 나오므로 어느 학교든
 * 언젠가는 화면에 선다 — 걸어 두는 화면에서 이 차이가 크다.
 *
 * 고를 수는 없다. 벽에 걸어 두고 지켜보는 화면이라 누르는 사람을 전제하지 않는다 — 고르게
 * 두면 누군가 한 시·군에 세워 둔 채 자리를 떠, 나머지 열넷은 종일 나오지 않는다.
 */
export function RankingStrip({ schools }: RankingStripProps) {
  const [index, setIndex] = useState(0);

  /*
    학교가 실제로 있는 시·군만 돈다.
    순서는 `REGIONS` 를 따라 늘 같게 둔다 — 발전량 순으로 세우면 순위가 바뀔 때마다 도는 차례가
    달라져, 지켜보는 사람이 「아까 그 시·군」 을 다시 만나기까지 얼마나 걸릴지 가늠할 수 없다.
  */
  const groups = useMemo(() => {
    const byRegion = new Map<string, School[]>();

    schools.forEach((school) => {
      const list = byRegion.get(school.regionName) ?? [];

      list.push(school);
      byRegion.set(school.regionName, list);
    });

    return REGIONS
      .map((region) => ({ name: region.name, schools: byRegion.get(region.name) ?? [] }))
      .filter((group) => group.schools.length > 0);
  }, [schools]);

  useEffect(() => {
    if (groups.length <= 1) return undefined;

    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % groups.length),
      ROTATE_MS,
    );

    return () => window.clearInterval(timer);
  }, [groups.length]);

  if (groups.length === 0) return null;

  // 시·군 수가 줄어든 뒤에도 자리표가 범위를 넘지 않게 한다.
  const group = groups[index % groups.length];
  const ordered = [...group.schools].sort((a, b) => hoursOf(b) - hoursOf(a));
  const best = hoursOf(ordered[0]) || 1;
  const ranked = ordered.slice(0, TOP_N);

  return (
    <div className={styles.rank}>
      {/*
        지금 어느 시·군인지.
        열다섯을 모두 적으면 이름표가 순위표보다 길어지므로, 지금 것만 크게 적고 몇 번째인지를
        옆에 붙인다 — 다시 돌아오기까지 얼마나 남았는지가 그 수로 가늠된다.
      */}
      <p className={styles.rank__region} aria-live="polite">
        <span className={styles.rank__regionName}>{group.name}</span>
        <span className={styles.rank__regionStep}>
          {index % groups.length + 1} / {groups.length}
        </span>
      </p>

      <ol className={styles.rank__list}>
        {ranked.map((school, order) => {
          const medal = MEDALS[order];

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
                  <span className={styles.rank__order}>{order + 1}</span>
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
    </div>
  );
}
