import { useState } from 'react';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { TODAY } from '@/mocks/today';
import { formatNumber } from '@/utils/format';
import { CUMULATIVE } from '@/mocks/generation';
import { PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { AggregationPanel } from './components/AggregationPanel';
import { CollectionHealth } from './components/CollectionHealth';
import { MissingInverters } from './components/MissingInverters';
import { FaultList } from './components/FaultList';
import { FaultMap } from './components/FaultMap';
import { OpsMetrics } from './components/OpsMetrics';
import { OutputGauge } from './components/OutputGauge';
import { RankingStrip } from './components/RankingStrip';
import { LiveTrendChart } from './components/LiveTrendChart';
import { CumulativeKpi } from './components/CumulativeKpi';
import { SCOPE_LABEL, useControlRoomData } from './useControlRoomData';
import styles from './ControlRoom.module.scss';

/** 가운데 지도 높이(px) — 상황판 한가운데를 차지하는 크기다 */
const MAIN_MAP_HEIGHT = 430;

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

          <section className={styles.panel} aria-label="발전량">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>발전량</h2>
            </div>
            <CumulativeKpi
              todayKwh={data.totals.todayKwh}
              monthKwh={data.totals.monthKwh}
              yearKwh={data.totals.yearKwh}
              totalKwh={CUMULATIVE.totalKwh}
            />
          </section>

          <section className={`${styles.panel} ${styles.col__grow}`} aria-label="운영지표">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>운영지표</h2>
              <span className={styles.panel__note}>{data.rows.length}개소 기준</span>
            </div>
            <OpsMetrics
              schools={data.rows}
              hours={data.stat.hours}
              staleCount={data.collection.stale.length}
            />

            {/* 미수신이 몇 대인지 위에서 봤으면, 어느 인버터인지는 여기서 흘려 보여 준다 (SFR-004-05) */}
            <MissingInverters plantIds={data.plantIds} collection={data.collection.byId} />

            {/* 위 지표가 "얼마나 잘 만들고 있나" 라면, 여기서는 "그 숫자를 믿어도 되나" 를 답한다 */}
            <CollectionHealth
              rows={data.collection.rows}
              belowThreshold={data.belowThreshold}
              collectedAt={data.collection.latest}
              isStale={data.collection.stale.length > 0}
            />
          </section>
        </div>

        {/*
          가운데 — 관내 전체 지도.
          상황판에서 가장 먼저 답해야 할 물음이 "어디가 어떤가"라, 지도를 가운데 크게 세우고
          숫자 판들을 양옆으로 둘렀다. 정상까지 함께 찍어 분포가 보이게 한다 (SFR-004-01/14).
        */}
        <div className={styles.col}>
          <section className={styles.panel} aria-label="관내 발전소 현황 지도">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>관내 발전소 현황</h2>
              <span className={styles.panel__note}>
                {formatNumber(data.rows.length)}개소 · 이상 {formatNumber(data.abnormalCount)}개소
              </span>
            </div>
            <FaultMap plants={data.rows} scope="all" height={MAIN_MAP_HEIGHT} selectable />
          </section>

          {/* 표는 가운데 넓은 자리에 둔다 — 다섯 칸짜리 표를 좁은 컬럼에 밀어 넣으면 줄이 접힌다 */}
          <section className={`${styles.panel} ${styles.col__grow}`} aria-label="발전 현황 집계">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>발전 현황 집계</h2>
              <span className={styles.panel__note}>발전소·학교급·권역 기준</span>
            </div>

            <AggregationPanel schools={data.rows} />
          </section>
        </div>

        {/* 오른쪽 — 먼저 봐야 할 것 */}
        <div className={styles.col}>
          <section className={styles.panel} aria-label="금일 실적 순위">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>금일 실적 순위</h2>
              <span className={styles.panel__note}>조회 {formatNumber(data.rows.length)}개소 중 상위 5</span>
            </div>
            <RankingStrip schools={data.rows} />
          </section>

          <section className={styles.panel} aria-label="시간대별 발전량">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>시간대별 발전량 · 권역 집계</h2>
            </div>
            <LiveTrendChart schools={data.rows} date={TODAY.toDate()} />
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
