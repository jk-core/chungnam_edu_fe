import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { CELL_TYPE_LABEL } from '@/mocks/moduleProducts';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { FormRow, FormSection, NumberField, RadioGroup, TextField } from '@/components/common/Form';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { PlusIcon } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useEquipmentStore, { mergeInverterMasters, mergeModules } from '@/stores/equipmentStore';
import type { Column } from '@/components/common/Table';
import type { ModuleProduct } from '@/interface/deviceMaster';
import styles from '../../Admin.module.scss';
import { createdEntry, deletedEntry, diffEntries } from '../utils/deviceChangeLog';
import { DeviceHistory } from '../components/DeviceHistory';

interface Draft {
  id: string | null;
  name: string;
  maker: string;
  wattPerPanel: number | '';
  maxVoltage: number | '';
  maxCurrent: number | '';
  openVoltage: number | '';
  shortCurrent: number | '';
  voltTempCoeff: number | '';
  currentTempCoeff: number | '';
  cellType: ModuleProduct['cellType'];
}

/** 숫자 항목의 허용 범위 — 검증과 이력 라벨을 같은 표에서 뽑는다 (SFR-017-05). */
const NUMERIC: { key: keyof Draft; label: string; min: number; max: number; unit: string }[] = [
  { key: 'wattPerPanel', label: '모듈 용량', min: 0, max: 700, unit: 'W' },
  { key: 'maxVoltage', label: '최대 전압', min: 0, max: 100, unit: 'V' },
  { key: 'maxCurrent', label: '최대 전류', min: 0, max: 100, unit: 'A' },
  { key: 'openVoltage', label: '개방 전압', min: 0, max: 100, unit: 'V' },
  { key: 'shortCurrent', label: '단락 전류', min: 0, max: 100, unit: 'A' },
  { key: 'voltTempCoeff', label: '전압 온도계수', min: -1, max: 0, unit: '%/℃' },
  { key: 'currentTempCoeff', label: '전류 온도계수', min: 0, max: 1, unit: '%/℃' },
];

const EMPTY_DRAFT: Draft = {
  id: null,
  name: '',
  maker: '',
  wattPerPanel: '',
  maxVoltage: '',
  maxCurrent: '',
  openVoltage: '',
  shortCurrent: '',
  voltTempCoeff: '',
  currentTempCoeff: '',
  cellType: 'single',
};

/** 모듈 제품 마스터 관리 (SFR-016-01/05, SFR-017-05) — 인버터 등록이 이 목록을 고른다. */
function ModuleDepth() {
  const moduleCreated = useEquipmentStore((state) => state.moduleCreated);
  const modulePatched = useEquipmentStore((state) => state.modulePatched);
  const moduleDeleted = useEquipmentStore((state) => state.moduleDeleted);
  const inverterCreated = useEquipmentStore((state) => state.inverterCreated);
  const inverterPatched = useEquipmentStore((state) => state.inverterPatched);
  const inverterDeleted = useEquipmentStore((state) => state.inverterDeleted);
  const saveModule = useEquipmentStore((state) => state.saveModule);
  const removeModule = useEquipmentStore((state) => state.removeModule);
  const nextId = useEquipmentStore((state) => state.nextId);
  const nextSeq = useEquipmentStore((state) => state.nextSeq);
  const actor = useAuthUser();

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState<ModuleProduct | null>(null);

  const allModules = useMemo(
    () => mergeModules(moduleCreated, modulePatched, moduleDeleted),
    [moduleCreated, modulePatched, moduleDeleted],
  );

  const modules = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? allModules.filter((item) => item.name.includes(trimmed)
        || item.maker.includes(trimmed)
        || String(item.moduleId).includes(trimmed))
      : allModules;
  }, [allModules, keyword]);

  // 어느 인버터가 이 제품을 쓰는지 — 삭제 확인에 몇 대가 걸려 있는지 적어 준다.
  const usage = useMemo(() => {
    const counts = new Map<string, number>();

    mergeInverterMasters(inverterCreated, inverterPatched, inverterDeleted).forEach((inverter) => {
      counts.set(inverter.moduleProductId, (counts.get(inverter.moduleProductId) ?? 0) + 1);
    });

    return counts;
  }, [inverterCreated, inverterPatched, inverterDeleted]);

  const pageCount = Math.max(1, Math.ceil(modules.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = modules.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openEditor = (target: ModuleProduct | null) => {
    setErrors({});
    setDraft(target ? { ...target, id: target.id } : EMPTY_DRAFT);
  };

  const submit = () => {
    if (!draft) return;

    const found: Record<string, string> = {};

    if (!draft.name.trim()) found.name = MSG.requiredField('모듈명');
    if (!draft.maker.trim()) found.maker = MSG.requiredField('업체명');

    NUMERIC.forEach(({ key, label, min, max }) => {
      const value = draft[key];

      if (value === '' || typeof value !== 'number' || value < min || value > max) {
        found[key] = MSG.numberRange(label, min, max);
      }
    });

    setErrors(found);
    if (Object.keys(found).length === 0) setConfirming(true);
  };

  const commit = () => {
    if (!draft) return;

    const isNew = draft.id === null;
    const before = isNew ? null : allModules.find((item) => item.id === draft.id) ?? null;
    const saved: ModuleProduct = {
      id: draft.id ?? nextId('MOD'),
      moduleId: before?.moduleId ?? nextSeq(),
      name: draft.name.trim(),
      maker: draft.maker.trim(),
      wattPerPanel: Number(draft.wattPerPanel),
      maxVoltage: Number(draft.maxVoltage),
      maxCurrent: Number(draft.maxCurrent),
      openVoltage: Number(draft.openVoltage),
      shortCurrent: Number(draft.shortCurrent),
      voltTempCoeff: Number(draft.voltTempCoeff),
      currentTempCoeff: Number(draft.currentTempCoeff),
      cellType: draft.cellType,
    };
    const target = { kind: 'module' as const, id: saved.id, name: saved.name, actor: actor?.name ?? '관리자' };

    const entries = isNew
      ? createdEntry(target, `${saved.maker} · ${formatNumber(saved.wattPerPanel)}W`)
      : diffEntries(target, [
        { label: '모듈명', before: before?.name ?? '', after: saved.name },
        { label: '업체명', before: before?.maker ?? '', after: saved.maker },
        ...NUMERIC.map(({ key, label, unit }) => ({
          label,
          before: before ? `${String(before[key as keyof ModuleProduct])}${unit}` : '',
          after: `${String(saved[key as keyof ModuleProduct])}${unit}`,
        })),
        {
          label: '셀 종류',
          before: before ? CELL_TYPE_LABEL[before.cellType] : '',
          after: CELL_TYPE_LABEL[saved.cellType],
        },
      ]);

    saveModule(saved, entries, isNew);
    toast.success(isNew ? MSG.createSuccess('모듈 제품') : MSG.updateSuccess(saved.name));
    setConfirming(false);
    setDraft(null);
  };

  const columns: Column<ModuleProduct>[] = [
    {
      key: 'moduleId',
      header: '모듈 ID',
      width: '90px',
      hideOnTablet: true,
      render: (row) => <span className={styles.stackCell__sub}>{row.moduleId}</span>,
    },
    {
      key: 'name',
      header: '모듈명 · 업체',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.name}</strong>
          <span className={styles.stackCell__sub}>{row.maker}</span>
        </span>
      ),
    },
    { key: 'watt', header: '용량', align: 'right', width: '90px', render: (row) => `${formatNumber(row.wattPerPanel)}W` },
    {
      key: 'power',
      header: '최대 전압 · 전류',
      width: '150px',
      hideOnTablet: true,
      render: (row) => `${row.maxVoltage}V · ${row.maxCurrent}A`,
    },
    {
      key: 'open',
      header: '개방 · 단락',
      width: '150px',
      hideOnTablet: true,
      render: (row) => `${row.openVoltage}V · ${row.shortCurrent}A`,
    },
    {
      key: 'coeff',
      header: '온도계수',
      width: '150px',
      hideOnTablet: true,
      render: (row) => `${row.voltTempCoeff} · ${row.currentTempCoeff} %/℃`,
    },
    {
      key: 'cell',
      header: '셀 종류',
      width: '90px',
      align: 'center',
      render: (row) => <Badge tone={row.cellType === 'double' ? 'brand' : 'neutral'}>{CELL_TYPE_LABEL[row.cellType]}</Badge>,
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

  const numberField = (key: keyof Draft, current: Draft) => {
    const spec = NUMERIC.find((item) => item.key === key);

    if (!spec) return null;

    return (
      <NumberField
        label={spec.label}
        value={current[key] as number | ''}
        onChange={(value) => setDraft({ ...current, [key]: value })}
        min={spec.min}
        max={spec.max}
        step={0.01}
        unit={spec.unit}
        required
        error={errors[key]}
      />
    );
  };

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
            placeholder="모듈명으로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(modules.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => openEditor(null)}>
            모듈 등록
          </Button>
        </div>
      </div>

      <Reveal delay={0.05}>
        <Card
          eyebrow="Module"
          title="모듈 제품"
          description="여기에 등록한 제품을 인버터 등록에서 고릅니다. 용량은 설비용량 산출에 그대로 쓰입니다."
        >
          {modules.length === 0 ? (
            <EmptyState title="조건에 맞는 제품이 없습니다" description="검색어를 지우거나 새 제품을 등록해 보세요." />
          ) : (
            <>
              <Table
                caption="모듈 제품 목록. 모듈명과 업체, 용량, 최대 전압·전류, 개방·단락, 온도계수, 셀 종류 순입니다."
                columns={columns}
                rows={pageRows}
                getRowKey={(row) => row.id}
              />
              <Pagination
                page={currentPage}
                pageCount={pageCount}
                totalCount={modules.length}
                onChange={setPage}
                label="모듈 제품 목록"
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

      <DeviceHistory kind="module" keyword={keyword} title="모듈 제품 변경 이력" />

      <Modal
        isOpen={draft !== null}
        onClose={() => setDraft(null)}
        size="lg"
        title={draft?.id === null ? '모듈 제품 등록' : '모듈 제품 수정'}
        description="제조사 데이터시트의 STC 기준 값을 넣습니다."
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
            <FormSection legend="제품 정보">
              <FormRow cols={2}>
                <TextField
                  label="모듈명"
                  value={draft.name}
                  onChange={(value) => setDraft({ ...draft, name: value })}
                  required
                  error={errors.name}
                />
                <TextField
                  label="업체명"
                  value={draft.maker}
                  onChange={(value) => setDraft({ ...draft, maker: value })}
                  required
                  error={errors.maker}
                />
              </FormRow>
              <FormRow cols={2}>
                {numberField('wattPerPanel', draft)}
                <RadioGroup
                  legend="셀 종류"
                  value={draft.cellType}
                  onChange={(value) => setDraft({ ...draft, cellType: value })}
                  options={[
                    { value: 'single', label: CELL_TYPE_LABEL.single },
                    { value: 'double', label: CELL_TYPE_LABEL.double },
                  ]}
                  required
                />
              </FormRow>
            </FormSection>

            <FormSection legend="전기 특성" hint="최대 출력 동작점과 개방·단락 값입니다.">
              <FormRow cols={2}>
                {numberField('maxVoltage', draft)}
                {numberField('maxCurrent', draft)}
              </FormRow>
              <FormRow cols={2}>
                {numberField('openVoltage', draft)}
                {numberField('shortCurrent', draft)}
              </FormRow>
            </FormSection>

            <FormSection legend="온도계수" hint="전압은 음수, 전류는 양수입니다.">
              <FormRow cols={2}>
                {numberField('voltTempCoeff', draft)}
                {numberField('currentTempCoeff', draft)}
              </FormRow>
            </FormSection>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={confirming}
        title={draft?.id === null ? MSG.createConfirm('모듈 제품') : MSG.updateConfirm(draft?.name ?? '모듈 제품')}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setConfirming(false)}
      />

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '모듈 제품')}
        description={deleting && (usage.get(deleting.id) ?? 0) > 0
          ? `이 제품을 쓰는 인버터가 ${formatNumber(usage.get(deleting.id) ?? 0)}대 있습니다. 삭제하면 해당 인버터의 모듈을 다시 골라야 합니다.`
          : '등록 이력에는 삭제한 사실이 남습니다.'}
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => {
          if (!deleting) return;

          removeModule(deleting.id, deletedEntry(
            { kind: 'module', id: deleting.id, name: deleting.name, actor: actor?.name ?? '관리자' },
            `${deleting.maker} · ${formatNumber(deleting.wattPerPanel)}W`,
          ));
          toast.success(MSG.deleteSuccess(deleting.name));
          setDeleting(null);
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

export default ModuleDepth;
