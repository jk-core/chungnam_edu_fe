import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { describeDetail, pickEnergyUnit } from '@/mocks/generation';
import { DownloadIcon } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { MSG } from '@/configs/messages';
import { exportCsv } from '@/utils/export';
import { formatNumber, formatPercent } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import type { Column } from '@/components/common/Table';
import type { CsvColumn } from '@/utils/export';
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
 * 설비별은 아래 계층을 파고들지만, 이 둘은 도 전체를 한 표로 묶어 어디가 앞서고 뒤지는지 본다.
 * 그래서 조회 뎁스가 어디든 같은 표가 뜬다 — 뎁스 화면이 아니라 공통 조각인 이유다.
 */
export function BasisTable({ view }: { view: StatisticsView }) {
  const { basis, basisRows, meta, period, date } = view;

  if (basisRows.length === 0) return null;

  const download = () => {
    const columns: CsvColumn<BasisRow>[] = [
      { header: BASIS_LABEL[basis], value: (row) => row.name },
      { header: '발전소 수', value: (row) => row.count },
      { header: '설비용량(kW)', value: (row) => Math.round(row.capacityKw * 10) / 10 },
      { header: '발전량(kWh)', value: (row) => Math.round(row.generationKwh) },
      { header: '설비이용률', value: (row) => formatPercent(row.utilization) },
    ];
    const filename = `발전집계_${BASIS_LABEL[basis]}별_${describeDetail(period, date)}`;

    exportCsv(filename, columns, basisRows);
    toast.success(MSG.downloadStart(filename));
  };

  return (
    <Reveal>
      <Card
        eyebrow="Basis"
        title={`${BASIS_LABEL[basis]}별 발전 집계`}
        description={`${meta.label} 기준 · ${basisRows.length}개 ${BASIS_LABEL[basis]}를 발전량 순으로 늘어놓았습니다. 설비이용률은 용량 대비 실제 발전량입니다.`}
        action={(
          <Button variant="secondary" size="sm" iconLeft={<DownloadIcon />} onClick={download}>
            집계 내려받기
          </Button>
        )}
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
