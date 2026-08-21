import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { CELL_TYPE_LABEL } from '@/mocks/moduleProducts';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormRow, FormSection, NumberField, RadioGroup, TextField } from '@/components/common/Form';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { MSG } from '@/configs/messages';
import { useModuleProducts } from '@/pages/Admin/Plants/Equipment/hooks/useEquipmentRows';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useEquipmentStore, { mergeEquipment } from '@/stores/equipmentStore';
import type { ModuleProduct } from '@/interface/deviceMaster';
import { createdEntry, deletedEntry, diffEntries } from '@/pages/Admin/_shared/device/deviceChangeLog';
import { EMPTY_DRAFT, NUMERIC } from './moduleFields';
import type { ModuleDraft, NumericKey } from './moduleFields';

interface ModuleEditorProps {
  /** 고칠 제품의 서버 식별자. 없으면 새로 세우는 자리다 */
  moduleId: number | null;
}

/** 모듈 제품 등록·수정 (SFR-016-01, SFR-017-05) */
export function ModuleEditor({ moduleId }: ModuleEditorProps) {
  const saveModule = useEquipmentStore((state) => state.saveModule);
  const nextId = useEquipmentStore((state) => state.nextId);
  const nextSeq = useEquipmentStore((state) => state.nextSeq);
  const removeModule = useEquipmentStore((state) => state.removeModule);
  const equipmentCreated = useEquipmentStore((state) => state.equipmentCreated);
  const equipmentPatched = useEquipmentStore((state) => state.equipmentPatched);
  const equipmentDeleted = useEquipmentStore((state) => state.equipmentDeleted);
  const actor = useAuthUser();
  const products = useModuleProducts();
  const navigate = useNavigate();

  const target = products.find((row) => row.moduleId === moduleId) ?? null;
  const backTo = listPath('devices', 'module');

  const [draft, setDraft] = useState<ModuleDraft>(() => (target ? { ...target } : EMPTY_DRAFT));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isNew = target === null;

  // 이 제품을 쓰는 설비가 몇 대인지 — 삭제 확인에 적어 준다.
  const inUse = useMemo(
    () => mergeEquipment(equipmentCreated, equipmentPatched, equipmentDeleted)
      .filter((item) => item.moduleProductId === target?.id).length,
    [equipmentCreated, equipmentPatched, equipmentDeleted, target],
  );

  const submit = () => {
    const found: Record<string, string> = {};

    if (!draft.name.trim()) found.name = MSG.requiredField('모듈명');
    if (!draft.maker.trim()) found.maker = MSG.requiredField('업체명');

    NUMERIC.forEach(({ key, label, min, max }) => {
      const value = draft[key];

      if (value === '' || value < min || value > max) found[key] = MSG.numberRange(label, min, max);
    });

    setErrors(found);
    if (Object.keys(found).length === 0) setIsConfirming(true);
  };

  const commit = () => {
    const saved: ModuleProduct = {
      ...draft,
      id: target?.id ?? nextId('MOD'),
      moduleId: target?.moduleId ?? nextSeq(),
      name: draft.name.trim(),
      maker: draft.maker.trim(),
      wattPerPanel: Number(draft.wattPerPanel),
      maxVoltage: Number(draft.maxVoltage),
      maxCurrent: Number(draft.maxCurrent),
      openVoltage: Number(draft.openVoltage),
      shortCurrent: Number(draft.shortCurrent),
      voltTempCoeff: Number(draft.voltTempCoeff),
      currentTempCoeff: Number(draft.currentTempCoeff),
    };
    const logTarget = { kind: 'module' as const, id: saved.id, name: saved.name, actor: actor?.name ?? '관리자' };

    const entries = isNew
      ? createdEntry(logTarget, `${saved.maker} · ${formatNumber(saved.wattPerPanel)}W`)
      : diffEntries(logTarget, [
        { label: '모듈명', before: target?.name ?? '', after: saved.name },
        { label: '업체명', before: target?.maker ?? '', after: saved.maker },
        ...NUMERIC.map(({ key, label, unit }) => ({
          label,
          before: target ? `${target[key]}${unit}` : '',
          after: `${saved[key]}${unit}`,
        })),
        {
          label: '셀 종류',
          before: target ? CELL_TYPE_LABEL[target.cellType] : '',
          after: CELL_TYPE_LABEL[saved.cellType],
        },
      ]);

    saveModule(saved, entries, isNew);
    toast.success(isNew ? MSG.createSuccess('모듈 제품') : MSG.updateSuccess(saved.name));
    setIsConfirming(false);
    navigate(backTo);
  };

  const remove = () => {
    if (!target) return;

    removeModule(target.id, deletedEntry(
      { kind: 'module', id: target.id, name: target.name, actor: actor?.name ?? '관리자' },
      `${target.maker} · ${formatNumber(target.wattPerPanel)}W`,
    ));
    toast.success(MSG.deleteSuccess(target.name));
    navigate(backTo);
  };

  const numberField = (key: NumericKey) => {
    const spec = NUMERIC.find((item) => item.key === key);

    if (!spec) return null;

    return (
      <NumberField
        label={spec.label}
        value={draft[key]}
        onChange={(value) => setDraft({ ...draft, [key]: value })}
        min={spec.min}
        max={spec.max}
        step={0.01}
        unit={spec.unit}
        placeholder={`${spec.min} ~ ${spec.max}`}
        required
        error={errors[key]}
      />
    );
  };

  return (
    <>
      <FormPage
        title={isNew ? '모듈 제품 등록' : '모듈 제품 수정'}
        description="제조사 데이터시트의 STC 기준 값을 넣습니다."
        backTo={backTo}
        danger={isNew ? null : <Button variant="danger" onClick={() => setIsDeleting(true)}>제품 삭제</Button>}
        footer={(
          <>
            <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
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
            {numberField('wattPerPanel')}
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
            {numberField('maxVoltage')}
            {numberField('maxCurrent')}
          </FormRow>
          <FormRow cols={2}>
            {numberField('openVoltage')}
            {numberField('shortCurrent')}
          </FormRow>
        </FormSection>

        <FormSection legend="온도계수" hint="전압은 음수, 전류는 양수입니다.">
          <FormRow cols={2}>
            {numberField('voltTempCoeff')}
            {numberField('currentTempCoeff')}
          </FormRow>
        </FormSection>
      </FormPage>

      <ConfirmDialog
        isOpen={isConfirming}
        title={isNew ? MSG.createConfirm('모듈 제품') : MSG.updateConfirm(draft.name)}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
      />

      <ConfirmDialog
        isOpen={isDeleting}
        title={MSG.deleteConfirm(target?.name ?? '모듈 제품')}
        description={inUse > 0
          ? `이 제품을 쓰는 설비가 ${formatNumber(inUse)}대 있습니다. 삭제하면 해당 설비의 모듈을 다시 골라야 합니다.`
          : '등록 이력에는 삭제한 사실이 남습니다.'}
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setIsDeleting(false)}
      />
    </>
  );
}
