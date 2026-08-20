import { useState } from 'react';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { TODAY } from '@/mocks/today';
import { formatNumber } from '@/utils/format';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { AggregationPanel } from './components/AggregationPanel';
import { FaultList } from './components/FaultList';
import { FaultMap } from './components/FaultMap';
import { OpsMetrics } from './components/OpsMetrics';
import { RegionOutput } from './components/RegionOutput';
import { OutputGauge } from './components/OutputGauge';
import { RankingStrip } from './components/RankingStrip';
import { LiveTrendChart } from './components/LiveTrendChart';
import { CumulativeKpi } from './components/CumulativeKpi';
import { SCOPE_LABEL, useControlRoomData } from './useControlRoomData';
import styles from './ControlRoom.module.scss';

/**
 * 통합관제 상황판 · 시안 A — 3단 그리드 (SFR-004).
 *
 * 지켜보는 화면이라 조작 장치를 두지 않는다. 발전소 하나로 좁혀 보는 일은
 * 발전 현황·AI진단 화면이 맡으므로, 여기서는 도 전체만 다룬다.
 * 하나의 목록을 지도·우선목록·순위·총출력이 함께 나눠 쓰고,
 * 이상 설비가 항상 위로 올라오도록 상태 우선으로 정렬한다.
 */
function ControlRoomPage() {
  const data = useControlRoomData();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <ControlRoomLayout
      scopeLabel={SCOPE_LABEL}
      variantLabel="시안 A · 3단 그리드"
      alertTone={data.alertTone}
      onSearch={() => setSearchOpen(true)}
      searchSummary={data.searchSummary}
    >
      <div className={styles.grid}>
        {/* 왼쪽 — 지금 얼마나 내고 있는지. 값 하나짜리 게이지는 작게 두고 아래 판에 자리를 준다 */}
        <div className={styles.col}>
          <section className={styles.panel} aria-label="현재 총출력">
            <OutputGauge outputKw={data.totals.outputKw} capacityKw={data.totals.capacityKw} />
          </section>

          <section className={styles.panel} aria-label="발전실적">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>발전실적</h2>
            </div>
            <CumulativeKpi
              todayKwh={data.totals.todayKwh}
              monthKwh={data.totals.monthKwh}
              yearKwh={data.totals.yearKwh}
              capacityKw={data.totals.capacityKw}
            />
          </section>

          <section className={styles.panel} aria-label="운영지표">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>운영지표</h2>
              <span className={styles.panel__note}>{data.rows.length}개소 기준</span>
            </div>
            <OpsMetrics
              schools={data.rows}
              hours={data.stat.hours}
              staleCount={data.collection.stale.length}
            />
          </section>

          {/*
            하루 곡선은 이 열의 남는 높이를 그대로 받는다.
            가로로 길고 세로로 낮은 그림이라 좁고 높은 자리에 넣으면 봉우리만 뾰족해지고 시각
            눈금이 겹친다 — 열 폭을 다 쓰고 높이는 남는 만큼만 쓰는 쪽이 읽힌다.
          */}
          <section className={`${styles.panel} ${styles.col__grow}`} aria-label="시간대별 발전량">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>시간대별 발전량</h2>
            </div>
            <LiveTrendChart date={TODAY.toDate()} />
          </section>
        </div>

        {/*
          가운데 — 관내 전체 지도.
          상황판에서 가장 먼저 답해야 할 물음이 "어디가 어떤가"라, 지도를 가운데 크게 세우고
          숫자 판들을 양옆으로 둘렀다. 정상까지 함께 찍어 분포가 보이게 한다 (SFR-004-01/14).
        */}
        <div className={styles.col}>
          <section className={`${styles.panel} ${styles.col__grow}`} aria-label="관내 발전소 현황 지도">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>관내 발전소 현황</h2>
              <span className={styles.panel__note}>
                {formatNumber(data.rows.length)}개소 · 이상 {formatNumber(data.abnormalCount)}개소
              </span>
            </div>
            <FaultMap plants={data.rows} scope="all" height="100%" selectable tour />
          </section>

          {/*
            표는 가운데 넓은 자리에 둔다 — 다섯 칸짜리 표를 좁은 컬럼에 밀어 넣으면 줄이 접힌다.

            높이는 표가 정한다. 남는 높이를 이 판이 받으면 다섯 줄 아래로 빈 자리가 생기는데,
            그 자리는 지도가 쓰는 편이 낫다 — 상황판에서 가장 먼저 답해야 할 물음이 「어디가
            어떤가」 이고, 지도는 커질수록 그 답을 잘한다.
          */}
          <section className={styles.panel} aria-label="발전 현황 집계">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>발전 현황 집계</h2>
            </div>

            <AggregationPanel schools={data.rows} />
          </section>
        </div>

        {/* 오른쪽 — 먼저 봐야 할 것 */}
        <div className={styles.col}>
          <section className={styles.panel} aria-label="금일 실적 순위">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>금일 실적 순위</h2>
              <span className={styles.panel__note}>시·군별 발전시간 상위 3</span>
            </div>
            <RankingStrip schools={data.rows} />
          </section>

          {/*
            순위 바로 아래에 둔다.
            위가 "어느 학교가 잘 냈나" 라면 여기는 "어느 지역이 얼마나 냈나" 다 — 같은 물음을
            낱개와 묶음으로 이어 묻는 자리라, 둘이 붙어 있어야 눈이 옮겨 가지 않는다.
          */}
          <section className={styles.panel} aria-label="시·군별 발전량">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>시·군별 발전량</h2>
              <span className={styles.panel__note}>금일 · kWh</span>
            </div>
            <RegionOutput />
          </section>

          {/* 지도가 어디가 아픈지를 답했으면, 여기서는 무엇이 얼마나 아픈지를 답한다 */}
          <section className={`${styles.panel} ${styles.col__grow}`} aria-label="장애 발생 현황">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>장애 발생 현황</h2>
              <span className={styles.panel__note}>이상 {formatNumber(data.abnormalCount)}개소</span>
            </div>

            <FaultList plants={data.rows} collection={data.collection.byId} />
          </section>
        </div>
      </div>

      <PlantSearchModal
        isOpen={searchOpen}
        filters={data.filters}
        onClose={() => setSearchOpen(false)}
        onApply={data.setFilters}
      />
    </ControlRoomLayout>
  );
}

export default ControlRoomPage;
