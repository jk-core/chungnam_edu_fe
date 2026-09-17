import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createdEntry, deletedEntry, diffEntries } from '@/pages/Admin/_shared/changeLog';
import { createForm, FormRow, FormSection } from '@/components/common/Form';
import { formatPhone } from '@/utils/format';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { MSG } from '@/configs/messages';
import { EMAIL_MAX } from '@/schemas/email';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useEquipmentStore from '@/stores/equipmentStore';
import type { RtuEnterprise } from '@/interface/deviceMaster';
import { useRtuEnterpriseRows } from '../hooks/useRtuEnterpriseRows';
import { NAME_MAX, rtuEnterpriseFormSchema } from './form';
import { EMPTY_VALUES, toFormValues } from './values';
import type { RtuEnterpriseFormValues } from './form';

const Form = createForm<RtuEnterpriseFormValues>();

interface RtuEnterpriseEditorProps {
  /** 고칠 업체의 서버 식별자. 없으면 새로 세우는 자리다 */
  rtuEnterpriseId: number | null;
}

/** RTU 업체 등록·수정 (SFR-016-01) */
export function RtuEnterpriseEditor({ rtuEnterpriseId }: RtuEnterpriseEditorProps) {
  const saveRtuEnterprise = useEquipmentStore((state) => state.saveRtuEnterprise);
  const removeRtuEnterprise = useEquipmentStore((state) => state.removeRtuEnterprise);
  const nextId = useEquipmentStore((state) => state.nextId);
  const nextSeq = useEquipmentStore((state) => state.nextSeq);
  const actor = useAuthUser();
  const rows = useRtuEnterpriseRows();
  const navigate = useNavigate();

  const target = rows.find((row) => row.rtuEnterpriseId === rtuEnterpriseId) ?? null;
  const backTo = listPath('plants', 'rtu-enterprise');
  const isNew = target === null;

  const methods = useForm<RtuEnterpriseFormValues>({
    defaultValues: target ? toFormValues(target) : EMPTY_VALUES,
    resolver: zodResolver(rtuEnterpriseFormSchema),
    mode: 'onChange',
  });

  const [pending, setPending] = useState<RtuEnterpriseFormValues | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const commit = (values: RtuEnterpriseFormValues) => {
    const saved: RtuEnterprise = {
      id: target?.id ?? nextId('RTUENT'),
      rtuEnterpriseId: target?.rtuEnterpriseId ?? nextSeq(),
      name: values.rtuEnterpriseName,
      email: values.rtuEnterpriseEmail,
      phone: values.rtuEnterprisePhone.trim(),
    };
    const logTarget = {
      targetType: 'rtuEnterprise' as const,
      id: saved.id,
      name: saved.name,
      actor: actor?.name ?? '관리자',
    };

    const entries = isNew
      ? createdEntry(logTarget, [saved.email, saved.phone].filter(Boolean).join(' · ') || saved.name)
      : diffEntries(logTarget, [
        { label: '업체 이름', before: target?.name ?? '', after: saved.name },
        { label: '이메일', before: target?.email ?? '', after: saved.email },
        { label: '전화번호', before: target?.phone ?? '', after: saved.phone },
      ]);

    saveRtuEnterprise(saved, entries, isNew);
    toast.success(isNew ? MSG.createSuccess('RTU업체') : MSG.updateSuccess(saved.name));
    navigate(backTo);
  };

  const remove = () => {
    if (!target) return;

    removeRtuEnterprise(target.id, deletedEntry(
      { targetType: 'rtuEnterprise', id: target.id, name: target.name, actor: actor?.name ?? '관리자' },
      [target.email, target.phone].filter(Boolean).join(' · ') || target.name,
    ));
    toast.success(MSG.deleteSuccess(target.name));
    navigate(backTo);
  };

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
        onConfirm={() => pending && commit(pending)}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        isOpen={isDeleting}
        title={MSG.deleteConfirm(target?.name ?? 'RTU업체')}
        description="이미 이 업체로 등록된 발전소의 표기는 그대로 남습니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setIsDeleting(false)}
      />
    </>
  );
}
