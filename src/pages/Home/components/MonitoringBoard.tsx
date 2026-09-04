import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { GeoMap } from '@/components/common/GeoMap';
import { MapStatusFilter, useStatusFilter } from '@/components/plant/MapStatusFilter';
import { ALL, EMPTY_FILTERS, matchPlants, PlantSearchModal } from '@/components/plant/PlantSearchModal';
import { NOW } from '@/mocks/today';
import { isAbnormal, OPERATION_LABEL, OPERATION_ORDER } from '@/mocks/status';
import { CHUNGNAM_REGIONS } from '@/configs/regions';
import { PlantDetailPanel } from '@/components/plant/PlantDetailPanel';
import { Reveal } from '@/components/common/Reveal';
import { SearchIcon } from '@/components/common/Icon';
import { formatNumber, formatPercent } from '@/utils/format';
import { getCollectionStatus } from '@/mocks/collection';
import { PATH } from '@/routes/routes';
import { useSelectNode } from '@/stores/plantStore';
import type { OperationStatus } from '@/interface/status';
import type { PlantFilters } from '@/components/plant/PlantSearchModal';
import type { School } from '@/interface/energy';
import styles from './MonitoringBoard.module.scss';

const SEGMENT_COLOR: Record<OperationStatus, string> = {
  running: 'var(--ok)',
  ready: 'var(--brand)',
  degraded: 'var(--caution)',
  fault: 'var(--critical)',
  commLost: 'var(--offline)',
};

const DONUT_RADIUS = 68;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

/**
 * 통합관제 보드 (SFR-004).
 * 검색·필터로 좁히고 상태가 나쁜 학교를 앞세워 보여 준다.
 * 오른쪽 지도는 같은 목록을 실제 좌표에 찍은 것으로, 목록과 선택이 이어진다 (SFR-007-05~10).
 */
export function MonitoringBoard() {
  const selectNode = useSelectNode();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<PlantFilters>(EMPTY_FILTERS);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /** 고른 발전소를 조회 대상으로 잡고 발전 현황으로 넘긴다 — 누르면 다음 화면이 열려야 한다. */
  const openPlant = (plant: School) => {
    setSelectedId(plant.id);
    selectNode(plant.id);
    navigate(PATH.ENERGY_STATISTICS);
  };

  // 수집 현황은 최근 수집 시각·미수신 표시에 쓴다 (SFR-004-04/05).
  const collection = useMemo(() => {
    const rows = getCollectionStatus(NOW.toDate());

    return {
      byId: new Map(rows.map((row) => [row.schoolId, row])),
      staleCount: rows.filter((row) => row.delayMinutes > 60).length,
    };
  }, []);

  const rows = useMemo(() => matchPlants(filters), [filters]);
  // 범례가 곧 필터다 — 지도에 무엇을 남길지 여기서 고른다.
  const status = useStatusFilter(rows);

  // 걸어 둔 조건을 짧은 말로 되짚는다.
  const chips = [
    filters.keyword.trim() ? `"${filters.keyword.trim()}"` : null,
    filters.region !== ALL ? CHUNGNAM_REGIONS.find((item) => item.code === filters.region)?.name ?? null : null,
    filters.level !== ALL ? filters.level : null,
    filters.status !== ALL ? OPERATION_LABEL[filters.status as OperationStatus] : null,
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <section className={styles.board} aria-labelledby="monitoring-title">
      <Reveal>
        <Card
          title={<span id="monitoring-title">통합관제</span>}
          description="왼쪽은 지금 운영 상태, 오른쪽은 실제 위치입니다. 도면에서 발전소를 누르면 그 발전소의 발전 현황으로 넘어갑니다."
        >
          <div className={styles.board__inner}>
            <div className={styles.filters}>
              <Button variant="secondary" iconLeft={<SearchIcon />} onClick={() => setSearchOpen(true)}>
                발전소 검색
              </Button>

              {/* 무엇으로 좁혀 놓았는지 늘 보이게 둔다 — 모달을 닫으면 조건이 잊히기 쉽다 */}
              {chips.length > 0 ? (
                <ul className={styles.chips}>
                  {chips.map((chip) => (
                    <li key={chip} className={styles.chips__item}>{chip}</li>
                  ))}
                  <li>
                    <button type="button" className={styles.chips__clear} onClick={() => setFilters(EMPTY_FILTERS)}>
                      조건 지우기
                    </button>
                  </li>
                </ul>
              ) : null}

              <p className={styles.filters__meta}>
                <span>최근 수집 {NOW.format('YYYY-MM-DD HH:mm')}</span>
                <span className={collection.staleCount > 0 ? styles.filters__stale : undefined}>
                  미수신 {collection.staleCount}개소 · 조회 {formatNumber(rows.length)}개소
                </span>
              </p>
            </div>

            <div className={styles.layout}>
              <StatusDonut rows={rows} />

              <div className={styles.mapArea}>
                <GeoMap
                  plants={status.visible}
                  selectedId={selectedId}
                  /*
                    마커를 누르면 옆 칸에 설명만 편다.
                    누르자마자 화면을 넘겨 버리면 무엇을 골랐는지 볼 틈이 없다 —
                    넘어가는 일은 설명 안 "발전 현황 보기"가 맡는다.
                  */
                  // 지도를 못 읽는 환경에서는 검색 모달의 발전소 목록으로 같은 내용을 훑을 수 있다.
                  fallback={<p>지도를 볼 수 없다면 위 발전소 검색에서 같은 목록을 조건별로 확인할 수 있습니다.</p>}
                  renderPopup={(plant) => <PlantDetailPanel plant={plant} onOpen={() => openPlant(plant)} />}
                />

                {/* 지도 아래 범례가 곧 필터다 — 「경고」만 남겨 어디인지 볼 수 있다 */}
                <MapStatusFilter
                  counts={status.counts}
                  picked={status.picked}
                  onToggle={status.toggle}
                  onReset={status.reset}
                  hideEmpty
                />
              </div>
            </div>
          </div>
        </Card>
      </Reveal>

      <PlantSearchModal
        isOpen={searchOpen}
        filters={filters}
        onClose={() => setSearchOpen(false)}
        onApply={setFilters}
        onSelect={openPlant}
      />
    </section>
  );
}

/** 지금 조회 조건에 걸린 발전소의 운영 상태 분포 (SFR-004-02). */
function StatusDonut({ rows }: { rows: School[] }) {
  const total = Math.max(1, rows.length);
  const counts = OPERATION_ORDER.map((key) => ({
    key,
    label: OPERATION_LABEL[key],
    color: SEGMENT_COLOR[key],
    count: rows.filter((row) => row.status === key).length,
  }));

  // 도넛 조각은 앞 조각이 끝난 자리에서 이어 그린다.
  const arcs = counts.reduce<{ key: OperationStatus; color: string; length: number; offset: number }[]>(
    (acc, item) => {
      const length = (item.count / total) * CIRCUMFERENCE;
      const prev = acc[acc.length - 1];

      return [...acc, { key: item.key, color: item.color, length, offset: prev ? prev.offset - prev.length : 0 }];
    },
    [],
  );

  const running = counts.find((item) => item.key === 'running')?.count ?? 0;
  const trouble = rows.filter((row) => isAbnormal(row.status)).length;

  return (
    <div className={styles.health}>
      <div className={styles.health__donutWrap}>
        <svg className={styles.health__donut} viewBox="0 0 160 160" aria-hidden="true">
          <circle cx="80" cy="80" r={DONUT_RADIUS} className={styles.health__track} />
          {arcs.map((arc, index) => (
            <motion.circle
              key={arc.key}
              cx="80"
              cy="80"
              r={DONUT_RADIUS}
              className={styles.health__segment}
              stroke={arc.color}
              strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
              initial={{ strokeDashoffset: arc.offset + CIRCUMFERENCE, opacity: 0 }}
              whileInView={{ strokeDashoffset: arc.offset, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: index * 0.1, ease: [0.22, 0.68, 0.32, 1] }}
            />
          ))}
        </svg>

        <div className={styles.health__center}>
          <p className={styles.health__ratio}>{formatPercent(running / total, 1)}</p>
          <p className={styles.health__ratioLabel}>정상 가동</p>
        </div>
      </div>

      <ul className={styles.health__legend}>
        {counts.map((item) => (
          <li key={item.key} className={styles.health__legendItem}>
            <span className={styles.health__dot} style={{ backgroundColor: item.color }} />
            <span className={styles.health__legendLabel}>{item.label}</span>
            <span className={styles.health__legendValue}>{item.count}</span>
          </li>
        ))}
      </ul>

      <p className={styles.health__note}>
        {trouble > 0
          ? `손봐야 할 발전소가 ${formatNumber(trouble)}곳 있습니다. 오른쪽 도면에서 붉은 점을 눌러 보세요.`
          : '지금은 손봐야 할 발전소가 없습니다.'}
      </p>
    </div>
  );
}

/** 마커 팝업 — 설비 기본정보 · 시간대별 발전량 · 효율 추이와 현재 상태 (SFR-007-06~08) */
