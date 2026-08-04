import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { CHANNELS, getRawSeries, scaleToInverter } from '@/mocks/collection';
import { Card } from '@/components/common/Card';
import { DownloadIcon } from '@/components/common/Icon';
import { Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { MSG } from '@/configs/messages';
import { cn } from '@/utils/cn';
import { exportCsv } from '@/utils/export';
import { formatNumber } from '@/utils/format';
import { formatShort } from '@/utils/date';
import { toast } from '@/stores/toastStore';
import { useCollectionDate } from '@/stores/filterStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { CsvColumn } from '@/utils/export';
import type { RawPoint } from '@/interface/collection';
import styles from '../Collection.module.scss';
import { CollectionFilter } from './CollectionFilter';

type RowFilter = 'all' | 'missing';

const FILTER_OPTIONS: { value: RowFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'missing', label: '결측만' },
];

const PAGE_SIZE = 24;

export function RawTab() {
  const { plant, inverter, label } = usePlantScope();
  const [date] = useCollectionDate();
  const [filter, setFilter] = useState<RowFilter>('all');
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const base = getRawSeries(plant?.id ?? null, date);
    const points = inverter && plant ? scaleToInverter(base, inverter.capacityKw / plant.capacityKw) : base;

    return filter === 'missing' ? points.filter((point) => point.values.power === null) : points;
  }, [plant, inverter, date, filter]);

  // 채널 구성이 바뀌면 열도 따라 바뀌도록 CHANNELS 에서 그대로 뽑는다.
  const csvColumns: CsvColumn<RawPoint>[] = [
    { header: '시각', value: (row) => row.time },
    ...CHANNELS.map((channel) => ({
      header: `${channel.label}(${channel.unit})`,
      value: (row: RawPoint) => row.values[channel.key] ?? '',
    })),
  ];

  const download = () => {
    if (rows.length === 0) {
      toast.error(MSG.noResult);

      return;
    }

    const filename = `원시데이터_${label}_${formatShort(date).replace(/[.\s]/g, '')}`;

    exportCsv(filename, csvColumns, rows);
    toast.success(MSG.downloadStart(filename));
  };

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className={styles.tab}>
      <CollectionFilter
        trailing={
          <Button variant="secondary" size="sm" iconLeft={<DownloadIcon />} onClick={download}>
            CSV 내려받기
          </Button>
        }
      >
        <SegmentedControl
          label="행 필터"
          size="sm"
          options={FILTER_OPTIONS}
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
        />
      </CollectionFilter>

      <Reveal>
        <Card
          eyebrow="Raw"
          title="원시 수집 데이터"
          description={`${label} · ${formatShort(date)} 수집분입니다. 값이 들어오지 않은 자리는 —로 두었습니다.`}
          padding="none"
        >
          <div className={styles.rawWrap}>
            <table className={styles.raw}>
              <caption>수집 시각별 계측값 표</caption>
              <thead>
                <tr>
                  <th scope="col">수집 시각</th>
                  {CHANNELS.map((channel) => (
                    <th key={channel.key} scope="col">
                      {channel.label}
                      <span className={styles.raw__unit}>{channel.unit}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((point) => {
                  const isMissing = point.values.power === null;

                  return (
                    <tr key={point.time} className={cn({ [styles['raw__row--missing']]: isMissing })}>
                      <th scope="row" className={styles.raw__time}>
                        {point.time}
                      </th>
                      {CHANNELS.map((channel) => {
                        const value = point.values[channel.key];

                        return (
                          <td key={channel.key} className={styles.raw__cell}>
                            {value === null ? <span className={styles.raw__none}>—</span> : formatNumber(value, 1)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={current}
            pageCount={pageCount}
            totalCount={rows.length}
            onChange={setPage}
            label="원시 수집 데이터"
          />
        </Card>
      </Reveal>
    </div>
  );
}
