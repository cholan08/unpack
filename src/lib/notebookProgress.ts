import { useSyncExternalStore } from 'react';

/** Which notebook pages this browser has opened, and where each notebook was left. */
export interface BookProgress {
  last?: string;
  seen: string[];
}
type Store = { v: 1; books: Record<string, BookProgress> };

const KEY = 'unpacked:notebooks:v1';
const EMPTY: BookProgress = { seen: [] };
const listeners = new Set<() => void>();
let state: Store = load();

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 1 && s.books && typeof s.books === 'object') return s;
    }
  } catch {
    /* storage blocked or corrupt */
  }
  return { v: 1, books: {} };
}

function commit(next: Store) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: keep in memory */
  }
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    state = load();
    listeners.forEach((l) => l());
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useBookProgress(bookId: string): BookProgress {
  return useSyncExternalStore(subscribe, () => state.books[bookId] ?? EMPTY);
}

export function markPageSeen(bookId: string, pageId: string) {
  const cur = state.books[bookId] ?? EMPTY;
  if (cur.last === pageId && cur.seen.includes(pageId)) return;
  const seen = cur.seen.includes(pageId) ? cur.seen : [...cur.seen, pageId];
  commit({ ...state, books: { ...state.books, [bookId]: { last: pageId, seen } } });
}
