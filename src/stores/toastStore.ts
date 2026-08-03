import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
  /** 오류일 때 대처 방안을 한 줄 덧붙인다 (SIF-004-04) */
  action?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

/** 성공 알림은 짧게 스치고, 오류는 읽을 시간을 준다. */
const DURATION: Record<ToastTone, number> = {
  success: 2600,
  info: 3200,
  error: 6000,
};

let sequence = 0;

const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    sequence += 1;

    const id = `toast-${sequence}`;

    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

    window.setTimeout(() => get().dismiss(id), DURATION[toast.tone]);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
}));

export const useToasts = () => useToastStore((state) => state.toasts);

export const useDismissToast = () => useToastStore((state) => state.dismiss);

/**
 * 화면에서 부르는 알림 창구.
 * 훅 밖(이벤트 핸들러 안)에서도 쓸 수 있게 스토어를 직접 잡는다.
 */
export const toast = {
  success: (message: string) => useToastStore.getState().push({ tone: 'success', message }),
  info: (message: string) => useToastStore.getState().push({ tone: 'info', message }),
  error: (message: string, action?: string) => useToastStore.getState().push({ tone: 'error', message, action }),
};

export default useToastStore;
