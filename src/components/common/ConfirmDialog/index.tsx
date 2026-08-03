import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger 는 삭제처럼 되돌릴 수 없는 작업에 쓴다. */
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * 등록·수정·삭제 확인 대화상자 (SIF-004-01).
 * 기존 Modal 을 그대로 감싸 포커스 트랩·ESC·바디 스크롤 락을 물려받는다.
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  tone = 'default',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'solar' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      )}
    >
      {null}
    </Modal>
  );
}
