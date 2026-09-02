import { Card } from '@/components/common/Card';
import { pickEnergyUnit } from '@/mocks/generation';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { formatNumber, formatPercent } from '@/utils/format';
import type { Column } from '@/components/common/Table';
import { BASIS_LABEL } from '../utils/statBasis';
import type { BasisRow } from '../utils/statBasis';
import type { StatisticsView } from '../hooks/useStatisticsView';

const COLUMNS = (basisLabel: string): Column<BasisRow>[] => [
  { key: 'name', header: basisLabel, render: (row) => <strong>{row.name}</strong> },
  { key: 'count', header: '발전소', width: '90px', align: 'right', render: (row) => `${formatNumber(row.count)}개소` },
  {
    key: 'capacity',
    header: '설비용량',
    width: '120px',
    align: 'right',
    render: (row) => `${formatNumber(row.capacityKw, 1)} kW`,
  },
  {
    key: 'generation',
    header: '발전량',
    width: '140px',
    align: 'right',
    render: (row) => {
      const unit = pickEnergyUnit(row.generationKwh);

      return `${formatNumber(row.generationKwh / unit.divider, 1)} ${unit.unit}`;
    },
  },
  {
    key: 'utilization',
    header: '설비이용률',
    width: '110px',
    align: 'right',
    render: (row) => formatPercent(row.utilization),
  },
];

/**
 * 지역별·교육청별 집계 (SFR-008-04).
 *
 * 설비별은 고른 발전소의 아래 계층을 파고들지만, 이 둘은 조회 대상과 무관하게 도 전체를
 * 한 표로 묶어 어디가 앞서고 뒤지는지 본다. 그래서 이 축을 고르면 화면이 이 표 하나가 된다.
 */
export function BasisTable({ view }: { view: StatisticsView }) {
  const { basis, basisRows, meta } = view;

  if (basisRows.length === 0) return null;

  return (
    <Reveal>
      <Card
        title={`${BASIS_LABEL[basis]}별 발전 집계`}
        description={`${meta.label} 기준 · ${basisRows.length}개 ${BASIS_LABEL[basis]}를 발전량 순으로 늘어놓았습니다. 설비이용률은 용량 대비 실제 발전량입니다.`}
      >
        <Table
          caption={`${BASIS_LABEL[basis]}별 발전 집계`}
          columns={COLUMNS(BASIS_LABEL[basis])}
          rows={basisRows}
          getRowKey={(row) => row.key}
        />
      </Card>
    </Reveal>
  );
}
