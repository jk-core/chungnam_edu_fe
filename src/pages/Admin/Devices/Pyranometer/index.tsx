import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { FormRow, FormSection, NumberField, RadioGroup, TextArea, TextField } from '@/components/common/Form';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { PlusIcon } from '@/components/common/Icon';
import { PYRANOMETER_PORT } from '@/mocks/pyranometers';
import { Reveal } from '@/components/common/Reveal';
import { SCHOOLS } from '@/mocks/schools';
import { Select } from '@/components/common/Select';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useDeletedPlants } from '@/stores/assetStore';
import useEquipmentStore, { mergePyranometers } from '@/stores/equipmentStore';
import type { Column } from '@/components/common/Table';
import type { Pyranometer } from '@/interface/deviceMaster';
import styles from '../../Admin.module.scss';
import { createdEntry, deletedEntry, diffEntries } from '../utils/deviceChangeLog';
import { DeviceHistory } from '../components/DeviceHistory';

/** 설비 이름 길이 제한 */
const NAME_MAX = 48;

/** 통신 ID 는 장비 설정 화면에 그대로 들어가는 값이라 영숫자만 받는다. */
const COMM_ID = /^[A-Za-z0-9]+$/;

interface Draft {
  id: string | null;
  plantId: string;
  name: string;
  calibrationFactor: number | '';
  rtuCommId: string;
  hasModuleThermometer: boolean;
  note: string;
}

const EMPTY_DRAFT: Draft = {
  id: null,
  plantId: SCHOOLS[0]?.id ?? '',
  name: '',
  calibrationFactor: 1,
  rtuCommId: '',
  hasModuleThermometer: true,
  note: '',
};

const YES_NO = [
  { value: 'yes', label: '있음' },
  { value: 'no', label: '없음' },
] as const;

/** 일사량계(환경센서) 관리 (SFR-016-01/05) — 발전소마다 한 대가 기본이다. */
function PyranometerDepth() {
  const pyranometerCreated = useEquipmentStore((state) => state.pyranometerCreated);
  const pyranometerPatched = useEquipmentStore((state) => state.pyranometerPatched);
  const pyranometerDeleted = useEquipmentStore((state) => state.pyranometerDeleted);
  const savePyranometer = useEquipmentStore((state) => state.savePyranometer);
  const removePyranometer = useEquipmentStore((state) => state.removePyranometer);
  const nextId = useEquipmentStore((state) => state.nextId);
  const nextSeq = useEquipmentStore((state) => state.nextSeq);
  const deletedPlants = useDeletedPlants();
  const actor = useAuthUser();

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState<Pyranometer | null>(null);

  // 지운 발전소의 장비는 목록에서 함께 감춘다 (SFR-016-05).
  const allRows = useMemo(
    () => mergePyranometers(pyranometerCreated, pyranometerPatched, pyranometerDeleted)
      .filter((row) => !deletedPlants.includes(row.plantId)),
    [pyranometerCreated, pyranometerPatched, pyranometerDeleted, deletedPlants],
  );

  const plantOptions = useMemo(
    () => SCHOOLS
      .filter((school) => !deletedPlants.includes(school.id))
      .map((school) => ({ value: school.id, label: school.name })),
    [deletedPlants],
  );

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? allRows.filter((row) => row.plantName.includes(trimmed)
        || row.name.includes(trimmed)
        || row.rtuCommId.includes(trimmed))
      : allRows;
  }, [allRows, keyword]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openEditor = (target: Pyranometer | null) => {
    setErrors({});
    setDraft(target
      ? {
        id: target.id,
        plantId: target.plantId,
        name: target.name,
        calibrationFactor: target.calibrationFactor,
        rtuCommId: target.rtuCommId,
        hasModuleThermometer: target.hasModuleThermometer,
        note: target.note,
      }
      : EMPTY_DRAFT);
  };

  const submit = () => {
    if (!draft) return;

    const found: Record<string, string> = {};
    const name = draft.name.trim();

    if (!name) found.name = MSG.requiredField('설비 이름');
    else if (name.length > NAME_MAX) found.name = MSG.tooLong('설비 이름', NAME_MAX);

    if (draft.calibrationFactor === '' || draft.calibrationFactor < 0 || draft.calibrationFactor > 10) {
      found.calibrationFactor = MSG.numberRange('캘리브레이션 인수', 0, 10);
    }

    if (!COMM_ID.test(draft.rtuCommId.trim())) found.rtuCommId = 'RTU 통신 ID 는 영문·숫자만 넣을 수 있습니다.';

    setErrors(found);
    if (Object.keys(found).length === 0) setConfirming(true);
  };

  const commit = () => {
    if (!draft) return;

    const isNew = draft.id === null;
    const before = isNew ? null : allRows.find((row) => row.id === draft.id) ?? null;
    const plantName = SCHOOLS.find((school) => school.id === draft.plantId)?.name ?? before?.plantName ?? '';
    const saved: Pyranometer = {
      id: draft.id ?? nextId('PYR'),
      irradId: before?.irradId ?? nextSeq(),
      plantId: draft.plantId,
      plantName,
      name: draft.name.trim(),
      calibrationFactor: Number(draft.calibrationFactor),
      rtuCommId: draft.rtuCommId.trim(),
      // 포트는 화면에서 고를 수 없다 — 3번이 일사량계 몫이다.
      rtuPort: PYRANOMETER_PORT,
      hasModuleThermometer: draft.hasModuleThermometer,
      note: draft.note.trim(),
      status: before?.status ?? 'normal',
    };
    const target = { kind: 'pyranometer' as const, id: saved.id, name: saved.name, actor: actor?.name ?? '관리자' };

    const entries = isNew
      ? createdEntry(target, `${saved.plantName} · ${saved.rtuCommId}`)
      : diffEntries(target, [
        { label: '설비 이름', before: before?.name ?? '', after: saved.name },
        { label: '발전소', before: before?.plantName ?? '', after: saved.plantName },
        {
          label: '캘리브레이션 인수',
          before: String(before?.calibrationFactor ?? ''),
          after: String(saved.calibrationFactor),
        },
        { label: 'RTU 통신 ID', before: before?.rtuCommId ?? '', after: saved.rtuCommId },
        {
          label: '모듈 온도계',
          before: before ? (before.hasModuleThermometer ? '있음' : '없음') : '',
          after: saved.hasModuleThermometer ? '있음' : '없음',
        },
        { label: '비고', before: before?.note ?? '', after: saved.note },
      ]);

    savePyranometer(saved, entries, isNew);
    toast.success(isNew ? MSG.createSuccess('일사량계') : MSG.updateSuccess(saved.name));
    setConfirming(false);
    setDraft(null);
  };

  const columns: Column<Pyranometer>[] = [
    {
      key: 'irradId',
      header: '일사량계 ID',
      width: '100px',
      hideOnTablet: true,
      render: (row) => <span className={styles.stackCell__sub}>{row.irradId}</span>,
    },
    {
      key: 'plant',
      header: '발전소 · 설비',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.plantName}</strong>
          <span className={styles.stackCell__sub}>{row.name}</span>
        </span>
      ),
    },
    {
      key: 'factor',
      header: '캘리브레이션',
      align: 'right',
      width: '110px',
      render: (row) => formatNumber(row.calibrationFactor, 3),
    },
    {
      key: 'comm',
      header: 'RTU 통신 ID · 포트',
      width: '160px',
      hideOnTablet: true,
      render: (row) => `${row.rtuCommId} · ${row.rtuPort}번`,
    },
    {
      key: 'thermometer',
      header: '모듈 온도계',
      width: '110px',
      align: 'center',
      render: (row) => (row.hasModuleThermometer ? '있음' : '없음'),
    },
    {
      key: 'action',
      header: '관리',
      width: '140px',
      align: 'center',
      render: (row) => (
        <span className={styles.toolbar__actions}>
          <Button size="sm" variant="secondary" onClick={() => openEditor(row)}>
            수정
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(row)}>
            삭제
          </Button>
        </span>
      ),
    },
  ];

  return (
    <>
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
            placeholder="일사량계명·RTU 통신ID 로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => openEditor(null)}>
            일사량계 등록
          </Button>
        </div>
      </div>

      <Reveal delay={0.05}>
        <Card
          eyebrow="Pyranometer"
          title="일사량계 목록"
          description="일사량은 AI 진단이 기대 발전량을 계산할 때 쓰는 값입니다. 캘리브레이션 인수를 정확히 넣어 주세요."
        >
          {rows.length === 0 ? (
            <EmptyState title="조건에 맞는 설비가 없습니다" description="검색어를 지우거나 새 설비를 등록해 보세요." />
          ) : (
            <>
              <Table
                caption="일사량계 목록. 발전소와 설비 이름, 캘리브레이션 인수, 통신 설정, 모듈 온도계 순입니다."
                columns={columns}
                rows={pageRows}
                getRowKey={(row) => row.id}
              />
              <Pagination
                page={currentPage}
                pageCount={pageCount}
                totalCount={rows.length}
                onChange={setPage}
                label="일사량계 목록"
                pageSize={pageSize}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </>
          )}
        </Card>
      </Reveal>

      <DeviceHistory kind="pyranometer" keyword={keyword} title="일사량계 변경 이력" />

      <Modal
        isOpen={draft !== null}
        onClose={() => setDraft(null)}
        size="lg"
        title={draft?.id === null ? '일사량계 등록' : '일사량계 수정'}
        description={`RTU ${PYRANOMETER_PORT}번 포트는 일사량계 몫이라 바꿀 수 없습니다.`}
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
            <FormSection legend="설치 위치">
              <FormRow cols={2}>
                <Select
                  label="발전소"
                  value={draft.plantId}
                  onChange={(value) => setDraft({ ...draft, plantId: value })}
                  options={plantOptions}
                />
                <TextField
                  label="설비 이름"
                  value={draft.name}
                  onChange={(value) => setDraft({ ...draft, name: value })}
                  required
                  hint={`${NAME_MAX}자 이내`}
                  error={errors.name}
                />
              </FormRow>
            </FormSection>

            <FormSection legend="계측·통신">
              <FormRow cols={2}>
                <NumberField
                  label="캘리브레이션 인수"
                  value={draft.calibrationFactor}
                  onChange={(value) => setDraft({ ...draft, calibrationFactor: value })}
                  min={0}
                  max={10}
                  step={0.001}
                  required
                  error={errors.calibrationFactor}
                />
                <TextField
                  label="RTU 통신 ID"
                  value={draft.rtuCommId}
                  onChange={(value) => setDraft({ ...draft, rtuCommId: value })}
                  ime="latin"
                  required
                  error={errors.rtuCommId}
                />
              </FormRow>
              <FormRow cols={2}>
                <NumberField
                  label="RTU 포트"
                  value={PYRANOMETER_PORT}
                  onChange={() => undefined}
                  readOnly
                  hint="일사량계 고정"
                />
                <RadioGroup
                  legend="모듈 온도계"
                  value={draft.hasModuleThermometer ? 'yes' : 'no'}
                  onChange={(value) => setDraft({ ...draft, hasModuleThermometer: value === 'yes' })}
                  options={[...YES_NO]}
                />
              </FormRow>
            </FormSection>

            <FormSection legend="비고">
              <TextArea
                label="메모"
                value={draft.note}
                onChange={(value) => setDraft({ ...draft, note: value })}
                optional
                placeholder="설치 위치나 점검 시 주의할 점을 적어 두세요."
              />
            </FormSection>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={confirming}
        title={draft?.id === null ? MSG.createConfirm('일사량계') : MSG.updateConfirm(draft?.name ?? '일사량계')}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setConfirming(false)}
      />

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '일사량계')}
        description="일사량 값이 없으면 그 발전소의 AI 진단은 기대 발전량을 계산하지 못합니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => {
          if (!deleting) return;

          removePyranometer(deleting.id, deletedEntry(
            { kind: 'pyranometer', id: deleting.id, name: deleting.name, actor: actor?.name ?? '관리자' },
            `${deleting.plantName} · ${deleting.rtuCommId}`,
          ));
          toast.success(MSG.deleteSuccess(deleting.name));
          setDeleting(null);
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

export default PyranometerDepth;
