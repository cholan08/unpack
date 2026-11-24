import type { Course } from '@/engine/types';
import type { GateResult, PlacementResult } from '@/lib/progress';

export type LessonState = 'done' | 'started' | 'new' | 'soon';
export interface LessonStatus {
  state: LessonState;
  step?: number;
  total?: number;
  /** 0..1 */
  frac: number;
}
export interface PartStatus {
  done: number;
  total: number;
  minutes: number;
  minutesLeft: number;
  started: boolean;
  complete: boolean;
  /** Before where the placement check put the learner (and not finished). */
  skippable: boolean;
}
export type GateState = 'passed' | 'skipped' | 'ready' | 'locked';
export interface GateStatus {
  state: GateState;
  result?: GateResult;
}
export interface MapStatus {
  lessons: Record<string, LessonStatus>;
  parts: Record<string, PartStatus>;
  gates: Record<string, GateStatus>;
  /** The lesson to do next (continue an open one, else the first unfinished). */
  next?: { lessonId: string; partIndex: number; resume: boolean };
  /** Index of the part the learner is in. */
  current: number;
  totals: { done: number; total: number; gatesPassed: number; gates: number; minutesLeft: number; pct: number };
  anyProgress: boolean;
}

interface ProgressLike {
  lessons: Record<string, { step: number; total?: number; done: boolean }>;
  last?: string;
}

export function computeStatus(course: Course, progress: ProgressLike, gates: Record<string, GateResult>, placement: PlacementResult | undefined): MapStatus {
  const lessons: MapStatus['lessons'] = {};
  const parts: MapStatus['parts'] = {};
  const gateOut: MapStatus['gates'] = {};
  const startPart = placement?.startPart ?? 0;
  let done = 0;
  let total = 0;
  let minutesLeft = 0;
  let gatesPassed = 0;
  let anyProgress = false;

  course.parts.forEach((part, pi) => {
    let pDone = 0;
    let minutes = 0;
    let left = 0;
    let started = false;
    for (const stub of part.lessons) {
      const meta = course.lessons[stub.id];
      const p = progress.lessons[`${course.id}/${stub.id}`];
      let st: LessonStatus;
      if (!meta) st = { state: 'soon', frac: 0 };
      else if (p?.done) st = { state: 'done', frac: 1, step: p.step, total: p.total };
      else if (p) st = { state: 'started', step: p.step, total: p.total, frac: p.total ? Math.min(1, p.step / p.total) : 0.1 };
      else st = { state: 'new', frac: 0 };
      lessons[stub.id] = st;
      const m = meta?.minutes ?? stub.minutes ?? 0;
      minutes += m;
      if (st.state === 'done') pDone++;
      else left += Math.round(m * (1 - st.frac));
      if (st.state === 'done' || st.state === 'started') started = true;
    }
    const totalP = part.lessons.length;
    const complete = totalP > 0 && pDone === totalP;
    parts[part.id] = { done: pDone, total: totalP, minutes, minutesLeft: left, started, complete, skippable: pi < startPart && !complete };
    done += pDone;
    total += totalP;
    minutesLeft += left;
    if (started) anyProgress = true;

    const g = gates[`${course.id}/${part.id}`];
    let state: GateState = complete ? 'ready' : 'locked';
    if (g?.passed) state = 'passed';
    else if (g?.skipped) state = 'skipped';
    if (state === 'passed') gatesPassed++;
    gateOut[part.id] = { state, result: g };
  });

  // next up: resume the last open lesson, else the first unfinished from the placement point
  let next: MapStatus['next'];
  const order = course.parts.flatMap((part, pi) => part.lessons.map((l) => ({ id: l.id, pi })));
  const lastId = progress.last?.startsWith(course.id + '/') ? progress.last.slice(course.id.length + 1) : undefined;
  const lastEntry = lastId ? order.find((o) => o.id === lastId) : undefined;
  if (lastEntry && lessons[lastEntry.id]?.state === 'started') next = { lessonId: lastEntry.id, partIndex: lastEntry.pi, resume: true };
  else {
    const open = (o: { id: string }) => lessons[o.id].state === 'new' || lessons[o.id].state === 'started';
    const from = lastEntry ? order.indexOf(lastEntry) : order.findIndex((o) => o.pi >= startPart);
    const hit = order.slice(Math.max(0, from)).find(open) ?? order.find(open);
    if (hit) next = { lessonId: hit.id, partIndex: hit.pi, resume: lessons[hit.id].state === 'started' };
  }

  const current = next?.partIndex ?? (done === total ? course.parts.length - 1 : startPart);
  return {
    lessons,
    parts,
    gates: gateOut,
    next,
    current,
    totals: { done, total, gatesPassed, gates: course.parts.length, minutesLeft, pct: total ? done / total : 0 },
    anyProgress,
  };
}

export const fmtMinutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`);
