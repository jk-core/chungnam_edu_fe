import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormRow, FormSection, PasswordField, RadioGroup, TextField } from '@/components/common/Form';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { ROLE_LABEL } from '@/mocks/accounts';
import { toast } from '@/stores/toastStore';
import useAssetStore from '@/stores/assetStore';
import type { ManagedUser, Role, UserChange } from '@/interface/account';
import styles from '@/pages/Admin/Admin.module.scss';
import { useUserChangeLog } from '../hooks/useUserChangeLog';
import { draftOf, LOGIN_ID, PASSWORD_RULE, TRACKED } from './userFields';
import type { UserDraft } from './userFields';

interface UserEditorProps {
  /** 고친다면 그 사람, 새로 등록한다면 null */
  target: ManagedUser | null;
  onClose: () => void;
}

/** 사용자 등록·수정 (SFR-018) */
export function UserEditor({ target, onClose }: UserEditorProps) {
  const saveUser = useAssetStore((state) => state.saveUser);
  const nextUserId = useAssetStore((state) => state.nextUserId);
  const nextUserSeq = useAssetStore((state) => state.nextUserSeq);
  const entryOf = useUserChangeLog();

  const [draft, setDraft] = useState<UserDraft>(() => draftOf(target));
  const [error, setError] = useState<string | undefined>(undefined);
  const [isConfirming, setIsConfirming] = useState(false);

  const isNew = target === null;

  const change = (next: Partial<UserDraft>) => setDraft({ ...draft, ...next });

  const submit = () => {
    if (!draft.name.trim() || !draft.orgName.trim() || !draft.email.trim() || !draft.loginId.trim()
      || !draft.phone.trim()) {
      setError(MSG.requiredMissing);

      return;
    }

    if (!LOGIN_ID.test(draft.loginId.trim())) {
      setError('로그인 ID 는 영문·숫자·밑줄 4~20자로 넣어 주세요.');

      return;
    }

    // 새 계정은 비밀번호가 있어야 하고, 수정은 비워 두면 기존 것을 그대로 쓴다.
    if ((isNew || draft.password) && !PASSWORD_RULE.test(draft.password)) {
      setError('비밀번호는 영문·숫자·특수문자를 섞어 8~20자로 넣어 주세요.');

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
      orgName: draft.orgName.trim(),
      department: draft.department.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      plantIds: target?.plantIds ?? [],
      lastLoginAt: target?.lastLoginAt ?? null,
      locked: target?.locked ?? false,
    };

    // 신규는 한 줄로, 수정은 실제로 달라진 항목만 남긴다 (SFR-018-04).
    const entries: UserChange[] = isNew
      ? [entryOf(saved, '신규 등록', '—', `${ROLE_LABEL[saved.role]} · ${saved.orgName}`)]
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
    onClose();
  };

  /** 보낸 뒤에야 어느 칸이 비었는지 표시한다 — 적는 동안 붉은 칸이 따라다니지 않게 */
  const missing = (value: string, label: string) => (error && !value.trim() ? MSG.requiredField(label) : undefined);

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        size="lg"
        title={isNew ? '사용자 등록' : '사용자 수정'}
        description="교육기관 담당자는 소속 학교의 설비만 조회할 수 있습니다."
        footer={(
          <>
            <Button variant="secondary" onClick={onClose}>취소</Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
        <div className={styles.form}>
          <FormSection legend="기본 정보">
            <FormRow cols={2}>
              <TextField
                label="이름"
                value={draft.name}
                onChange={(value) => change({ name: value })}
                required
                error={missing(draft.name, '이름')}
              />
              <TextField
                label="소속 기관"
                value={draft.orgName}
                onChange={(value) => change({ orgName: value })}
                required
                error={missing(draft.orgName, '소속 기관')}
              />
            </FormRow>
            <FormRow cols={2}>
              <TextField
                label="부서"
                value={draft.department}
                onChange={(value) => change({ department: value })}
              />
              <TextField
                label="이메일"
                value={draft.email}
                onChange={(value) => change({ email: value })}
                ime="latin"
                required
                error={missing(draft.email, '이메일')}
              />
            </FormRow>
            <FormRow cols={2}>
              <TextField
                label="휴대전화"
                value={draft.phone}
                onChange={(value) => change({ phone: value })}
                ime="numeric"
                hint="010-0000-0000"
                required
                error={missing(draft.phone, '휴대전화')}
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
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirming}
        title={isNew ? MSG.createConfirm('사용자') : MSG.updateConfirm(draft.name)}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
      />
    </>
  );
}
