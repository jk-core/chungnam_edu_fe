import { useMemo, useState } from 'react';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { getCollectionStatus } from '@/mocks/collection';
import { getNodeStat } from '@/mocks/nodeStats';
import { liveTotalOutput } from '@/mocks/schoolOutput';
import { NOW, TODAY } from '@/mocks/today';
import { isAbnormal, OPERATION_RANK } from '@/mocks/status';
import { SCHOOLS } from '@/mocks/schools';
import { formatNumber } from '@/utils/format';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { usePlantScope } from '@/hooks/usePlantScope';
import { useSelectNode } from '@/stores/plantStore';
import { AggregationPanel } from './components/AggregationPanel';
import { EquipmentCards } from './components/EquipmentCards';
import { FaultMap } from './components/FaultMap';
import { PlantHealthPanel } from './components/PlantHealthPanel';
import { OpsMetrics } from './components/OpsMetrics';
import { OutputGauge } from './components/OutputGauge';
import { RankingStrip } from './components/RankingStrip';
import { LiveTrendChart } from './components/LiveTrendChart';
import { CumulativeKpi } from './components/CumulativeKpi';
import { ControlFilterBar, FILTER_ALL } from './components/ControlFilterBar';
import styles from './ControlRoom.module.scss';
import type { ControlFilter } from './components/ControlFilterBar';

/** 자동 갱신 주기 — 실제 서비스에서는 이 틱에 최신 수집값을 다시 읽는다. */
const REFRESH_MS = 60_000;

const EMPTY_FILTER: ControlFilter = {
  keyword: '',
  region: FILTER_ALL,
  level: FILTER_ALL,
  status: FILTER_ALL,
};

/**
 * 통합관제 상황판 (SFR-004).
 * 검색·필터로 좁힌 하나의 목록을 지도·우선목록·순위·총출력이 함께 나눠 쓰고,
 * 이상 설비가 항상 위로 올라오도록 상태 우선으로 정렬한다.
 */
function ControlRoomPage() {
  const { node, plant, plantLabel } = usePlantScope();
  const selectNode = useSelectNode();
  useAutoRefresh(REFRESH_MS);

  const [filter, setFilter] = useState<ControlFilter>(EMPTY_FILTER);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 수집 현황은 최근 수집 시각·미수신 표시에 쓴다 (SFR-004-04/05).
  const collection = useMemo(() => {
    const rows = getCollectionStatus(NOW.toDate());
    const stale = rows.filter((row) => row.delayMinutes > 60);
    const latest = rows.reduce((best, row) => (row.lastCollectedAt > best ? row.lastCollectedAt : best), '');

    return { byId: new Map(rows.map((row) => [row.schoolId, row])), stale, latest };
  }, []);

  // 발전소를 골라 두면 그 학교만, 아니면 도 전체를 대상으로 한다.
  const scoped = useMemo(() => (plant ? SCHOOLS.filter((school) => school.id === plant.id) : SCHOOLS), [plant]);

  const rows = useMemo(() => {
    const query = filter.keyword.trim().toLowerCase();

    return scoped
      .filter((school) => {
        if (filter.region !== FILTER_ALL && school.regionCode !== filter.region) return false;
        if (filter.level !== FILTER_ALL && school.level !== filter.level) return false;
        if (filter.status !== FILTER_ALL && school.status !== filter.status) return false;
        if (!query) return true;

        return [school.name, school.regionName, school.address]
          .some((field) => field.toLowerCase().includes(query));
      })
      // 이상 설비를 앞세운다 (SFR-004-13).
      .sort((a, b) => OPERATION_RANK[a.status] - OPERATION_RANK[b.status] || b.capacityKw - a.capacityKw);
  }, [scoped, filter]);

  const totals = useMemo(() => ({
    outputKw: liveTotalOutput(rows),
    capacityKw: rows.reduce((sum, school) => sum + school.capacityKw, 0),
    todayKwh: rows.reduce((sum, school) => sum + school.todayKwh, 0),
    monthKwh: rows.reduce((sum, school) => sum + school.monthKwh, 0),
    yearKwh: rows.reduce((sum, school) => sum + school.yearKwh, 0),
  }), [rows]);

  const stat = useMemo(() => getNodeStat(node, 'day', TODAY.toDate()), [node]);

  // 장애 지도는 필터와 무관하게 도 전체를 보여 주므로 개수도 전체 기준이다.
  const abnormalCount = useMemo(() => SCHOOLS.filter((school) => isAbnormal(school.status)).length, []);

  return (
    <ControlRoomLayout
      scopeLabel={plantLabel}
      collectedAt={collection.latest}
      isStale={collection.stale.length > 0}
    >
      <div className={styles.grid}>
        {/* 왼쪽 — 지금 얼마나 내고 있는지 */}
        <div className={styles.col}>
          <section className={`${styles.panel} ${styles.col__grow}`} aria-label="현재 총출력">
            <OutputGauge outputKw={totals.outputKw} capacityKw={totals.capacityKw} />
          </section>

          <section className={styles.panel} aria-label="누적 발전량">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>누적 발전량</h2>
            </div>
            <CumulativeKpi
              todayKwh={totals.todayKwh}
              monthKwh={totals.monthKwh}
              yearKwh={totals.yearKwh}
            />
          </section>

          <section className={styles.panel} aria-label="운영지표">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>운영지표</h2>
              <span className={styles.panel__note}>{rows.length}개소 기준</span>
            </div>
            <OpsMetrics schools={rows} hours={stat.hours} staleCount={collection.stale.length} />
          </section>
        </div>

        {/* 가운데 — 어느 축으로 봐도 같은 목록 */}
        <div className={styles.col}>
          <section className={`${styles.panel} ${styles['panel--open']}`} aria-label="검색과 필터">
            <ControlFilterBar
              value={filter}
              onChange={setFilter}
              matchedCount={rows.length}
              staleCount={collection.stale.length}
            />
          </section>

          {/* 전체를 볼 때는 표로 견주고, 발전소 하나를 고르면 그 아래 설비로 내려간다 */}
          <section className={`${styles.panel} ${styles.col__grow}`} aria-label="발전 현황 집계">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>
                {plant ? `${plant.name} 설비 현황` : '발전 현황 집계'}
              </h2>
              <span className={styles.panel__note}>
                {plant ? '인버터 아래 스트링·접속반까지' : '발전소·학교급·권역 기준'}
              </span>
            </div>

            {plant ? (
              <EquipmentCards plant={plant} />
            ) : (
              <AggregationPanel
                schools={rows}
                selectedId={selectedId}
                onSelect={(school) => {
                  setSelectedId(school.id);
                  selectNode(school.id);
                }}
              />
            )}
          </section>

          <section className={styles.panel} aria-label="시간대별 발전량">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>시간대별 발전량 · 권역 집계</h2>
            </div>
            <LiveTrendChart schools={rows} date={TODAY.toDate()} height={190} />
          </section>
        </div>

        {/* 오른쪽 — 먼저 봐야 할 것 */}
        <div className={styles.col}>
          {/* 순위는 검색·필터·선택과 무관하게 늘 전체 발전소를 견준다 */}
          <section className={`${styles.panel} ${styles.col__grow}`} aria-label="금일 실적 순위">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>금일 실적 순위</h2>
              <span className={styles.panel__note}>전체 {formatNumber(SCHOOLS.length)}개소 기준</span>
            </div>
            <RankingStrip
              schools={SCHOOLS}
              selectedId={selectedId}
              onSelect={(school) => {
                setSelectedId(school.id);
                selectNode(school.id);
              }}
            />
          </section>

          {/* 전체를 볼 때는 어디가 아픈지, 한 곳을 볼 때는 값이 들어오는지를 답한다 */}
          <section className={`${styles.panel} ${styles.col__grow}`} aria-label={plant ? '수집·고장 현황' : '장애 발생 위치'}>
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>{plant ? '수집·고장 현황' : '장애 발생 위치'}</h2>
              <span className={styles.panel__note}>
                {plant ? '15분 단위 수집 상태' : `이상 ${formatNumber(abnormalCount)}개소`}
              </span>
            </div>

            {plant ? <PlantHealthPanel plant={plant} /> : <FaultMap plants={SCHOOLS} />}
          </section>
        </div>
      </div>
    </ControlRoomLayout>
  );
}

export default ControlRoomPage;
