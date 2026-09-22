import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { formatCapacity, formatCarbon, formatEnergy, formatNumber, formatPercent } from '@/utils/format';
import { Badge } from '@/components/common/Badge';
import { Panel } from '@/pages/ControlRoom/components/Panel';
import { StatusMix } from '@/pages/ControlRoom/components/StatusMix';
import type { School } from '@/interface/energy';
import { useTerrainRegions } from '../hooks/useTerrainRegions';
import styles from './RegionDetail.module.scss';
import type { CSSProperties } from 'react';

/**
 * 이름으로 세우는 문제 설비 수 — 나머지는 「외 N곳」 으로 접는다.
 *
 * A 의 `.now` 는 셋을 세우지만, 이 화면은 뿌리 글자가 18px 이라 한 줄이 더 높다. 큰 자리(약
 * 630px)에 오늘 값·규모·누적·도 대비 몫·상태 분포까지 얹고 나면 목록에 두 줄만 남으므로,
 * 셋째 줄이 판을 넘기지 않게 둘로 둔다. 나머지는 제목 줄의 「외 N곳」 이 받는다.
 */
const NAMED_FAULTS = 2;

/**
 * 고른 시·군의 상세 (SFR-004-03/08).
 *
 * 판 껍데기·상태 알약·상태 분포 막대는 시안 A 의 것을 그대로 쓰고(`Panel`·`Badge`·`StatusMix`),
 * 짜임새는 시안 A 의 `RegionStatMap` 이 시·군 상세를 그리던 `.now`(머리 → 수치 → 도 대비 몫 →
 * 상태 분포 → 손봐야 할 곳)를 본떴다 — 「기존 UI 차용」 고객 요청(2026-09-15). A 의 `.now` 는
 * 여섯 값을 같은 크기로 늘어놓지만, 이 화면은 보는 사람의 연령이 높아 **층**을 준다: 오늘의
 * 값(발전량·발전시간·출력·이용률)을 크게, 그중 금일 발전량 하나를 가장 크게, 규모와 누적 셋을
 * 한 단 작게. A 가 담지 않는 누적발전량·누적발전시간·탄소저감을 규모 칸에 더해, 고객이 지정한
 * 열 항목을 모두 담는다.
 *
 * 어느 시·군을 보는지는 지도와 같은 `useTerrainRegions` 에서 온다 — 두 판이 같은 순회 자리를
 * 보므로 지도에서 물든 면과 이 판의 값이 늘 같은 곳을 가리킨다.
 */
export function RegionDetail({ plants }: { plants: School[] }) {
  const { active, province, colorForRegion } = useTerrainRegions(plants);

  const today = formatEnergy(active.todayKwh);
  const output = formatCapacity(active.outputKw);
  const capacity = formatCapacity(active.capacityKw);
  const cumulative = formatEnergy(active.yearKwh);
  const carbon = formatCarbon(active.carbonKg);
  const regionColor = colorForRegion(active.name);

  // 도 전체에서 이 시·군이 차지하는 몫 — 설비와 발전이 어긋나 있는 것 자체가 읽을거리다
  const capacityShare = province.capacityKw > 0 ? active.capacityKw / province.capacityKw : 0;
  const todayShare = province.todayKwh > 0 ? active.todayKwh / province.todayKwh : 0;

  return (
    <Panel title="선택 시·군 상세">
      <div className={styles.detail}>
        <header className={styles.detail__head}>
          <span
            className={styles.detail__color}
            style={{ backgroundColor: regionColor } as CSSProperties}
            aria-hidden
          />
          <h3 className={styles.detail__name}>{active.name}</h3>
          {active.abnormal > 0 ? (
            <Badge tone="critical">이상 {formatNumber(active.abnormal)}</Badge>
          ) : (
            <Badge tone="ok" withDot>정상</Badge>
          )}
        </header>

        {/* 오늘의 값 — 금일 발전량을 가장 크게, 나머지 셋을 그 아래에 나란히 */}
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

        {/* 규모와 누적 — 오늘 값보다 한 단 작게, 실선으로 위를 끊어 몫을 가른다 */}
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

        {/*
          도 전체에서 차지하는 몫 — 설비 몫보다 발전 몫이 작으면 오늘 제 몫을 못 낸 것이다.
          막대는 지도에서 물든 면과 같은 단계색을 받아, 위 지도와 색 하나로 이어진다.
        */}
        <div className={styles.share}>
          {[
            { id: 'capacity', label: '도 대비 설비', ratio: capacityShare },
            { id: 'today', label: '도 대비 발전', ratio: todayShare },
          ].map((item) => (
            <p key={item.id} className={styles.share__row}>
              <span className={styles.share__label}>{item.label}</span>
              <span className={styles.share__track}>
                <span
                  className={styles.share__bar}
                  style={{ width: `${Math.min(100, item.ratio * 100)}%`, backgroundColor: regionColor } as CSSProperties}
                />
              </span>
              <span className={styles.share__value}>{formatPercent(item.ratio, 1)}</span>
            </p>
          ))}
        </div>

        {/* 설비 상태 분포 — 도 전체를 보여 주던 A 의 부품을 이 시·군만으로 다시 그린다 */}
        <div className={styles.status}>
          <p className={styles.detail__label}>설비 상태</p>
          <StatusMix plants={active.schools} />
        </div>

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
                  <Badge tone={OPERATION_TONE[school.status]}>{OPERATION_LABEL[school.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}
