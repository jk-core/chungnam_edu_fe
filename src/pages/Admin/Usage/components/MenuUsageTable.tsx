import { useMemo } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DownloadIcon } from '@/components/common/Icon';
import { MSG } from '@/configs/messages';
import { NOW } from '@/mocks/today';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { exportCsv } from '@/utils/export';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import type { Column } from '@/components/common/Table';
import type { CsvColumn } from '@/utils/export';
import type { MenuUsage } from '@/interface/security';
import styles from '../../Admin.module.scss';
import { readMenuUsage, shareOf, sumViews } from './usageData';

/**
 * 화면별 상세 (SFR-028-03).
 *
 * 파일에는 화면에서 줄인 항목까지 그대로 담는다 — 표는 좁은 화면에서 비중 칸을 접지만,
 * 받아서 다시 셈하려는 사람에게는 그 칸이 필요하다.
 */
export function MenuUsageTable() {
  const rows = useMemo(() => readMenuUsage(), []);
  const totalViews = sumViews(rows);
  const topViews = rows[0]?.views ?? 1;

  const columns: Column<MenuUsage>[] = [
    { key: 'section', header: '대메뉴', width: '120px', render: (row) => row.section },
    { key: 'menu', header: '화면', render: (row) => <strong>{row.menu}</strong> },
    { key: 'views', header: '조회수', align: 'right', width: '110px', render: (row) => formatNumber(row.views) },
    { key: 'users', header: '이용자', align: 'right', width: '90px', render: (row) => `${formatNumber(row.users)}명` },
    {
      key: 'share',
      header: '비중',
      width: '190px',
      hideOnTablet: true,
      // 막대는 1위 대비 길이, 숫자는 전체 대비 비중 — 길이는 견주라고, 숫자는 몫을 알라고 있다
      render: (row) => (
        <span className={styles.rate}>
          <span className={styles.rate__track}>
            <span className={styles.rate__bar} style={{ width: `${Math.round((row.views / topViews) * 100)}%` }} />
          </span>
          <span className={styles.rate__value}>{shareOf(row, totalViews).toFixed(1)}%</span>
        </span>
      ),
    },
  ];

  const download = () => {
    const csvColumns: CsvColumn<MenuUsage>[] = [
      { header: '대메뉴', value: (row) => row.section },
      { header: '화면', value: (row) => row.menu },
      { header: '조회수', value: (row) => row.views },
      { header: '이용자수', value: (row) => row.users },
      { header: '비중(%)', value: (row) => shareOf(row, totalViews).toFixed(1) },
    ];
    const filename = `시스템활용통계_메뉴별_${NOW.format('YYYYMMDD')}`;

    exportCsv(filename, csvColumns, rows);
    toast.success(MSG.downloadStart(filename));
  };

  return (
    <Reveal delay={0.1}>
      <Card
        title="화면별 상세"
        description="조회수 순으로 정렬했습니다."
        action={(
          <Button variant="secondary" size="sm" iconLeft={<DownloadIcon />} onClick={download}>
            엑셀 내려받기
          </Button>
        )}
      >
        <Table caption="메뉴별 활용 통계" columns={columns} rows={rows} getRowKey={(row) => row.menu} />
      </Card>
    </Reveal>
  );
}
