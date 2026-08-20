import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormRow, FormSection, NumberField, TextField } from '@/components/common/Form';
import { getSchoolById } from '@/mocks/schools';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { Select } from '@/components/common/Select';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useEquipmentStore from '@/stores/equipmentStore';
import type { JunctionBoxMaster } from '@/interface/deviceMaster';
import styles from '@/pages/Admin/Admin.module.scss';
import { createdEntry, diffEntries } from '../../utils/deviceChangeLog';
import { useSelectableInverters } from '../hooks/useJunctionRows';
import type { JunctionRow } from '../hooks/useJunctionRows';

/** 한 접속반이 받을 수 있는 직렬·병렬 수 */
const COUNT_MIN = 1;
const COUNT_MAX = 50;

interface Draft {
  inverterId: string;
  name: string;
  seriesCount: number | '';
  parallelCount: number | '';
}

interface JunctionEditorProps {
  /** 고친다면 그 접속반, 새로 등록한다면 null */
  target: JunctionRow | null;
  onClose: () => void;
}

/** 접속반 등록·수정 (SFR-017-06) */
export function JunctionEditor({ target, onClose }: JunctionEditorProps) {
  const saveJunction = useEquipmentStore((state) => state.saveJunction);
  const nextId = useEquipmentStore((state) => state.nextId);
  const nextSeq = useEquipmentStore((state) => state.nextSeq);
  const actor = useAuthUser();
  const inverters = useSelectableInverters();

  const [draft, setDraft] = useState<Draft>(() => (target
    ? {
      inverterId: target.inverterId,
      name: target.name,
      seriesCount: target.seriesCount,
      parallelCount: target.parallelCount,
    }
    : { inverterId: inverters[0]?.inverterId ?? '', name: '', seriesCount: '', parallelCount: '' }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirming, setIsConfirming] = useState(false);

  const isNew = target === null;

  const change = (next: Partial<Draft>) => setDraft({ ...draft, ...next });

  const submit = () => {
    const found: Record<string, string> = {};

    if (!draft.inverterId) found.inverterId = MSG.selectRequired('설비');
    if (!draft.name.trim()) found.name = MSG.requiredField('접속반 이름');

    if (draft.seriesCount === '' || draft.seriesCount < COUNT_MIN || draft.seriesCount > COUNT_MAX) {
      found.seriesCount = MSG.numberRange('모듈 직렬', COUNT_MIN, COUNT_MAX);
    }

    if (draft.parallelCount === '' || draft.parallelCount < COUNT_MIN || draft.parallelCount > COUNT_MAX) {
      found.parallelCount = MSG.numberRange('모듈 병렬', COUNT_MIN, COUNT_MAX);
    }

    setErrors(found);
    if (Object.keys(found).length === 0) setIsConfirming(true);
  };

  const commit = () => {
    const saved: JunctionBoxMaster = {
      id: target?.id ?? nextId('JB'),
      connectBoxId: target?.connectBoxId ?? nextSeq(),
      inverterId: draft.inverterId,
      name: draft.name.trim(),
      seriesCount: Number(draft.seriesCount),
      parallelCount: Number(draft.parallelCount),
    };
    const owner = inverters.find((item) => item.inverterId === saved.inverterId);
    const logTarget = { kind: 'junction' as const, id: saved.id, name: saved.name, actor: actor?.name ?? '관리자' };

    const entries = isNew
      ? createdEntry(logTarget, `${owner?.name ?? ''} · ${saved.seriesCount}직렬 × ${saved.parallelCount}병렬`)
      : diffEntries(logTarget, [
        { label: '접속반 이름', before: target?.name ?? '', after: saved.name },
        { label: '소속 설비', before: target?.inverterName ?? '', after: owner?.name ?? '' },
        { label: '모듈 직렬', before: String(target?.seriesCount ?? ''), after: String(saved.seriesCount) },
        { label: '모듈 병렬', before: String(target?.parallelCount ?? ''), after: String(saved.parallelCount) },
      ]);

    saveJunction(saved, entries, isNew);
    toast.success(isNew ? MSG.createSuccess('접속반') : MSG.updateSuccess(saved.name));
    setIsConfirming(false);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        size="lg"
        title={isNew ? '접속반 등록' : '접속반 수정'}
        description="어느 인버터에 물리는 접속반인지 먼저 고릅니다."
        footer={(
          <>
            <Button variant="secondary" onClick={onClose}>취소</Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
        <div className={styles.form}>
          <FormSection legend="소속 설비">
            <FormRow cols={2}>
              <Select
                label="설비"
                value={draft.inverterId}
                onChange={(value) => change({ inverterId: value })}
                options={inverters.map((item) => ({
                  value: item.inverterId,
                  label: `${getSchoolById(item.plantId)?.name ?? ''} · ${item.name}`,
                }))}
              />
              <TextField
                label="접속반 이름"
                value={draft.name}
                onChange={(value) => change({ name: value })}
                required
                error={errors.name}
              />
            </FormRow>
          </FormSection>

          <FormSection legend="모듈 구성" hint="직렬 장수 × 병렬 조 수가 이 접속반이 받는 모듈 수입니다.">
            <FormRow cols={2}>
              <NumberField
                label="모듈 직렬"
                value={draft.seriesCount}
                onChange={(value) => change({ seriesCount: value })}
                min={COUNT_MIN}
                max={COUNT_MAX}
                unit="직렬"
                required
                error={errors.seriesCount}
              />
              <NumberField
                label="모듈 병렬"
                value={draft.parallelCount}
                onChange={(value) => change({ parallelCount: value })}
                min={COUNT_MIN}
                max={COUNT_MAX}
                unit="병렬"
                required
                error={errors.parallelCount}
              />
            </FormRow>
          </FormSection>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirming}
        title={isNew ? MSG.createConfirm('접속반') : MSG.updateConfirm(draft.name)}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
      />
    </>
  );
}
