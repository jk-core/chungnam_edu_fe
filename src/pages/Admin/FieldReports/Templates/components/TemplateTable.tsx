import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { flattenTemplate } from '@/mocks/fieldReport';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { useTemplates } from '@/stores/fieldReportStore';
import type { Column } from '@/components/common/Table';
import type { ReportTemplate } from '@/interface/fieldReport';
import styles from '@/pages/Admin/Admin.module.scss';

/** 점검 양식 목록 (SFR-021-14). 문항을 고치려면 여기서 골라 편집기로 들어간다. */
export function TemplateTable() {
  const templates = useTemplates();
  const navigate = useNavigate();

  const columns: Column<ReportTemplate>[] = [
    {
      key: 'label',
      header: '양식명',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.label}</strong>
          <span className={styles.stackCell__sub}>{row.sections.map((section) => section.title).join(' · ')}</span>
        </span>
      ),
    },
    {
      key: 'type',
      header: '점검 유형',
      width: '100px',
      render: (row) => <Badge tone={row.inspectType === '특별' ? 'caution' : 'neutral'}>{row.inspectType}</Badge>,
    },
    {
      key: 'count',
      header: '분류 · 문항',
      width: '120px',
      align: 'right',
      render: (row) => `${row.sections.length}분류 · ${flattenTemplate(row).length}문항`,
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
          문항 편집
        </Button>
      ),
    },
  ];

  return (
    <Reveal>
      <Card
        title="점검 양식"
        description="문항을 고치면 새 판으로 나갑니다. 이미 작성된 보고서는 그때 문항을 그대로 지킵니다."
      >
        <Table caption="점검 양식 목록" columns={columns} rows={templates} getRowKey={(row) => row.id} />
      </Card>
    </Reveal>
  );
}
