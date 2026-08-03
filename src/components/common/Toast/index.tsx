import { createPortal } from 'react-dom';
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from '@/components/common/Icon';
import { useDismissToast, useToasts } from '@/stores/toastStore';
import { cn } from '@/utils/cn';
import type { ToastTone } from '@/stores/toastStore';
import styles from './Toast.module.scss';

const ICONS: Record<ToastTone, typeof CheckIcon> = {
  success: CheckIcon,
  error: AlertIcon,
  info: InfoIcon,
};

/**
 * 화면 아래 가운데에 뜨는 알림 (SIF-004-01/03).
 * 결과가 눈으로 바로 보이는 작업은 짧게 스치고, 오류는 대처 방안까지 함께 남긴다.
 */
export function ToastViewport() {
  const toasts = useToasts();
  const dismiss = useDismissToast();

  if (toasts.length === 0) return null;

  return createPortal(
    <div className={styles.viewport} role="status" aria-live="polite">
      {toasts.map((item) => {
        const Icon = ICONS[item.tone];

        return (
          <div key={item.id} className={cn(styles.toast, styles[`toast--${item.tone}`])}>
            <span className={styles.toast__icon}>
              <Icon width={18} height={18} />
            </span>
            <span className={styles.toast__body}>
              <span className={styles.toast__message}>{item.message}</span>
              {item.action ? <span className={styles.toast__action}>{item.action}</span> : null}
            </span>
            <button type="button" className={styles.toast__close} onClick={() => dismiss(item.id)} aria-label="알림 닫기">
              <CloseIcon width={14} height={14} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
