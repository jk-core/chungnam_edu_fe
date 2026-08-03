import { useId, useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Column, Table } from '@/components/common/Table';
import { currentOutputOf, hourlySeriesOf } from '@/mocks/schoolOutput';
import { GeoMap } from '@/components/common/GeoMap';
import { SUNRISE_HOUR } from '@/mocks/generation';
import { NOW } from '@/mocks/today';
import { isAbnormal, OPERATION_LABEL, OPERATION_ORDER, OPERATION_RANK, OPERATION_TONE, RTU_LABEL } from '@/mocks/status';
import { REGIONS } from '@/mocks/regions';
import { Reveal } from '@/components/common/Reveal';
import { SCHOOL_LEVELS, SCHOOLS } from '@/mocks/schools';
import { SearchIcon } from '@/components/common/Icon';
import { Select } from '@/components/common/Select';
import { Sparkline } from '@/components/common/Sparkline';
import { cn } from '@/utils/cn';
import { formatNumber, formatPercent } from '@/utils/format';
import { getCollectionStatus } from '@/mocks/collection';
import { useSelectNode } from '@/stores/plantStore';
import type { School } from '@/interface/energy';
import styles from './MonitoringBoard.module.scss';

const ALL = 'all';

/**
 * 통합관제 보드 (SFR-004).
 * 검색·필터로 좁히고 상태가 나쁜 학교를 앞세워 보여 준다.
 * 오른쪽 지도는 같은 목록을 실제 좌표에 찍은 것으로, 목록과 선택이 이어진다 (SFR-007-05~10).
 */
export function MonitoringBoard() {
  const selectNode = useSelectNode();
  const searchId = useId();

  const [keyword, setKeyword] = useState('');
  const [region, setRegion] = useState<string>(ALL);
  const [level, setLevel] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
          description="검색과 필터로 좁혀 보고, 이상이 있는 학교를 앞세워 보여 줍니다. 지도에서 마커를 누르면 그 설비의 상세를 펼칩니다."
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
              <div className={styles.list}>
                {rows.length === 0 ? (
                  <p className={styles.empty}>조건에 맞는 발전소가 없습니다.</p>
                ) : (
                  rows.map((school) => {
                    const collected = collection.byId.get(school.id);

                    return (
                      <button
                        key={school.id}
                        type="button"
                        className={cn(styles.row, {
                          [styles['row--abnormal']]: isAbnormal(school.status),
                          [styles['row--selected']]: school.id === selectedId,
                        })}
                        onClick={() => {
                          setSelectedId(school.id);
                          selectNode(school.id);
                        }}
                      >
                        <span className={styles.row__body}>
                          <span className={styles.row__name}>{school.name}</span>
                          <span className={styles.row__meta}>
                            {school.regionName} · {formatNumber(school.capacityKw, 1)}kW · 일사량계{' '}
                            {RTU_LABEL[school.pyranometerStatus]}
                            {collected && collected.delayMinutes > 60 ? ` · 수집 지연 ${collected.delayMinutes}분` : ''}
                          </span>
                        </span>
                        <span className={styles.row__right}>
                          <span className={styles.row__output}>
                            <span className={styles.row__outputValue}>{formatNumber(currentOutputOf(school), 1)}</span>
                            <span className={styles.row__outputUnit}>kW</span>
                          </span>
                          <Badge tone={OPERATION_TONE[school.status]} withDot>
                            {OPERATION_LABEL[school.status]}
                          </Badge>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <GeoMap
                plants={rows}
                selectedId={selectedId}
                onSelect={(plant) => {
                  setSelectedId(plant.id);
                  selectNode(plant.id);
                }}
                fallback={(
                  <Table
                    caption="지도에 표시한 발전소 목록"
                    columns={fallbackColumns}
                    rows={rows}
                    getRowKey={(row) => row.id}
                  />
                )}
                renderPopup={(plant) => <PlantPopup plant={plant} />}
              />
            </div>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}

/** 마커 팝업 — 설비 기본정보 · 시간대별 발전량 · 효율 추이와 현재 상태 (SFR-007-06~08) */
function PlantPopup({ plant }: { plant: School }) {
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
    </div>
  );
}
