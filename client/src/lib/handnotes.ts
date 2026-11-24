import { useSyncExternalStore } from 'react';

/** Personal notes, kept in this browser only (localStorage). */
export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple';
export const NOTE_COLORS: NoteColor[] = ['yellow', 'blue', 'green', 'pink', 'purple'];

export interface Handnote {
  id: string;
  title: string;
  body: string;
  color: NoteColor;
  /** `${courseId}/${lessonId}` this note is about, if any. */
  lesson?: string;
  pinned: boolean;
  created: number;
  updated: number;
}

interface Store {
  v: 1;
  notes: Handnote[];
}

const KEY = 'unpacked:handnotes:v1';
const listeners = new Set<() => void>();
let state: Store = load();

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 1 && Array.isArray(s.notes)) return s;
    }
  } catch {
    /* storage blocked or corrupt: start empty */
  }
  return { v: 1, notes: [] };
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

// Keep several open tabs in sync.
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

export function useHandnotes(): Handnote[] {
  return useSyncExternalStore(subscribe, () => state.notes);
}

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function createNote(init: Partial<Omit<Handnote, 'id' | 'created' | 'updated'>> = {}): Handnote {
  const now = Date.now();
  const note: Handnote = { title: '', body: '', color: 'yellow', pinned: false, ...init, id: newId(), created: now, updated: now };
  commit({ ...state, notes: [note, ...state.notes] });
  return note;
}

export function updateNote(id: string, patch: Partial<Omit<Handnote, 'id' | 'created'>>) {
  commit({ ...state, notes: state.notes.map((n) => (n.id === id ? { ...n, ...patch, updated: Date.now() } : n)) });
}

export function deleteNote(id: string) {
  commit({ ...state, notes: state.notes.filter((n) => n.id !== id) });
}

export const isEmptyNote = (n: Handnote) => !n.title.trim() && !n.body.trim();

/** All notes as one Markdown document, for download. */
export function notesToMarkdown(notes: Handnote[], lessonTitle: (key: string) => string | undefined): string {
  const out = ['# My Handnotes', ''];
  for (const n of notes) {
    out.push(`## ${n.title.trim() || 'Untitled'}`);
    const meta = [new Date(n.updated).toLocaleDateString()];
    if (n.lesson) meta.push(`Lesson: ${lessonTitle(n.lesson) ?? n.lesson}`);
    out.push(`_${meta.join(' · ')}_`, '', n.body.trim(), '');
  }
  return out.join('\n');
}
