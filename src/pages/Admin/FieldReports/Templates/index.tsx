import { useSearchParams } from 'react-router-dom';
import { useTemplates } from '@/stores/fieldReportStore';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import { RevisionHistory } from './components/RevisionHistory';
import { TemplateEditor } from './components/TemplateEditor';
import { TemplateTable } from './components/TemplateTable';

/**
 * 점검 양식 편집과 판 관리 (SFR-021-14).
 *
 * 초안(분류·문항·개정 사유)은 편집기가 통째로 가진다 — 어느 양식을 고쳤는지는 주소가 쥔다.
 */
function TemplatesDepth({ depth }: { depth: AdminDepth }) {
  const [params] = useSearchParams();
  const templates = useTemplates();
  const template = templates.find((item) => item.id === params.get('templateId'));

  // 양식은 새로 만들지 않고 있는 것을 고쳐 새 판으로 낸다 — 없는 주소면 목록을 보여 준다.
  if (depth === 'form') return template ? <TemplateEditor template={template} /> : <TemplateTable />;

  return (
    <>
      <TemplateTable />
      <RevisionHistory />
    </>
  );
}

export default TemplatesDepth;
