import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { TextArea } from '@/components/common/Form';
import type { FieldReport } from '@/interface/fieldReport';

interface RejectModalProps {
  report: FieldReport;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

/** 반려는 사유가 있어야 한다 — 현장이 무엇을 고쳐야 할지 알아야 다시 낼 수 있다 (SFR-021-08). */
export function RejectModal({ report, onConfirm, onClose }: RejectModalProps) {
  const [reason, setReason] = useState('');

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="md"
      title="보고서 반려"
      description={`${report.schoolName} · ${report.date}`}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button onClick={() => onConfirm(reason.trim())} disabled={!reason.trim()}>반려</Button>
        </>
      )}
    >
      <TextArea
        label="반려 사유"
        value={reason}
        onChange={setReason}
        required
        placeholder="무엇을 고쳐서 다시 내야 하는지 적어 주세요."
        maxLength={300}
      />
    </Modal>
  );
}
