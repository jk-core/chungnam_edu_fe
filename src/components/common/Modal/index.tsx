import { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '@/components/common/Icon';
import styles from './Modal.module.scss';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'md' | 'lg';
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 접근성 모달. 열려 있는 동안 배경 스크롤을 막고 포커스를 안에 가둔다.
 * 600px 이하에서는 아래에서 올라오는 바텀시트로 형태를 바꾼다.
 */
export function Modal({ isOpen, onClose, title, description, size = 'md', children, footer }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    returnFocusRef.current = document.activeElement as HTMLElement;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    // 열리자마자 첫 조작 대상으로 포커스를 옮긴다.
    const focusTimer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);

      (first ?? panelRef.current)?.focus();
    }, 40);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();

        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null,
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        // key 가 없으면 AnimatePresence 가 이 노드를 추적하지 못해 exit 이 끝나지 않는다.
        <div key="modal" className={styles.modal}>
          <motion.button
            type="button"
            className={styles.modal__backdrop}
            aria-label="닫기"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />

          <motion.div
            ref={panelRef}
            className={`${styles.modal__panel} ${styles[`modal__panel--${size}`]}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          >
            <header className={styles.modal__header}>
              <div className={styles.modal__heading}>
                <h2 id={titleId} className={styles.modal__title}>
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className={styles.modal__description}>
                    {description}
                  </p>
                ) : null}
              </div>
              <button type="button" className={styles.modal__close} onClick={onClose} aria-label="닫기">
                <CloseIcon />
              </button>
            </header>

            {/* 본문이 없는 확인 대화상자에서 빈 여백이 남지 않게 한다. */}
            {children ? <div className={styles.modal__body}>{children}</div> : null}

            {footer ? <footer className={styles.modal__footer}>{footer}</footer> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
