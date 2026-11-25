import { useSyncExternalStore } from 'react';

/** Progress lives in this browser only (localStorage). Shape is versioned for future sync. */
export interface LessonProgress {
  step: number;
  /** Steps in the lesson when last visited (lets the course map show progress without loading it). */
  total?: number;
  done: boolean;
  updated: number;
}

export interface PlacementResult {
  score: number;
  total: number;
  startPart: number;
  ts: number;
}

export interface GateResult {
  attempts: number;
  bestScore: number;
  passed: boolean;
  skipped: boolean;
  ts: number;
  /** Map of wrong question ids to the lesson step they link back to */
  weakTopics?: Record<string, { lessonId: string; step: number }>;
}

export interface ReviewCard {
  id: string;
  lessonId: string;
  courseId: string;
  prompt: string;
  dueAt: number;
  interval: number; /** days */
  attempts: number;
  lastResult?: 'pass' | 'fail';
}

export interface ExplainBackResult {
  lessonId: string;
  courseId: string;
  stepKey: string;
  result: 'pass' | 'needs-work';
  ts: number;
}

/** Something the learner built and put online: the proof for a build (docs/VISION.md §5). */
export interface Ship {
  /** The public link, as the learner pasted it (https only). */
  url: string;
  at: number;
}

export interface DashStats {
  streakDays: number;
  lastActiveDate: string;
  timeSpentMs: number;
}

interface Store {
  v: 2;
  lessons: Record<string, LessonProgress>;
  last?: string;
  placement?: PlacementResult;
  gates: Record<string, GateResult>; // key: `${courseId}/${partId}`
  reviews: ReviewCard[];
  explainBacks: ExplainBackResult[];
  settings: {
    tutorKey?: string;
    noAiMode?: boolean;
  };
  dash: DashStats;
  /** Skill-plan skills the learner ticked as "I know this" (id → when). Optional: older saves lack it. */
  known?: Record<string, number>;
  /** Live links the learner shipped, by what they built (a chapter id, or `brief:<id>`). Optional: older saves lack it. */
  ships?: Record<string, Ship>;
  /** Levels earned (level number → when). Once earned, a level is kept even if its requirements grow. */
  levels?: Record<string, number>;
  /** Problem briefs: the stages ticked, and when the design was defended. Notes and interviews live apart. */
  briefs?: Record<string, BriefProgress>;
}

export interface BriefProgress {
  stages: string[];
  defended?: number;
}

const KEY = 'unpacked:progress:v2';
const LEGACY_KEY = 'unpacked:progress:v1';
const listeners = new Set<() => void>();
let state: Store = load();

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 2 && s.lessons) return s;
    }
    // Migrate from v1
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const v1 = JSON.parse(legacy);
      if (v1 && v1.v === 1 && v1.lessons) {
        return {
          v: 2,
          lessons: v1.lessons,
          last: v1.last,
          gates: {},
          reviews: [],
          explainBacks: [],
          settings: {},
          dash: { streakDays: 0, lastActiveDate: '', timeSpentMs: 0 },
        };
      }
    }
  } catch {
    /* corrupt or unavailable: start fresh */
  }
  return {
    v: 2,
    lessons: {},
    gates: {},
    reviews: [],
    explainBacks: [],
    settings: {},
    dash: { streakDays: 0, lastActiveDate: '', timeSpentMs: 0 },
  };
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
export const gateKey = (course: string, part: string) => `${course}/${part}`;

export function recordStep(course: string, lesson: string, step: number, total: number) {
  const key = lessonKey(course, lesson);
  const prev = state.lessons[key];
  const done = (prev?.done ?? false) || step >= total;
  if (prev && prev.step === step && prev.total === total && prev.done === done && state.last === key) return;

  // Update dash streak
  const today = new Date().toISOString().slice(0, 10);
  const dash = { ...state.dash };
  if (dash.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    dash.streakDays = dash.lastActiveDate === yesterday ? (dash.streakDays || 0) + 1 : 1;
    dash.lastActiveDate = today;
  }

  save({ ...state, last: key, dash, lessons: { ...state.lessons, [key]: { step, total, done, updated: Date.now() } } });
}

export function resetProgress() {
  save({
    v: 2,
    lessons: {},
    gates: {},
    reviews: [],
    explainBacks: [],
    settings: state.settings,
    dash: { streakDays: 0, lastActiveDate: '', timeSpentMs: 0 },
  });
}

export function savePlacementResult(result: PlacementResult) {
  save({ ...state, placement: result });
}

export function saveGateResult(courseId: string, partId: string, result: Omit<GateResult, 'attempts'>) {
  const key = gateKey(courseId, partId);
  const prev = state.gates[key];
  save({
    ...state,
    gates: {
      ...state.gates,
      [key]: {
        ...result,
        attempts: (prev?.attempts ?? 0) + 1,
        bestScore: Math.max(result.bestScore, prev?.bestScore ?? 0),
        passed: result.passed || (prev?.passed ?? false),
      },
    },
  });
}

export function skipGate(courseId: string, partId: string) {
  const key = gateKey(courseId, partId);
  const prev = state.gates[key];
  save({
    ...state,
    gates: {
      ...state.gates,
      [key]: {
        attempts: prev?.attempts ?? 0,
        bestScore: prev?.bestScore ?? 0,
        passed: prev?.passed ?? false,
        skipped: true,
        ts: Date.now(),
      },
    },
  });
}

export function addReviewCard(card: Omit<ReviewCard, 'attempts' | 'lastResult'>) {
  const existing = state.reviews.findIndex((r) => r.id === card.id);
  if (existing >= 0) return; // already scheduled
  save({
    ...state,
    reviews: [...state.reviews, { ...card, attempts: 0 }],
  });
}

export function recordReview(cardId: string, result: 'pass' | 'fail') {
  const INTERVALS = [1, 3, 7, 21]; // SRS schedule in days
  save({
    ...state,
    reviews: state.reviews.map((r) => {
      if (r.id !== cardId) return r;
      const nextInterval = result === 'pass'
        ? INTERVALS[Math.min(r.attempts, INTERVALS.length - 1)]
        : 1;
      return {
        ...r,
        attempts: r.attempts + 1,
        lastResult: result,
        interval: nextInterval,
        dueAt: Date.now() + nextInterval * 86400000,
      };
    }),
  });
}

export function saveExplainBack(result: ExplainBackResult) {
  save({
    ...state,
    explainBacks: [...state.explainBacks.filter((e) => e.stepKey !== result.stepKey), result],
  });
}

/** A link is worth keeping as proof only if it is a public https address (not localhost, not a file). */
export function shipUrl(raw: string): string | undefined {
  const text = raw.trim();
  if (!text) return undefined;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`);
    if (u.protocol !== 'https:') return undefined;
    if (!u.hostname.includes('.') || /^(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.)/.test(u.hostname)) return undefined;
    return u.href;
  } catch {
    return undefined;
  }
}

/** Keep a shipped link as the proof for `id`. Returns false when the link isn't a public https address. */
export function saveShip(id: string, raw: string): boolean {
  const url = shipUrl(raw);
  if (!url) return false;
  save({ ...state, ships: { ...state.ships, [id]: { url, at: Date.now() } } });
  return true;
}

export function removeShip(id: string) {
  if (!state.ships?.[id]) return;
  const ships = { ...state.ships };
  delete ships[id];
  save({ ...state, ships });
}

/** Record levels as earned (several at once for a learner who already met them). */
export function earnLevels(ns: number[]) {
  const fresh = ns.filter((n) => !state.levels?.[n]);
  if (!fresh.length) return;
  const levels = { ...state.levels };
  for (const n of fresh) levels[n] = Date.now();
  save({ ...state, levels });
}

/** Tick or untick one stage of a problem brief. */
export function toggleBriefStage(id: string, stage: string) {
  const prev = state.briefs?.[id] ?? { stages: [] };
  const stages = prev.stages.includes(stage) ? prev.stages.filter((x) => x !== stage) : [...prev.stages, stage];
  save({ ...state, briefs: { ...state.briefs, [id]: { ...prev, stages } } });
}

/** Mark a brief's design as defended (or not). */
export function setBriefDefended(id: string, defended: boolean) {
  const prev = state.briefs?.[id] ?? { stages: [] };
  save({ ...state, briefs: { ...state.briefs, [id]: { ...prev, defended: defended ? Date.now() : undefined } } });
}

/** Tick or untick a skill on a topic's skill plan. */
export function toggleKnown(id: string) {
  const known = { ...state.known };
  if (known[id]) delete known[id];
  else known[id] = Date.now();
  save({ ...state, known });
}

export function saveTutorKey(key: string) {
  save({ ...state, settings: { ...state.settings, tutorKey: key } });
}

export function setNoAiMode(val: boolean) {
  save({ ...state, settings: { ...state.settings, noAiMode: val } });
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

function getSnapshot() { return state; }

export function useProgress(): Store {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function usePlacement(): PlacementResult | undefined {
  const s = useSyncExternalStore(subscribe, getSnapshot);
  return s.placement;
}

export function useGates(): Record<string, GateResult> {
  const s = useSyncExternalStore(subscribe, getSnapshot);
  return s.gates;
}

export function useDueReviews(): ReviewCard[] {
  const s = useSyncExternalStore(subscribe, getSnapshot);
  const now = Date.now();
  return s.reviews.filter((r) => r.dueAt <= now);
}

export function useSettings() {
  const s = useSyncExternalStore(subscribe, getSnapshot);
  return s.settings;
}

export function useShips(): Record<string, Ship> {
  const s = useSyncExternalStore(subscribe, getSnapshot);
  return s.ships ?? NO_SHIPS;
}
const NO_SHIPS: Record<string, Ship> = {};

export function useDash() {
  const s = useSyncExternalStore(subscribe, getSnapshot);
  return s.dash;
}
