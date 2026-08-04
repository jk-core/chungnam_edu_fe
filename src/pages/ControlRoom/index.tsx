import { useMemo, useState } from 'react';
import { ControlRoomLayout } from '@/layouts/ControlRoomLayout';
import { getCollectionStatus } from '@/mocks/collection';
import { getQualityStatus, summarizeQuality } from '@/mocks/quality';
import { getNode, ROOT_ID } from '@/mocks/tree';
import { getNodeStat } from '@/mocks/nodeStats';
import { liveTotalOutput } from '@/mocks/schoolOutput';
import { NOW, TODAY } from '@/mocks/today';
import { isAbnormal, OPERATION_RANK } from '@/mocks/status';
import { SCHOOLS } from '@/mocks/schools';
import { formatNumber } from '@/utils/format';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { ALERT_RECORDS } from '@/mocks/alerts';
import { AggregationPanel } from './components/AggregationPanel';
import { AlertToastStack, compareAlerts, toneOfAlert } from './components/AlertToastStack';
import { CollectionHealth } from './components/CollectionHealth';
import { FaultList } from './components/FaultList';
import { FaultMap } from './components/FaultMap';
import { OpsMetrics } from './components/OpsMetrics';
import { OutputGauge } from './components/OutputGauge';
import { RankingStrip } from './components/RankingStrip';
import { LiveTrendChart } from './components/LiveTrendChart';
import { CumulativeKpi } from './components/CumulativeKpi';
import { ControlSummaryBanner } from './components/ControlSummaryBanner';
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
function ControlRoomPage() {
  useAutoRefresh(REFRESH_MS);

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

  // 이상 설비를 앞세운다 (SFR-004-13).
  const rows = useMemo(() => [...SCHOOLS].sort(
    (a, b) => OPERATION_RANK[a.status] - OPERATION_RANK[b.status] || b.capacityKw - a.capacityKw,
  ), []);

  const totals = useMemo(() => ({
    outputKw: liveTotalOutput(rows),
    capacityKw: rows.reduce((sum, school) => sum + school.capacityKw, 0),
    todayKwh: rows.reduce((sum, school) => sum + school.todayKwh, 0),
    monthKwh: rows.reduce((sum, school) => sum + school.monthKwh, 0),
    yearKwh: rows.reduce((sum, school) => sum + school.yearKwh, 0),
  }), [rows]);

  const stat = useMemo(() => getNodeStat(getNode(ROOT_ID), 'day', TODAY.toDate()), []);

  const abnormalCount = useMemo(() => SCHOOLS.filter((school) => isAbnormal(school.status)).length, []);

  /*
    아직 손대지 않은 경보. 조치하기 전에는 사라지지 않으므로 알림창과 테두리 등이 함께 본다.
    정보성(info) 알림은 지켜보는 사람을 부르는 성격이 아니라 뺀다 — 다만 통신 유형은
    값 자체가 끊긴 것이라 심각도와 무관하게 챙긴다.
  */
  const openAlerts = useMemo(() => ALERT_RECORDS
    .filter((alert) => !alert.handled && !alert.resolvedAt && (alert.severity !== 'info' || alert.type === '통신'))
    .sort(compareAlerts), []);

  // 이미 눈으로 확인한 경보는 지워 둔다. 알림창과 테두리 등이 같은 목록을 보므로 함께 꺼진다.
  const [dismissed, setDismissed] = useState<string[]>([]);
  const liveAlerts = useMemo(
    () => openAlerts.filter((alert) => !dismissed.includes(alert.id)),
    [openAlerts, dismissed],
  );

  // 테두리는 가장 급한 결 하나만 따른다. 여러 색이 겹치면 무엇이 급한지 흐려진다.
  const alertTone = liveAlerts.some((alert) => toneOfAlert(alert) === 'critical')
    ? 'critical'
    : liveAlerts.some((alert) => toneOfAlert(alert) === 'caution')
      ? 'caution'
      : liveAlerts.length > 0 ? 'offline' : null;

  return (
    <ControlRoomLayout
      scopeLabel={SCOPE_LABEL}
      collectedAt={collection.latest}
      isStale={collection.stale.length > 0}
      alertTone={alertTone}
    >
      <div className={styles.grid}>
        {/* 왼쪽 — 지금 얼마나 내고 있는지. 값 하나짜리 게이지는 작게 두고 아래 판에 자리를 준다 */}
        <div className={styles.col}>
          <section className={styles.panel} aria-label="현재 총출력">
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

          <section className={`${styles.panel} ${styles.col__grow}`} aria-label="운영지표">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>운영지표</h2>
              <span className={styles.panel__note}>{rows.length}개소 기준</span>
            </div>
            <OpsMetrics schools={rows} hours={stat.hours} staleCount={collection.stale.length} />

            {/* 위 지표가 "얼마나 잘 만들고 있나" 라면, 여기서는 "그 숫자를 믿어도 되나" 를 답한다 */}
            <CollectionHealth rows={collection.rows} belowThreshold={quality.belowThreshold} />
          </section>
        </div>

        {/* 가운데 — 어느 축으로 봐도 같은 목록 */}
        <div className={styles.col}>
          {/* 조작할 것이 없는 화면이라, 필터가 있던 자리에 지금 상황을 흘려보낸다 */}
          <ControlSummaryBanner schools={rows} staleCount={collection.stale.length} />

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
              <span className={styles.panel__note}>전체 {formatNumber(SCHOOLS.length)}개소 중 상위 5</span>
            </div>
            <RankingStrip schools={SCHOOLS} />
          </section>

          {/* 지도는 어디가 아픈지, 목록은 무엇이 얼마나 아픈지를 답한다 */}
          <section className={`${styles.panel} ${styles.col__grow}`} aria-label="장애 발생 현황">
            <div className={styles.panel__head}>
              <h2 className={styles.panel__title}>장애 발생 현황</h2>
              <span className={styles.panel__note}>이상 {formatNumber(abnormalCount)}개소</span>
            </div>

            <FaultMap plants={SCHOOLS} />
            <FaultList plants={SCHOOLS} collection={collection.byId} />
          </section>
        </div>
      </div>

      <AlertToastStack
        alerts={liveAlerts}
        now={NOW.toDate()}
        onDismiss={(id) => setDismissed((prev) => [...prev, id])}
        onDismissAll={() => setDismissed(openAlerts.map((alert) => alert.id))}
      />
    </ControlRoomLayout>
  );
}

export default ControlRoomPage;
