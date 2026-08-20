import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormRow, FormSection, NumberField, RadioGroup, TextField } from '@/components/common/Form';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { NOW } from '@/mocks/today';
import { RTU_LABEL } from '@/mocks/status';
import { SCHOOLS } from '@/mocks/schools';
import { Select } from '@/components/common/Select';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useDeletedPlants } from '@/stores/assetStore';
import useEquipmentStore from '@/stores/equipmentStore';
import type { Rtu } from '@/interface/asset';
import type { RtuStatus } from '@/interface/status';
import styles from '@/pages/Admin/Admin.module.scss';
import { createdEntry, diffEntries } from '../../utils/deviceChangeLog';

/** 수집 주기 허용 범위(분) */
const INTERVAL_MIN = 1;
const INTERVAL_MAX = 60;

/** 새로 등록할 때의 기본 수집 주기(분) */
const DEFAULT_INTERVAL = 5;

interface Draft {
  plantId: string;
  model: string;
  serial: string;
  firmware: string;
  intervalMinutes: number | '';
  status: RtuStatus;
}

interface RtuEditorProps {
  /** 고친다면 그 장치, 새로 등록한다면 null */
  target: Rtu | null;
  onClose: () => void;
}

function draftOf(target: Rtu | null): Draft {
  return target
    ? {
      plantId: target.plantId,
      model: target.model,
      serial: target.serial,
      firmware: target.firmware,
      intervalMinutes: target.intervalMinutes,
      status: target.status,
    }
    : {
      plantId: SCHOOLS[0]?.id ?? '',
      model: '',
      serial: '',
      firmware: '',
      intervalMinutes: DEFAULT_INTERVAL,
      status: 'normal',
    };
}

/** RTU 등록·수정 (SFR-017-01~03) */
export function RtuEditor({ target, onClose }: RtuEditorProps) {
  const saveRtu = useEquipmentStore((state) => state.saveRtu);
  const nextId = useEquipmentStore((state) => state.nextId);
  const deletedPlants = useDeletedPlants();
  const actor = useAuthUser();

  const [draft, setDraft] = useState<Draft>(() => draftOf(target));
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

  const submit = () => {
    const found: Record<string, string> = {};

    if (!draft.model.trim()) found.model = MSG.requiredField('모델');
    if (!draft.serial.trim()) found.serial = MSG.requiredField('시리얼');
    if (!draft.firmware.trim()) found.firmware = MSG.requiredField('펌웨어');

    if (draft.intervalMinutes === '' || draft.intervalMinutes < INTERVAL_MIN || draft.intervalMinutes > INTERVAL_MAX) {
      found.intervalMinutes = MSG.numberRange('수집 주기', INTERVAL_MIN, INTERVAL_MAX);
    }

    setErrors(found);
    if (Object.keys(found).length === 0) setIsConfirming(true);
  };

  const commit = () => {
    const at = NOW.format('YYYY-MM-DD HH:mm');
    const firmware = draft.firmware.trim();
    const plantName = SCHOOLS.find((school) => school.id === draft.plantId)?.name ?? target?.plantName ?? '';
    const saved: Rtu = {
      id: target?.id ?? nextId('RTU'),
      plantId: draft.plantId,
      plantName,
      model: draft.model.trim(),
      serial: draft.serial.trim(),
      firmware,
      intervalMinutes: Number(draft.intervalMinutes),
      status: draft.status,
      lastSeenAt: target?.lastSeenAt ?? at,
      // 펌웨어를 올리거나 새로 설치한 사실은 장비 이력에도 남긴다 (SFR-017-02/03).
      events: isNew
        ? [{ at, kind: 'install', note: '신규 등록' }]
        : (target && target.firmware !== firmware
          ? [...(target.events ?? []), { at, kind: 'firmware' as const, note: `펌웨어 ${firmware} 업데이트` }]
          : target?.events ?? []),
    };
    const logTarget = {
      kind: 'rtu' as const,
      id: saved.id,
      name: `${saved.plantName} RTU`,
      actor: actor?.name ?? '관리자',
    };

    const entries = isNew
      ? createdEntry(logTarget, `${saved.model} · ${saved.serial}`)
      : diffEntries(logTarget, [
        { label: '발전소', before: target?.plantName ?? '', after: saved.plantName },
        { label: '모델', before: target?.model ?? '', after: saved.model },
        { label: '시리얼', before: target?.serial ?? '', after: saved.serial },
        { label: '펌웨어', before: `v${target?.firmware ?? ''}`, after: `v${saved.firmware}` },
        { label: '수집 주기', before: target ? `${target.intervalMinutes}분` : '', after: `${saved.intervalMinutes}분` },
        { label: '연계 상태', before: target ? RTU_LABEL[target.status] : '', after: RTU_LABEL[saved.status] },
      ]);

    saveRtu(saved, entries, isNew);
    toast.success(isNew ? MSG.createSuccess('RTU') : MSG.updateSuccess(`${saved.plantName} RTU`));
    setIsConfirming(false);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        size="lg"
        title={isNew ? 'RTU 등록' : 'RTU 수정'}
        description="수집 주기를 짧게 두면 통신량이 늘어납니다. 기본은 5분입니다."
        footer={(
          <>
            <Button variant="secondary" onClick={onClose}>취소</Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
        <div className={styles.form}>
          <FormSection legend="장치 정보">
            <FormRow cols={2}>
              <Select
                label="발전소"
                value={draft.plantId}
                onChange={(value) => change({ plantId: value })}
                options={plantOptions}
              />
              <TextField
                label="모델"
                value={draft.model}
                onChange={(value) => change({ model: value })}
                ime="latin"
                required
                error={errors.model}
              />
            </FormRow>
            <FormRow cols={2}>
              <TextField
                label="시리얼"
                value={draft.serial}
                onChange={(value) => change({ serial: value })}
                ime="latin"
                required
                error={errors.serial}
              />
              <TextField
                label="펌웨어"
                value={draft.firmware}
                onChange={(value) => change({ firmware: value })}
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
                onChange={(value) => change({ intervalMinutes: value })}
                min={INTERVAL_MIN}
                max={INTERVAL_MAX}
                unit="분"
                required
                error={errors.intervalMinutes}
              />
              <RadioGroup
                legend="연계 상태"
                value={draft.status}
                onChange={(value) => change({ status: value })}
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
      </Modal>

      <ConfirmDialog
        isOpen={isConfirming}
        title={isNew ? MSG.createConfirm('RTU') : MSG.updateConfirm('RTU')}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
      />
    </>
  );
}
