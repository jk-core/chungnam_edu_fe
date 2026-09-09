import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createdEntry, deletedEntry, diffEntries } from '@/pages/Admin/_shared/changeLog';
import { createForm, FormField, FormRow, FormSection, NumberControl } from '@/components/common/Form';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { MSG } from '@/configs/messages';
import { FACTOR_MAX, FACTOR_MIN, NAME_MAX, pyranometerFormSchema } from '@/service/pyranometer/type';
import { PYRANOMETER_PORT } from '@/mocks/pyranometers';
import { SCHOOLS } from '@/mocks/schools';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useDeletedPlants } from '@/stores/assetStore';
import useEquipmentStore from '@/stores/equipmentStore';
import type { PyranometerFormValues } from '@/service/pyranometer/type';
import type { Pyranometer } from '@/interface/deviceMaster';
import { usePyranometerRows } from '../hooks/usePyranometerRows';
import { EMPTY_VALUES, toFormValues } from './values';

const YES_NO = [
  { value: 'yes' as const, label: '있음' },
  { value: 'no' as const, label: '없음' },
];

const Form = createForm<PyranometerFormValues>();

interface PyranometerEditorProps {
  /** 고칠 일사량계의 서버 식별자. 없으면 새로 세우는 자리다 */
  irradId: number | null;
}

/** 일사량계 등록·수정 (SFR-016-01) */
export function PyranometerEditor({ irradId }: PyranometerEditorProps) {
  const savePyranometer = useEquipmentStore((state) => state.savePyranometer);
  const removePyranometer = useEquipmentStore((state) => state.removePyranometer);
  const nextId = useEquipmentStore((state) => state.nextId);
  const nextSeq = useEquipmentStore((state) => state.nextSeq);
  const deletedPlants = useDeletedPlants();
  const actor = useAuthUser();
  const rows = usePyranometerRows();
  const navigate = useNavigate();

  const target = rows.find((row) => row.irradId === irradId) ?? null;
  const backTo = listPath('plants', 'pyranometer');
  const isNew = target === null;

  const methods = useForm<PyranometerFormValues>({
    defaultValues: target ? toFormValues(target) : EMPTY_VALUES,
    resolver: zodResolver(pyranometerFormSchema),
    mode: 'onChange',
  });

  const [pending, setPending] = useState<PyranometerFormValues | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const plantOptions = useMemo(
    () => SCHOOLS
      .filter((school) => !deletedPlants.includes(school.id))
      .map((school) => ({ value: school.id, label: school.name })),
    [deletedPlants],
  );

  const commit = (values: PyranometerFormValues) => {
    const plantName = SCHOOLS.find((school) => school.id === values.plantId)?.name ?? target?.plantName ?? '';
    const saved: Pyranometer = {
      id: target?.id ?? nextId('PYR'),
      irradId: target?.irradId ?? nextSeq(),
      plantId: values.plantId,
      plantName,
      name: values.name,
      calibrationFactor: values.calibrationFactor,
      rtuCommId: values.rtuCommId,
      // 포트는 화면에서 고를 수 없다 — 3번이 일사량계 몫이다.
      rtuPort: PYRANOMETER_PORT,
      hasModuleThermometer: values.moduleThermometer === 'yes',
      note: values.note.trim(),
      status: target?.status ?? 'normal',
    };
    const logTarget = {
      targetType: 'irrad' as const,
      id: saved.id,
      name: saved.name,
      actor: actor?.name ?? '관리자',
    };

    const entries = isNew
      ? createdEntry(logTarget, `${saved.plantName} · ${saved.rtuCommId}`)
      : diffEntries(logTarget, [
        { label: '설비 이름', before: target?.name ?? '', after: saved.name },
        { label: '발전소', before: target?.plantName ?? '', after: saved.plantName },
        {
          label: '캘리브레이션 인수',
          before: String(target?.calibrationFactor ?? ''),
          after: String(saved.calibrationFactor),
        },
        { label: 'RTU 통신 ID', before: target?.rtuCommId ?? '', after: saved.rtuCommId },
        {
          label: '모듈 온도계',
          before: target ? (target.hasModuleThermometer ? '있음' : '없음') : '',
          after: saved.hasModuleThermometer ? '있음' : '없음',
        },
        { label: '비고', before: target?.note ?? '', after: saved.note },
      ]);

    savePyranometer(saved, entries, isNew);
    toast.success(isNew ? MSG.createSuccess('일사량계') : MSG.updateSuccess(saved.name));
    navigate(backTo);
  };

  const remove = () => {
    if (!target) return;

    removePyranometer(target.id, deletedEntry(
      { targetType: 'irrad', id: target.id, name: target.name, actor: actor?.name ?? '관리자' },
      `${target.plantName} · ${target.rtuCommId}`,
    ));
    toast.success(MSG.deleteSuccess(target.name));
    navigate(backTo);
  };

  return (
    <>
      <Form methods={methods} onSubmit={setPending}>
        <FormPage
          title={isNew ? '일사량계 등록' : '일사량계 수정'}
          description={`RTU ${PYRANOMETER_PORT}번 포트는 일사량계 몫이라 바꿀 수 없습니다.`}
          backTo={backTo}
          danger={isNew ? null : <Button variant="solar" onClick={() => setIsDeleting(true)}>삭제</Button>}
          footer={(
            <>
              <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
              <Form.Submit />
            </>
          )}
        >
          <FormSection legend="설치 위치">
            <FormRow cols={2}>
              <Form.Select label="발전소" name="plantId" options={plantOptions} />
              <Form.Text label="설비 이름" name="name" required hint={`${NAME_MAX}자 이내`} />
            </FormRow>
          </FormSection>

          <FormSection legend="계측·통신">
            <FormRow cols={2}>
              <Form.Number
                label="캘리브레이션 인수"
                name="calibrationFactor"
                min={FACTOR_MIN}
                max={FACTOR_MAX}
                step={0.001}
                required
              />
              <Form.Text label="RTU 통신 ID" name="rtuCommId" ime="latin" required />
            </FormRow>
            <FormRow cols={2}>
              {/* 고를 수 없는 값이라 폼 밖에 둔다 — 보여 주기만 한다. */}
              <FormField label="RTU 포트" hint="일사량계 고정">
                <NumberControl value={PYRANOMETER_PORT} onChange={() => undefined} readOnly />
              </FormField>
              <Form.Radio label="모듈 온도계" name="moduleThermometer" options={YES_NO} />
            </FormRow>
          </FormSection>

          <FormSection legend="비고">
            <Form.Area
              label="메모"
              name="note"
              optional
              placeholder="설치 위치나 점검 시 주의할 점을 적어 두세요."
            />
          </FormSection>
        </FormPage>
      </Form>

      <ConfirmDialog
        isOpen={pending !== null}
        title={isNew ? MSG.createConfirm('일사량계') : MSG.updateConfirm(pending?.name ?? '일사량계')}
        confirmLabel="저장"
        onConfirm={() => pending && commit(pending)}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        isOpen={isDeleting}
        title={MSG.deleteConfirm(target?.name ?? '일사량계')}
        description="일사량 값이 없으면 그 발전소의 AI 진단은 기대 발전량을 계산하지 못합니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setIsDeleting(false)}
      />
    </>
  );
}
