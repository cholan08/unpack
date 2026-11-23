import { useSyncExternalStore } from 'react';

/** Progress lives in this browser only (localStorage). Shape is versioned for future sync. */
export interface LessonProgress {
  step: number;
  /** Steps in the lesson when last visited (lets the course map show progress without loading it). */
  total?: number;
  done: boolean;
  updated: number;
}
interface Store {
  v: 1;
  lessons: Record<string, LessonProgress>;
  last?: string;
}

const KEY = 'unpacked:progress:v1';
const listeners = new Set<() => void>();
let state: Store = load();

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 1 && s.lessons) return s;
    }
  } catch {
    /* corrupt or unavailable: start fresh */
  }
  return { v: 1, lessons: {} };
}

function save(next: Store) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: progress lasts for this session only */
  }
  listeners.forEach((l) => l());
}

export const lessonKey = (course: string, lesson: string) => `${course}/${lesson}`;

export function recordStep(course: string, lesson: string, step: number, total: number) {
  const key = lessonKey(course, lesson);
  const prev = state.lessons[key];
  const done = (prev?.done ?? false) || step >= total;
  if (prev && prev.step === step && prev.total === total && prev.done === done && state.last === key) return;
  save({ ...state, last: key, lessons: { ...state.lessons, [key]: { step, total, done, updated: Date.now() } } });
}

export function resetProgress() {
  save({ v: 1, lessons: {} });
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    state = load();
    listeners.forEach((l) => l());
  }
});

export function useProgress(): Store {
  return useSyncExternalStore(subscribe, () => state);
}
