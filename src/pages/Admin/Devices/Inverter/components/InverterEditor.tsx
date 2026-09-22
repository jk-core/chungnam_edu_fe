import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createForm, FormRow, FormSection } from '@/components/common/Form';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { INVERTER_TYPE, PHASE_TYPE } from '@/configs/codes';
import { MSG } from '@/configs/messages';
import { PageSkeleton } from '@/components/common/Skeleton';
import { useInverterEditor } from '../hooks/useInverterEditor';
import { CAPACITY_MAX, CAPACITY_MIN, ENTERPRISE_NAME_MAX, inverterFormSchema, NAME_MAX } from './form';
import { EMPTY_VALUES, toFormValues } from './values';
import type { InverterFormValues } from './form';

const Form = createForm<InverterFormValues>();

interface InverterEditorProps {
  /** 고칠 제품의 서버 식별자. 없으면 새로 세우는 자리다 */
  inverterId: number | null;
}

/** 인버터 제품 등록·수정 (SFR-017-04) */
export function InverterEditor({ inverterId }: InverterEditorProps) {
  const editor = useInverterEditor(inverterId);

  if (editor.isLoading) return <PageSkeleton />;

  return <InverterForm editor={editor} />;
}

function InverterForm({ editor }: { editor: ReturnType<typeof useInverterEditor> }) {
  const { target, save, remove, backTo } = editor;
  const navigate = useNavigate();
  const isNew = target === undefined;

  const methods = useForm<InverterFormValues>({
    defaultValues: target ? toFormValues(target) : EMPTY_VALUES,
    resolver: zodResolver(inverterFormSchema),
    mode: 'onChange',
  });

  // 확인창을 거쳐 저장하므로 검증을 통과한 값을 잠시 들고 있는다.
  const [pending, setPending] = useState<InverterFormValues | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
      <Form methods={methods} onSubmit={setPending}>
        <FormPage
          title={isNew ? '인버터 제품 등록' : '인버터 제품 수정'}
          description="여기 등록한 제품을 설비 등록에서 골라 씁니다."
          backTo={backTo}
          danger={isNew ? null : <Button variant="solar" onClick={() => setIsDeleting(true)}>삭제</Button>}
          footer={(
            <>
              <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
              <Form.Submit />
            </>
          )}
        >
          <FormSection legend="제품 정보">
            <FormRow cols={2}>
              <Form.Text label="업체 이름" name="inverterEnterpriseName" maxLength={ENTERPRISE_NAME_MAX} required />
              <Form.Text label="인버터 이름" name="inverterName" maxLength={NAME_MAX} ime="latin" required />
            </FormRow>
            <FormRow cols={2}>
              <Form.Number
                label="인버터 용량"
                name="inverterCapacity"
                min={CAPACITY_MIN}
                max={CAPACITY_MAX}
                step={0.1}
                unit="kW"
                placeholder={`${CAPACITY_MIN} ~ ${CAPACITY_MAX}`}
                required
              />
              <Form.Select
                label="인버터 타입"
                name="inverterTypeCode"
                options={Object.entries(INVERTER_TYPE.NAME)
                  .map(([code, label]) => ({ value: Number(code), label }))}
              />
            </FormRow>
            <Form.Radio
              label="위상 종류"
              name="phaseTypeCode"
              options={[
                { value: PHASE_TYPE.CODE.단상, label: '단상' },
                { value: PHASE_TYPE.CODE.삼상, label: '삼상' },
              ]}
              required
            />
          </FormSection>
        </FormPage>
      </Form>

      <ConfirmDialog
        isOpen={pending !== null}
        title={isNew ? MSG.createConfirm('인버터 제품') : MSG.updateConfirm(pending?.inverterName ?? '인버터 제품')}
        confirmLabel="저장"
        onConfirm={() => pending && save.mutate(pending)}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        isOpen={isDeleting}
        title={MSG.deleteConfirm(target?.inverterName ?? '인버터 제품')}
        description="이 제품을 쓰는 설비가 있으면 그 설비의 인버터를 다시 골라야 합니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => remove.mutate()}
        onClose={() => setIsDeleting(false)}
      />
    </>
  );
}
