import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AlertIcon, CheckIcon, ChevronRightIcon, MonitorIcon } from '@/components/common/Icon';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { DIAG_EFFICIENCY_CRITICAL, DIAG_EFFICIENCY_WARN } from '@/configs/diagnosis';
import { EmptyState } from '@/components/common/EmptyState';
import { getFaultCode } from '@/mocks/faultCodes';
import { getNodePath } from '@/stores/scopeTreeStore';
import { isAbnormal, OPERATION_LABEL, OPERATION_ORDER, OPERATION_RANK, OPERATION_TONE } from '@/mocks/status';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Sparkline } from '@/components/common/Sparkline';
import { Table } from '@/components/common/Table';
import { cn } from '@/utils/cn';
import { formatEnergy, formatNumber } from '@/utils/format';
import { useDiagnosisRange } from '@/stores/filterStore';
import { useDiagnosisScope } from '@/hooks/useDiagnosisScope';
import { useExpandPath, useSelectNode } from '@/stores/plantStore';
import type { FaultCode } from '@/interface/equipment';
import type { OperationStatus } from '@/interface/status';
import type { Column } from '@/components/common/Table';
import styles from '../../AiDiagnosis.module.scss';
import { useDiagnosisUnits } from '../hooks/useDiagnosisUnits';
import { DeepDiagnosisModal } from './DeepDiagnosisModal';
import { FaultCodeModal } from './FaultCodeModal';
import type { DiagnosisUnit } from '../hooks/useDiagnosisUnits';

type ViewMode = 'card' | 'table';

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'card', label: '카드' },
  { value: 'table', label: '표' },
];

/**
 * 지금 보고 있는 계층 바로 아래 설비의 진단 현황 (SFR-013-04/07/08).
 * 한 단계만 내려가 보여 주고, 카드를 누르면 그 설비로 조회 대상이 옮겨 간다.
 *
 * 표 보기는 요구사항이 못박은 형태다 — 설비별 발전효율·기대값·측정값을 한 줄에 늘어놓고,
 * 줄을 누르면 그 설비의 심층 진단이 열린다.
 */
export function DiagnosisEquipment() {
  const { target, label } = useDiagnosisScope();
  const [range] = useDiagnosisRange();
  const { units, isLoading, hasChildren, childNoun } = useDiagnosisUnits();
  const selectNode = useSelectNode();
  const expandPath = useExpandPath();
  const [openFault, setOpenFault] = useState<{ fault: FaultCode; device: string } | null>(null);
  const [deepTarget, setDeepTarget] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('card');

  // 손봐야 할 설비가 뒤로 밀리지 않도록 이상부터 세운다.
  const rows = useMemo(
    () => [...units].sort((a, b) => OPERATION_RANK[a.status] - OPERATION_RANK[b.status] || b.capacityKw - a.capacityKw),
    [units],
  );

  const counts = useMemo(() => units.reduce<Record<OperationStatus, number>>(
    (acc, unit) => ({ ...acc, [unit.status]: acc[unit.status] + 1 }),
    { running: 0, degraded: 0, fault: 0, commLost: 0, ready: 0 },
  ), [units]);

  /* 측정·기대 발전량은 인버터까지만 잰다 — 스트링 줄에서는 그 칸을 세우지 않는다. */
  const hasPower = target.kind === 'plant';

  const tableColumns: Column<DiagnosisUnit>[] = [
    {
      key: 'name',
      header: '설비',
      render: (row) => (
        <button type="button" className={styles.unitTable__name} onClick={() => setDeepTarget(row.nodeId)}>
          {row.name}
        </button>
      ),
    },
    {
      key: 'status',
      header: '상태',
      width: '104px',
      render: (row) => <Badge tone={OPERATION_TONE[row.status]} withDot>{row.statusName}</Badge>,
    },
    {
      key: 'efficiency',
      header: '발전효율',
      align: 'right',
      width: '96px',
      render: (row) => (
        <span className={row.efficiency > 0 && row.efficiency < DIAG_EFFICIENCY_WARN ? styles.deltaDown : undefined}>
          {row.efficiency <= 0 ? '—' : `${formatNumber(row.efficiency, 1)} %`}
        </span>
      ),
    },
    ...(hasPower ? [
      {
        key: 'predicted',
        header: '기대값',
        align: 'right' as const,
        width: '110px',
        render: (row: DiagnosisUnit) => energyText(row.power?.predicted),
      },
      {
        key: 'current',
        header: '측정값',
        align: 'right' as const,
        width: '110px',
        render: (row: DiagnosisUnit) => energyText(row.power?.current),
      },
    ] : [
      {
        key: 'countBelow',
        header: '미달일수',
        align: 'right' as const,
        width: '96px',
        render: (row: DiagnosisUnit) => `${formatNumber(row.countBelow)}일`,
      },
    ]),
    {
      key: 'fault',
      header: '고장분류',
      hideOnTablet: true,
      render: (row) => (row.faultCode > 0 ? row.faultCodeName : '정상'),
    },
  ];

  /* 도 전체와 스트링에는 아래로 내려갈 계층이 없다 — 조회할 것이 없다고 적는다. */
  if (!hasChildren) {
    return (
      <Card padding="none">
        <EmptyState
          title={target.kind === 'string' ? '더 내려갈 설비가 없습니다' : '발전소를 골라 주세요'}
          description={target.kind === 'string'
            ? '스트링이 진단의 최말단입니다. 아래 계측 추이로 이 스트링을 살펴보세요.'
            : '진단은 발전소 한 곳에서 시작합니다. 좌측 조회 대상에서 발전소를 골라 주세요.'}
        />
      </Card>
    );
  }

  return (
    <>
      <Reveal>
        <Card
          title="설비별 진단 현황"
          description={view === 'table'
            ? `${label}의 ${childNoun}별 발전효율 — 줄을 누르면 그 설비의 심층 진단이 열립니다`
            : `${label}의 ${childNoun} 실시간 진단`}
          action={(
            <SegmentedControl
              label="보기 방식"
              size="sm"
              options={VIEW_OPTIONS}
              value={view}
              onChange={setView}
            />
          )}
        >
          {rows.length === 0 ? (
            <EmptyState
              title={isLoading ? `${childNoun} 진단을 불러오는 중입니다` : `${childNoun} 진단 결과가 없습니다`}
              description={isLoading ? '' : `${label} 아래 ${childNoun}의 조회 기간 진단 결과가 없습니다.`}
            />
          ) : (
            <>
              <div className={styles.unitSummary}>
                <p className={styles.unitSummary__head}>
                  <MonitorIcon width={14} height={14} aria-hidden />
                  <span className={styles.unitSummary__title}>{childNoun}</span>
                  <span className={styles.unitSummary__total}>
                    {formatNumber(rows.length)}
                    <small>기</small>
                  </span>
                </p>
                <ul className={styles.unitSummary__counts}>
                  {OPERATION_ORDER.filter((status) => status !== 'ready').map((status) => (
                    <li key={status} className={styles.unitSummary__chip}>
                      <span className={cn(styles.unitSummary__dot, styles[`unitDot--${status}`])} aria-hidden />
                      {OPERATION_LABEL[status]}
                      <strong>{counts[status]}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              {view === 'table' ? (
                <div className={styles.unitTable}>
                  <Table
                    caption={`${childNoun}별 발전효율과 고장분류`}
                    columns={tableColumns}
                    rows={rows}
                    getRowKey={(row) => row.nodeId}
                  />
                </div>
              ) : (
                <ul className={styles.unitGrid} aria-label={`${childNoun}별 진단 카드`}>
                  {rows.map((unit, index) => (
                    <UnitTile
                      key={unit.nodeId}
                      unit={unit}
                      index={index}
                      parentName={label}
                      onOpenFault={(fault, device) => setOpenFault({ fault, device })}
                      onOpen={() => {
                        // 조회 대상을 옮기고, 좌측 트리에서도 그 자리가 펼쳐져 있게 한다.
                        expandPath(getNodePath(unit.nodeId).map((item) => item.id));
                        selectNode(unit.nodeId);
                      }}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </Card>
      </Reveal>

      <FaultCodeModal
        fault={openFault?.fault ?? null}
        deviceLabel={openFault?.device}
        onClose={() => setOpenFault(null)}
      />

      {/* 표에서 고른 설비의 심층 진단 (SFR-013-08/09/10) */}
      <DeepDiagnosisModal nodeId={deepTarget} date={range.end} onClose={() => setDeepTarget(null)} />
    </>
  );
}

/** 값이 없는 칸은 0 이 아니라 하이픈이다 — 0 kWh 로 읽히면 안 잰 것과 구분되지 않는다 */
function energyText(kwh: number | undefined): string {
  if (kwh === undefined) return '—';

  const energy = formatEnergy(kwh);

  return `${energy.value} ${energy.unit}`;
}

interface UnitTileProps {
  unit: DiagnosisUnit;
  index: number;
  parentName: string;
  onOpenFault: (fault: FaultCode, device: string) => void;
  onOpen: () => void;
}

function UnitTile({ unit, index, parentName, onOpenFault, onOpen }: UnitTileProps) {
  const abnormal = isAbnormal(unit.status);
  const deviceLabel = parentName ? `${parentName} · ${unit.name}` : unit.name;
  /* 원인·조치와 참고 사진은 코드 사전이 쥐고 있다 — 사전에 없는 코드는 펼칠 것이 없어 누르지 않는다. */
  const fault = unit.faultCode > 0 ? getFaultCode(unit.faultCode) : null;

  return (
    <motion.li
      className={cn(styles.unit, styles[`unit--${unit.status}`])}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04 }}
    >
      {/* 카드 빈 곳을 누르면 그 설비로 내려간다. 안쪽 버튼은 위 층에 둔다. */}
      <button
        type="button"
        className={styles.unit__overlay}
        aria-label={`${unit.name} 조회 대상으로 보기`}
        onClick={onOpen}
      />

      <header className={styles.unit__head}>
        <span className={styles.unit__icon} aria-hidden>
          <MonitorIcon width={13} height={13} />
        </span>
        <span className={styles.unit__name}>{deviceLabel}</span>
        <Badge tone={OPERATION_TONE[unit.status]}>{unit.statusName}</Badge>
      </header>

      {/*
        차트 위 한 줄은 늘 있어야 지금 이 설비가 어떤 상태인지 카드마다 같은 자리에서 읽힌다.
        이상이면 눌러서 원인·조치로, 정상이면 눌 곳 없는 안내로 둔다.
      */}
      {unit.faultCode > 0 ? (
        <FaultLine unit={unit} fault={fault} deviceLabel={deviceLabel} onOpenFault={onOpenFault} />
      ) : (
        <p className={cn(styles.unitAlert, styles['unitAlert--running'])}>
          <CheckIcon width={13} height={13} aria-hidden />
          <span className={styles.unitAlert__cause}>
            정상 · 진단 효율이 기준 안에 있습니다
            {unit.countBelow > 0 ? ` (최근 미달 ${unit.countBelow}일)` : ''}
          </span>
        </p>
      )}

      <div className={styles.unit__spark}>
        <Sparkline
          className={styles.unit__sparkLine}
          values={unit.points.map((point) => point.efficiency)}
          tone={abnormal ? 'critical' : 'brand'}
          width={300}
          height={44}
          animate={false}
          filled
        />
        <span className={styles.unit__sparkCaption}>
          진단 효율 추이 · {DIAG_EFFICIENCY_WARN}% 미만 주황 · {DIAG_EFFICIENCY_CRITICAL}% 미만 빨강
          {unit.countBelow > 0 ? ` · 미달 ${unit.countBelow}일` : ''}
        </span>
      </div>

      <dl className={styles.unit__metrics}>
        {unit.power ? (
          <>
            <div>
              <dt>기대값</dt>
              <dd>
                {formatEnergy(unit.power.predicted).value}
                <small>{formatEnergy(unit.power.predicted).unit}</small>
              </dd>
            </div>
            <div>
              <dt>측정값</dt>
              <dd>
                {formatEnergy(unit.power.current).value}
                <small>{formatEnergy(unit.power.current).unit}</small>
              </dd>
            </div>
          </>
        ) : (
          <div>
            <dt>미달일수</dt>
            <dd>
              {formatNumber(unit.countBelow)}
              <small>일</small>
            </dd>
          </div>
        )}
        <div>
          <dt>발전 효율</dt>
          <dd className={unit.efficiency > 0 && unit.efficiency < DIAG_EFFICIENCY_WARN ? styles.deltaDown : undefined}>
            {unit.efficiency <= 0 ? '—' : formatNumber(unit.efficiency, 1)}
            <small>%</small>
          </dd>
        </div>
      </dl>
    </motion.li>
  );
}

interface FaultLineProps {
  unit: DiagnosisUnit;
  fault: FaultCode | null;
  deviceLabel: string;
  onOpenFault: (fault: FaultCode, device: string) => void;
}

function FaultLine({ unit, fault, deviceLabel, onOpenFault }: FaultLineProps) {
  const className = cn(styles.unitAlert, styles[`unitAlert--${unit.status}`]);

  if (!fault) {
    return (
      <p className={className}>
        <AlertIcon width={13} height={13} aria-hidden />
        <span className={styles.unitAlert__cause}>{unit.faultCodeName}</span>
      </p>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        event.stopPropagation();
        onOpenFault(fault, deviceLabel);
      }}
      aria-label={`${unit.name} 원인·조치 보기`}
    >
      <AlertIcon width={13} height={13} aria-hidden />
      <span className={styles.unitAlert__cause}>{fault.summary}</span>
      <ChevronRightIcon width={12} height={12} aria-hidden />
    </button>
  );
}
