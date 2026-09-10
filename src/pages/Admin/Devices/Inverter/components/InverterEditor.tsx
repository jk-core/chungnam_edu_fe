import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createdEntry, deletedEntry, diffEntries } from '@/pages/Admin/_shared/changeLog';
import { createForm, FormRow, FormSection } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { INVERTER_KIND_LABEL, kindFromInverterTypeCode } from '@/mocks/deviceMaster';
import { INVERTER_TYPE, PHASE_TYPE } from '@/configs/codes';
import { CAPACITY_MAX, CAPACITY_MIN, inverterFormSchema, NAME_MAX } from '@/service/inverter/type';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { MSG } from '@/configs/messages';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useInverterProducts } from '@/pages/Admin/_shared/device/useSelectableEquipment';
import useEquipmentStore, { mergeEquipment } from '@/stores/equipmentStore';
import type { InverterFormValues } from '@/service/inverter/type';
import type { InverterProduct } from '@/interface/deviceMaster';
import { EMPTY_VALUES, phaseFromCode, toFormValues } from './values';

const Form = createForm<InverterFormValues>();

interface InverterEditorProps {
  /** 고칠 제품의 서버 식별자. 없으면 새로 세우는 자리다 */
  inverterId: number | null;
}

/** 인버터 제품 등록·수정 (SFR-017-04) */
export function InverterEditor({ inverterId }: InverterEditorProps) {
  const saveInverter = useEquipmentStore((state) => state.saveInverter);
  const nextId = useEquipmentStore((state) => state.nextId);
  const nextSeq = useEquipmentStore((state) => state.nextSeq);
  const removeInverter = useEquipmentStore((state) => state.removeInverter);
  const equipmentCreated = useEquipmentStore((state) => state.equipmentCreated);
  const equipmentPatched = useEquipmentStore((state) => state.equipmentPatched);
  const equipmentDeleted = useEquipmentStore((state) => state.equipmentDeleted);
  const actor = useAuthUser();
  const products = useInverterProducts();
  const navigate = useNavigate();

  const target = products.find((row) => row.inverterId === inverterId) ?? null;
  const backTo = listPath('devices', 'inverter');
  const isNew = target === null;

  const methods = useForm<InverterFormValues>({
    defaultValues: target ? toFormValues(target) : EMPTY_VALUES,
    resolver: zodResolver(inverterFormSchema),
    mode: 'onChange',
  });

  // 확인창을 거쳐 저장하므로 검증을 통과한 값을 잠시 들고 있는다.
  const [pending, setPending] = useState<InverterFormValues | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 이 제품을 쓰는 설비가 몇 대인지 — 삭제 확인에 적어 준다.
  const inUse = useMemo(
    () => mergeEquipment(equipmentCreated, equipmentPatched, equipmentDeleted)
      .filter((item) => item.inverterProductId === target?.id).length,
    [equipmentCreated, equipmentPatched, equipmentDeleted, target],
  );

  const commit = (values: InverterFormValues) => {
    const saved: InverterProduct = {
      id: target?.id ?? nextId('INVP'),
      inverterId: target?.inverterId ?? nextSeq(),
      maker: values.inverterEnterpriseName,
      name: values.inverterName,
      capacityKw: values.inverterCapacity,
      kind: kindFromInverterTypeCode(values.inverterTypeCode),
      phase: phaseFromCode(values.phaseTypeCode),
    };
    const logTarget = { targetType: 'inverter' as const, id: saved.id, name: saved.name, actor: actor?.name ?? '관리자' };

    const entries = isNew
      ? createdEntry(logTarget, `${saved.maker} · ${formatNumber(saved.capacityKw, 1)}kW`)
      : diffEntries(logTarget, [
        { label: '업체 이름', before: target?.maker ?? '', after: saved.maker },
        { label: '인버터 이름', before: target?.name ?? '', after: saved.name },
        {
          label: '인버터 용량',
          before: target ? `${formatNumber(target.capacityKw, 1)}kW` : '',
          after: `${formatNumber(saved.capacityKw, 1)}kW`,
        },
        {
          label: '인버터 타입',
          before: target ? INVERTER_KIND_LABEL[target.kind] : '',
          after: INVERTER_KIND_LABEL[saved.kind],
        },
        { label: '위상 종류', before: target?.phase ?? '', after: saved.phase },
      ]);

    saveInverter(saved, entries, isNew);
    toast.success(isNew ? MSG.createSuccess('인버터 제품') : MSG.updateSuccess(saved.name));
    navigate(backTo);
  };

  const remove = () => {
    if (!target) return;

    removeInverter(target.id, deletedEntry(
      { targetType: 'inverter', id: target.id, name: target.name, actor: actor?.name ?? '관리자' },
      `${target.maker} · ${formatNumber(target.capacityKw, 1)}kW`,
    ));
    toast.success(MSG.deleteSuccess(target.name));
    navigate(backTo);
  };

  return (
    <>
      <Form methods={methods} onSubmit={setPending}>
        <FormPage
          title={isNew ? '인버터 제품 등록' : '인버터 제품 수정'}
          description="여기 등록한 제품을 설비 등록에서 골라 씁니다."
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
              <Form.Text label="업체 이름" name="inverterEnterpriseName" maxLength={NAME_MAX} required />
              <Form.Text label="인버터 이름" name="inverterName" maxLength={NAME_MAX} ime="latin" required />
            </FormRow>
            <FormRow cols={2}>
              <Form.Number
                label="인버터 용량"
                name="inverterCapacity"
                min={CAPACITY_MIN}
                max={CAPACITY_MAX}
                step={0.1}
                unit="kW"
                placeholder={`${CAPACITY_MIN} ~ ${CAPACITY_MAX}`}
                required
              />
              <Form.Select
                label="인버터 타입"
                name="inverterTypeCode"
                options={Object.entries(INVERTER_TYPE.NAME)
                  .map(([code, label]) => ({ value: Number(code), label }))}
              />
            </FormRow>
            <Form.Radio
              label="위상 종류"
              name="phaseTypeCode"
              options={[
                { value: PHASE_TYPE.CODE.단상, label: '단상' },
                { value: PHASE_TYPE.CODE.삼상, label: '삼상' },
              ]}
              required
            />
          </FormSection>
        </FormPage>
      </Form>

      <ConfirmDialog
        isOpen={pending !== null}
        title={isNew ? MSG.createConfirm('인버터 제품') : MSG.updateConfirm(pending?.inverterName ?? '인버터 제품')}
        confirmLabel="저장"
        onConfirm={() => pending && commit(pending)}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        isOpen={isDeleting}
        title={MSG.deleteConfirm(target?.name ?? '인버터 제품')}
        description={inUse > 0
          ? `이 제품을 쓰는 설비가 ${formatNumber(inUse)}대 있습니다. 삭제하면 해당 설비의 인버터를 다시 골라야 합니다.`
          : '등록 이력에는 삭제한 사실이 남습니다.'}
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setIsDeleting(false)}
      />
    </>
  );
}
