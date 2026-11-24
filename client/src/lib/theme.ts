import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'unpacked:theme';
const listeners = new Set<() => void>();

const read = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

function apply(t: Theme) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#141210' : '#eee5d9');
  listeners.forEach((l) => l());
}

export function setTheme(t: Theme) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
  apply(t);
}

// Follow the OS while the reader hasn't picked a theme themselves.
const mq = window.matchMedia('(prefers-color-scheme: dark)');
mq.addEventListener('change', (e) => {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    /* ignore */
  }
  if (!saved) apply(e.matches ? 'dark' : 'light');
});

export function useTheme(): [Theme, () => void] {
  const t = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
  );
  return [t, () => setTheme(t === 'dark' ? 'light' : 'dark')];
}
