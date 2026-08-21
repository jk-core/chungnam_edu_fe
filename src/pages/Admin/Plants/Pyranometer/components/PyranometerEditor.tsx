import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormRow, FormSection, NumberField, RadioGroup, TextArea, TextField } from '@/components/common/Form';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { MSG } from '@/configs/messages';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/common/Button';
import { PYRANOMETER_PORT } from '@/mocks/pyranometers';
import { SCHOOLS } from '@/mocks/schools';
import { Select } from '@/components/common/Select';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useDeletedPlants } from '@/stores/assetStore';
import useEquipmentStore from '@/stores/equipmentStore';
import type { Pyranometer } from '@/interface/deviceMaster';
import { createdEntry, deletedEntry, diffEntries } from '@/pages/Admin/_shared/device/deviceChangeLog';
import { usePyranometerRows } from '../hooks/usePyranometerRows';

/** 설비 이름 길이 제한 */
const NAME_MAX = 48;

/** 캘리브레이션 인수 허용 범위 */
const FACTOR_MIN = 0;
const FACTOR_MAX = 10;

/** 통신 ID 는 장비 설정 화면에 그대로 들어가는 값이라 영숫자만 받는다. */
const COMM_ID = /^[A-Za-z0-9]+$/;

const YES_NO = [
  { value: 'yes', label: '있음' },
  { value: 'no', label: '없음' },
] as const;

interface Draft {
  plantId: string;
  name: string;
  calibrationFactor: number | '';
  rtuCommId: string;
  hasModuleThermometer: boolean;
  note: string;
}

interface PyranometerEditorProps {
  /** 고칠 일사량계의 서버 식별자. 없으면 새로 세우는 자리다 */
  irradId: number | null;
}

function draftOf(target: Pyranometer | null): Draft {
  return target
    ? {
      plantId: target.plantId,
      name: target.name,
      calibrationFactor: target.calibrationFactor,
      rtuCommId: target.rtuCommId,
      hasModuleThermometer: target.hasModuleThermometer,
      note: target.note,
    }
    : {
      plantId: SCHOOLS[0]?.id ?? '',
      name: '',
      calibrationFactor: 1,
      rtuCommId: '',
      hasModuleThermometer: true,
      note: '',
    };
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

  const [draft, setDraft] = useState<Draft>(() => draftOf(target));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isNew = target === null;
  const plantOptions = useMemo(
    () => SCHOOLS
      .filter((school) => !deletedPlants.includes(school.id))
      .map((school) => ({ value: school.id, label: school.name })),
    [deletedPlants],
  );

  const change = (next: Partial<Draft>) => setDraft({ ...draft, ...next });

  const submit = () => {
    const found: Record<string, string> = {};
    const name = draft.name.trim();

    if (!name) found.name = MSG.requiredField('설비 이름');
    else if (name.length > NAME_MAX) found.name = MSG.tooLong('설비 이름', NAME_MAX);

    const factor = draft.calibrationFactor;

    if (factor === '' || factor < FACTOR_MIN || factor > FACTOR_MAX) {
      found.calibrationFactor = MSG.numberRange('캘리브레이션 인수', FACTOR_MIN, FACTOR_MAX);
    }

    if (!COMM_ID.test(draft.rtuCommId.trim())) found.rtuCommId = 'RTU 통신 ID 는 영문·숫자만 넣을 수 있습니다.';

    setErrors(found);
    if (Object.keys(found).length === 0) setIsConfirming(true);
  };

  const commit = () => {
    const plantName = SCHOOLS.find((school) => school.id === draft.plantId)?.name ?? target?.plantName ?? '';
    const saved: Pyranometer = {
      id: target?.id ?? nextId('PYR'),
      irradId: target?.irradId ?? nextSeq(),
      plantId: draft.plantId,
      plantName,
      name: draft.name.trim(),
      calibrationFactor: Number(draft.calibrationFactor),
      rtuCommId: draft.rtuCommId.trim(),
      // 포트는 화면에서 고를 수 없다 — 3번이 일사량계 몫이다.
      rtuPort: PYRANOMETER_PORT,
      hasModuleThermometer: draft.hasModuleThermometer,
      note: draft.note.trim(),
      status: target?.status ?? 'normal',
    };
    const logTarget = {
      kind: 'pyranometer' as const,
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
    setIsConfirming(false);
    navigate(backTo);
  };

  const remove = () => {
    if (!target) return;

    removePyranometer(target.id, deletedEntry(
      { kind: 'pyranometer', id: target.id, name: target.name, actor: actor?.name ?? '관리자' },
      `${target.plantName} · ${target.rtuCommId}`,
    ));
    toast.success(MSG.deleteSuccess(target.name));
    navigate(backTo);
  };

  return (
    <>
      <FormPage
        title={isNew ? '일사량계 등록' : '일사량계 수정'}
        description={`RTU ${PYRANOMETER_PORT}번 포트는 일사량계 몫이라 바꿀 수 없습니다.`}
        backTo={backTo}
        danger={isNew ? null : <Button variant="solar" onClick={() => setIsDeleting(true)}>일사량계 삭제</Button>}
        footer={(
          <>
            <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
        <FormSection legend="설치 위치">
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
              onChange={(value) => change({ calibrationFactor: value })}
              min={FACTOR_MIN}
              max={FACTOR_MAX}
              step={0.001}
              required
              error={errors.calibrationFactor}
            />
            <TextField
              label="RTU 통신 ID"
              value={draft.rtuCommId}
              onChange={(value) => change({ rtuCommId: value })}
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
              onChange={(value) => change({ hasModuleThermometer: value === 'yes' })}
              options={[...YES_NO]}
            />
          </FormRow>
        </FormSection>

        <FormSection legend="비고">
          <TextArea
            label="메모"
            value={draft.note}
            onChange={(value) => change({ note: value })}
            optional
            placeholder="설치 위치나 점검 시 주의할 점을 적어 두세요."
          />
        </FormSection>
      </FormPage>

      <ConfirmDialog
        isOpen={isConfirming}
        title={isNew ? MSG.createConfirm('일사량계') : MSG.updateConfirm(draft.name)}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
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
