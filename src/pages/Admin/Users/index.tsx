import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { FormRow, FormSection, PasswordField, RadioGroup, TextField } from '@/components/common/Form';
import { Modal } from '@/components/common/Modal';
import { MaskedText } from '@/components/common/MaskedText';
import { maskEmail } from '@/utils/mask';
import { MSG } from '@/configs/messages';
import { NOW } from '@/mocks/today';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { PlusIcon } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { ROLE_LABEL } from '@/mocks/accounts';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useAssetStore, { mergeUserChanges, mergeUsers } from '@/stores/assetStore';
import type { Column } from '@/components/common/Table';
import type { ManagedUser, Role, UserChange } from '@/interface/account';
import styles from '../Admin.module.scss';

/** 비밀번호 규칙 — 서버 정규식을 그대로 쓴다 (영문·숫자·특수문자 포함 8~20자). */
const PASSWORD_RULE = /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*\W)(?=\S+$).{8,20}$/;

/** 로그인 계정에 쓸 수 있는 글자 */
const LOGIN_ID = /^[A-Za-z0-9_]{4,20}$/;

interface Draft {
  id: string | null;
  loginId: string;
  /** 새 비밀번호. 수정에서 비워 두면 기존 비밀번호를 그대로 쓴다 */
  password: string;
  name: string;
  role: Role;
  orgName: string;
  department: string;
  email: string;
  phone: string;
}

/** 이력에 남길 항목 — 화면의 입력 항목과 이름을 맞춘다 (SFR-018-04). */
const TRACKED: { key: keyof Draft; label: string }[] = [
  { key: 'loginId', label: '로그인 ID' },
  { key: 'name', label: '이름' },
  { key: 'orgName', label: '소속 기관' },
  { key: 'department', label: '부서' },
  { key: 'email', label: '이메일' },
  { key: 'phone', label: '휴대전화' },
  { key: 'role', label: '권한' },
];

const EMPTY_DRAFT: Draft = {
  id: null,
  loginId: '',
  password: '',
  name: '',
  role: 'institution',
  orgName: '',
  department: '행정실',
  email: '',
  phone: '',
};

/** 사용자 관리 (SFR-018) — 관리자만 들어온다 (SFR-018-05). */
function UsersPage() {
  const userCreated = useAssetStore((state) => state.userCreated);
  const userPatched = useAssetStore((state) => state.userPatched);
  const userDeleted = useAssetStore((state) => state.userDeleted);
  const userChanges = useAssetStore((state) => state.userChanges);
  const saveUser = useAssetStore((state) => state.saveUser);
  const patchUser = useAssetStore((state) => state.patchUser);
  const removeUser = useAssetStore((state) => state.removeUser);
  const nextUserId = useAssetStore((state) => state.nextUserId);
  const nextUserSeq = useAssetStore((state) => state.nextUserSeq);
  const actor = useAuthUser();

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState<ManagedUser | null>(null);

  const users = useMemo(() => {
    const all = mergeUsers(userCreated, userPatched, userDeleted);
    const trimmed = keyword.trim();

    return trimmed
      ? all.filter((user) => user.name.includes(trimmed)
        || user.loginId.includes(trimmed)
        || user.orgName.includes(trimmed)
        || user.email.includes(trimmed))
      : all;
  }, [userCreated, userPatched, userDeleted, keyword]);

  // 위 검색어를 이력에도 그대로 걸어 준다 — 한 사람만 골라 보게 하려는 것 (SFR-018-04).
  const history = useMemo(() => {
    const all = mergeUserChanges(userChanges);
    const trimmed = keyword.trim();

    return trimmed
      ? all.filter((item) => item.userName.includes(trimmed) || item.actor.includes(trimmed) || item.field.includes(trimmed))
      : all;
  }, [userChanges, keyword]);

  const pageCount = Math.max(1, Math.ceil(users.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = users.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const lockedCount = users.filter((user) => user.locked).length;

  const openEditor = (target: ManagedUser | null) => {
    setError(undefined);
    setDraft(
      target
        ? {
          id: target.id,
          loginId: target.loginId,
          // 기존 비밀번호는 받아 오지 않는다 — 비워 두면 그대로 둔다는 뜻이다.
          password: '',
          name: target.name,
          role: target.role,
          orgName: target.orgName,
          department: target.department,
          email: target.email,
          phone: target.phone,
        }
        : EMPTY_DRAFT,
    );
  };

  const submit = () => {
    if (!draft) return;

    const isNew = draft.id === null;

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
    setConfirming(true);
  };

  /** 이력 한 줄을 만든다 — 저장·잠금해제·삭제가 같은 형식을 쓴다. */
  const entryOf = (target: Pick<ManagedUser, 'id' | 'name'>, field: string, before: string, after: string, seq = 0): UserChange => ({
    id: `UC-${NOW.format('MMDDHHmm')}-${target.id}-${seq}`,
    userId: target.id,
    userName: target.name,
    at: NOW.format('YYYY-MM-DD HH:mm'),
    actor: actor?.name ?? '관리자',
    field,
    before,
    after,
  });

  const commit = () => {
    if (!draft) return;

    const isNew = draft.id === null;
    const existing = isNew ? null : users.find((user) => user.id === draft.id) ?? null;
    const saved: ManagedUser = {
      id: draft.id ?? nextUserId(),
      userId: existing?.userId ?? nextUserSeq(),
      loginId: draft.loginId.trim(),
      name: draft.name.trim(),
      role: draft.role,
      orgName: draft.orgName.trim(),
      department: draft.department.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      plantIds: existing?.plantIds ?? [],
      lastLoginAt: existing?.lastLoginAt ?? null,
      locked: existing?.locked ?? false,
    };

    // 신규는 한 줄로, 수정은 실제로 달라진 항목만 남긴다 (SFR-018-04).
    const entries: UserChange[] = isNew
      ? [entryOf(saved, '신규 등록', '—', `${ROLE_LABEL[saved.role]} · ${saved.orgName}`)]
      : TRACKED.flatMap(({ key, label }, index) => {
        const before = String(existing?.[key as keyof ManagedUser] ?? '');
        const after = String(saved[key as keyof ManagedUser] ?? '');

        if (before === after) return [];

        return key === 'role'
          ? [entryOf(saved, label, ROLE_LABEL[before as Role], ROLE_LABEL[after as Role], index)]
          : [entryOf(saved, label, before || '—', after || '—', index)];
      });

    saveUser(saved, entries);
    toast.success(isNew ? MSG.createSuccess('사용자') : MSG.updateSuccess(draft.name));
    setDraft(null);
  };

  const unlock = (target: ManagedUser) => {
    patchUser(target.id, { locked: false }, [entryOf(target, '계정 잠금', '잠김', '해제')]);
    toast.success(`${target.name} 계정 잠금을 풀었습니다.`);
  };

  const resetPassword = (target: ManagedUser) => {
    toast.success(`${target.name} 계정에 임시 비밀번호를 보냈습니다. (${NOW.format('HH:mm')} 기준)`);
  };

  const columns: Column<ManagedUser>[] = [
    {
      key: 'name',
      header: '로그인 ID · 이름',
      width: '180px',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>
            {row.name}
            {row.locked ? <Badge tone="critical"> 잠금</Badge> : null}
          </strong>
          <span className={styles.stackCell__sub}>{row.loginId}</span>
        </span>
      ),
    },
    { key: 'org', header: '소속', render: (row) => `${row.orgName} · ${row.department}` },
    { key: 'role', header: '권한', width: '120px', render: (row) => <Badge tone={row.role === 'admin' ? 'brand' : 'neutral'}>{ROLE_LABEL[row.role]}</Badge> },
    {
      key: 'email',
      header: '이메일',
      hideOnTablet: true,
      // 목록에서는 가려 두고 필요할 때만 확인한다 (SFR-018-05).
      render: (row) => <MaskedText masked={maskEmail(row.email)} original={row.email} label={`${row.name} 이메일`} />,
    },
    {
      key: 'login',
      header: '마지막 로그인',
      width: '140px',
      hideOnTablet: true,
      render: (row) => row.lastLoginAt ?? '이력 없음',
    },
    {
      key: 'action',
      header: '관리',
      width: '210px',
      align: 'center',
      render: (row) => (
        <span className={styles.toolbar__actions}>
          <Button size="sm" variant="secondary" onClick={() => openEditor(row)}>
            수정
          </Button>
          {row.locked ? (
            <Button size="sm" variant="secondary" onClick={() => unlock(row)}>
              잠금 해제
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => resetPassword(row)}>
              비번 초기화
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setDeleting(row)}>
            삭제
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <TextField
            label="이름 검색"
            hideLabel
            value={keyword}
            onChange={(value) => {
              setKeyword(value);
              setPage(1);
            }}
            placeholder="사용자명으로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>
            총 {formatNumber(users.length)}개{lockedCount > 0 ? ` · 잠금 ${lockedCount}건` : ''}
          </p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => openEditor(null)}>
            사용자 등록
          </Button>
        </div>
      </div>

      <Reveal>
        <Card
          title="설비 담당자"
          description="로그인 실패가 누적돼 잠긴 계정은 여기서 풀어 줍니다."
        >
          <Table
            caption="사용자 목록"
            columns={columns}
            rows={pageRows}
            getRowKey={(row) => row.id}
            getRowClassName={(row) => (row.locked ? styles.rowAlert : undefined)}
          />
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            totalCount={users.length}
            onChange={setPage}
            label="사용자 목록"
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </Card>
      </Reveal>

      <Reveal delay={0.06}>
        <Card
          title="담당자 변경 이력"
          description="누가 언제 어떤 항목을 바꿨는지 남습니다. 위 검색어로 사람을 좁혀 볼 수 있습니다."
        >
          {history.length === 0 ? (
            <EmptyState title="변경 이력이 없습니다" description="검색어를 지우거나 다른 이름으로 찾아 보세요." />
          ) : (
            <div className={styles.history}>
              {history.slice(0, 10).map((item) => (
                <div key={item.id} className={styles.historyItem}>
                  <span className={styles.historyItem__at}>{item.at}</span>
                  <span className={styles.historyItem__body}>
                    <strong>{item.userName}</strong> · {item.field} —{' '}
                    <span className={styles.historyItem__diff}>
                      <del>{item.before}</del> → <ins>{item.after}</ins>
                    </span>
                  </span>
                  <span className={styles.historyItem__at}>{item.actor}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Reveal>

      <Modal
        isOpen={draft !== null}
        onClose={() => setDraft(null)}
        size="lg"
        title={draft?.id === null ? '사용자 등록' : '사용자 수정'}
        description="교육기관 담당자는 소속 학교의 설비만 조회할 수 있습니다."
        footer={(
          <>
            <Button variant="secondary" onClick={() => setDraft(null)}>
              취소
            </Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
        {draft ? (
          <div className={styles.form}>
            <FormSection legend="기본 정보">
              <FormRow cols={2}>
                <TextField
                  label="이름"
                  value={draft.name}
                  onChange={(value) => setDraft({ ...draft, name: value })}
                  required
                  error={error && !draft.name.trim() ? MSG.requiredField('이름') : undefined}
                />
                <TextField
                  label="소속 기관"
                  value={draft.orgName}
                  onChange={(value) => setDraft({ ...draft, orgName: value })}
                  required
                  error={error && !draft.orgName.trim() ? MSG.requiredField('소속 기관') : undefined}
                />
              </FormRow>
              <FormRow cols={2}>
                <TextField
                  label="부서"
                  value={draft.department}
                  onChange={(value) => setDraft({ ...draft, department: value })}
                />
                <TextField
                  label="이메일"
                  value={draft.email}
                  onChange={(value) => setDraft({ ...draft, email: value })}
                  ime="latin"
                  required
                  error={error && !draft.email.trim() ? MSG.requiredField('이메일') : undefined}
                />
              </FormRow>
              <FormRow cols={2}>
                <TextField
                  label="휴대전화"
                  value={draft.phone}
                  onChange={(value) => setDraft({ ...draft, phone: value })}
                  ime="numeric"
                  hint="010-0000-0000"
                  required
                  error={error && !draft.phone.trim() ? MSG.requiredField('휴대전화') : undefined}
                />
              </FormRow>
            </FormSection>

            <FormSection
              legend="로그인 정보"
              hint={draft.id === null
                ? '로그인 ID 로 접속합니다. 등록 후에는 담당자가 직접 비밀번호를 바꿀 수 있습니다.'
                : '비밀번호를 비워 두면 기존 비밀번호를 그대로 둡니다.'}
            >
              <FormRow cols={2}>
                <TextField
                  label="로그인 ID"
                  value={draft.loginId}
                  onChange={(value) => setDraft({ ...draft, loginId: value })}
                  ime="latin"
                  hint="영문·숫자·밑줄 4~20자"
                  required
                  error={error && (!draft.loginId.trim() || !LOGIN_ID.test(draft.loginId.trim()))
                    ? '영문·숫자·밑줄 4~20자로 넣어 주세요.'
                    : undefined}
                />
                <PasswordField
                  label="비밀번호"
                  value={draft.password}
                  onChange={(value) => setDraft({ ...draft, password: value })}
                  width="full"
                  hint={draft.id === null ? '영문·숫자·특수문자 8~20자' : '바꿀 때만 입력'}
                  required={draft.id === null}
                  error={error && (draft.id === null || Boolean(draft.password)) && !PASSWORD_RULE.test(draft.password)
                    ? '영문·숫자·특수문자를 섞어 8~20자로 넣어 주세요.'
                    : undefined}
                />
              </FormRow>
            </FormSection>

            <FormSection legend="권한">
              <RadioGroup
                legend="역할"
                value={draft.role}
                onChange={(value) => setDraft({ ...draft, role: value })}
                options={[
                  { value: 'institution', label: ROLE_LABEL.institution },
                  { value: 'office', label: ROLE_LABEL.office },
                  { value: 'admin', label: ROLE_LABEL.admin, tone: 'brand' },
                ]}
                required
              />
            </FormSection>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={confirming}
        title={draft?.id === null ? MSG.createConfirm('사용자') : MSG.updateConfirm(draft?.name ?? '사용자')}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setConfirming(false)}
      />

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '사용자')}
        description="삭제해도 접속 로그에는 과거 기록이 남습니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => {
          if (!deleting) return;

          removeUser(deleting.id, entryOf(deleting, '계정 삭제', `${ROLE_LABEL[deleting.role]} · ${deleting.orgName}`, '삭제됨'));
          toast.success(MSG.deleteSuccess(deleting.name));
          setDeleting(null);
        }}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

export default UsersPage;
