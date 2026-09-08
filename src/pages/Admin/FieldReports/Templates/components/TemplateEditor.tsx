import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { CHECK_NAME_MAX, LABEL_MAX, REVISION_NOTE_MAX, templateFormSchema } from '@/service/inspectionReport/type';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createForm, FormRow, FormSection } from '@/components/common/Form';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { INSPECTION_TARGET_OPTIONS } from '@/mocks/fieldReport';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { MSG } from '@/configs/messages';
import { NOW, TODAY } from '@/mocks/today';
import { PlusIcon } from '@/components/common/Icon';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useFieldReportStore from '@/stores/fieldReportStore';
import type { TemplateFormValues } from '@/service/inspectionReport/type';
import type { ReportTemplate } from '@/interface/fieldReport';
import styles from '@/pages/Admin/Admin.module.scss';
import { EMPTY_VALUES, hasItemChange, toFormValues, toItems } from './values';

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
 * 점검 양식 등록·수정 (SFR-021-14/19).
 *
 * **문항을 고치면** 판 번호를 올려 새 판으로 낸다 — 이미 쓰인 보고서는 자기 문항을 통째로 들고
 * 있어 (`FieldReport.checklist`) 과거 보고서가 뒤늦게 바뀌는 일이 없다.
 *
 * **기간만 고치면 판은 그대로다.** 다음 회차를 여는 일이지 양식을 고친 일이 아니라서,
 * 판을 올리면 개정 이력이 「문항은 그대로인데 v5」로 채워져 무엇이 바뀌었는지 못 읽게 된다.
 *
 * 문항은 한 행에 하나씩 적는다 — 행마다 오류가 따로 붙고 빼기·추가가 그 자리에서 된다.
 */
export function TemplateEditor({ template }: TemplateEditorProps) {
  const saveTemplate = useFieldReportStore((state) => state.saveTemplate);
  const removeTemplate = useFieldReportStore((state) => state.removeTemplate);
  const nextTemplateId = useFieldReportStore((state) => state.nextTemplateId);
  const actor = useAuthUser();
  const navigate = useNavigate();

  const backTo = listPath('field-reports', 'templates');
  const isNew = template === null;

  const [pending, setPending] = useState<TemplateFormValues | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const methods = useForm<TemplateFormValues>({
    defaultValues: template ? toFormValues(template) : EMPTY_VALUES,
    /*
      개정 사유를 받을지는 적는 도중에 갈린다 — 문항을 되돌려 놓으면 다시 안 받아야 한다.
      스키마를 밖에서 만들어 두면 그 판정을 못 하므로 검증 때마다 지금 값으로 세운다.
    */
    resolver: (data, context, options) => zodResolver(
      templateFormSchema(isNew, template === null || hasItemChange(data.items, template)),
    )(data, context, options),
    mode: 'onChange',
  });
  const { fields, append, remove } = useFieldArray<TemplateFormValues, 'items'>({
    control: methods.control,
    name: 'items',
  });
  const items = useWatch({ control: methods.control, name: 'items' });

  // 문항이 그대로면 낼 새 판이 없다 — 판 번호도 개정 사유도 그때만 걸린다.
  const isRevising = template === null || hasItemChange(items, template);
  const nextVersion = (template?.version ?? 0) + (isRevising ? 1 : 0);

  const commit = (input: TemplateFormValues) => {
    const saved: ReportTemplate = {
      id: template?.id ?? nextTemplateId(),
      inspectType: input.inspectType,
      targetType: input.targetType,
      label: input.label.trim(),
      version: nextVersion,
      revisedAt: isRevising ? TODAY.format('YYYY-MM-DD') : template?.revisedAt ?? TODAY.format('YYYY-MM-DD'),
      startDate: input.startDate,
      dueDate: input.dueDate,
      items: toItems(input.items),
    };

    // 기간만 고쳤으면 이력에 남길 개정이 없다.
    saveTemplate(saved, isRevising ? {
      id: `TR-${NOW.format('MMDDHHmm')}-${saved.id}`,
      templateId: saved.id,
      templateLabel: saved.label,
      version: nextVersion,
      at: NOW.format('YYYY-MM-DD HH:mm'),
      actor: actor?.name ?? '관리자',
      note: isNew ? '새 양식을 등록했습니다.' : input.note.trim(),
    } : null, isNew);

    toast.success(isRevising
      ? `${saved.label} v${nextVersion} 판을 냈습니다.`
      : `${saved.label} 점검 기간을 ${saved.dueDate} 까지로 고쳤습니다.`);
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
          title={isNew ? '점검 양식 등록' : `${template.label} 편집`}
          description={isNew
            ? '저장하면 v1 판으로 나갑니다. 이후 문항을 고칠 때마다 판 번호가 오릅니다.'
            : isRevising
              ? `현재 v${template.version} · 문항이 바뀌어 저장하면 v${nextVersion} 로 나갑니다.`
              : `현재 v${template.version} · 기간만 고치면 판은 그대로입니다.`}
          backTo={backTo}
          danger={isNew ? null : <Button variant="solar" onClick={() => setIsDeleting(true)}>삭제</Button>}
          footer={(
            <>
              <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
              <Form.Submit>{isNew ? '등록' : isRevising ? '새 판으로 저장' : '저장'}</Form.Submit>
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

          <FormSection
            legend="점검 기간"
            hint="이번 회차를 언제까지 내는지입니다. 다음 회차를 열 때는 문항을 그대로 두고 이 두 날짜만 고칩니다."
          >
            <FormRow cols={2}>
              <Form.Date label="시작일" name="startDate" required />
              <Form.Date label="마감기한" name="dueDate" required />
            </FormRow>
          </FormSection>

          <FormSection legend="점검 문항" hint="점검자가 보고서에서 이 차례대로 답합니다.">
            <div className={styles.checkList}>
              {fields.map((field, index) => (
                <div key={field.id} className={styles.checkRow}>
                  <span className={styles.checkRow__no}>{index + 1}</span>
                  <Form.Text
                    label={`${index + 1}번 문항`}
                    hideLabel
                    name={`items.${index}.label`}
                    maxLength={CHECK_NAME_MAX}
                    required
                  />
                  {fields.length > 1 ? (
                    <Button size="sm" variant="ghost" onClick={() => remove(index)}>빼기</Button>
                  ) : null}
                </div>
              ))}
            </div>

            <div className={styles.rowFoot}>
              <p className={styles.toolbar__note}>{toItems(items).length}문항</p>
              <Button variant="secondary" iconLeft={<PlusIcon />} onClick={() => append({ label: '' })}>
                문항 추가
              </Button>
            </div>
          </FormSection>

          {/* 새 양식에는 되돌아볼 앞 판이 없고, 기간만 고친 것은 남길 개정이 아니다. */}
          {isNew || !isRevising ? null : (
            <FormSection legend="개정 사유" hint="이력에 그대로 남습니다. 무엇을 왜 고쳤는지 적어 주세요.">
              <Form.Area
                label="개정 사유"
                name="note"
                placeholder="예: 적외선 열화상 점검 문항을 더했습니다."
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
          : isRevising
            ? `${template?.label ?? '양식'} v${nextVersion} 로 낼까요?`
            : `${template?.label ?? '양식'} 점검 기간을 고칠까요?`}
        description={isRevising
          ? '새 판은 지금부터 작성하는 보고서에만 적용됩니다. 이미 쓴 보고서는 그대로입니다.'
          : '문항은 그대로 두고 기간만 바꿉니다. 판 번호와 개정 이력은 움직이지 않습니다.'}
        confirmLabel={isNew ? '등록' : isRevising ? '새 판으로 저장' : '저장'}
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
