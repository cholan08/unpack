import { useSyncExternalStore } from 'react';

/**
 * Small confirmations ("Link copied") that appear at the bottom of the screen and leave by
 * themselves. Rendered by <Toaster/> (site/Toaster.tsx); call `toast()` from anywhere.
 */
export type ToastIcon = 'check' | 'link' | 'info';

export interface Toast {
  id: number;
  text: string;
  icon: ToastIcon;
}

let toasts: Toast[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function toast(text: string, icon: ToastIcon = 'check', ms = 2600) {
  const t: Toast = { id: ++seq, text, icon };
  toasts = [...toasts.slice(-2), t]; // at most three on screen
  emit();
  setTimeout(() => dismissToast(t.id), ms);
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useToasts = () => useSyncExternalStore(subscribe, () => toasts);
