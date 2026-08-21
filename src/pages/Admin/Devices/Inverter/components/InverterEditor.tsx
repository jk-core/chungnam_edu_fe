import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createdEntry, diffEntries } from '@/pages/Admin/_shared/device/deviceChangeLog';
import { FormRow, FormSection, NumberField, RadioGroup, TextField } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { INVERTER_KIND_LABEL } from '@/mocks/deviceMaster';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { MSG } from '@/configs/messages';
import { useInverterProducts } from '@/pages/Admin/_shared/device/useSelectableEquipment';
import { Select } from '@/components/common/Select';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useEquipmentStore from '@/stores/equipmentStore';
import type { InverterKind, InverterProduct } from '@/interface/deviceMaster';

/** 인버터 용량 범위(kW) */
const CAPACITY_MIN = 0;
const CAPACITY_MAX = 5000;

const KIND_OPTIONS = (Object.keys(INVERTER_KIND_LABEL) as InverterKind[])
  .map((value) => ({ value, label: INVERTER_KIND_LABEL[value] }));

/** 초안에서는 용량 칸을 비워 둘 수 있다 — 검증 전까지 빈 문자열을 허용한다. */
type Draft = Omit<InverterProduct, 'id' | 'inverterId' | 'capacityKw'> & { capacityKw: number | '' };

const EMPTY_DRAFT: Draft = {
  maker: '',
  name: '',
  capacityKw: '',
  kind: 'string',
  phase: '삼상',
};

interface InverterEditorProps {
  /** 고칠 제품의 서버 식별자. 없으면 새로 세우는 자리다 */
  inverterId: number | null;
}

/** 인버터 제품 등록·수정 (SFR-017-04) */
export function InverterEditor({ inverterId }: InverterEditorProps) {
  const saveInverter = useEquipmentStore((state) => state.saveInverter);
  const nextId = useEquipmentStore((state) => state.nextId);
  const nextSeq = useEquipmentStore((state) => state.nextSeq);
  const actor = useAuthUser();
  const products = useInverterProducts();
  const navigate = useNavigate();

  const target = products.find((row) => row.inverterId === inverterId) ?? null;
  const backTo = listPath('devices', 'inverter');

  const [draft, setDraft] = useState<Draft>(() => (target ? { ...target } : EMPTY_DRAFT));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirming, setIsConfirming] = useState(false);

  const isNew = target === null;

  const change = (next: Partial<Draft>) => setDraft({ ...draft, ...next });

  const submit = () => {
    const found: Record<string, string> = {};

    if (!draft.maker.trim()) found.maker = MSG.requiredField('업체 이름');
    if (!draft.name.trim()) found.name = MSG.requiredField('인버터 이름');

    if (draft.capacityKw === '' || draft.capacityKw <= CAPACITY_MIN || draft.capacityKw > CAPACITY_MAX) {
      found.capacityKw = MSG.numberRange('인버터 용량', CAPACITY_MIN, CAPACITY_MAX);
    }

    setErrors(found);
    if (Object.keys(found).length === 0) setIsConfirming(true);
  };

  const commit = () => {
    const saved: InverterProduct = {
      ...draft,
      id: target?.id ?? nextId('INVP'),
      inverterId: target?.inverterId ?? nextSeq(),
      maker: draft.maker.trim(),
      name: draft.name.trim(),
      capacityKw: Number(draft.capacityKw),
    };
    const logTarget = { kind: 'inverter' as const, id: saved.id, name: saved.name, actor: actor?.name ?? '관리자' };

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
    setIsConfirming(false);
    navigate(backTo);
  };

  return (
    <>
      <FormPage
        title={isNew ? '인버터 제품 등록' : '인버터 제품 수정'}
        description="여기 등록한 제품을 설비 등록에서 골라 씁니다."
        backTo={backTo}
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
              label="업체 이름"
              value={draft.maker}
              onChange={(value) => change({ maker: value })}
              maxLength={120}
              required
              error={errors.maker}
            />
            <TextField
              label="인버터 이름"
              value={draft.name}
              onChange={(value) => change({ name: value })}
              maxLength={120}
              ime="latin"
              required
              error={errors.name}
            />
          </FormRow>
          <FormRow cols={2}>
            <NumberField
              label="인버터 용량"
              value={draft.capacityKw}
              onChange={(value) => change({ capacityKw: value })}
              min={CAPACITY_MIN}
              max={CAPACITY_MAX}
              step={0.1}
              unit="kW"
              placeholder={`${CAPACITY_MIN} ~ ${CAPACITY_MAX}`}
              required
              error={errors.capacityKw}
            />
            <Select
              label="인버터 타입"
              value={draft.kind}
              onChange={(value) => change({ kind: value })}
              options={KIND_OPTIONS}
            />
          </FormRow>
          <RadioGroup
            legend="위상 종류"
            value={draft.phase}
            onChange={(value) => change({ phase: value })}
            options={[
              { value: '단상', label: '단상' },
              { value: '삼상', label: '삼상' },
            ]}
            required
          />
        </FormSection>
      </FormPage>

      <ConfirmDialog
        isOpen={isConfirming}
        title={isNew ? MSG.createConfirm('인버터 제품') : MSG.updateConfirm(draft.name)}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
      />
    </>
  );
}
