import { Button } from '@/components/common/Button';
import { FormField, TextAreaControl } from '@/components/common/Form';
import { Modal } from '@/components/common/Modal';
import type { FieldReport } from '@/interface/fieldReport';

interface RejectModalProps {
  report: FieldReport;
  reason: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

/** 반려는 사유가 있어야 한다 — 현장이 무엇을 고쳐야 할지 알아야 다시 낼 수 있다 (SFR-021-08). */
export function RejectModal({ report, reason, onReasonChange, onConfirm, onClose }: RejectModalProps) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      size="md"
      title="보고서 반려"
      description={`${report.schoolName} · ${report.date} · ${report.inspector}`}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button onClick={onConfirm} disabled={!reason.trim()}>반려</Button>
        </>
      )}
    >
      <FormField label="반려 사유" required>
        <TextAreaControl
          value={reason}
          onChange={onReasonChange}
          placeholder="무엇을 고쳐서 다시 내야 하는지 적어 주세요."
          maxLength={300}
        />
      </FormField>
    </Modal>
  );
}
