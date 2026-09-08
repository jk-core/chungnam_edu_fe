import { useSearchParams } from 'react-router-dom';
import { useTemplates } from '@/stores/fieldReportStore';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import { RevisionHistory } from './components/RevisionHistory';
import { TemplateEditor } from './components/TemplateEditor';
import { TemplateTable } from './components/TemplateTable';

/**
 * 점검 양식 등록·편집과 판 관리 (SFR-021-14).
 *
 * 초안(문항·개정 사유)은 편집기가 통째로 가진다 — 어느 양식을 고쳤는지는 주소가 쥔다.
 */
function TemplatesDepth({ depth }: { depth: AdminDepth }) {
  const [params] = useSearchParams();
  const templates = useTemplates();
  const templateId = params.get('templateId');

  // `?templateId=` 가 없으면 새로 세우는 자리다 — 다른 관리 화면과 같은 규칙이다.
  if (depth === 'form') return <TemplateEditor template={templates.find((item) => item.id === templateId) ?? null} />;

  return (
    <>
      <TemplateTable />
      <RevisionHistory />
    </>
  );
}

export default TemplatesDepth;
