import { OPERATION_LABEL, OPERATION_ORDER, OPERATION_TONE } from '@/mocks/status';
import { formatCapacity, formatCarbon, formatEnergy, formatNumber, formatPercent } from '@/utils/format';
import type { School } from '@/interface/energy';
import { useTerrainRegions } from '../hooks/useTerrainRegions';
import { StatusPill } from './StatusPill';
import styles from './RegionDetail.module.scss';
import type { RegionStat } from '../hooks/useTerrainRegions';
import type { CSSProperties } from 'react';

/** 이름으로 세우는 문제 설비 수 — 나머지는 「외 N곳」 으로 접는다 */
const NAMED_FAULTS = 2;

/**
 * 고른 시·군의 상세 (SFR-004-03/08).
 *
 * 고객이 지정한 열 항목을 모두 담되, 460px 폭에 열을 같은 크기로 늘어놓으면 전부 작아진다.
 * 그래서 층을 준다 — 오늘의 값(발전량·발전시간·출력·이용률)을 크게, 그중 발전량 하나를 가장
 * 크게, 누적과 탄소를 한 단 작게, 설비상태와 문제설비목록은 아래에 접어 둔다. 보는 사람의
 * 연령이 높다는 것이 이 시안의 첫 제약이라, 자리를 줄여 번 만큼을 글자 크기에 쓴다.
 *
 * 어느 시·군을 보는지는 지도와 같은 `useTerrainRegions` 에서 온다 — 두 판이 같은 순회 자리를
 * 보므로 지도에서 물든 면과 이 판의 값이 늘 같은 곳을 가리킨다.
 */
export function RegionDetail({ plants }: { plants: School[] }) {
  const { active, colorForRegion } = useTerrainRegions(plants);

  const today = formatEnergy(active.todayKwh);
  const output = formatCapacity(active.outputKw);
  const capacity = formatCapacity(active.capacityKw);
  const cumulative = formatEnergy(active.yearKwh);
  const carbon = formatCarbon(active.carbonKg);

  return (
    <section className={styles.detail} aria-label="선택 시·군 상세">
      <header className={styles.detail__head}>
        <span
          className={styles.detail__color}
          style={{ backgroundColor: colorForRegion(active.name) } as CSSProperties}
          aria-hidden
        />
        <h2 className={styles.detail__name}>{active.name}</h2>
        {active.abnormal > 0 ? (
          <StatusPill tone="critical">이상 {formatNumber(active.abnormal)}</StatusPill>
        ) : (
          <StatusPill tone="ok" withDot>정상</StatusPill>
        )}
      </header>

      {/* 오늘의 값 — 발전량을 가장 크게, 나머지 셋을 그 아래에 나란히 */}
      <div className={styles.hero}>
        <p className={styles.hero__label}>금일 발전량</p>
        <p className={styles.hero__value}>
          {today.value}<span className={styles.hero__unit}>{today.unit}</span>
        </p>
      </div>

      <dl className={styles.today}>
        <div className={styles.today__item}>
          <dt>발전시간</dt>
          <dd>{formatNumber(active.hours, 1)}<span>h</span></dd>
        </div>
        <div className={styles.today__item}>
          <dt>현재 출력</dt>
          <dd>{output.value}<span>{output.unit}</span></dd>
        </div>
        <div className={styles.today__item}>
          <dt>이용률</dt>
          <dd>{formatPercent(active.utilization, 1)}</dd>
        </div>
      </dl>

      {/* 규모와 누적 — 오늘 값보다 한 단 작게 */}
      <dl className={styles.base}>
        <div className={styles.base__item}>
          <dt>설비용량</dt>
          <dd>{capacity.value}<span>{capacity.unit}</span></dd>
        </div>
        <div className={styles.base__item}>
          <dt>누적 발전량</dt>
          <dd>{cumulative.value}<span>{cumulative.unit}</span></dd>
        </div>
        <div className={styles.base__item}>
          <dt>누적 발전시간</dt>
          <dd>{formatNumber(active.cumulativeHours)}<span>h</span></dd>
        </div>
        <div className={styles.base__item}>
          <dt>탄소저감</dt>
          <dd>{carbon.value}<span>{carbon.unit}</span></dd>
        </div>
      </dl>

      <StatusMix region={active} />

      <div className={styles.faults}>
        <p className={styles.faults__title}>
          문제 설비
          {active.faults.length > NAMED_FAULTS ? (
            <span className={styles.faults__more}>외 {formatNumber(active.faults.length - NAMED_FAULTS)}곳</span>
          ) : null}
        </p>

        {active.faults.length === 0 ? (
          <p className={styles.faults__none}>이상 설비가 없습니다</p>
        ) : (
          <ul className={styles.faults__list}>
            {active.faults.slice(0, NAMED_FAULTS).map((school) => (
              <li key={school.id} className={styles.faults__item}>
                <span className={styles.faults__name}>{school.name}</span>
                <StatusPill tone={OPERATION_TONE[school.status]}>{OPERATION_LABEL[school.status]}</StatusPill>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/**
 * 설비 상태 분포.
 *
 * 공용 `StatusMix` 는 범례를 caption·label-sm(12px)로 세워, 이 시안의 글자 크기 제약을 어긴다.
 * 그래서 같은 뜻을 label-md 이상으로 다시 그린다 — 한 줄 막대로 비율을, 아래 범례로 개소 수를
 * 말하되 색만으로 갈리지 않게 한다.
 */
function StatusMix({ region }: { region: RegionStat }) {
  const total = region.count || 1;

  return (
    <div className={styles.mix}>
      <p className={styles.mix__title}>설비 상태</p>
      <div className={styles.mix__bar} role="img" aria-label={`설비 상태 분포, 전체 ${region.count}개소`}>
        {OPERATION_ORDER.filter((status) => region.statusCount[status] > 0).map((status) => (
          <span
            key={status}
            className={`${styles.mix__seg} ${styles[`mix__seg--${OPERATION_TONE[status]}`]}`}
            style={{ width: `${(region.statusCount[status] / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className={styles.mix__legend}>
        {OPERATION_ORDER.map((status) => (
          <li key={status} className={styles.mix__item}>
            <span className={`${styles.mix__dot} ${styles[`mix__dot--${OPERATION_TONE[status]}`]}`} aria-hidden />
            <span className={styles.mix__label}>{OPERATION_LABEL[status]}</span>
            <span className={styles.mix__count}>{formatNumber(region.statusCount[status])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
