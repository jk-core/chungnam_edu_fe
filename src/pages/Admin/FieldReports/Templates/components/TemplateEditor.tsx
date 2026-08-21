import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { FormSection, TextArea, TextField } from '@/components/common/Form';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { NOW, TODAY } from '@/mocks/today';
import { PlusIcon } from '@/components/common/Icon';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useFieldReportStore from '@/stores/fieldReportStore';
import type { ReportTemplate, TemplateSection } from '@/interface/fieldReport';
import styles from '@/pages/Admin/Admin.module.scss';

interface TemplateEditorProps {
  /** 편집할 양식. 새 판은 이 판 번호에서 하나 올려 낸다 */
  template: ReportTemplate;
}

/** 빈 줄은 문항으로 세지 않는다 — 붙여 넣다 남은 줄이 문항이 되면 점검자가 헛클릭한다 */
const liveItems = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);

/**
 * 문항 편집기 (SFR-021-14).
 *
 * 고치면 **판 번호를 올려 새 판으로** 낸다 — 이미 쓰인 보고서는 자기 문항을 통째로 들고 있어
 * (`FieldReport.checklist`) 과거 보고서가 뒤늦게 바뀌는 일이 없다.
 *
 * 문항은 대분류마다 한 줄에 하나씩 적는다. 표 형태 편집기보다 옮겨 붙이기 쉽다.
 */
export function TemplateEditor({ template }: TemplateEditorProps) {
  const saveTemplate = useFieldReportStore((state) => state.saveTemplate);
  const actor = useAuthUser();
  const navigate = useNavigate();

  const backTo = listPath('field-reports', 'templates');

  const [sections, setSections] = useState<TemplateSection[]>(
    () => template.sections.map((section) => ({ ...section })),
  );
  const [note, setNote] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const nextVersion = template.version + 1;
  const itemCount = sections.reduce((sum, section) => sum + liveItems(section.items).length, 0);
  const canSave = Boolean(note.trim()) && itemCount > 0 && sections.every((section) => section.title.trim());

  const setSection = (index: number, change: Partial<TemplateSection>) => {
    setSections(sections.map((section, order) => (order === index ? { ...section, ...change } : section)));
  };

  const commit = () => {
    if (!canSave) return;

    const next: ReportTemplate = {
      ...template,
      version: nextVersion,
      revisedAt: TODAY.format('YYYY-MM-DD'),
      sections: sections
        .map((section) => ({ title: section.title.trim(), items: liveItems(section.items) }))
        .filter((section) => section.items.length > 0),
    };

    saveTemplate(next, {
      id: `TR-${NOW.format('MMDDHHmm')}-${next.id}`,
      templateId: next.id,
      templateLabel: next.label,
      version: nextVersion,
      at: NOW.format('YYYY-MM-DD HH:mm'),
      actor: actor?.name ?? '관리자',
      note: note.trim(),
    });
    toast.success(`${next.label} v${nextVersion} 판을 냈습니다.`);
    setIsConfirming(false);
    navigate(backTo);
  };

  return (
    <>
      <FormPage
        title={`${template.label} 문항 편집`}
        description={`현재 v${template.version} · 저장하면 v${nextVersion} 로 나갑니다.`}
        backTo={backTo}
        footer={(
          <>
            <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
            <Button onClick={() => setIsConfirming(true)} disabled={!canSave}>새 판으로 저장</Button>
          </>
        )}
      >
        {sections.map((section, index) => (
          <FormSection
            key={`section-${index}`}
            legend={`${index + 1}번 분류`}
            hint="문항은 한 줄에 하나씩 적습니다. 빈 줄은 무시합니다."
          >
            <TextField
              label="분류 이름"
              value={section.title}
              onChange={(value) => setSection(index, { title: value })}
              required
            />
            <TextArea
              label="문항"
              value={section.items.join('\n')}
              onChange={(value) => setSection(index, { items: value.split('\n') })}
              hint={`${liveItems(section.items).length}문항`}
            />
            <div className={styles.toolbar__actions}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSections(sections.filter((_, order) => order !== index))}
              >
                이 분류 삭제
              </Button>
            </div>
          </FormSection>
        ))}

        <div className={styles.toolbar__actions}>
          <Button
            size="sm"
            variant="secondary"
            iconLeft={<PlusIcon />}
            onClick={() => setSections([...sections, { title: '', items: [''] }])}
          >
            분류 추가
          </Button>
        </div>

        <FormSection legend="개정 사유" hint="이력에 그대로 남습니다. 무엇을 왜 고쳤는지 적어 주세요.">
          <TextArea
            label="개정 사유"
            hideLabel
            value={note}
            onChange={setNote}
            required
            placeholder="예: 태양전지 분류에 적외선 열화상 항목을 더했습니다."
            maxLength={200}
          />
        </FormSection>
      </FormPage>

      <ConfirmDialog
        isOpen={isConfirming}
        title={`${template.label} v${nextVersion} 로 낼까요?`}
        description="새 판은 지금부터 작성하는 보고서에만 적용됩니다. 이미 쓴 보고서는 그대로입니다."
        confirmLabel="새 판으로 저장"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
      />
    </>
  );
}
