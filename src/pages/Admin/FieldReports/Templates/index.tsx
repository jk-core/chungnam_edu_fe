import { useState } from 'react';
import type { ReportTemplate } from '@/interface/fieldReport';
import { RevisionHistory } from './components/RevisionHistory';
import { TemplateEditor } from './components/TemplateEditor';
import { TemplateTable } from './components/TemplateTable';

/**
 * 점검 양식 편집과 판 관리 (SFR-021-14).
 *
 * 어느 양식을 편집 중인지만 여기서 쥔다 — 표가 고르고 편집기가 여닫히는 관계라 둘 중 한쪽에
 * 두면 다른 쪽이 그 사정을 알아야 한다. 초안(분류·문항·개정 사유)은 편집기가 통째로 가진다.
 */
function TemplatesDepth() {
  const [editing, setEditing] = useState<ReportTemplate | null>(null);

  return (
    <>
      <TemplateTable onEdit={setEditing} />
      <RevisionHistory />

      {/*
        고른 양식이 바뀌면 편집기를 새로 세운다.
        같은 편집기를 계속 쓰면 앞서 열었던 양식의 문항과 개정 사유가 그대로 남는다.
      */}
      {editing ? (
        <TemplateEditor key={editing.id} template={editing} onClose={() => setEditing(null)} />
      ) : null}
    </>
  );
}

export default TemplatesDepth;
