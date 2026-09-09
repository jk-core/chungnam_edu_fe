import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createForm, FormRow, FormSection } from '@/components/common/Form';
import { formatPhone } from '@/utils/format';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { MSG } from '@/configs/messages';
import {
  EMAIL_MAX,
  NAME_MAX,
  ORG_NAME_MAX,
  PASSWORD_HINT,
  SELECTABLE_USER_TYPE_CODES,
  userFormSchema,
} from '@/service/user/type';
import { ROLE_LABEL, ROLE_SCOPE_NOTE, roleFromCode } from '@/mocks/accounts';
import { toast } from '@/stores/toastStore';
import { useManagedUsers } from '@/hooks/usePlantAssets';
import { USER_TYPE } from '@/configs/codes';
import useAssetStore from '@/stores/assetStore';
import type { UserFormValues } from '@/service/user/type';
import type { ChangeLog } from '@/interface/changeLog';
import type { ManagedUser } from '@/interface/account';
import styles from '@/pages/Admin/Admin.module.scss';
import { useUserChangeLog } from '../hooks/useUserChangeLog';
import { EMPTY_VALUES, toFormValues } from './values';

/** 이력에 남길 항목 — 계정이 들고 있는 이름으로 견준다 (SFR-018-04). */
const TRACKED: { key: keyof ManagedUser; label: string }[] = [
  { key: 'loginId', label: '로그인 ID' },
  { key: 'name', label: '이름' },
  { key: 'orgName', label: '소속' },
  { key: 'email', label: '이메일' },
  { key: 'phone', label: '연락처' },
];

const Form = createForm<UserFormValues>();

interface UserEditorProps {
  /** 고칠 계정의 서버 번호. 없으면 새로 세우는 자리다 */
  userId: number | null;
}

/** 사용자 등록·수정 (SFR-018) */
export function UserEditor({ userId }: UserEditorProps) {
  const saveUser = useAssetStore((state) => state.saveUser);
  const patchUser = useAssetStore((state) => state.patchUser);
  const nextUserId = useAssetStore((state) => state.nextUserId);
  const nextUserSeq = useAssetStore((state) => state.nextUserSeq);
  const removeUser = useAssetStore((state) => state.removeUser);
  const entryOf = useUserChangeLog();
  const users = useManagedUsers();
  const navigate = useNavigate();

  const target = users.find((row) => row.userId === userId) ?? null;
  const backTo = listPath('users', 'account');
  const isNew = target === null;

  // 등록·수정에서 비밀번호 규칙이 갈린다. 폼이 사는 동안 바뀌지 않는 값이라 스키마를 지어 쓴다.
  const schema = useMemo(() => userFormSchema(isNew), [isNew]);
  const methods = useForm<UserFormValues>({
    defaultValues: target ? toFormValues(target) : EMPTY_VALUES,
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const [pending, setPending] = useState<UserFormValues | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const userTypeCode = useWatch({ control: methods.control, name: 'userTypeCode' });

  const commit = (values: UserFormValues) => {
    const saved: ManagedUser = {
      id: target?.id ?? nextUserId(),
      userId: target?.userId ?? nextUserSeq(),
      loginId: values.loginId,
      name: values.userName,
      role: roleFromCode(values.userTypeCode),
      orgName: values.orgName.trim(),
      email: values.email,
      phone: values.cellPhone.trim(),
      plantIds: target?.plantIds ?? [],
      lastLoginAt: target?.lastLoginAt ?? null,
      locked: target?.locked ?? false,
    };

    // 신규는 한 줄로, 수정은 실제로 달라진 항목만 남긴다 (SFR-018-04).
    const entries: ChangeLog[] = isNew
      ? [entryOf(saved, '신규 등록', '—', `${ROLE_LABEL[saved.role]} · ${saved.loginId}`)]
      : [
        ...TRACKED.flatMap(({ key, label }) => {
          const before = String(target?.[key] ?? '');
          const after = String(saved[key] ?? '');

          return before === after ? [] : [entryOf(saved, label, before || '—', after || '—')];
        }),
        ...(target && target.role !== saved.role
          ? [entryOf(saved, '등급', ROLE_LABEL[target.role], ROLE_LABEL[saved.role])]
          : []),
      ];

    saveUser(saved, entries);
    toast.success(isNew ? MSG.createSuccess('사용자') : MSG.updateSuccess(saved.name));
    navigate(backTo);
  };

  const unlock = () => {
    if (!target) return;

    patchUser(target.id, { locked: false }, [entryOf(target, '계정 잠금', '잠김', '해제')]);
    toast.success(`${target.name} 계정 잠금을 풀었습니다.`);
  };

  const remove = () => {
    if (!target) return;

    removeUser(target.id, entryOf(target, '삭제', `${ROLE_LABEL[target.role]} · ${target.loginId}`, '—'));
    toast.success(MSG.deleteSuccess(target.name));
    navigate(backTo);
  };

  return (
    <>
      <Form methods={methods} onSubmit={setPending}>
        <FormPage
          title={isNew ? '사용자 등록' : '사용자 수정'}
          description="등급에 따라 볼 수 있는 발전소와 메뉴가 달라집니다."
          backTo={backTo}
          danger={isNew ? null : <Button variant="solar" onClick={() => setIsDeleting(true)}>삭제</Button>}
          footer={(
            <>
              <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
              <Form.Submit />
            </>
          )}
        >
          <FormSection legend="기본 정보">
            <FormRow cols={2}>
              <Form.Text label="이름" name="userName" maxLength={NAME_MAX} required />
              <Form.Text label="소속" name="orgName" maxLength={ORG_NAME_MAX} optional />
            </FormRow>
            <FormRow cols={2}>
              <Form.Text label="이메일" name="email" ime="latin" maxLength={EMAIL_MAX} optional />
              <Form.Text
                label="연락처"
                name="cellPhone"
                transform={formatPhone}
                ime="numeric"
                hint="적는 대로 하이픈이 붙습니다"
                optional
              />
            </FormRow>
          </FormSection>

          <FormSection
            legend="로그인 정보"
            hint={isNew
              ? '로그인 ID 로 접속합니다. 등록 후에는 담당자가 직접 비밀번호를 바꿀 수 있습니다.'
              : '비밀번호를 비워 두면 기존 비밀번호를 그대로 둡니다.'}
          >
            <FormRow cols={2}>
              <Form.Text label="로그인 ID" name="loginId" ime="latin" hint="영문·숫자·밑줄 4~20자" required />
              <Form.Password
                label="비밀번호"
                name="password"
                width="full"
                hint={isNew ? PASSWORD_HINT : `바꿀 때만 입력 · ${PASSWORD_HINT}`}
                required={isNew}
              />
            </FormRow>
            <FormRow cols={2}>
              <Form.Password
                label="비밀번호 확인"
                name="passwordConfirm"
                width="full"
                hint="확인용이라 저장되지 않습니다"
                required={isNew}
              />
            </FormRow>
          </FormSection>

          {target?.locked ? (
            <FormSection legend="계정 잠금" hint="로그인 실패가 누적돼 잠긴 계정입니다. 풀어 주면 바로 다시 접속합니다.">
              <Button variant="secondary" className={styles.sectionAction} onClick={unlock}>잠금 해제</Button>
            </FormSection>
          ) : null}

          <FormSection legend="등급" hint={ROLE_SCOPE_NOTE[roleFromCode(userTypeCode)]}>
            <Form.Radio
              label="사용자 등급"
              name="userTypeCode"
              options={SELECTABLE_USER_TYPE_CODES.map((code) => ({
                value: code,
                label: USER_TYPE.NAME[code],
              }))}
              required
            />
          </FormSection>
        </FormPage>
      </Form>

      <ConfirmDialog
        isOpen={pending !== null}
        title={isNew ? MSG.createConfirm('사용자') : MSG.updateConfirm(pending?.userName ?? '사용자')}
        confirmLabel="저장"
        onConfirm={() => pending && commit(pending)}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        isOpen={isDeleting}
        title={MSG.deleteConfirm(target?.name ?? '사용자')}
        description="삭제해도 접속 로그에는 과거 기록이 남습니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setIsDeleting(false)}
      />
    </>
  );
}
