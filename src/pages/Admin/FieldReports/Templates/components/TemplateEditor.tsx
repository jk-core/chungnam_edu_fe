import { useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createForm, FormRow, FormSection } from '@/components/common/Form';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { INSPECTION_TARGET_OPTIONS } from '@/mocks/fieldReport';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { LABEL_MAX, REVISION_NOTE_MAX, SECTION_TITLE_MAX, templateFormSchema } from '@/service/inspectionReport/type';
import { MSG } from '@/configs/messages';
import { NOW, TODAY } from '@/mocks/today';
import { PlusIcon } from '@/components/common/Icon';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useFieldReportStore from '@/stores/fieldReportStore';
import type { TemplateFormValues } from '@/service/inspectionReport/type';
import type { ReportTemplate } from '@/interface/fieldReport';
import styles from '@/pages/Admin/Admin.module.scss';
import { EMPTY_VALUES, toFormValues, toSections } from './values';

const INSPECT_TYPES = [
  { value: '정기' as const, label: '정기점검' },
  { value: '특별' as const, label: '특별점검' },
];

const Form = createForm<TemplateFormValues>();

interface TemplateEditorProps {
  /** 고칠 양식. 없으면 새로 세우는 자리다 */
  template: ReportTemplate | null;
}

/**
 * 점검 양식 등록·수정 (SFR-021-14).
 *
 * 고치면 **판 번호를 올려 새 판으로** 낸다 — 이미 쓰인 보고서는 자기 문항을 통째로 들고 있어
 * (`FieldReport.checklist`) 과거 보고서가 뒤늦게 바뀌는 일이 없다.
 *
 * 문항은 대분류마다 한 줄에 하나씩 적는다. 표 형태 편집기보다 옮겨 붙이기 쉽다.
 */
export function TemplateEditor({ template }: TemplateEditorProps) {
  const saveTemplate = useFieldReportStore((state) => state.saveTemplate);
  const removeTemplate = useFieldReportStore((state) => state.removeTemplate);
  const nextTemplateId = useFieldReportStore((state) => state.nextTemplateId);
  const actor = useAuthUser();
  const navigate = useNavigate();

  const backTo = listPath('field-reports', 'templates');
  const isNew = template === null;
  const nextVersion = (template?.version ?? 0) + 1;

  const schema = useMemo(() => templateFormSchema(isNew), [isNew]);
  const methods = useForm<TemplateFormValues>({
    defaultValues: template ? toFormValues(template) : EMPTY_VALUES,
    resolver: zodResolver(schema),
    mode: 'onChange',
  });
  const { fields, append, remove } = useFieldArray<TemplateFormValues, 'sections'>({
    control: methods.control,
    name: 'sections',
  });
  const sections = useWatch({ control: methods.control, name: 'sections' });

  const [pending, setPending] = useState<TemplateFormValues | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const commit = (values: TemplateFormValues) => {
    const saved: ReportTemplate = {
      id: template?.id ?? nextTemplateId(),
      inspectType: values.inspectType,
      targetType: values.targetType,
      label: values.label.trim(),
      version: nextVersion,
      revisedAt: TODAY.format('YYYY-MM-DD'),
      sections: toSections(values),
    };

    saveTemplate(saved, {
      id: `TR-${NOW.format('MMDDHHmm')}-${saved.id}`,
      templateId: saved.id,
      templateLabel: saved.label,
      version: nextVersion,
      at: NOW.format('YYYY-MM-DD HH:mm'),
      actor: actor?.name ?? '관리자',
      note: isNew ? '새 양식을 등록했습니다.' : values.note.trim(),
    }, isNew);

    toast.success(`${saved.label} v${nextVersion} 판을 냈습니다.`);
    setPending(null);
    navigate(backTo);
  };

  const removeIt = () => {
    if (!template) return;

    removeTemplate(template.id);
    toast.success(MSG.deleteSuccess(template.label));
    navigate(backTo);
  };

  return (
    <>
      <Form methods={methods} onSubmit={setPending}>
        <FormPage
          title={isNew ? '점검 양식 등록' : `${template.label} 문항 편집`}
          description={isNew
            ? '저장하면 v1 판으로 나갑니다. 이후 고칠 때마다 판 번호가 오릅니다.'
            : `현재 v${template.version} · 저장하면 v${nextVersion} 로 나갑니다.`}
          backTo={backTo}
          danger={isNew ? null : <Button variant="solar" onClick={() => setIsDeleting(true)}>삭제</Button>}
          footer={(
            <>
              <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
              <Form.Submit>{isNew ? '등록' : '새 판으로 저장'}</Form.Submit>
            </>
          )}
        >
          <FormSection legend="양식 정보" hint="점검자가 보고서를 쓸 때 이 이름으로 고릅니다.">
            <FormRow cols={2}>
              <Form.Text
                label="양식명"
                name="label"
                placeholder="예: 자가용 태양광 설비 안전점검 체크리스트"
                maxLength={LABEL_MAX}
                required
              />
              <Form.Select
                label="점검 대상"
                name="targetType"
                hint="이 양식이 겨눈 설비입니다. 작성자가 바꿀 수 있습니다."
                options={INSPECTION_TARGET_OPTIONS.map((item) => ({ value: item, label: item }))}
              />
            </FormRow>
            <Form.Radio label="점검 유형" name="inspectType" options={INSPECT_TYPES} inline required />
          </FormSection>

          {fields.map((field, index) => (
            <FormSection
              key={field.id}
              legend={`${index + 1}번 분류`}
              hint="문항은 한 줄에 하나씩 적습니다. 빈 줄은 무시합니다."
            >
              <Form.Text
                label="분류 이름"
                name={`sections.${index}.title`}
                maxLength={SECTION_TITLE_MAX}
                required
              />
              <Form.Area
                label="문항"
                name={`sections.${index}.items`}
                hint={`${(sections?.[index]?.items ?? '').split('\n').filter((item) => item.trim()).length}문항`}
                required
              />
              {fields.length > 1 ? (
                <div className={styles.toolbar__actions}>
                  <Button size="sm" variant="ghost" onClick={() => remove(index)}>이 분류 삭제</Button>
                </div>
              ) : null}
            </FormSection>
          ))}

          <div className={styles.toolbar__actions}>
            <Button
              size="sm"
              variant="secondary"
              iconLeft={<PlusIcon />}
              onClick={() => append({ title: '', items: '' })}
            >
              분류 추가
            </Button>
          </div>

          {/* 새 양식에는 되돌아볼 앞 판이 없어 사유를 받지 않는다. */}
          {isNew ? null : (
            <FormSection legend="개정 사유" hint="이력에 그대로 남습니다. 무엇을 왜 고쳤는지 적어 주세요.">
              <Form.Area
                label="개정 사유"
                name="note"
                placeholder="예: 태양전지 분류에 적외선 열화상 항목을 더했습니다."
                maxLength={REVISION_NOTE_MAX}
                required
              />
            </FormSection>
          )}
        </FormPage>
      </Form>

      <ConfirmDialog
        isOpen={pending !== null}
        title={isNew
          ? MSG.createConfirm('점검 양식')
          : `${template?.label ?? '양식'} v${nextVersion} 로 낼까요?`}
        description="새 판은 지금부터 작성하는 보고서에만 적용됩니다. 이미 쓴 보고서는 그대로입니다."
        confirmLabel={isNew ? '등록' : '새 판으로 저장'}
        onConfirm={() => pending && commit(pending)}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        isOpen={isDeleting}
        title={MSG.deleteConfirm(template?.label ?? '점검 양식')}
        description="이미 이 양식으로 쓴 보고서는 자기 문항을 그대로 들고 있어 바뀌지 않습니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={removeIt}
        onClose={() => setIsDeleting(false)}
      />
    </>
  );
}
