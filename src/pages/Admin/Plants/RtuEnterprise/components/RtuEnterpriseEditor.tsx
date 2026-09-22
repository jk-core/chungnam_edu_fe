import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createForm, FormRow, FormSection } from '@/components/common/Form';
import { formatPhone } from '@/utils/format';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { MSG } from '@/configs/messages';
import { EMAIL_MAX } from '@/schemas/email';
import { PageSkeleton } from '@/components/common/Skeleton';
import { useRtuEnterpriseEditor } from '../hooks/useRtuEnterpriseEditor';
import { NAME_MAX, rtuEnterpriseFormSchema } from './form';
import { EMPTY_VALUES, toFormValues } from './values';
import type { RtuEnterpriseFormValues } from './form';

const Form = createForm<RtuEnterpriseFormValues>();

interface RtuEnterpriseEditorProps {
  /** 고칠 업체의 서버 식별자. 없으면 새로 세우는 자리다 */
  rtuEnterpriseId: number | null;
}

/**
 * RTU 업체 등록·수정 (SFR-016-01).
 * 폼의 기본값은 한 번만 잡히므로 고칠 값이 도착한 뒤에 세운다.
 */
export function RtuEnterpriseEditor({ rtuEnterpriseId }: RtuEnterpriseEditorProps) {
  const editor = useRtuEnterpriseEditor(rtuEnterpriseId);

  if (editor.isLoading) return <PageSkeleton />;

  return <RtuEnterpriseForm editor={editor} />;
}

function RtuEnterpriseForm({ editor }: { editor: ReturnType<typeof useRtuEnterpriseEditor> }) {
  const { target, save, remove, backTo } = editor;
  const navigate = useNavigate();
  const isNew = target === undefined;

  const methods = useForm<RtuEnterpriseFormValues>({
    defaultValues: target ? toFormValues(target) : EMPTY_VALUES,
    resolver: zodResolver(rtuEnterpriseFormSchema),
    mode: 'onChange',
  });

  // 확인창을 거쳐 저장하므로 검증을 통과한 값을 잠시 들고 있는다.
  const [pending, setPending] = useState<RtuEnterpriseFormValues | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
      <Form methods={methods} onSubmit={setPending}>
        <FormPage
          title={isNew ? 'RTU업체 등록' : 'RTU업체 수정'}
          description="발전소 등록에서 이 목록을 고릅니다. 장애가 났을 때 연락할 곳입니다."
          backTo={backTo}
          danger={isNew ? null : <Button variant="solar" onClick={() => setIsDeleting(true)}>삭제</Button>}
          footer={(
            <>
              <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
              <Form.Submit />
            </>
          )}
        >
          <FormSection legend="업체 정보">
            <FormRow cols={1}>
              <Form.Text label="업체 이름" name="rtuEnterpriseName" maxLength={NAME_MAX} required />
            </FormRow>
            <FormRow cols={2}>
              <Form.Text label="이메일" name="rtuEnterpriseEmail" ime="latin" maxLength={EMAIL_MAX} optional />
              <Form.Text
                label="전화번호"
                name="rtuEnterprisePhone"
                transform={formatPhone}
                ime="numeric"
                hint="적는 대로 하이픈이 붙습니다"
                optional
              />
            </FormRow>
          </FormSection>
        </FormPage>
      </Form>

      <ConfirmDialog
        isOpen={pending !== null}
        title={isNew ? MSG.createConfirm('RTU업체') : MSG.updateConfirm(pending?.rtuEnterpriseName ?? 'RTU업체')}
        confirmLabel="저장"
        onConfirm={() => pending && save.mutate(pending)}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        isOpen={isDeleting}
        title={MSG.deleteConfirm(target?.rtuEnterpriseName ?? 'RTU업체')}
        description="이미 이 업체로 등록된 발전소의 표기는 그대로 남습니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => remove.mutate()}
        onClose={() => setIsDeleting(false)}
      />
    </>
  );
}
