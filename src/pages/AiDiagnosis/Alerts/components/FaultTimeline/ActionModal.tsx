import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormRow, RadioGroup, TextArea, TextField } from '@/components/common/Form';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { NOW } from '@/mocks/today';
import { toast } from '@/stores/toastStore';
import { useAddAction } from '@/stores/faultActionStore';
import { useAuthUser } from '@/stores/authStore';
import type { FaultTimeline } from '@/interface/faultTimeline';
import styles from './FaultTimeline.module.scss';

type ResolveChoice = 'resolve' | 'progress';

interface ActionModalProps {
  timeline: FaultTimeline;
  onClose: () => void;
}

/**
 * 조치 기록 (SFR-015).
 * 이미 끝난 건은 진행 이력만 덧붙이는 자리라, 처리 구분의 첫 값을 그에 맞춰 세운다.
 */
export function ActionModal({ timeline, onClose }: ActionModalProps) {
  const addAction = useAddAction();
  const user = useAuthUser();

  const [choice, setChoice] = useState<ResolveChoice>(timeline.resolved ? 'progress' : 'resolve');
  const [actor, setActor] = useState(user?.name ?? '');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [isConfirming, setIsConfirming] = useState(false);

  const submit = () => {
    if (!note.trim()) {
      setError(MSG.requiredField('조치 내용'));

      return;
    }

    if (!actor.trim()) {
      setError(MSG.requiredField('조치자'));

      return;
    }

    setError(undefined);
    setIsConfirming(true);
  };

  const commit = () => {
    addAction(timeline.id, {
      at: NOW.format('YYYY-MM-DD HH:mm'),
      note: note.trim(),
      actor: actor.trim(),
      resolves: choice === 'resolve',
    });

    toast.success(choice === 'resolve' ? '조치 완료로 처리했습니다.' : '조치 진행 이력을 남겼습니다.');
    setIsConfirming(false);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        title="조치 기록"
        description={`${timeline.plantName} · ${timeline.deviceName}`}
        footer={(
          <>
            <Button variant="secondary" onClick={onClose}>취소</Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
        <div className={styles.form}>
          <RadioGroup
            legend="처리 구분"
            value={choice}
            onChange={setChoice}
            options={[
              { value: 'resolve', label: '조치 완료', tone: 'ok' },
              { value: 'progress', label: '조치 진행', tone: 'brand' },
            ]}
            required
          />

          <FormRow cols={2}>
            <TextField label="조치자" value={actor} onChange={setActor} required width="md" />
            <TextField
              label="조치 일시"
              value={NOW.format('YYYY-MM-DD HH:mm')}
              onChange={() => undefined}
              readOnly
              width="md"
            />
          </FormRow>

          <TextArea
            label="조치 내용"
            value={note}
            onChange={setNote}
            required
            error={error}
            placeholder="무엇을 확인하고 어떻게 처리했는지 적어 주세요."
            maxLength={300}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirming}
        title={choice === 'resolve' ? '조치 완료로 처리할까요?' : '조치 이력을 남길까요?'}
        description={choice === 'resolve'
          ? '완료로 처리하면 미조치 목록에서 빠집니다. 기록은 타임라인에 남습니다.'
          : '진행 이력으로 남기고 건은 미조치 상태를 유지합니다.'}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
      />
    </>
  );
}
