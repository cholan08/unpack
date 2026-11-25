/**
 * The three doors' logic, shared by their pages, the Home doors and the chapter trail.
 * Pure functions of (door content, chapters, progress), plus two small stores kept in this browser:
 * the questions you have peeked at (Explore) and the product you are planning (Build).
 */
import { useSyncExternalStore } from 'react';
import { chapterNum, chapterStatus, getChapter, type Chapter, type ChapterStatus } from '@/content/manual';
import { CORE, FEATURES, IDEAS, PATH, type Feature, type Idea, type PathStage } from '@/content/doors';
import type { useProgress } from '@/lib/progress';
import { chapterHref, chapterProgress } from '../manual/shared';

type Store = ReturnType<typeof useProgress>;

/* ---------------- a tiny saved store ---------------- */

function saved<T>(key: string, fallback: T, valid: (v: unknown) => v is T) {
  let value: T = fallback;
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : undefined;
    if (valid(parsed)) value = parsed;
  } catch {
    /* nothing saved, or storage is off: start empty */
  }
  const subs = new Set<() => void>();
  const subscribe = (fn: () => void) => {
    subs.add(fn);
    return () => subs.delete(fn);
  };
  return {
    get: () => value,
    set(next: T) {
      value = next;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* kept for this visit only */
      }
      subs.forEach((fn) => fn());
    },
    use: () => useSyncExternalStore(subscribe, () => value),
  };
}

const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

/* ---------------- chapters, as the doors see them ---------------- */

export interface ChapterView {
  chapter: Chapter;
  status: ChapterStatus;
  done: number;
  ready: number;
  pct: number;
  /** Every written lesson in it is finished. */
  finished: boolean;
  /** Something to open now: written, has lessons, or is a page of its own. */
  open: boolean;
  href: string;
}

export function viewOf(c: Chapter, progress: Store): ChapterView {
  const status = chapterStatus(c);
  const p = chapterProgress(c, progress);
  return {
    chapter: c,
    status,
    done: p.done,
    ready: p.ready,
    pct: p.pct,
    finished: p.ready > 0 && p.done === p.ready,
    open: status !== 'planned',
    href: chapterHref(c),
  };
}

/* ---------------- Explore ---------------- */

const seenStore = saved<string[]>('unpacked:explore:seen', [], isStrings);
export const useSeen = () => seenStore.use();
export function markSeen(id: string) {
  const now = seenStore.get();
  if (!now.includes(id)) seenStore.set([...now, id]);
}

/**
 * "You can build this": where a question's chapter leads to building. A written chapter has its own
 * Build it section; otherwise the Build door opens with the feature that needs this chapter.
 */
export function buildLinkFor(chapterId: string): { href: string; label: string } | undefined {
  const c = getChapter(chapterId);
  if (!c) return undefined;
  if (chapterStatus(c) === 'complete') return { href: `/manual/${c.id}#s-build`, label: 'Build it yourself' };
  if (c.href) return { href: c.href, label: 'Start building' };
  const f = FEATURES.find((x) => x.needs.some((n) => n.chapter === c.id));
  if (f) return { href: `/build?add=${f.id}`, label: 'Plan an app that does this' };
  return undefined;
}

/* ---------------- Build: reading someone's own idea ---------------- */

/** Lower case, punctuation to spaces, padded — so " word " finds whole words only. */
const norm = (text: string) => ` ${text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9+#-]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
const has = (hay: string, word: string) => {
  const w = word.toLowerCase().replace(/[’']/g, '');
  return hay.includes(` ${w} `) || hay.includes(` ${w}s `);
};

/** The idea a description sounds most like (most words in common), if any. */
export function matchIdea(text: string): Idea | undefined {
  const hay = norm(text);
  if (hay.trim() === '') return undefined;
  let best: Idea | undefined;
  let score = 0;
  for (const idea of IDEAS) {
    const s = idea.words.filter((w) => has(hay, w)).length;
    if (s > score) {
      best = idea;
      score = s;
    }
  }
  return best;
}

/** Features a description mentions in so many words ("people log in" → accounts). */
export function detectFeatures(text: string): string[] {
  const hay = norm(text);
  if (hay.trim() === '') return [];
  return FEATURES.filter((f) => f.words.some((w) => has(hay, w))).map((f) => f.id);
}

/* ---------------- Build: the plan ---------------- */

export interface BuildState {
  /** What they typed after "I want to build". */
  text: string;
  /** Features switched on by hand. */
  adds: string[];
  /** Features switched off by hand. */
  removes: string[];
}

export const EMPTY_BUILD: BuildState = { text: '', adds: [], removes: [] };

const isBuild = (v: unknown): v is BuildState =>
  !!v && typeof v === 'object' && typeof (v as BuildState).text === 'string' && isStrings((v as BuildState).adds) && isStrings((v as BuildState).removes);

const buildStore = saved<BuildState>('unpacked:build:v1', EMPTY_BUILD, isBuild);
export const useBuildState = () => buildStore.use();
export const setBuildState = (s: BuildState) => buildStore.set(s);
export const hasBuild = (s: BuildState) => s.text.trim() !== '' || s.adds.length > 0;

export interface FeatureState {
  feature: Feature;
  on: boolean;
  /** The idea it sounds like usually has it. */
  fromIdea: boolean;
  /** Their own words mention it. */
  fromWords: boolean;
  /** Switched on by hand. */
  byYou: boolean;
}

export interface PlanRow extends ChapterView {
  /** "so people sign in…" — one per feature that needs it, core first. */
  why: string[];
  features: string[];
}

export interface Plan {
  idea?: Idea;
  features: FeatureState[];
  rows: PlanRow[];
  /** The first chapter to open: not finished, and something to read. */
  start?: PlanRow;
  ready: number;
  planned: number;
  finished: number;
}

export function planOf(s: BuildState, progress: Store): Plan {
  const idea = matchIdea(s.text);
  const words = detectFeatures(s.text);
  const features: FeatureState[] = FEATURES.map((feature) => {
    const id = feature.id;
    const fromIdea = !!idea?.features.includes(id);
    const fromWords = words.includes(id);
    const byYou = s.adds.includes(id);
    return { feature, on: (fromIdea || fromWords || byYou) && !s.removes.includes(id), fromIdea, fromWords, byYou };
  });

  const byId = new Map<string, { why: string[]; features: string[] }>();
  const need = (chapter: string, why: string, feature?: string) => {
    const row = byId.get(chapter) ?? { why: [], features: [] };
    if (!row.why.includes(why)) row.why.push(why);
    if (feature && !row.features.includes(feature)) row.features.push(feature);
    byId.set(chapter, row);
  };
  for (const n of CORE) need(n.chapter, n.why);
  for (const f of features) if (f.on) for (const n of f.feature.needs) need(n.chapter, n.why, f.feature.id);

  const rows: PlanRow[] = [...byId]
    .map(([id, r]) => {
      const c = getChapter(id);
      return c ? { ...viewOf(c, progress), ...r } : undefined;
    })
    .filter((r): r is PlanRow => !!r)
    .sort((a, b) => chapterNum(a.chapter.id) - chapterNum(b.chapter.id));

  return {
    idea,
    features,
    rows,
    start: rows.find((r) => r.open && !r.finished),
    ready: rows.filter((r) => r.open).length,
    planned: rows.filter((r) => !r.open).length,
    finished: rows.filter((r) => r.finished).length,
  };
}

/** Toggle one feature. A "no" to something the idea or their words suggest is remembered as a "no". */
export function toggleFeature(s: BuildState, f: FeatureState): BuildState {
  const id = f.feature.id;
  const suggested = f.fromIdea || f.fromWords;
  const adds = s.adds.filter((x) => x !== id);
  const removes = s.removes.filter((x) => x !== id);
  if (f.on ? suggested : !suggested) (f.on ? removes : adds).push(id);
  return { ...s, adds, removes };
}

/** A build in one line for the mentor and the trail: "an online shop". */
export const buildName = (s: BuildState, plan: Plan) => s.text.trim() || plan.idea?.phrase || 'your build';

/* ---------------- Path ---------------- */

export type StepState = 'finished' | 'lit' | 'later' | 'planned';

export interface PathStep extends ChapterView {
  state: StepState;
  /** 1–3 for the steps that are lit. */
  litN?: number;
  /** Position on the whole path, 1-based. */
  n: number;
}

export interface PathView {
  stages: { stage: PathStage; steps: PathStep[]; finished: number; open: number }[];
  lit: PathStep[];
  total: number;
  open: number;
  finished: number;
}

/** How many steps the path lights at once (docs/VISION.md §2: three doors, not fourteen). */
export const LIT = 3;

export function pathOf(progress: Store): PathView {
  let n = 0;
  let lit = 0;
  const all: PathStep[] = [];
  const stages = PATH.map((stage) => {
    const steps = stage.chapters.flatMap((id) => {
      const c = getChapter(id);
      if (!c) return [];
      const v = viewOf(c, progress);
      const state: StepState = !v.open ? 'planned' : v.finished ? 'finished' : lit < LIT ? 'lit' : 'later';
      const step: PathStep = { ...v, state, n: ++n, litN: state === 'lit' ? ++lit : undefined };
      all.push(step);
      return [step];
    });
    return { stage, steps, finished: steps.filter((s) => s.finished).length, open: steps.filter((s) => s.open).length };
  });
  return {
    stages,
    lit: all.filter((s) => s.state === 'lit'),
    total: all.length,
    open: all.filter((s) => s.open).length,
    finished: all.filter((s) => s.finished).length,
  };
}
