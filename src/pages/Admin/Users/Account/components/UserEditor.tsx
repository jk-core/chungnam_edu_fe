import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { FormRow, FormSection, PasswordField, RadioGroup, TextField } from '@/components/common/Form';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { MSG } from '@/configs/messages';
import { useManagedUsers } from '@/pages/Admin/Plants/Equipment/hooks/useEquipmentPickers';
import { ROLE_LABEL } from '@/mocks/accounts';
import { toast } from '@/stores/toastStore';
import useAssetStore from '@/stores/assetStore';
import type { ManagedUser, Role, UserChange } from '@/interface/account';
import { formatPhone } from '@/utils/format';
import { useUserChangeLog } from '../hooks/useUserChangeLog';
import { draftOf, EMAIL, EMAIL_MAX, LOGIN_ID, NAME_MAX, PASSWORD_RULE, TRACKED } from './userFields';
import type { UserDraft } from './userFields';

interface UserEditorProps {
  /** 고칠 계정의 서버 번호. 없으면 새로 세우는 자리다 */
  userId: number | null;
}

/** 사용자 등록·수정 (SFR-018) */
export function UserEditor({ userId }: UserEditorProps) {
  const saveUser = useAssetStore((state) => state.saveUser);
  const nextUserId = useAssetStore((state) => state.nextUserId);
  const nextUserSeq = useAssetStore((state) => state.nextUserSeq);
  const removeUser = useAssetStore((state) => state.removeUser);
  const entryOf = useUserChangeLog();
  const users = useManagedUsers();
  const navigate = useNavigate();

  const target = users.find((row) => row.userId === userId) ?? null;
  const backTo = listPath('users', 'account');

  const [draft, setDraft] = useState<UserDraft>(() => draftOf(target));
  const [error, setError] = useState<string | undefined>(undefined);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isNew = target === null;

  const change = (next: Partial<UserDraft>) => setDraft({ ...draft, ...next });

  const submit = () => {
    if (!draft.name.trim() || !draft.loginId.trim()) {
      setError(MSG.requiredMissing);

      return;
    }

    if (!LOGIN_ID.test(draft.loginId.trim())) {
      setError('로그인 ID 는 영문·숫자·밑줄 4~20자로 넣어 주세요.');

      return;
    }

    // 이메일은 선택이지만, 적었다면 형식은 맞아야 한다.
    if (draft.email.trim() && !EMAIL.test(draft.email.trim())) {
      setError('이메일 형식이 올바르지 않습니다.');

      return;
    }

    // 새 계정은 비밀번호가 있어야 하고, 수정은 비워 두면 기존 것을 그대로 쓴다.
    if ((isNew || draft.password) && !PASSWORD_RULE.test(draft.password)) {
      setError('비밀번호는 영문·숫자·특수문자를 섞어 8~20자로 넣어 주세요.');

      return;
    }

    if (draft.password !== draft.passwordConfirm) {
      setError('비밀번호가 서로 다릅니다.');

      return;
    }

    setError(undefined);
    setIsConfirming(true);
  };

  const commit = () => {
    const saved: ManagedUser = {
      id: target?.id ?? nextUserId(),
      userId: target?.userId ?? nextUserSeq(),
      loginId: draft.loginId.trim(),
      name: draft.name.trim(),
      role: draft.role,
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      plantIds: target?.plantIds ?? [],
      lastLoginAt: target?.lastLoginAt ?? null,
      locked: target?.locked ?? false,
    };

    // 신규는 한 줄로, 수정은 실제로 달라진 항목만 남긴다 (SFR-018-04).
    const entries: UserChange[] = isNew
      ? [entryOf(saved, '신규 등록', '—', `${ROLE_LABEL[saved.role]} · ${saved.loginId}`)]
      : TRACKED.flatMap(({ key, label }, index) => {
        const before = String(target?.[key] ?? '');
        const after = String(saved[key] ?? '');

        if (before === after) return [];

        return key === 'role'
          ? [entryOf(saved, label, ROLE_LABEL[before as Role], ROLE_LABEL[after as Role], index)]
          : [entryOf(saved, label, before || '—', after || '—', index)];
      });

    saveUser(saved, entries);
    toast.success(isNew ? MSG.createSuccess('사용자') : MSG.updateSuccess(saved.name));
    setIsConfirming(false);
    navigate(backTo);
  };

  const remove = () => {
    if (!target) return;

    removeUser(target.id, entryOf(target, '계정 삭제', `${ROLE_LABEL[target.role]} · ${target.loginId}`, '삭제됨'));
    toast.success(MSG.deleteSuccess(target.name));
    navigate(backTo);
  };

  /** 보낸 뒤에야 어느 칸이 비었는지 표시한다 — 적는 동안 붉은 칸이 따라다니지 않게 */
  const missing = (value: string, label: string) => (error && !value.trim() ? MSG.requiredField(label) : undefined);

  return (
    <>
      <FormPage
        title={isNew ? '사용자 등록' : '사용자 수정'}
        description="교육기관 담당자는 소속 학교의 설비만 조회할 수 있습니다."
        backTo={backTo}
        danger={isNew ? null : <Button variant="danger" onClick={() => setIsDeleting(true)}>계정 삭제</Button>}
        footer={(
          <>
            <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
        <FormSection legend="기본 정보">
          <FormRow cols={2}>
            <TextField
              label="이름"
              value={draft.name}
              onChange={(value) => change({ name: value })}
              maxLength={NAME_MAX}
              required
              error={missing(draft.name, '이름')}
            />
            <TextField
              label="이메일"
              value={draft.email}
              onChange={(value) => change({ email: value })}
              ime="latin"
              maxLength={EMAIL_MAX}
              optional
              error={error && draft.email.trim() && !EMAIL.test(draft.email.trim())
                ? '이메일 형식이 올바르지 않습니다.'
                : undefined}
            />
          </FormRow>
          <FormRow cols={2}>
            <TextField
              label="연락처"
              value={draft.phone}
              onChange={(value) => change({ phone: formatPhone(value) })}
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
            <TextField
              label="로그인 ID"
              value={draft.loginId}
              onChange={(value) => change({ loginId: value })}
              ime="latin"
              hint="영문·숫자·밑줄 4~20자"
              required
              error={error && !LOGIN_ID.test(draft.loginId.trim())
                ? '영문·숫자·밑줄 4~20자로 넣어 주세요.'
                : undefined}
            />
            <PasswordField
              label="비밀번호"
              value={draft.password}
              onChange={(value) => change({ password: value })}
              width="full"
              hint={isNew ? '영문·숫자·특수문자 8~20자' : '바꿀 때만 입력'}
              required={isNew}
              error={error && (isNew || Boolean(draft.password)) && !PASSWORD_RULE.test(draft.password)
                ? '영문·숫자·특수문자를 섞어 8~20자로 넣어 주세요.'
                : undefined}
            />
          </FormRow>
          <FormRow cols={2}>
            <PasswordField
              label="비밀번호 확인"
              value={draft.passwordConfirm}
              onChange={(value) => change({ passwordConfirm: value })}
              width="full"
              hint="확인용이라 저장되지 않습니다"
              required={isNew}
              error={error && draft.password !== draft.passwordConfirm ? '비밀번호가 서로 다릅니다.' : undefined}
            />
          </FormRow>
        </FormSection>

        <FormSection legend="권한">
          <RadioGroup
            legend="역할"
            value={draft.role}
            onChange={(value) => change({ role: value })}
            options={[
              { value: 'institution', label: ROLE_LABEL.institution },
              { value: 'office', label: ROLE_LABEL.office },
              { value: 'admin', label: ROLE_LABEL.admin, tone: 'brand' },
            ]}
            required
          />
        </FormSection>
      </FormPage>

      <ConfirmDialog
        isOpen={isConfirming}
        title={isNew ? MSG.createConfirm('사용자') : MSG.updateConfirm(draft.name)}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
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
