import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { Reveal } from '@/components/common/Reveal';
import { RTU_EVENT_LABEL, RTUS } from '@/mocks/rtu';
import { RTU_LABEL, RTU_TONE } from '@/mocks/status';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import type { Column } from '@/components/common/Table';
import type { Rtu } from '@/interface/asset';
import type { RtuStatus } from '@/interface/status';
import styles from '../Admin.module.scss';

type Filter = 'all' | RtuStatus;

/** 시스템 장비(수집장치) 관리 (SFR-017) */
export function DevicesTab() {
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Rtu | null>(null);

  const rows = useMemo(
    () => (filter === 'all' ? RTUS : RTUS.filter((rtu) => rtu.status === filter)),
    [filter],
  );

  const abnormal = RTUS.filter((rtu) => rtu.status === 'abnormal').length;
  const disconnected = RTUS.filter((rtu) => rtu.status === 'disconnected').length;

  const columns: Column<Rtu>[] = [
    {
      key: 'plant',
      header: '발전소',
      render: (row) => <strong>{row.plantName}</strong>,
    },
    { key: 'model', header: '모델', width: '120px', hideOnTablet: true, render: (row) => row.model },
    { key: 'serial', header: '시리얼', width: '120px', hideOnTablet: true, render: (row) => row.serial },
    { key: 'firmware', header: '펌웨어', width: '90px', hideOnTablet: true, render: (row) => `v${row.firmware}` },
    { key: 'interval', header: '수집 주기', align: 'right', width: '90px', render: (row) => `${row.intervalMinutes}분` },
    {
      key: 'status',
      header: '연계 상태',
      width: '110px',
      render: (row) => (
        <Badge tone={RTU_TONE[row.status]} withDot>
          {RTU_LABEL[row.status]}
        </Badge>
      ),
    },
    { key: 'seen', header: '최근 수신', width: '150px', render: (row) => row.lastSeenAt },
    {
      key: 'action',
      header: '이력',
      width: '80px',
      align: 'center',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => setSelected(row)}>
          보기
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.tab}>
      <Reveal>
        <div className={`${styles.summary} ${styles['summary--three']}`}>
          <StatCard label="수집장치" value={RTUS.length} unit="식" />
          <StatCard label="연계 비정상" value={abnormal} unit="식" />
          <StatCard label="연계 두절" value={disconnected} unit="식" />
        </div>
      </Reveal>

      <div className={styles.toolbar}>
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: '전체' },
            { value: 'normal', label: '정상' },
            { value: 'abnormal', label: '비정상' },
            { value: 'disconnected', label: '두절' },
          ]}
          label="연계 상태 필터"
        />
        <p className={styles.toolbar__note}>{formatNumber(rows.length)}식</p>
      </div>

      <Reveal delay={0.05}>
        <Card
          eyebrow="RTU"
          title="수집장치 목록"
          description="연계 상태와 수집 주기를 확인하고, 이력 버튼으로 교체·이설 내역을 봅니다."
        >
          <Table
            caption="수집장치 목록"
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            getRowClassName={(row) => (row.status === 'disconnected' ? styles.rowAlert : undefined)}
          />
        </Card>
      </Reveal>

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={`${selected?.plantName ?? ''} 수집장치`}
        description={selected ? `${selected.model} · ${selected.serial} · 펌웨어 v${selected.firmware}` : undefined}
      >
        {selected ? (
          <div className={styles.history}>
            {[...selected.events].reverse().map((event) => (
              <div key={`${event.at}-${event.kind}`} className={styles.historyItem}>
                <span className={styles.historyItem__at}>{event.at}</span>
                <span className={styles.historyItem__body}>
                  <Badge tone={event.kind === 'replace' ? 'caution' : 'neutral'}>{RTU_EVENT_LABEL[event.kind]}</Badge>{' '}
                  {event.note}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
