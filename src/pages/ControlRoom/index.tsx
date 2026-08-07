import { useMemo, useState } from 'react';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { getCollectionStatus } from '@/mocks/collection';
import { getQualityStatus, summarizeQuality } from '@/mocks/quality';
import { getNode, ROOT_ID } from '@/mocks/tree';
import { getNodeStat } from '@/mocks/nodeStats';
import { liveTotalOutput } from '@/mocks/schoolOutput';
import { NOW, TODAY } from '@/mocks/today';
import { isAbnormal, OPERATION_LABEL } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { ALERT_RECORDS } from '@/mocks/alerts';
import { CUMULATIVE } from '@/mocks/generation';
import type { AlertRecord } from '@/interface/alert';
import type { OperationStatus } from '@/interface/status';
import type { PlantFilters } from '@/components/plant/PlantSearchModal';
import { ALL, EMPTY_FILTERS, matchPlants, PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { REGIONS } from '@/mocks/regions';
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
import styles from './ControlRoom.module.scss';

/** 자동 갱신 주기 — 실제 서비스에서는 이 틱에 최신 수집값을 다시 읽는다. */
const REFRESH_MS = 60_000;

/** 이 화면이 다루는 범위 — 늘 도 전체다 */
const SCOPE_LABEL = '충청남도 전체';

/**
 * 통합관제 상황판 (SFR-004).
 *
 * 지켜보는 화면이라 조작 장치를 두지 않는다. 발전소 하나로 좁혀 보는 일은
 * 발전 현황·AI진단 화면이 맡으므로, 여기서는 도 전체만 다룬다.
 * 하나의 목록을 지도·우선목록·순위·총출력이 함께 나눠 쓰고,
 * 이상 설비가 항상 위로 올라오도록 상태 우선으로 정렬한다.
 */
/**
 * 화면 가장자리를 어느 색으로 점등할지 (SFR-004-14).
 * 통신 장애는 설비 고장과 원인이 달라 갈라 놓는다.
 */
function toneOfAlert(alert: AlertRecord): 'critical' | 'caution' | 'offline' {
  if (alert.type === '통신') return 'offline';

  return alert.severity === 'critical' ? 'critical' : 'caution';
}

function ControlRoomPage() {
  useAutoRefresh(REFRESH_MS);

  // 조회 조건 (SFR-004-11/12) — 헤더 검색창에서 연다.
  const [filters, setFilters] = useState<PlantFilters>(EMPTY_FILTERS);
  const [searchOpen, setSearchOpen] = useState(false);

  // 수집 현황은 최근 수집 시각·미수신 표시에 쓴다 (SFR-004-04/05).
  const collection = useMemo(() => {
    const rows = getCollectionStatus(NOW.toDate());
    const stale = rows.filter((row) => row.delayMinutes > 60);
    const latest = rows.reduce((best, row) => (row.lastCollectedAt > best ? row.lastCollectedAt : best), '');

    return { rows, byId: new Map(rows.map((row) => [row.schoolId, row])), stale, latest };
  }, []);

  // 품질 기준(95%)에 못 미쳐 AI 학습에서 빠지는 개소 (SFR-012-10/11).
  const quality = useMemo(
    () => summarizeQuality(getQualityStatus(null, TODAY.toDate(), TODAY.toDate())),
    [],
  );

  // 조건에 걸린 발전소를 이상부터 세운다 (SFR-004-13). 조건이 없으면 전체가 대상이다.
  const rows = useMemo(() => matchPlants(filters), [filters]);

  const plantIds = useMemo(() => new Set(rows.map((row) => row.id)), [rows]);

  /** 검색창에 되짚어 줄 조건 요약 — 무엇으로 좁혀 놓았는지 한 줄로 적는다. */
  const searchSummary = useMemo(() => {
    const chips = [
      filters.keyword.trim() ? `"${filters.keyword.trim()}"` : null,
      filters.region !== ALL ? REGIONS.find((item) => item.code === filters.region)?.name ?? null : null,
      filters.level !== ALL ? filters.level : null,
      filters.status !== ALL ? OPERATION_LABEL[filters.status as OperationStatus] : null,
      filters.org !== ALL ? (filters.org === 'moe' ? '교육부' : '충청남도교육청') : null,
    ].filter((chip): chip is string => Boolean(chip));

    if (chips.length === 0) return undefined;

    return `${chips.join(' · ')} · ${formatNumber(rows.length)}개소`;
  }, [filters, rows.length]);

  const totals = useMemo(() => ({
    outputKw: liveTotalOutput(rows),
    capacityKw: rows.reduce((sum, school) => sum + school.capacityKw, 0),
    todayKwh: rows.reduce((sum, school) => sum + school.todayKwh, 0),
    monthKwh: rows.reduce((sum, school) => sum + school.monthKwh, 0),
    yearKwh: rows.reduce((sum, school) => sum + school.yearKwh, 0),
  }), [rows]);

  const stat = useMemo(() => getNodeStat(getNode(ROOT_ID), 'day', TODAY.toDate()), []);

  const abnormalCount = useMemo(() => rows.filter((school) => isAbnormal(school.status)).length, [rows]);

  /*
    아직 손대지 않은 경보. 조치하기 전에는 사라지지 않으므로 알림창과 테두리 등이 함께 본다.
    정보성(info) 알림은 지켜보는 사람을 부르는 성격이 아니라 뺀다 — 다만 통신 유형은
    값 자체가 끊긴 것이라 심각도와 무관하게 챙긴다.
  */
  const openAlerts = useMemo(() => ALERT_RECORDS
    .filter((alert) => !alert.handled && !alert.resolvedAt && (alert.severity !== 'info' || alert.type === '통신'))
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)), []);

  // 이미 눈으로 확인한 경보는 지워 둔다. 알림창과 테두리 등이 같은 목록을 보므로 함께 꺼진다.

  // 테두리는 가장 급한 결 하나만 따른다. 여러 색이 겹치면 무엇이 급한지 흐려진다.
  const alertTone = openAlerts.some((alert) => toneOfAlert(alert) === 'critical')
    ? 'critical'
    : openAlerts.some((alert) => toneOfAlert(alert) === 'caution')
      ? 'caution'
      : openAlerts.length > 0 ? 'offline' : null;

  return (
    <ControlRoomLayout
      scopeLabel={SCOPE_LABEL}
      alertTone={alertTone}
      onSearch={() => setSearchOpen(true)}
      searchSummary={searchSummary}
    >
      <div className={styles.grid}>
        {/* 왼쪽 — 지금 얼마나 내고 있는지. 값 하나짜리 게이지는 작게 두고 아래 판에 자리를 준다 */}
        <div className={styles.col}>
          <section className={styles.panel} aria-label="현재 총출력">
            <OutputGauge outputKw={totals.outputKw} capacityKw={totals.capacityKw} />
          </section>

          <section className={styles.panel} aria-label="발전량">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>발전량</h2>
            </div>
            <CumulativeKpi
              todayKwh={totals.todayKwh}
              monthKwh={totals.monthKwh}
              yearKwh={totals.yearKwh}
              totalKwh={CUMULATIVE.totalKwh}
            />
          </section>

          <section className={`${styles.panel} ${styles.col__grow}`} aria-label="운영지표">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>운영지표</h2>
              <span className={styles.panel__note}>{rows.length}개소 기준</span>
            </div>
            <OpsMetrics schools={rows} hours={stat.hours} staleCount={collection.stale.length} />

            {/* 미수신이 몇 대인지 위에서 봤으면, 어느 인버터인지는 여기서 흘려 보여 준다 (SFR-004-05) */}
            <MissingInverters plantIds={plantIds} collection={collection.byId} />

            {/* 위 지표가 "얼마나 잘 만들고 있나" 라면, 여기서는 "그 숫자를 믿어도 되나" 를 답한다 */}
            <CollectionHealth
              rows={collection.rows}
              belowThreshold={quality.belowThreshold}
              collectedAt={collection.latest}
              isStale={collection.stale.length > 0}
            />
          </section>
        </div>

        {/* 가운데 — 어느 축으로 봐도 같은 목록 */}
        <div className={styles.col}>
          <section className={`${styles.panel} ${styles.col__grow}`} aria-label="발전 현황 집계">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>발전 현황 집계</h2>
              <span className={styles.panel__note}>발전소·학교급·권역 기준</span>
            </div>

            <AggregationPanel schools={rows} />
          </section>

          <section className={styles.panel} aria-label="시간대별 발전량">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>시간대별 발전량 · 권역 집계</h2>
            </div>
            <LiveTrendChart schools={rows} date={TODAY.toDate()} />
          </section>
        </div>

        {/* 오른쪽 — 먼저 봐야 할 것 */}
        <div className={styles.col}>
          <section className={styles.panel} aria-label="금일 실적 순위">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>금일 실적 순위</h2>
              <span className={styles.panel__note}>조회 {formatNumber(rows.length)}개소 중 상위 5</span>
            </div>
            <RankingStrip schools={rows} />
          </section>

          {/* 지도는 어디가 아픈지, 목록은 무엇이 얼마나 아픈지를 답한다 */}
          <section className={`${styles.panel} ${styles.col__grow}`} aria-label="장애 발생 현황">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>장애 발생 현황</h2>
              <span className={styles.panel__note}>이상 {formatNumber(abnormalCount)}개소</span>
            </div>

            <FaultMap plants={rows} />
            <FaultList plants={rows} collection={collection.byId} />
          </section>
        </div>
      </div>

      <PlantSearchModal
        isOpen={searchOpen}
        filters={filters}
        onClose={() => setSearchOpen(false)}
        onApply={setFilters}
      />
    </ControlRoomLayout>
  );
}

export default ControlRoomPage;
