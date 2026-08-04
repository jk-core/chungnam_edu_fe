import { useMemo, useState } from 'react';
import { ALERT_RECORDS } from '@/mocks/alerts';
import { Badge, SEVERITY_LABEL, SEVERITY_TONE } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { INSPECTIONS } from '@/mocks/diagnosis';
import { INVERTERS, leafUnitsOf } from '@/mocks/equipment';
import { Modal } from '@/components/common/Modal';
import { OPERATION_LABEL } from '@/mocks/status';
import { Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { SCHOOLS } from '@/mocks/schools';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { TextField } from '@/components/common/Form';
import { computeCapacity, getSeedAsset } from '@/mocks/assetMaster';
import { formatNumber } from '@/utils/format';
import useAssetStore, { mergeAsset } from '@/stores/assetStore';
import type { Column } from '@/components/common/Table';
import type { ModuleSpec } from '@/interface/asset';
import styles from '../Admin.module.scss';

const PAGE_SIZE = 12;

/** 표 한 줄 — 발전소 한 곳의 모듈 구성 */
interface ModuleRow {
  plantId: string;
  plantName: string;
  spec: ModuleSpec;
  /** panelCount ÷ seriesCount — 직렬 묶음이 몇 조인지 */
  stringCount: number;
  capacityKw: number;
  /** 스트링·채널 가운데 정상이 아닌 것 */
  faultyUnits: number;
}

/**
 * 모듈 기본 정보와 스트링/어레이 구성 (SFR-017-05/06),
 * 행마다 점검·이상 이력을 이어 붙인다 (SFR-017-07).
 */
export function DeviceModules() {
  const assetPatched = useAssetStore((state) => state.assetPatched);
  const plantCreated = useAssetStore((state) => state.plantCreated);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ModuleRow | null>(null);

  const allRows = useMemo<ModuleRow[]>(() => SCHOOLS.map((school) => {
    // 등록 정보 화면에서 고친 스펙이 있으면 그쪽을 따른다 (SFR-016).
    const asset = mergeAsset(school.id, assetPatched, plantCreated) ?? getSeedAsset(school.id);
    const spec = asset?.module ?? { model: '-', wattPerPanel: 0, panelCount: 0, seriesCount: 1 };
    const units = INVERTERS.filter((inverter) => inverter.schoolId === school.id).flatMap(leafUnitsOf);

    return {
      plantId: school.id,
      plantName: school.name,
      spec,
      stringCount: spec.seriesCount > 0 ? Math.round(spec.panelCount / spec.seriesCount) : 0,
      capacityKw: computeCapacity(spec),
      faultyUnits: units.filter((unit) => unit.status !== 'running').length,
    };
  }), [assetPatched, plantCreated]);

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? allRows.filter((row) => row.plantName.includes(trimmed) || row.spec.model.includes(trimmed))
      : allRows;
  }, [allRows, keyword]);

  const totalPanels = allRows.reduce((sum, row) => sum + row.spec.panelCount, 0);
  const models = new Set(allRows.map((row) => row.spec.model)).size;

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const columns: Column<ModuleRow>[] = [
    {
      key: 'plant',
      header: '발전소 · 모듈 형식',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.plantName}</strong>
          <span className={styles.stackCell__sub}>{row.spec.model}</span>
        </span>
      ),
    },
    {
      key: 'watt',
      header: '1장 출력',
      align: 'right',
      width: '90px',
      render: (row) => `${formatNumber(row.spec.wattPerPanel)}W`,
    },
    {
      key: 'panels',
      header: '총 매수',
      align: 'right',
      width: '90px',
      render: (row) => `${formatNumber(row.spec.panelCount)}장`,
    },
    {
      key: 'array',
      header: '어레이 구성',
      width: '160px',
      hideOnTablet: true,
      // 직렬 몇 장을 몇 조로 묶었는지 — 스트링 구성이 한눈에 읽히게 적는다.
      render: (row) => `${row.spec.seriesCount}직렬 × ${formatNumber(row.stringCount)}조`,
    },
    {
      key: 'capacity',
      header: '설비 용량',
      align: 'right',
      width: '110px',
      render: (row) => `${formatNumber(row.capacityKw, 1)}kW`,
    },
    {
      key: 'faulty',
      header: '이상 회로',
      align: 'center',
      width: '100px',
      render: (row) => (row.faultyUnits > 0 ? <Badge tone="caution">{row.faultyUnits}회로</Badge> : '없음'),
    },
    {
      key: 'action',
      header: '점검·이상',
      width: '90px',
      align: 'center',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => setSelected(row)}>
          보기
        </Button>
      ),
    },
  ];

  const detail = selected ? buildHistory(selected.plantId) : null;

  return (
    <>
      <Reveal>
        <div className={`${styles.summary} ${styles['summary--three']}`}>
          <StatCard label="모듈 매수" value={totalPanels} unit="장" accent />
          <StatCard label="모듈 형식" value={models} unit="종" />
          <StatCard label="이상 회로" value={allRows.reduce((sum, row) => sum + row.faultyUnits, 0)} unit="회로" />
        </div>
      </Reveal>

      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <TextField
            label="발전소 검색"
            value={keyword}
            onChange={(value) => {
              setKeyword(value);
              setPage(1);
            }}
            placeholder="발전소·모듈 형식 검색"
            width="md"
          />
        </div>
        <p className={styles.toolbar__note}>{formatNumber(rows.length)}개소</p>
      </div>

      <Reveal delay={0.05}>
        <Card
          eyebrow="Module"
          title="모듈 구성"
          description="형식·매수와 직렬/조 구성을 봅니다. 스펙을 고치는 곳은 발전소·설비 관리입니다."
        >
          {rows.length === 0 ? (
            <EmptyState title="조건에 맞는 발전소가 없습니다" description="검색어를 지우고 다시 찾아 보세요." />
          ) : (
            <>
              <Table
                caption="모듈 구성 목록. 발전소와 모듈 형식, 1장 출력, 총 매수, 어레이 구성, 설비 용량, 이상 회로 순입니다."
                columns={columns}
                rows={pageRows}
                getRowKey={(row) => row.plantId}
                getRowClassName={(row) => (row.faultyUnits > 0 ? styles.rowAlert : undefined)}
              />
              <Pagination
                page={currentPage}
                pageCount={pageCount}
                totalCount={rows.length}
                onChange={setPage}
                label="모듈 구성 목록"
              />
            </>
          )}
        </Card>
      </Reveal>

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        size="lg"
        title={`${selected?.plantName ?? ''} 모듈 점검·이상 이력`}
        description={selected
          ? `${selected.spec.model} · ${selected.spec.seriesCount}직렬 × ${formatNumber(selected.stringCount)}조 · ${formatNumber(selected.capacityKw, 1)}kW`
          : undefined}
      >
        {selected && detail ? (
          <div className={styles.form}>
            <section>
              <h3 className={styles.toolbar__note}>이상 회로</h3>
              {detail.units.length === 0 ? (
                <p className={styles.toolbar__note}>정상이 아닌 회로가 없습니다.</p>
              ) : (
                <div className={styles.history}>
                  {detail.units.map((unit) => (
                    <div key={unit.id} className={styles.historyItem}>
                      <span className={styles.historyItem__at}>{unit.owner} · {unit.name}</span>
                      <span className={styles.historyItem__body}>
                        <Badge tone="caution">{OPERATION_LABEL[unit.status]}</Badge> 형제 대비 출력{' '}
                        {formatNumber(unit.relativeOutput * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className={styles.toolbar__note}>설비 알림 (통신 장애 제외)</h3>
              {detail.alerts.length === 0 ? (
                <p className={styles.toolbar__note}>최근 알림이 없습니다.</p>
              ) : (
                <div className={styles.history}>
                  {detail.alerts.map((alert) => (
                    <div key={alert.id} className={styles.historyItem}>
                      <span className={styles.historyItem__at}>{alert.occurredAt}</span>
                      <span className={styles.historyItem__body}>
                        <Badge tone={SEVERITY_TONE[alert.severity]}>{SEVERITY_LABEL[alert.severity]}</Badge>{' '}
                        {alert.title} — {alert.deviceName}
                      </span>
                      <span className={styles.historyItem__at}>{alert.handled ? '조치 완료' : '미조치'}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className={styles.toolbar__note}>점검 이력</h3>
              {detail.inspections.length === 0 ? (
                <p className={styles.toolbar__note}>등록된 점검이 없습니다.</p>
              ) : (
                <div className={styles.history}>
                  {detail.inspections.map((item) => (
                    <div key={item.id} className={styles.historyItem}>
                      <span className={styles.historyItem__at}>{item.date}</span>
                      <span className={styles.historyItem__body}>
                        <Badge tone={item.state === 'overdue' ? 'critical' : item.state === 'done' ? 'ok' : 'neutral'}>
                          {INSPECTION_STATE_LABEL[item.state]}
                        </Badge>{' '}
                        {item.type} — {item.note}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

const INSPECTION_STATE_LABEL = {
  done: '완료',
  scheduled: '예정',
  overdue: '지연',
} as const;

/** 모듈 쪽에서 볼 만한 이력만 추린다 — 통신 장애는 수집장치 몫이라 뺀다. */
function buildHistory(plantId: string) {
  // 회로 이름은 인버터 안에서만 유일하다 — 어느 인버터 것인지 함께 들고 나온다.
  const units = INVERTERS
    .filter((inverter) => inverter.schoolId === plantId)
    .flatMap((inverter) => leafUnitsOf(inverter).map((unit) => ({ ...unit, owner: inverter.name })))
    .filter((unit) => unit.status !== 'running');

  return {
    units,
    alerts: ALERT_RECORDS
      .filter((alert) => alert.schoolId === plantId && alert.type !== '통신')
      .slice(0, 6),
    inspections: INSPECTIONS.filter((item) => item.schoolId === plantId),
  };
}
