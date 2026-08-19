import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { FormRow, FormSection, NumberField, RadioGroup, TextField } from '@/components/common/Form';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { NOW } from '@/mocks/today';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { PlusIcon } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { RTU_EVENT_LABEL } from '@/mocks/rtu';
import { RTU_LABEL, RTU_TONE } from '@/mocks/status';
import { SCHOOLS } from '@/mocks/schools';
import { Select } from '@/components/common/Select';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useDeletedPlants } from '@/stores/assetStore';
import useEquipmentStore, { mergeRtus } from '@/stores/equipmentStore';
import type { Column } from '@/components/common/Table';
import type { Rtu } from '@/interface/asset';
import type { RtuStatus } from '@/interface/status';
import styles from '../../Admin.module.scss';
import { createdEntry, deletedEntry, diffEntries } from '../utils/deviceChangeLog';
import { DeviceHistory } from '../components/DeviceHistory';

/** 수집 주기 허용 범위(분) */
const INTERVAL_MIN = 1;
const INTERVAL_MAX = 60;

interface Draft {
  id: string | null;
  plantId: string;
  model: string;
  serial: string;
  firmware: string;
  intervalMinutes: number | '';
  status: RtuStatus;
}

/** RTU 관리 (SFR-017-01~03) — 연계 상태·수집 주기를 다루고 교체·이설 이력을 본다. */
function RtuDepth() {
  const rtuCreated = useEquipmentStore((state) => state.rtuCreated);
  const rtuPatched = useEquipmentStore((state) => state.rtuPatched);
  const rtuDeleted = useEquipmentStore((state) => state.rtuDeleted);
  const saveRtu = useEquipmentStore((state) => state.saveRtu);
  const removeRtu = useEquipmentStore((state) => state.removeRtu);
  const nextId = useEquipmentStore((state) => state.nextId);
  const deletedPlants = useDeletedPlants();
  const actor = useAuthUser();

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<Rtu | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState<Rtu | null>(null);

  // 지운 발전소의 장비는 목록에서 함께 감춘다 (SFR-016-05).
  const allRows = useMemo(
    () => mergeRtus(rtuCreated, rtuPatched, rtuDeleted).filter((row) => !deletedPlants.includes(row.plantId)),
    [rtuCreated, rtuPatched, rtuDeleted, deletedPlants],
  );

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? allRows.filter((row) => row.plantName.includes(trimmed)
        || row.model.includes(trimmed)
        || row.serial.includes(trimmed))
      : allRows;
  }, [allRows, keyword]);

  const plantOptions = useMemo(
    () => SCHOOLS
      .filter((school) => !deletedPlants.includes(school.id))
      .map((school) => ({ value: school.id, label: school.name })),
    [deletedPlants],
  );

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openEditor = (target: Rtu | null) => {
    setErrors({});
    setDraft(target
      ? {
        id: target.id,
        plantId: target.plantId,
        model: target.model,
        serial: target.serial,
        firmware: target.firmware,
        intervalMinutes: target.intervalMinutes,
        status: target.status,
      }
      : {
        id: null,
        plantId: SCHOOLS[0]?.id ?? '',
        model: '',
        serial: '',
        firmware: '',
        intervalMinutes: 5,
        status: 'normal',
      });
  };

  const submit = () => {
    if (!draft) return;

    const found: Record<string, string> = {};

    if (!draft.model.trim()) found.model = MSG.requiredField('모델');
    if (!draft.serial.trim()) found.serial = MSG.requiredField('시리얼');
    if (!draft.firmware.trim()) found.firmware = MSG.requiredField('펌웨어');

    if (draft.intervalMinutes === '' || draft.intervalMinutes < INTERVAL_MIN || draft.intervalMinutes > INTERVAL_MAX) {
      found.intervalMinutes = MSG.numberRange('수집 주기', INTERVAL_MIN, INTERVAL_MAX);
    }

    setErrors(found);
    if (Object.keys(found).length === 0) setConfirming(true);
  };

  const commit = () => {
    if (!draft) return;

    const isNew = draft.id === null;
    const before = isNew ? null : allRows.find((row) => row.id === draft.id) ?? null;
    const plantName = SCHOOLS.find((school) => school.id === draft.plantId)?.name ?? before?.plantName ?? '';
    const at = NOW.format('YYYY-MM-DD HH:mm');
    const saved: Rtu = {
      id: draft.id ?? nextId('RTU'),
      plantId: draft.plantId,
      plantName,
      model: draft.model.trim(),
      serial: draft.serial.trim(),
      firmware: draft.firmware.trim(),
      intervalMinutes: Number(draft.intervalMinutes),
      status: draft.status,
      lastSeenAt: before?.lastSeenAt ?? at,
      // 펌웨어를 올리거나 새로 설치한 사실은 장비 이력에도 남긴다 (SFR-017-02/03).
      events: isNew
        ? [{ at, kind: 'install', note: '신규 등록' }]
        : (before && before.firmware !== draft.firmware.trim()
          ? [...(before.events ?? []), { at, kind: 'firmware' as const, note: `펌웨어 ${draft.firmware.trim()} 업데이트` }]
          : before?.events ?? []),
    };
    const target = { kind: 'rtu' as const, id: saved.id, name: `${saved.plantName} RTU`, actor: actor?.name ?? '관리자' };

    const entries = isNew
      ? createdEntry(target, `${saved.model} · ${saved.serial}`)
      : diffEntries(target, [
        { label: '발전소', before: before?.plantName ?? '', after: saved.plantName },
        { label: '모델', before: before?.model ?? '', after: saved.model },
        { label: '시리얼', before: before?.serial ?? '', after: saved.serial },
        { label: '펌웨어', before: `v${before?.firmware ?? ''}`, after: `v${saved.firmware}` },
        {
          label: '수집 주기',
          before: before ? `${before.intervalMinutes}분` : '',
          after: `${saved.intervalMinutes}분`,
        },
        {
          label: '연계 상태',
          before: before ? RTU_LABEL[before.status] : '',
          after: RTU_LABEL[saved.status],
        },
      ]);

    saveRtu(saved, entries, isNew);
    toast.success(isNew ? MSG.createSuccess('RTU') : MSG.updateSuccess(`${saved.plantName} RTU`));
    setConfirming(false);
    setDraft(null);
  };

  const columns: Column<Rtu>[] = [
    {
      key: 'plant',
      header: '발전소',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.plantName}</strong>
          <span className={styles.stackCell__sub}>{row.model} · {row.serial}</span>
        </span>
      ),
    },
    { key: 'firmware', header: '펌웨어', width: '90px', hideOnTablet: true, render: (row) => `v${row.firmware}` },
    { key: 'interval', header: '수집 주기', align: 'right', width: '90px', render: (row) => `${row.intervalMinutes}분` },
    {
      key: 'status',
      header: '연계 상태',
      width: '110px',
      render: (row) => (
        <Badge tone={RTU_TONE[row.status]} withDot>
          {RTU_LABEL[row.status]}
        </Badge>
      ),
    },
    { key: 'seen', header: '최근 수신', width: '150px', hideOnTablet: true, render: (row) => row.lastSeenAt },
    {
      key: 'action',
      header: '관리',
      width: '200px',
      align: 'center',
      render: (row) => (
        <span className={styles.toolbar__actions}>
          <Button size="sm" variant="secondary" onClick={() => setSelected(row)}>
            이력
          </Button>
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
            placeholder="RTU명으로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => openEditor(null)}>
            RTU 등록
          </Button>
        </div>
      </div>

      <Reveal delay={0.05}>
        <Card
          title="RTU 목록"
          description="연계 상태와 수집 주기를 확인하고, 이력 버튼으로 교체·이설 내역을 봅니다."
        >
          {rows.length === 0 ? (
            <EmptyState title="조건에 맞는 RTU가 없습니다" description="검색어를 지우거나 새 장치를 등록해 보세요." />
          ) : (
            <>
              <Table
                caption="RTU 목록. 발전소와 모델·시리얼, 펌웨어, 수집 주기, 연계 상태, 최근 수신 순입니다."
                columns={columns}
                rows={pageRows}
                getRowKey={(row) => row.id}
                getRowClassName={(row) => (row.status === 'disconnected' ? styles.rowAlert : undefined)}
              />
              <Pagination
                page={currentPage}
                pageCount={pageCount}
                totalCount={rows.length}
                onChange={setPage}
                label="RTU 목록"
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

      <DeviceHistory kind="rtu" title="RTU 변경 이력" />

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={`${selected?.plantName ?? ''} RTU`}
        description={selected ? `${selected.model} · ${selected.serial} · 펌웨어 v${selected.firmware}` : undefined}
      >
        {selected ? (
          <div className={styles.history}>
            {[...selected.events].reverse().map((event) => (
              <div key={`${event.at}-${event.kind}`} className={styles.historyItem}>
                <span className={styles.historyItem__at}>{event.at}</span>
                <span className={styles.historyItem__body}>
                  <Badge tone={event.kind === 'replace' ? 'caution' : 'neutral'}>{RTU_EVENT_LABEL[event.kind]}</Badge>{' '}
                  {event.note}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={draft !== null}
        onClose={() => setDraft(null)}
        size="lg"
        title={draft?.id === null ? 'RTU 등록' : 'RTU 수정'}
        description="수집 주기를 짧게 두면 통신량이 늘어납니다. 기본은 5분입니다."
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
            <FormSection legend="장치 정보">
              <FormRow cols={2}>
                <Select
                  label="발전소"
                  value={draft.plantId}
                  onChange={(value) => setDraft({ ...draft, plantId: value })}
                  options={plantOptions}
                />
                <TextField
                  label="모델"
                  value={draft.model}
                  onChange={(value) => setDraft({ ...draft, model: value })}
                  ime="latin"
                  required
                  error={errors.model}
                />
              </FormRow>
              <FormRow cols={2}>
                <TextField
                  label="시리얼"
                  value={draft.serial}
                  onChange={(value) => setDraft({ ...draft, serial: value })}
                  ime="latin"
                  required
                  error={errors.serial}
                />
                <TextField
                  label="펌웨어"
                  value={draft.firmware}
                  onChange={(value) => setDraft({ ...draft, firmware: value })}
                  ime="latin"
                  hint="예: 2.4.1"
                  required
                  error={errors.firmware}
                />
              </FormRow>
            </FormSection>

            <FormSection legend="연계 설정">
              <FormRow cols={2}>
                <NumberField
                  label="수집 주기"
                  value={draft.intervalMinutes}
                  onChange={(value) => setDraft({ ...draft, intervalMinutes: value })}
                  min={INTERVAL_MIN}
                  max={INTERVAL_MAX}
                  unit="분"
                  required
                  error={errors.intervalMinutes}
                />
                <RadioGroup
                  legend="연계 상태"
                  value={draft.status}
                  onChange={(value) => setDraft({ ...draft, status: value })}
                  options={[
                    { value: 'normal', label: RTU_LABEL.normal },
                    { value: 'abnormal', label: RTU_LABEL.abnormal, tone: 'critical' },
                    { value: 'disconnected', label: RTU_LABEL.disconnected, tone: 'offline' },
                  ]}
                  required
                />
              </FormRow>
            </FormSection>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={confirming}
        title={draft?.id === null ? MSG.createConfirm('RTU') : MSG.updateConfirm('RTU')}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setConfirming(false)}
      />

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(`${deleting?.plantName ?? ''} RTU`)}
        description="장치를 지우면 그 발전소의 수집이 멈춘 것으로 보입니다. 교체라면 수정으로 시리얼만 바꿔 주세요."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => {
          if (!deleting) return;

          removeRtu(deleting.id, deletedEntry(
            {
              kind: 'rtu',
              id: deleting.id,
              name: `${deleting.plantName} RTU`,
              actor: actor?.name ?? '관리자',
            },
            `${deleting.model} · ${deleting.serial}`,
          ));
          toast.success(MSG.deleteSuccess(`${deleting.plantName} RTU`));
          setDeleting(null);
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

export default RtuDepth;
