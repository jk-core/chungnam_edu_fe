import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { FormRow, FormSection, NumberField, RadioGroup, TextArea, TextField } from '@/components/common/Form';
import { computeInverterCapacity, INVERTER_KIND_LABEL } from '@/mocks/deviceMaster';
import { getSchoolById } from '@/mocks/schools';
import { INVERTER_PHASE_LABEL } from '@/mocks/equipment';
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
import useEquipmentStore, { mergeInverterMasters, mergeModules } from '@/stores/equipmentStore';
import type { Column } from '@/components/common/Table';
import type { InverterKind, InverterMaster } from '@/interface/deviceMaster';
import styles from '../../Admin.module.scss';
import { createdEntry, deletedEntry, diffEntries } from '../utils/deviceChangeLog';
import { DeviceHistory } from '../components/DeviceHistory';

/** RTU 포트 범위. 3번은 일사량계 몫이라 인버터가 못 쓴다. */
const PORT_MIN = 0;
const PORT_MAX = 10;

/** 표 한 줄 — 등록 정보에 발전소·모듈 이름과 산출 용량을 붙인 것 */
interface InverterRow extends InverterMaster {
  plantName: string;
  moduleName: string;
}

interface Draft {
  id: string | null;
  plantId: string;
  name: string;
  maker: string;
  productName: string;
  rtuCommId: string;
  rtuPort: number | '';
  kind: InverterKind;
  phase: 'single' | 'three';
  moduleProductId: string;
  series1: number | '';
  parallel1: number | '';
  series2: number | '';
  parallel2: number | '';
  /** 설비용량(kW) — 모듈 구성에서 산출해 채우되 손으로 고칠 수 있다 */
  equipmentCapacity: number | '';
  note: string;
  installedAt: string;
  operatedAt: string;
}

const KIND_OPTIONS = (Object.keys(INVERTER_KIND_LABEL) as InverterKind[])
  .map((value) => ({ value, label: INVERTER_KIND_LABEL[value] }));

/** 인버터 관리 (SFR-017-04) — 등록 정보만 다룬다. 운영 상태는 통합관제·AI진단에서 본다. */
function InverterDepth() {
  const inverterCreated = useEquipmentStore((state) => state.inverterCreated);
  const inverterPatched = useEquipmentStore((state) => state.inverterPatched);
  const inverterDeleted = useEquipmentStore((state) => state.inverterDeleted);
  const moduleCreated = useEquipmentStore((state) => state.moduleCreated);
  const modulePatched = useEquipmentStore((state) => state.modulePatched);
  const moduleDeleted = useEquipmentStore((state) => state.moduleDeleted);
  const saveInverter = useEquipmentStore((state) => state.saveInverter);
  const removeInverter = useEquipmentStore((state) => state.removeInverter);
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
  const [deleting, setDeleting] = useState<InverterRow | null>(null);

  const modules = useMemo(
    () => mergeModules(moduleCreated, modulePatched, moduleDeleted),
    [moduleCreated, modulePatched, moduleDeleted],
  );

  const allRows = useMemo<InverterRow[]>(() => {
    const moduleById = new Map(modules.map((item) => [item.id, item]));

    // 지운 발전소의 설비는 목록에서 함께 감춘다 (SFR-016-05).
    return mergeInverterMasters(inverterCreated, inverterPatched, inverterDeleted)
      .filter((master) => !deletedPlants.includes(master.plantId))
      .map((master) => {
        const product = moduleById.get(master.moduleProductId) ?? null;

        return {
          ...master,
          plantName: getSchoolById(master.plantId)?.name ?? master.plantId,
          moduleName: product?.name ?? '모듈 미지정',
        };
      });
  }, [inverterCreated, inverterPatched, inverterDeleted, modules, deletedPlants]);

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
        || row.maker.includes(trimmed))
      : allRows;
  }, [allRows, keyword]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  /*
    모듈·직병렬을 만지면 설비용량을 다시 셈해 채운다 (SFR-016-03).
    서버는 `equipmentCapacity` 를 값으로 받으므로 폼이 그 값을 들고 있어야 한다 —
    자동으로 채우되 현장 실측이 다르면 손으로 고칠 수 있게 둔다.
  */
  const capacityOf = (next: Draft): number | '' => {
    const product = modules.find((item) => item.id === next.moduleProductId);

    if (!product) return next.equipmentCapacity;

    const value = computeInverterCapacity({
      series1: Number(next.series1 || 0),
      parallel1: Number(next.parallel1 || 0),
      series2: Number(next.series2 || 0),
      parallel2: Number(next.parallel2 || 0),
    }, product.wattPerPanel);

    return Math.round(value * 1000) / 1000;
  };

  /** 모듈 구성을 바꾼 초안 — 설비용량까지 함께 갱신해 넣는다. */
  const setArray = (next: Draft) => setDraft({ ...next, equipmentCapacity: capacityOf(next) });

  const openEditor = (target: InverterRow | null) => {
    setErrors({});
    setDraft(target
      ? {
        id: target.inverterId,
        plantId: target.plantId,
        name: target.name,
        maker: target.maker,
        productName: target.productName,
        rtuCommId: target.rtuCommId,
        rtuPort: target.rtuPort ?? '',
        kind: target.kind,
        phase: target.phase,
        moduleProductId: target.moduleProductId,
        series1: target.series1,
        parallel1: target.parallel1,
        series2: target.series2,
        parallel2: target.parallel2,
        equipmentCapacity: target.equipmentCapacity,
        note: target.note,
        installedAt: target.installedAt,
        operatedAt: target.operatedAt,
      }
      : {
        id: null,
        plantId: SCHOOLS[0]?.id ?? '',
        name: '',
        maker: '',
        productName: '',
        rtuCommId: '',
        rtuPort: '',
        kind: 'string',
        phase: 'three',
        moduleProductId: modules[0]?.id ?? '',
        series1: '',
        parallel1: '',
        series2: 0,
        parallel2: 0,
        equipmentCapacity: '',
        note: '',
        installedAt: '',
        operatedAt: '',
      });
  };

  const submit = () => {
    if (!draft) return;

    const found: Record<string, string> = {};

    if (!draft.name.trim()) found.name = MSG.requiredField('설비 이름');
    if (!draft.maker.trim()) found.maker = MSG.requiredField('인버터 업체명');
    if (!draft.moduleProductId) found.moduleProductId = MSG.selectRequired('모듈 모델');
    if (!draft.rtuCommId.trim()) found.rtuCommId = MSG.requiredField('RTU 통신 ID');

    if (draft.rtuPort === '' || draft.rtuPort < PORT_MIN || draft.rtuPort > PORT_MAX) {
      found.rtuPort = MSG.numberRange('RTU 포트', PORT_MIN, PORT_MAX);
    } else if (draft.rtuPort === PYRANOMETER_PORT) {
      found.rtuPort = `${PYRANOMETER_PORT}번 포트는 일사량계 몫이라 쓸 수 없습니다.`;
    }

    if (draft.series1 === '' || draft.series1 < 1) found.series1 = MSG.requiredField('직렬 1');
    if (draft.parallel1 === '' || draft.parallel1 < 1) found.parallel1 = MSG.requiredField('병렬 1');
    if (draft.equipmentCapacity === '' || draft.equipmentCapacity <= 0) {
      found.equipmentCapacity = MSG.requiredField('설비용량');
    }

    setErrors(found);
    if (Object.keys(found).length === 0) setConfirming(true);
  };

  const commit = () => {
    if (!draft) return;

    const isNew = draft.id === null;
    const before = isNew ? null : allRows.find((row) => row.inverterId === draft.id) ?? null;
    const saved: InverterMaster = {
      inverterId: draft.id ?? nextId('INV'),
      cid: before?.cid ?? 10192000000 + nextSeq(),
      plantId: draft.plantId,
      name: draft.name.trim(),
      maker: draft.maker.trim(),
      productName: draft.productName.trim(),
      rtuCommId: draft.rtuCommId.trim(),
      rtuPort: draft.rtuPort === '' ? null : Number(draft.rtuPort),
      kind: draft.kind,
      phase: draft.phase,
      moduleProductId: draft.moduleProductId,
      series1: Number(draft.series1),
      parallel1: Number(draft.parallel1),
      series2: Number(draft.series2 || 0),
      parallel2: Number(draft.parallel2 || 0),
      equipmentCapacity: Number(draft.equipmentCapacity || 0),
      note: draft.note.trim(),
      installedAt: draft.installedAt.trim(),
      // 운영일시는 설치일시를 따라간다 — 손으로 고치는 값이 아니다.
      operatedAt: draft.operatedAt.trim() || draft.installedAt.trim(),
    };
    const plantName = getSchoolById(saved.plantId)?.name ?? saved.plantId;
    const moduleName = modules.find((item) => item.id === saved.moduleProductId)?.name ?? '';
    const target = { kind: 'inverter' as const, id: saved.inverterId, name: saved.name, actor: actor?.name ?? '관리자' };

    const entries = isNew
      ? createdEntry(target, `${plantName} · ${saved.maker} · ${formatNumber(saved.equipmentCapacity, 1)}kW`)
      : diffEntries(target, [
        { label: '설비 이름', before: before?.name ?? '', after: saved.name },
        { label: '발전소', before: before?.plantName ?? '', after: plantName },
        { label: '인버터 업체명', before: before?.maker ?? '', after: saved.maker },
        { label: '인버터 모델명', before: before?.productName ?? '', after: saved.productName },
        { label: 'RTU 통신 ID', before: before?.rtuCommId ?? '', after: saved.rtuCommId },
        { label: 'RTU 포트', before: String(before?.rtuPort ?? ''), after: String(saved.rtuPort ?? '') },
        {
          label: '인버터 타입',
          before: before ? INVERTER_KIND_LABEL[before.kind] : '',
          after: INVERTER_KIND_LABEL[saved.kind],
        },
        {
          label: '위상',
          before: before ? INVERTER_PHASE_LABEL[before.phase] : '',
          after: INVERTER_PHASE_LABEL[saved.phase],
        },
        { label: '모듈 모델', before: before?.moduleName ?? '', after: moduleName },
        {
          label: '모듈 구성',
          before: before ? `${before.series1}×${before.parallel1} / ${before.series2}×${before.parallel2}` : '',
          after: `${saved.series1}×${saved.parallel1} / ${saved.series2}×${saved.parallel2}`,
        },
        {
          label: '설비용량',
          before: before ? `${formatNumber(before.equipmentCapacity, 1)}kW` : '',
          after: `${formatNumber(saved.equipmentCapacity, 1)}kW`,
        },
        { label: '설치일시', before: before?.installedAt ?? '', after: saved.installedAt },
        { label: '비고', before: before?.note ?? '', after: saved.note },
      ]);

    saveInverter(saved, entries, isNew);
    toast.success(isNew ? MSG.createSuccess('인버터') : MSG.updateSuccess(saved.name));
    setConfirming(false);
    setDraft(null);
  };

  const columns: Column<InverterRow>[] = [
    {
      key: 'cid',
      header: 'CID',
      width: '120px',
      hideOnTablet: true,
      render: (row) => <span className={styles.stackCell__sub}>{row.cid}</span>,
    },
    {
      key: 'plant',
      header: '발전소 · 인버터',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.plantName}</strong>
          <span className={styles.stackCell__sub}>{row.name} · {row.maker}</span>
        </span>
      ),
    },
    { key: 'kind', header: '유형', width: '100px', render: (row) => INVERTER_KIND_LABEL[row.kind] },
    { key: 'phase', header: '위상', width: '110px', hideOnTablet: true, render: (row) => INVERTER_PHASE_LABEL[row.phase] },
    {
      key: 'capacity',
      header: '설비용량',
      align: 'right',
      width: '100px',
      render: (row) => `${formatNumber(row.equipmentCapacity, 1)}kW`,
    },
    {
      key: 'units',
      header: '모듈 구성',
      width: '170px',
      hideOnTablet: true,
      render: (row) => (
        <span className={styles.stackCell}>
          <span>{row.series1}직렬 × {row.parallel1}병렬</span>
          <span className={styles.stackCell__sub}>{row.moduleName}</span>
        </span>
      ),
    },
    {
      key: 'rtu',
      header: 'RTU 통신 ID · 포트',
      width: '160px',
      hideOnTablet: true,
      render: (row) => `${row.rtuCommId} · ${row.rtuPort ?? '—'}번`,
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
            placeholder="인버터명·CID·RTU 통신ID 로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => openEditor(null)}>
            인버터 등록
          </Button>
        </div>
      </div>

      <Reveal delay={0.05}>
        <Card
          eyebrow="Inverter"
          title="인버터 목록"
          description="등록 정보를 고치면 설비용량은 모듈 구성에서 다시 계산합니다."
        >
          {rows.length === 0 ? (
            <EmptyState title="조건에 맞는 인버터가 없습니다" description="검색어를 지우거나 새 설비를 등록해 보세요." />
          ) : (
            <>
              <Table
                caption="인버터 목록. 발전소와 인버터, 유형, 위상, 산출 용량, 모듈 구성, RTU 통신 설정 순입니다."
                columns={columns}
                rows={pageRows}
                getRowKey={(row) => row.inverterId}
              />
              <Pagination
                page={currentPage}
                pageCount={pageCount}
                totalCount={rows.length}
                onChange={setPage}
                label="인버터 목록"
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

      <DeviceHistory kind="inverter" keyword={keyword} title="인버터 변경 이력" />

      <Modal
        isOpen={draft !== null}
        onClose={() => setDraft(null)}
        size="lg"
        title={draft?.id === null ? '인버터 등록' : '인버터 수정'}
        description="설비용량은 입력하지 않습니다. 모듈 모델과 직병렬 구성에서 산출합니다."
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
            <FormSection legend="설비 정보">
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
                  error={errors.name}
                />
              </FormRow>
              <FormRow cols={2}>
                <TextField
                  label="인버터 업체명"
                  value={draft.maker}
                  onChange={(value) => setDraft({ ...draft, maker: value })}
                  required
                  error={errors.maker}
                />
                <TextField
                  label="인버터 모델명"
                  value={draft.productName}
                  onChange={(value) => setDraft({ ...draft, productName: value })}
                  ime="latin"
                  optional
                />
              </FormRow>
              <FormRow cols={2}>
                <Select
                  label="인버터 타입"
                  value={draft.kind}
                  onChange={(value) => setDraft({ ...draft, kind: value })}
                  options={KIND_OPTIONS}
                />
                <RadioGroup
                  legend="위상"
                  value={draft.phase}
                  onChange={(value) => setDraft({ ...draft, phase: value })}
                  options={[
                    { value: 'single', label: INVERTER_PHASE_LABEL.single },
                    { value: 'three', label: INVERTER_PHASE_LABEL.three },
                  ]}
                  required
                />
              </FormRow>
              <FormRow cols={2}>
                <TextField
                  label="설치일시"
                  value={draft.installedAt}
                  onChange={(value) => setDraft({ ...draft, installedAt: value })}
                  ime="numeric"
                  hint="YYYY-MM-DD"
                />
                <TextField
                  label="운영일시"
                  value={draft.operatedAt || draft.installedAt}
                  onChange={() => undefined}
                  readOnly
                  hint="설치일시를 따릅니다"
                />
              </FormRow>
            </FormSection>

            <FormSection legend="통신" hint={`${PYRANOMETER_PORT}번 포트는 일사량계가 씁니다.`}>
              <FormRow cols={2}>
                <TextField
                  label="RTU 통신 ID"
                  value={draft.rtuCommId}
                  onChange={(value) => setDraft({ ...draft, rtuCommId: value })}
                  ime="latin"
                  required
                  error={errors.rtuCommId}
                />
                <NumberField
                  label="RTU 포트"
                  value={draft.rtuPort}
                  onChange={(value) => setDraft({ ...draft, rtuPort: value })}
                  min={PORT_MIN}
                  max={PORT_MAX}
                  required
                  error={errors.rtuPort}
                />
              </FormRow>
            </FormSection>

            <FormSection legend="모듈 구성" hint="MPPT 2번을 쓰지 않으면 0으로 둡니다.">
              <FormRow cols={2}>
                <Select
                  label="모듈 모델"
                  value={draft.moduleProductId}
                  onChange={(value) => setArray({ ...draft, moduleProductId: value })}
                  options={modules.map((item) => ({
                    value: item.id,
                    label: `${item.name} · ${item.wattPerPanel}W`,
                  }))}
                />
              </FormRow>
              <FormRow cols={2}>
                <NumberField
                  label="직렬 1"
                  value={draft.series1}
                  onChange={(value) => setArray({ ...draft, series1: value })}
                  min={1}
                  unit="개"
                  required
                  error={errors.series1}
                />
                <NumberField
                  label="병렬 1"
                  value={draft.parallel1}
                  onChange={(value) => setArray({ ...draft, parallel1: value })}
                  min={1}
                  unit="개"
                  required
                  error={errors.parallel1}
                />
              </FormRow>
              <FormRow cols={2}>
                <NumberField
                  label="직렬 2"
                  value={draft.series2}
                  onChange={(value) => setArray({ ...draft, series2: value })}
                  min={0}
                  unit="개"
                />
                <NumberField
                  label="병렬 2"
                  value={draft.parallel2}
                  onChange={(value) => setArray({ ...draft, parallel2: value })}
                  min={0}
                  unit="개"
                />
              </FormRow>

              <FormRow cols={2}>
                <NumberField
                  label="설비용량"
                  value={draft.equipmentCapacity}
                  onChange={(value) => setDraft({ ...draft, equipmentCapacity: value })}
                  min={0}
                  step={0.001}
                  unit="kW"
                  required
                  hint="모듈 출력 × (직렬 × 병렬)로 채워집니다"
                  error={errors.equipmentCapacity}
                />
              </FormRow>
            </FormSection>

            <FormSection legend="비고">
              <TextArea
                label="메모"
                value={draft.note}
                onChange={(value) => setDraft({ ...draft, note: value })}
                optional
                placeholder="교체 예정이나 점검 시 주의할 점을 적어 두세요."
              />
            </FormSection>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={confirming}
        title={draft?.id === null ? MSG.createConfirm('인버터') : MSG.updateConfirm(draft?.name ?? '인버터')}
        description={draft?.equipmentCapacity === ''
          ? undefined
          : `설비용량은 ${formatNumber(Number(draft?.equipmentCapacity ?? 0), 1)}kW 로 저장됩니다.`}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setConfirming(false)}
      />

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '인버터')}
        description="이 인버터에 딸린 접속반·스트링 등록 정보는 남습니다. 각 화면에서 따로 정리해 주세요."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => {
          if (!deleting) return;

          removeInverter(deleting.inverterId, deletedEntry(
            { kind: 'inverter', id: deleting.inverterId, name: deleting.name, actor: actor?.name ?? '관리자' },
            `${deleting.plantName} · ${formatNumber(deleting.equipmentCapacity, 1)}kW`,
          ));
          toast.success(MSG.deleteSuccess(deleting.name));
          setDeleting(null);
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

export default InverterDepth;
