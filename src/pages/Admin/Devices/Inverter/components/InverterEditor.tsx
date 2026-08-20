import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { computeInverterCapacity, INVERTER_KIND_LABEL } from '@/mocks/deviceMaster';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormRow, FormSection, NumberField, RadioGroup, TextArea, TextField } from '@/components/common/Form';
import { getSchoolById, SCHOOLS } from '@/mocks/schools';
import { INVERTER_PHASE_LABEL } from '@/mocks/equipment';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { PYRANOMETER_PORT } from '@/mocks/pyranometers';
import { Select } from '@/components/common/Select';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useDeletedPlants } from '@/stores/assetStore';
import useEquipmentStore from '@/stores/equipmentStore';
import type { InverterKind, InverterMaster } from '@/interface/deviceMaster';
import styles from '@/pages/Admin/Admin.module.scss';
import { createdEntry, diffEntries } from '../../utils/deviceChangeLog';
import { useModuleProducts } from '../hooks/useInverterRows';
import type { InverterRow } from '../hooks/useInverterRows';

/** RTU 포트 범위. 3번은 일사량계 몫이라 인버터가 못 쓴다. */
const PORT_MIN = 0;
const PORT_MAX = 10;

/** CID 는 기존 체계를 따라 이 값에 일련번호를 더해 만든다 */
const CID_BASE = 10192000000;

const KIND_OPTIONS = (Object.keys(INVERTER_KIND_LABEL) as InverterKind[])
  .map((value) => ({ value, label: INVERTER_KIND_LABEL[value] }));

interface Draft {
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

interface InverterEditorProps {
  /** 고친다면 그 설비, 새로 등록한다면 null */
  target: InverterRow | null;
  onClose: () => void;
}

function draftOf(target: InverterRow | null, firstModuleId: string): Draft {
  return target
    ? {
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
      plantId: SCHOOLS[0]?.id ?? '',
      name: '',
      maker: '',
      productName: '',
      rtuCommId: '',
      rtuPort: '',
      kind: 'string',
      phase: 'three',
      moduleProductId: firstModuleId,
      series1: '',
      parallel1: '',
      series2: 0,
      parallel2: 0,
      equipmentCapacity: '',
      note: '',
      installedAt: '',
      operatedAt: '',
    };
}

/** 인버터 등록·수정 (SFR-017-04) */
export function InverterEditor({ target, onClose }: InverterEditorProps) {
  const saveInverter = useEquipmentStore((state) => state.saveInverter);
  const nextId = useEquipmentStore((state) => state.nextId);
  const nextSeq = useEquipmentStore((state) => state.nextSeq);
  const deletedPlants = useDeletedPlants();
  const actor = useAuthUser();
  const modules = useModuleProducts();

  const [draft, setDraft] = useState<Draft>(() => draftOf(target, modules[0]?.id ?? ''));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirming, setIsConfirming] = useState(false);

  const isNew = target === null;
  const plantOptions = useMemo(
    () => SCHOOLS
      .filter((school) => !deletedPlants.includes(school.id))
      .map((school) => ({ value: school.id, label: school.name })),
    [deletedPlants],
  );

  const change = (next: Partial<Draft>) => setDraft({ ...draft, ...next });

  /*
    모듈·직병렬을 만지면 설비용량을 다시 셈해 채운다 (SFR-016-03).
    서버는 `equipmentCapacity` 를 값으로 받으므로 폼이 그 값을 들고 있어야 한다 —
    자동으로 채우되 현장 실측이 다르면 손으로 고칠 수 있게 둔다.
  */
  const changeArray = (next: Partial<Draft>) => {
    const merged = { ...draft, ...next };
    const product = modules.find((item) => item.id === merged.moduleProductId);

    if (!product) {
      setDraft(merged);

      return;
    }

    const capacity = computeInverterCapacity({
      series1: Number(merged.series1 || 0),
      parallel1: Number(merged.parallel1 || 0),
      series2: Number(merged.series2 || 0),
      parallel2: Number(merged.parallel2 || 0),
    }, product.wattPerPanel);

    setDraft({ ...merged, equipmentCapacity: Math.round(capacity * 1000) / 1000 });
  };

  const submit = () => {
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
    if (Object.keys(found).length === 0) setIsConfirming(true);
  };

  const commit = () => {
    const saved: InverterMaster = {
      inverterId: target?.inverterId ?? nextId('INV'),
      cid: target?.cid ?? CID_BASE + nextSeq(),
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
    const logTarget = {
      kind: 'inverter' as const,
      id: saved.inverterId,
      name: saved.name,
      actor: actor?.name ?? '관리자',
    };

    const entries = isNew
      ? createdEntry(logTarget, `${plantName} · ${saved.maker} · ${formatNumber(saved.equipmentCapacity, 1)}kW`)
      : diffEntries(logTarget, [
        { label: '설비 이름', before: target?.name ?? '', after: saved.name },
        { label: '발전소', before: target?.plantName ?? '', after: plantName },
        { label: '인버터 업체명', before: target?.maker ?? '', after: saved.maker },
        { label: '인버터 모델명', before: target?.productName ?? '', after: saved.productName },
        { label: 'RTU 통신 ID', before: target?.rtuCommId ?? '', after: saved.rtuCommId },
        { label: 'RTU 포트', before: String(target?.rtuPort ?? ''), after: String(saved.rtuPort ?? '') },
        {
          label: '인버터 타입',
          before: target ? INVERTER_KIND_LABEL[target.kind] : '',
          after: INVERTER_KIND_LABEL[saved.kind],
        },
        {
          label: '위상',
          before: target ? INVERTER_PHASE_LABEL[target.phase] : '',
          after: INVERTER_PHASE_LABEL[saved.phase],
        },
        { label: '모듈 모델', before: target?.moduleName ?? '', after: moduleName },
        {
          label: '모듈 구성',
          before: target ? `${target.series1}×${target.parallel1} / ${target.series2}×${target.parallel2}` : '',
          after: `${saved.series1}×${saved.parallel1} / ${saved.series2}×${saved.parallel2}`,
        },
        {
          label: '설비용량',
          before: target ? `${formatNumber(target.equipmentCapacity, 1)}kW` : '',
          after: `${formatNumber(saved.equipmentCapacity, 1)}kW`,
        },
        { label: '설치일시', before: target?.installedAt ?? '', after: saved.installedAt },
        { label: '비고', before: target?.note ?? '', after: saved.note },
      ]);

    saveInverter(saved, entries, isNew);
    toast.success(isNew ? MSG.createSuccess('인버터') : MSG.updateSuccess(saved.name));
    setIsConfirming(false);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        size="lg"
        title={isNew ? '인버터 등록' : '인버터 수정'}
        description="설비용량은 입력하지 않습니다. 모듈 모델과 직병렬 구성에서 산출합니다."
        footer={(
          <>
            <Button variant="secondary" onClick={onClose}>취소</Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
        <div className={styles.form}>
          <FormSection legend="설비 정보">
            <FormRow cols={2}>
              <Select
                label="발전소"
                value={draft.plantId}
                onChange={(value) => change({ plantId: value })}
                options={plantOptions}
              />
              <TextField
                label="설비 이름"
                value={draft.name}
                onChange={(value) => change({ name: value })}
                required
                error={errors.name}
              />
            </FormRow>
            <FormRow cols={2}>
              <TextField
                label="인버터 업체명"
                value={draft.maker}
                onChange={(value) => change({ maker: value })}
                required
                error={errors.maker}
              />
              <TextField
                label="인버터 모델명"
                value={draft.productName}
                onChange={(value) => change({ productName: value })}
                ime="latin"
                optional
              />
            </FormRow>
            <FormRow cols={2}>
              <Select
                label="인버터 타입"
                value={draft.kind}
                onChange={(value) => change({ kind: value })}
                options={KIND_OPTIONS}
              />
              <RadioGroup
                legend="위상"
                value={draft.phase}
                onChange={(value) => change({ phase: value })}
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
                onChange={(value) => change({ installedAt: value })}
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
                onChange={(value) => change({ rtuCommId: value })}
                ime="latin"
                required
                error={errors.rtuCommId}
              />
              <NumberField
                label="RTU 포트"
                value={draft.rtuPort}
                onChange={(value) => change({ rtuPort: value })}
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
                onChange={(value) => changeArray({ moduleProductId: value })}
                options={modules.map((item) => ({ value: item.id, label: `${item.name} · ${item.wattPerPanel}W` }))}
              />
            </FormRow>
            <FormRow cols={2}>
              <NumberField
                label="직렬 1"
                value={draft.series1}
                onChange={(value) => changeArray({ series1: value })}
                min={1}
                unit="개"
                required
                error={errors.series1}
              />
              <NumberField
                label="병렬 1"
                value={draft.parallel1}
                onChange={(value) => changeArray({ parallel1: value })}
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
                onChange={(value) => changeArray({ series2: value })}
                min={0}
                unit="개"
              />
              <NumberField
                label="병렬 2"
                value={draft.parallel2}
                onChange={(value) => changeArray({ parallel2: value })}
                min={0}
                unit="개"
              />
            </FormRow>

            <FormRow cols={2}>
              <NumberField
                label="설비용량"
                value={draft.equipmentCapacity}
                onChange={(value) => change({ equipmentCapacity: value })}
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
              onChange={(value) => change({ note: value })}
              optional
              placeholder="교체 예정이나 점검 시 주의할 점을 적어 두세요."
            />
          </FormSection>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirming}
        title={isNew ? MSG.createConfirm('인버터') : MSG.updateConfirm(draft.name)}
        description={draft.equipmentCapacity === ''
          ? undefined
          : `설비용량은 ${formatNumber(Number(draft.equipmentCapacity), 1)}kW 로 저장됩니다.`}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
      />
    </>
  );
}
