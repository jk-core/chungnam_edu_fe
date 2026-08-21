import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { formatDuration, formatNumber } from '@/utils/format';
import { isAbnormal, OPERATION_LABEL, OPERATION_RANK, OPERATION_TONE } from '@/mocks/status';
import { Modal } from '@/components/common/Modal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Table } from '@/components/common/Table';
import type { Column } from '@/components/common/Table';
import type { CollectionStatus } from '@/interface/collection';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';
import { createLossEstimate } from '../utils/faultGroups';
import styles from './FaultGroupModal.module.scss';

/*
  정렬 기준 (SFR-004-13).

  기본은 상태 우선 — 값이 아예 끊긴 통신단절이 맨 위, 그 다음이 경고·주의다.
  다만 "어느 설비가 가장 오래 손을 안 탔나", "큰 설비부터 보자" 같은 판단도 자주 필요해
  운영자가 축을 바꿔 볼 수 있게 둔다.
*/
type SortKey = 'status' | 'stale' | 'capacity';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'status', label: '상태순' },
  { value: 'stale', label: '미수신순' },
  { value: 'capacity', label: '용량순' },
];

/** 상태 거르개에서 '전체'를 나타내는 값 */
const ALL = 'all';

interface FaultGroupModalProps {
  /** 전체 발전소 — 이 중 이상 상태만 담고, 정상 학교는 기대 발전량의 잣대가 된다 */
  plants: School[];
  collection: Map<string, CollectionStatus>;
  /** 어느 묶음의 더보기를 눌렀는지 — 거르개의 첫 값이 된다 */
  status: OperationStatus;
  onClose: () => void;
}

/**
 * 장애 발생 현황 전체 목록 (SFR-004-13/14).
 *
 * 판에는 급한 것 몇 개만 펴 두므로, 나머지를 여기서 마저 본다.
 * 누른 묶음으로 걸러 열되 상태를 넓혀 볼 수 있게 두고, 정렬은 판이 아니라 이 자리에서 고른다.
 */
export function FaultGroupModal({ plants, collection, status, onClose }: FaultGroupModalProps) {
  const [only, setOnly] = useState<string>(status);
  const [sort, setSort] = useState<SortKey>('status');

  const lossOf = useMemo(() => createLossEstimate(plants), [plants]);
  const faults = useMemo(() => plants.filter((plant) => isAbnormal(plant.status)), [plants]);

  const statusOptions = useMemo(() => {
    const kinds = [...new Set(faults.map((plant) => plant.status))]
      .sort((a, b) => OPERATION_RANK[a] - OPERATION_RANK[b]);

    return [
      { value: ALL, label: `전체 ${formatNumber(faults.length)}` },
      ...kinds.map((kind) => ({
        value: kind,
        label: `${OPERATION_LABEL[kind]} ${formatNumber(faults.filter((plant) => plant.status === kind).length)}`,
      })),
    ];
  }, [faults]);

  const rows = useMemo(() => {
    const byStatus = (a: School, b: School) =>
      OPERATION_RANK[a.status] - OPERATION_RANK[b.status] || b.capacityKw - a.capacityKw;
    const delayOf = (plant: School) => collection.get(plant.id)?.delayMinutes ?? 0;

    return faults
      .filter((plant) => (only === ALL ? true : plant.status === only))
      .sort((a, b) => {
        // 오래 끊긴 것부터. 같으면 상태 우선순위로 갈라 준다.
        if (sort === 'stale') return delayOf(b) - delayOf(a) || byStatus(a, b);
        if (sort === 'capacity') return b.capacityKw - a.capacityKw || byStatus(a, b);

        return byStatus(a, b);
      });
  }, [faults, only, sort, collection]);

  const columns: Column<School>[] = [
    {
      key: 'name',
      header: '발전소',
      render: (row) => row.name,
    },
    { key: 'region', header: '지역', width: '110px', hideOnTablet: true, render: (row) => row.regionName },
    {
      key: 'capacity',
      header: '설비용량',
      width: '110px',
      align: 'right',
      render: (row) => `${formatNumber(row.capacityKw, 1)}kW`,
    },
    {
      key: 'loss',
      header: '추정 손실',
      width: '110px',
      align: 'right',
      // 기대치만큼 낸 곳은 뺄 것이 없다 — 「−0kWh」 라고 적으면 조금 잃은 것처럼 읽힌다.
      render: (row) => {
        const loss = lossOf(row);

        return loss < 0.5 ? '—' : `−${formatNumber(loss, 0)}kWh`;
      },
    },
    {
      key: 'seen',
      header: '마지막 수신',
      width: '130px',
      hideOnTablet: true,
      render: (row) => {
        const seen = collection.get(row.id);

        return seen ? `${formatDuration(seen.delayMinutes)} 전` : '수집 정보 없음';
      },
    },
    {
      key: 'status',
      header: '상태',
      width: '110px',
      render: (row) => (
        <Badge tone={OPERATION_TONE[row.status]} withDot>
          {OPERATION_LABEL[row.status]}
        </Badge>
      ),
    },
  ];

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title="장애 발생 현황"
      description="추정 손실은 금일 정상 가동 발전소의 설비용량 1kW 당 발전량을 기준으로 산정한 값입니다."
    >
      <div className={styles.filters}>
        <SegmentedControl label="상태" size="sm" options={statusOptions} value={only} onChange={setOnly} />
        <SegmentedControl label="정렬 기준" size="sm" options={SORT_OPTIONS} value={sort} onChange={setSort} />
      </div>

      <Table
        caption="장애 발생 발전소 목록. 발전소, 지역, 설비용량, 마지막 수신, 상태 순입니다."
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
      />
    </Modal>
  );
}
