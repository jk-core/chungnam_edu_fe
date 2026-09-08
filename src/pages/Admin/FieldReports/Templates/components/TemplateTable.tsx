import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { createPath, editPath } from '@/pages/Admin/_shared/adminPath';
import { formatNumber } from '@/utils/format';
import { PlusIcon } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { TODAY } from '@/mocks/today';
import { useTemplates } from '@/stores/fieldReportStore';
import type { Column } from '@/components/common/Table';
import type { ReportTemplate } from '@/interface/fieldReport';
import styles from '@/pages/Admin/Admin.module.scss';

/** 마감까지 며칠인지. 지났으면 셈하지 않고 「마감」이라 적는다 */
function dueLabel(dueDate: string): string {
  const days = Math.round(TODAY.diff(dueDate, 'day', true) * -1);

  if (days < 0) return '마감';

  return days === 0 ? '오늘 마감' : `D-${days}`;
}

/** 점검 양식 목록 (SFR-021-14/19). 문항과 이번 회차 기간을 여기서 고른다. */
export function TemplateTable() {
  const templates = useTemplates();
  const navigate = useNavigate();

  const columns: Column<ReportTemplate>[] = [
    { key: 'label', header: '양식명', render: (row) => row.label },
    {
      key: 'type',
      header: '점검 유형',
      width: '100px',
      render: (row) => <Badge tone={row.inspectType === '특별' ? 'caution' : 'neutral'}>{row.inspectType}</Badge>,
    },
    { key: 'targetType', header: '점검 대상', width: '110px', render: (row) => row.targetType },
    { key: 'count', header: '문항', width: '80px', align: 'right', render: (row) => `${row.items.length}문항` },
    {
      key: 'period',
      header: '점검 기간',
      width: '170px',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.startDate} ~ {row.dueDate}</strong>
          <span className={styles.stackCell__sub}>{dueLabel(row.dueDate)}</span>
        </span>
      ),
    },
    {
      key: 'version',
      header: '판',
      width: '120px',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>v{row.version}</strong>
          <span className={styles.stackCell__sub}>{row.revisedAt}</span>
        </span>
      ),
    },
    {
      key: 'action',
      header: '관리',
      width: '110px',
      align: 'center',
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(editPath('field-reports', 'templates', 'templateId', row.id))}
        >
          편집
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <p className={styles.toolbar__note}>총 {formatNumber(templates.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => navigate(createPath('field-reports', 'templates'))}>
            양식 등록
          </Button>
        </div>
      </div>

      <Reveal>
        <Card
          title="점검 양식"
          description="문항을 고치면 새 판으로 나갑니다. 다음 회차는 문항을 그대로 두고 점검 기간만 고쳐 엽니다."
        >
          <Table caption="점검 양식 목록" columns={columns} rows={templates} getRowKey={(row) => row.id} />
        </Card>
      </Reveal>
    </>
  );
}
