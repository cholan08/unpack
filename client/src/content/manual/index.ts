/**
 * The Manual's lookups: chapters in order with their numbers, their status, the lessons they
 * link, and the hand-written chapter (one chunk per chapter, loaded on demand).
 */
import { useEffect, useState } from 'react';
import { COURSES, lessonEntries, type LessonEntry } from '@/content/registry';
import { NOTEBOOKS, writtenPages } from '@/content/notebooks/registry';
import type { Notebook } from '@/content/notebooks/types';
import type { PillarId } from '@/engine/types';
import { CHAPTERS, MANUAL_PARTS } from './chapters';
import type { Chapter, ChapterWriting, ManualPartId } from './types';

export { CHAPTERS, MANUAL_PARTS };
export type * from './types';

const writers = import.meta.glob<{ default: ChapterWriting }>('./written/*.ts');
const loaders = new Map(Object.entries(writers).map(([path, load]) => [path.replace(/^\.\/written\/|\.ts$/g, ''), load]));

/** Chapter number across the whole manual, 1-based, in reading order. */
const NUM = new Map(CHAPTERS.map((c, i) => [c.id, i + 1]));
export const chapterNum = (id: string) => NUM.get(id) ?? 0;

export const getChapter = (id: string | undefined) => CHAPTERS.find((c) => c.id === id);
export const chaptersIn = (part: ManualPartId) => CHAPTERS.filter((c) => c.part === part);
export const getPart = (id: ManualPartId) => MANUAL_PARTS.find((p) => p.id === id)!;

/** The colour a chapter draws in: its first topic lens. */
export const chapterLens = (c: Chapter): PillarId | undefined => c.lens[0];

const course = COURSES[0];
const entries = course ? lessonEntries(course) : [];

/** The chapter's lessons that are written, in the chapter's order. */
export function chapterLessons(c: Chapter): LessonEntry[] {
  return (c.lessons ?? []).map((id) => entries.find((e) => e.stub.id === id)).filter((e): e is LessonEntry => !!e?.meta);
}

/** Linked notebooks that have at least one written page (an outline alone is not content). */
export function chapterNotebooks(c: Chapter): Notebook[] {
  return (c.notebooks ?? [])
    .map((id) => NOTEBOOKS.find((b) => b.id === id))
    .filter((b): b is Notebook => !!b && writtenPages(b).written > 0);
}

/**
 * complete — the chapter is written (written/<id>.ts exists)
 * ready    — not written yet, but it has lessons (or is a page of its own, like the capstone)
 * planned  — nothing to read yet; the page still shows the question and what it will cover
 */
export type ChapterStatus = 'complete' | 'ready' | 'planned';

export function chapterStatus(c: Chapter): ChapterStatus {
  if (loaders.has(c.id)) return 'complete';
  if (c.href || chapterLessons(c).length || chapterNotebooks(c).length) return 'ready';
  return 'planned';
}

export const STATUS_LABEL: Record<ChapterStatus, string> = {
  complete: 'Complete',
  ready: 'Lessons ready',
  planned: 'Planned',
};

/** The status in words; a chapter that is a page of its own (the capstone) is ready to build, not to read. */
export const statusLabel = (c: Chapter) => {
  const s = chapterStatus(c);
  return c.href && s === 'ready' ? 'Ready to build' : STATUS_LABEL[s];
};

/* ---------------- the written chapter ---------------- */

const loaded = new Map<string, ChapterWriting>();
const pending = new Map<string, Promise<ChapterWriting>>();

export function loadWriting(id: string): Promise<ChapterWriting> | undefined {
  const load = loaders.get(id);
  if (!load) return undefined;
  let p = pending.get(id);
  if (!p) {
    p = load().then(
      (m) => {
        loaded.set(id, m.default);
        return m.default;
      },
      (err) => {
        pending.delete(id);
        throw err;
      },
    );
    pending.set(id, p);
  }
  return p;
}

export type WritingState = { status: 'none' } | { status: 'loading' } | { status: 'ready'; writing: ChapterWriting } | { status: 'error' };

/** The hand-written chapter, if there is one. */
export function useWriting(id: string): WritingState {
  const peek = (): WritingState => {
    const w = loaded.get(id);
    if (w) return { status: 'ready', writing: w };
    return loaders.has(id) ? { status: 'loading' } : { status: 'none' };
  };
  const [state, setState] = useState<WritingState>(peek);
  useEffect(() => {
    setState(peek());
    const p = loadWriting(id);
    if (!p || loaded.has(id)) return;
    let live = true;
    p.then(
      (writing) => live && setState({ status: 'ready', writing }),
      () => live && setState({ status: 'error' }),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return state;
}

/* ---------------- dev checks: a broken link is a console warning (so QA fails) ---------------- */

if (import.meta.env.DEV) {
  const ids = new Set<string>();
  for (const c of CHAPTERS) {
    if (ids.has(c.id)) console.warn(`[manual] chapter id "${c.id}" is used twice`);
    ids.add(c.id);
    for (const l of c.lessons ?? []) if (!entries.some((e) => e.stub.id === l)) console.warn(`[manual] "${c.id}" links lesson "${l}", which isn't in course.ts`);
    for (const b of c.notebooks ?? []) if (!NOTEBOOKS.some((n) => n.id === b)) console.warn(`[manual] "${c.id}" links notebook "${b}", which doesn't exist`);
    if (c.gate && course && !course.parts.some((p) => p.id === c.gate)) console.warn(`[manual] "${c.id}" links gate "${c.gate}", which isn't a part`);
  }
  for (const id of loaders.keys()) if (!ids.has(id)) console.warn(`[manual] written/${id}.ts has no chapter in chapters.ts`);
}
