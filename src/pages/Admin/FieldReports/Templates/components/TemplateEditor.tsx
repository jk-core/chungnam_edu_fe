import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
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
import type { ReportTemplate } from '@/interface/fieldReport';
import styles from '@/pages/Admin/Admin.module.scss';
import { CHECK_NAME_MAX, LABEL_MAX, REVISION_NOTE_MAX, templateFormSchema } from './form';
import { EMPTY_VALUES, hasChange, toCheckNameList, toFormValues } from './values';
import type { TemplateFormValues } from './form';

const INSPECT_TYPES = [
  { value: '정기점검' as const, label: '정기점검' },
  { value: '특별점검' as const, label: '특별점검' },
];

const Form = createForm<TemplateFormValues>();

interface TemplateEditorProps {
  /** 고칠 양식. 없으면 새로 세우는 자리다 */
  template: ReportTemplate | null;
}

/**
 * 점검 양식 등록·수정 (SFR-021-14/19).
 *
 * **어느 칸이든 고치면** 버전 번호를 올려 새 버전으로 낸다 — 이미 쓰인 보고서는 자기 문항을
 * 통째로 들고 있어 (`FieldReport.checklist`) 과거 보고서가 뒤늦게 바뀌는 일이 없다.
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
      templateFormSchema(isNew, template === null || hasChange(data, template)),
    )(data, context, options),
    mode: 'onChange',
  });
  const { fields, append, remove } = useFieldArray<TemplateFormValues, 'checkList'>({
    control: methods.control,
    name: 'checkList',
  });
  // 한 칸이라도 고쳤는지 보아야 하므로 개정 사유를 뺀 나머지를 모두 구독한다.
  const [templateName, reportTypeName, targetTypeName, startDate, endDate, checkList] = useWatch({
    control: methods.control,
    name: ['templateName', 'reportTypeName', 'targetTypeName', 'startDate', 'endDate', 'checkList'],
  });

  // 고친 것이 없으면 낼 새 버전이 없다 — 저장 자체가 막히고 개정 사유도 그때만 받는다.
  const isRevising = template === null
    || hasChange({ templateName, reportTypeName, targetTypeName, startDate, endDate, checkList }, template);
  const nextVersion = (template?.version ?? 0) + 1;

  const commit = (input: TemplateFormValues) => {
    const saved: ReportTemplate = {
      id: template?.id ?? nextTemplateId(),
      inspectType: input.reportTypeName === '특별점검' ? '특별' : '정기',
      targetType: input.targetTypeName,
      label: input.templateName.trim(),
      version: nextVersion,
      revisedAt: TODAY.format('YYYY-MM-DD'),
      startDate: input.startDate,
      dueDate: input.endDate,
      items: toCheckNameList(input.checkList),
    };

    saveTemplate(saved, {
      id: `TR-${NOW.format('MMDDHHmm')}-${saved.id}`,
      templateId: saved.id,
      templateLabel: saved.label,
      version: nextVersion,
      at: NOW.format('YYYY-MM-DD HH:mm'),
      actor: actor?.name ?? '관리자',
      note: isNew ? '새 양식을 등록했습니다.' : input.fixRemark.trim(),
    }, isNew);

    toast.success(`${saved.label} v${nextVersion} 버전을 냈습니다.`);
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
            ? '저장하면 v1 버전으로 나갑니다. 이후 어느 칸이든 고칠 때마다 버전 번호가 오릅니다.'
            : isRevising
              ? `현재 v${template.version} · 저장하면 v${nextVersion} 로 나갑니다.`
              : `현재 v${template.version} · 고친 내용이 없어 낼 버전이 없습니다.`}
          backTo={backTo}
          danger={isNew ? null : <Button variant="solar" onClick={() => setIsDeleting(true)}>삭제</Button>}
          footer={(
            <>
              <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
              <Form.Submit disabled={!isRevising}>{isNew ? '등록' : '새 버전으로 저장'}</Form.Submit>
            </>
          )}
        >
          <FormSection legend="양식 정보" hint="점검자가 보고서를 쓸 때 이 이름으로 고릅니다.">
            <FormRow cols={2}>
              <Form.Text
                label="양식명"
                name="templateName"
                placeholder="예: 자가용 태양광 설비 안전점검 체크리스트"
                maxLength={LABEL_MAX}
                required
              />
              <Form.Select
                label="점검 대상"
                name="targetTypeName"
                hint="이 양식이 겨눈 설비입니다. 작성자가 바꿀 수 있습니다."
                options={INSPECTION_TARGET_OPTIONS.map((item) => ({ value: item, label: item }))}
              />
            </FormRow>
            <Form.Radio label="점검 유형" name="reportTypeName" options={INSPECT_TYPES} inline required />
          </FormSection>

          <FormSection
            legend="점검 기간"
            hint="이번 회차를 언제까지 내는지입니다. 다음 회차를 열 때는 문항을 그대로 두고 이 두 날짜만 고칩니다."
          >
            <FormRow cols={2}>
              <Form.Date label="시작일" name="startDate" required />
              <Form.Date label="마감기한" name="endDate" required />
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
                    name={`checkList.${index}.checkName`}
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
              <p className={styles.toolbar__note}>{toCheckNameList(checkList).length}문항</p>
              <Button variant="secondary" iconLeft={<PlusIcon />} onClick={() => append({ checkName: '' })}>
                문항 추가
              </Button>
            </div>
          </FormSection>

          {/* 새 양식에는 되돌아볼 앞 버전이 없고, 고친 것이 없으면 낼 버전 자체가 없다. */}
          {isNew || !isRevising ? null : (
            <FormSection legend="개정 사유" hint="이력에 그대로 남습니다. 무엇을 왜 고쳤는지 적어 주세요.">
              <Form.Area
                label="개정 사유"
                name="fixRemark"
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
          : `${template?.label ?? '양식'} v${nextVersion} 로 낼까요?`}
        description="새 버전은 지금부터 작성하는 보고서에만 적용됩니다. 이미 쓴 보고서는 그대로입니다."
        confirmLabel={isNew ? '등록' : '새 버전으로 저장'}
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
