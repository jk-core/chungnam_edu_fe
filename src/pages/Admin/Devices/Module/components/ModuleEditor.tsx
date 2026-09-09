import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { CELL_TYPE } from '@/configs/codes';
import { CELL_TYPE_LABEL } from '@/mocks/moduleProducts';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createdEntry, deletedEntry, diffEntries } from '@/pages/Admin/_shared/changeLog';
import { createForm, FormRow, FormSection } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { moduleFormSchema, NUMERIC } from '@/service/module/type';
import { MSG } from '@/configs/messages';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useModuleProducts } from '@/pages/Admin/Plants/Equipment/hooks/useEquipmentRows';
import useEquipmentStore, { mergeEquipment } from '@/stores/equipmentStore';
import type { ModuleFormValues, NumericKey } from '@/service/module/type';
import type { ModuleProduct } from '@/interface/deviceMaster';
import { cellTypeFromCode, EMPTY_VALUES, toFormValues } from './values';

const Form = createForm<ModuleFormValues>();

/** 표에 적어 둔 범위·단위를 그대로 입력 칸에 옮긴다. */
function NumberSpec({ name }: { name: NumericKey }) {
  const spec = NUMERIC.find((item) => item.key === name);

  if (!spec) return null;

  return (
    <Form.Number
      label={spec.label}
      name={name}
      min={spec.min}
      max={spec.max}
      step={0.01}
      unit={spec.unit}
      placeholder={`${spec.min} ~ ${spec.max}`}
      required
    />
  );
}

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
  const isNew = target === null;

  const methods = useForm<ModuleFormValues>({
    defaultValues: target ? toFormValues(target) : EMPTY_VALUES,
    resolver: zodResolver(moduleFormSchema),
    mode: 'onChange',
  });

  const [pending, setPending] = useState<ModuleFormValues | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 이 제품을 쓰는 설비가 몇 대인지 — 삭제 확인에 적어 준다.
  const inUse = useMemo(
    () => mergeEquipment(equipmentCreated, equipmentPatched, equipmentDeleted)
      .filter((item) => item.moduleProductId === target?.id).length,
    [equipmentCreated, equipmentPatched, equipmentDeleted, target],
  );

  const commit = (values: ModuleFormValues) => {
    const saved: ModuleProduct = {
      id: target?.id ?? nextId('MOD'),
      moduleId: target?.moduleId ?? nextSeq(),
      name: values.moduleName,
      maker: values.moduleEnterpriseName,
      cellType: cellTypeFromCode(values.cellTypeCode),
      wattPerPanel: values.pwrMp,
      maxVoltage: values.vltMp,
      maxCurrent: values.curMp,
      openVoltage: values.vltOc,
      shortCurrent: values.curSc,
      voltTempCoeff: values.tempVltCof,
      currentTempCoeff: values.tempCurCof,
    };
    const logTarget = { targetType: 'module' as const, id: saved.id, name: saved.name, actor: actor?.name ?? '관리자' };

    const entries = isNew
      ? createdEntry(logTarget, `${saved.maker} · ${formatNumber(saved.wattPerPanel)}W`)
      : diffEntries(logTarget, [
        { label: '모듈명', before: target?.name ?? '', after: saved.name },
        { label: '업체명', before: target?.maker ?? '', after: saved.maker },
        ...NUMERIC.map(({ key, label, unit }) => ({
          label,
          before: target ? `${toFormValues(target)[key]}${unit}` : '',
          after: `${values[key]}${unit}`,
        })),
        {
          label: '셀 종류',
          before: target ? CELL_TYPE_LABEL[target.cellType] : '',
          after: CELL_TYPE_LABEL[saved.cellType],
        },
      ]);

    saveModule(saved, entries, isNew);
    toast.success(isNew ? MSG.createSuccess('모듈 제품') : MSG.updateSuccess(saved.name));
    navigate(backTo);
  };

  const remove = () => {
    if (!target) return;

    removeModule(target.id, deletedEntry(
      { targetType: 'module', id: target.id, name: target.name, actor: actor?.name ?? '관리자' },
      `${target.maker} · ${formatNumber(target.wattPerPanel)}W`,
    ));
    toast.success(MSG.deleteSuccess(target.name));
    navigate(backTo);
  };

  return (
    <>
      <Form methods={methods} onSubmit={setPending}>
        <FormPage
          title={isNew ? '모듈 제품 등록' : '모듈 제품 수정'}
          description="제조사 데이터시트의 STC 기준 값을 넣습니다."
          backTo={backTo}
          danger={isNew ? null : <Button variant="solar" onClick={() => setIsDeleting(true)}>삭제</Button>}
          footer={(
            <>
              <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
              <Form.Submit />
            </>
          )}
        >
          <FormSection legend="제품 정보">
            <FormRow cols={2}>
              <Form.Text label="모듈명" name="moduleName" required />
              <Form.Text label="업체명" name="moduleEnterpriseName" required />
            </FormRow>
            <FormRow cols={2}>
              <NumberSpec name="pwrMp" />
              <Form.Radio
                label="셀 종류"
                name="cellTypeCode"
                options={[
                  { value: CELL_TYPE.CODE.단면, label: CELL_TYPE_LABEL.single },
                  { value: CELL_TYPE.CODE.양면, label: CELL_TYPE_LABEL.double },
                ]}
                required
              />
            </FormRow>
          </FormSection>

          <FormSection legend="전기 특성" hint="최대 출력 동작점과 개방·단락 값입니다.">
            <FormRow cols={2}>
              <NumberSpec name="vltMp" />
              <NumberSpec name="curMp" />
            </FormRow>
            <FormRow cols={2}>
              <NumberSpec name="vltOc" />
              <NumberSpec name="curSc" />
            </FormRow>
          </FormSection>

          <FormSection legend="온도계수" hint="전압은 음수, 전류는 양수입니다.">
            <FormRow cols={2}>
              <NumberSpec name="tempVltCof" />
              <NumberSpec name="tempCurCof" />
            </FormRow>
          </FormSection>
        </FormPage>
      </Form>

      <ConfirmDialog
        isOpen={pending !== null}
        title={isNew ? MSG.createConfirm('모듈 제품') : MSG.updateConfirm(pending?.moduleName ?? '모듈 제품')}
        confirmLabel="저장"
        onConfirm={() => pending && commit(pending)}
        onClose={() => setPending(null)}
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
