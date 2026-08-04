import { useId, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Column, Table } from '@/components/common/Table';
import { currentOutputOf, hourlySeriesOf } from '@/mocks/schoolOutput';
import { GeoMap } from '@/components/common/GeoMap';
import { SUNRISE_HOUR } from '@/mocks/generation';
import { NOW } from '@/mocks/today';
import { isAbnormal, OPERATION_LABEL, OPERATION_ORDER, OPERATION_RANK, OPERATION_TONE } from '@/mocks/status';
import { REGIONS } from '@/mocks/regions';
import { Reveal } from '@/components/common/Reveal';
import { SCHOOL_LEVELS, SCHOOLS } from '@/mocks/schools';
import { ChevronRightIcon, SearchIcon } from '@/components/common/Icon';
import { Select } from '@/components/common/Select';
import { Sparkline } from '@/components/common/Sparkline';
import { formatNumber, formatPercent } from '@/utils/format';
import { getCollectionStatus } from '@/mocks/collection';
import { PATH } from '@/routes/routes';
import { useSelectNode } from '@/stores/plantStore';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';
import styles from './MonitoringBoard.module.scss';

const ALL = 'all';

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
  const searchId = useId();

  const [keyword, setKeyword] = useState('');
  const [region, setRegion] = useState<string>(ALL);
  const [level, setLevel] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /** 고른 발전소를 조회 대상으로 잡고 발전 현황으로 넘긴다 — 누르면 다음 화면이 열려야 한다. */
  const openPlant = (plant: School) => {
    setSelectedId(plant.id);
    selectNode(plant.id);
    navigate(PATH.STATISTICS_OVERVIEW);
  };

  // 수집 현황은 최근 수집 시각·미수신 표시에 쓴다 (SFR-004-04/05).
  const collection = useMemo(() => {
    const rows = getCollectionStatus(NOW.toDate());

    return {
      byId: new Map(rows.map((row) => [row.schoolId, row])),
      staleCount: rows.filter((row) => row.delayMinutes > 60).length,
    };
  }, []);

  const rows = useMemo(() => {
    const query = keyword.trim().toLowerCase();

    return SCHOOLS
      .filter((school) => {
        if (region !== ALL && school.regionCode !== region) return false;
        if (level !== ALL && school.level !== level) return false;
        if (status !== ALL && school.status !== status) return false;
        if (!query) return true;

        // 학교명·지역·설비상태 어디로든 찾을 수 있게 한다 (SFR-004-11).
        return [school.name, school.regionName, school.address, OPERATION_LABEL[school.status]]
          .some((field) => field.toLowerCase().includes(query));
      })
      // 이상 설비를 먼저 확인하도록 상태 우선 정렬 (SFR-004-13)
      .sort((a, b) => OPERATION_RANK[a.status] - OPERATION_RANK[b.status] || b.capacityKw - a.capacityKw);
  }, [keyword, region, level, status]);

  const fallbackColumns: Column<School>[] = [
    { key: 'name', header: '발전소', render: (row) => row.name },
    { key: 'region', header: '시·군', render: (row) => row.regionName, hideOnTablet: true },
    {
      key: 'status',
      header: '설비상태',
      render: (row) => (
        <Badge tone={OPERATION_TONE[row.status]} withDot>
          {OPERATION_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: 'output',
      header: '실시간 출력',
      align: 'right',
      render: (row) => `${formatNumber(currentOutputOf(row), 1)} kW`,
    },
    {
      key: 'today',
      header: '금일 발전량',
      align: 'right',
      hideOnTablet: true,
      render: (row) => `${formatNumber(row.todayKwh, 1)} kWh`,
    },
  ];

  return (
    <section className={styles.board} aria-labelledby="monitoring-title">
      <Reveal>
        <Card
          eyebrow="Monitoring"
          title={<span id="monitoring-title">통합관제</span>}
          description="왼쪽은 지금 운영 상태, 오른쪽은 실제 위치입니다. 도면에서 발전소를 누르면 그 발전소의 발전 현황으로 넘어갑니다."
        >
          <div className={styles.board__inner}>
            <div className={styles.filters}>
              <div className={styles.search}>
                <SearchIcon className={styles.search__icon} width={18} height={18} />
                <input
                  id={searchId}
                  type="search"
                  className={styles.search__input}
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="학교명·시·군·주소·설비상태로 검색"
                  aria-label="발전소 검색"
                />
              </div>

              <Select
                className={styles.filters__select}
                label="행정구역"
                value={region}
                onChange={setRegion}
                options={[{ value: ALL, label: '전체 시·군' }, ...REGIONS.map((item) => ({ value: item.code, label: item.name }))]}
              />
              <Select
                className={styles.filters__select}
                label="학교급"
                value={level}
                onChange={setLevel}
                options={[{ value: ALL, label: '전체 학교급' }, ...SCHOOL_LEVELS.map((item) => ({ value: item, label: item }))]}
              />
              <Select
                className={styles.filters__select}
                label="운영상태"
                value={status}
                onChange={setStatus}
                options={[{ value: ALL, label: '전체 상태' }, ...OPERATION_ORDER.map((item) => ({ value: item, label: OPERATION_LABEL[item] }))]}
              />

              <p className={styles.filters__meta}>
                <span>최근 수집 {NOW.format('YYYY-MM-DD HH:mm')}</span>
                <span className={collection.staleCount > 0 ? styles.filters__stale : undefined}>
                  미수신 {collection.staleCount}개소 · 조회 {formatNumber(rows.length)}개소
                </span>
              </p>
            </div>

            <div className={styles.layout}>
              <StatusDonut rows={rows} />

              <GeoMap
                plants={rows}
                selectedId={selectedId}
                // 도면에서 바로 그 발전소 발전통계로 넘어간다.
                onSelect={openPlant}
                fallback={(
                  <Table
                    caption="지도에 표시한 발전소 목록"
                    columns={fallbackColumns}
                    rows={rows}
                    getRowKey={(row) => row.id}
                  />
                )}
                renderPopup={(plant) => <PlantPopup plant={plant} onOpen={() => openPlant(plant)} />}
              />
            </div>
          </div>
        </Card>
      </Reveal>
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
function PlantPopup({ plant, onOpen }: { plant: School; onOpen: () => void }) {
  const series = hourlySeriesOf(plant);

  return (
    <div>
      <p className={styles.popup__name}>{plant.name}</p>
      <p className={styles.popup__meta}>
        {plant.regionName} · {formatNumber(plant.capacityKw, 1)}kW · 인버터 {plant.inverterCount}대
      </p>

      <div className={styles.popup__badges}>
        <Badge tone={OPERATION_TONE[plant.status]} withDot>
          {OPERATION_LABEL[plant.status]}
        </Badge>
        <Badge tone="neutral">{plant.level}</Badge>
      </div>

      <div className={styles.popup__section}>
        <p className={styles.popup__sectionTitle}>
          시간대별 발전량 ({Math.floor(SUNRISE_HOUR)}시 ~ 20시)
        </p>
        <Sparkline
          values={series}
          tone={isAbnormal(plant.status) ? 'critical' : 'solar'}
          width={212}
          height={40}
          animate={false}
          filled
          className={styles.popup__spark}
        />
      </div>

      <div className={styles.popup__stats}>
        <span className={styles.popup__stat}>
          <span className={styles.popup__statLabel}>실시간 출력</span>
          <span className={styles.popup__statValue}>{formatNumber(currentOutputOf(plant), 1)} kW</span>
        </span>
        <span className={styles.popup__stat}>
          <span className={styles.popup__statLabel}>이용률</span>
          <span className={styles.popup__statValue}>{formatPercent(plant.utilization, 1)}</span>
        </span>
      </div>

      <button type="button" className={styles.popup__go} onClick={onOpen}>
        발전 현황 보기
        <ChevronRightIcon width={14} height={14} aria-hidden />
      </button>
    </div>
  );
}
