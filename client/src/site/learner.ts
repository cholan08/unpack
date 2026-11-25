/**
 * Read-only views of the learner's progress that several pages share:
 * the sidebar, the home hub, topic pages and the dashboard.
 * Pure functions of (content, progress) — no storage of their own.
 */
import { COURSES, findEntry, lessonEntries, nextReady, type LessonEntry } from '@/content/registry';
import { getPillar, type Pillar } from '@/content/pillars';
import type { Course, LessonMeta, Part, PillarId } from '@/engine/types';
import type { useProgress } from '@/lib/progress';

type Store = ReturnType<typeof useProgress>;

/* ---------------- topics ---------------- */

export interface TopicGroup {
  course: Course;
  part: Part;
  items: LessonEntry[];
  /** Lessons in the part overall (this topic + others). */
  inPart: number;
  /** Other topics that hold the rest of this part's lessons. */
  others: { pillar: Pillar; n: number }[];
}

/** Every lesson labelled with a topic, across every course, grouped under the part it comes from. */
export function topicGroups(id: PillarId): TopicGroup[] {
  const groups: TopicGroup[] = [];
  for (const course of COURSES) {
    const entries = lessonEntries(course);
    for (const part of course.parts) {
      const inPart = entries.filter((e) => e.part.id === part.id);
      const items = inPart.filter((e) => e.pillar === id);
      if (!items.length) continue;
      const counts = new Map<PillarId, number>();
      for (const e of inPart) if (e.pillar && e.pillar !== id) counts.set(e.pillar, (counts.get(e.pillar) ?? 0) + 1);
      const others = [...counts].map(([p, n]) => ({ pillar: getPillar(p)!, n }));
      groups.push({ course, part, items, inPart: inPart.length, others });
    }
  }
  return groups;
}

export interface TopicStats {
  total: number;
  ready: number;
  done: number;
  minutes: number;
  /** The lesson to open next in this topic: the one in progress, else the first not started. */
  next?: { course: Course; e: LessonEntry };
  resumeStep?: number;
  started: boolean;
  pct: number;
}

export function topicStats(groups: TopicGroup[], progress: Store): TopicStats {
  const all = groups.flatMap((g) => g.items.map((e) => ({ course: g.course, e })));
  const ready = all.filter((x) => x.e.meta);
  const state = (x: (typeof all)[number]) => progress.lessons[`${x.course.id}/${x.e.stub.id}`];
  const done = ready.filter((x) => state(x)?.done).length;
  const minutes = ready.reduce((m, x) => m + (x.e.meta?.minutes ?? 0), 0);
  const resume = ready.find((x) => state(x) && !state(x)!.done);
  const next = resume ?? ready.find((x) => !state(x)) ?? ready[0];
  return {
    total: all.length,
    ready: ready.length,
    done,
    minutes,
    next,
    resumeStep: resume ? state(resume)?.step : undefined,
    started: !!resume,
    pct: ready.length ? done / ready.length : 0,
  };
}

/** Topic stats by id, for the sidebar and the home hub. */
export const statsFor = (id: PillarId, progress: Store) => topicStats(topicGroups(id), progress);

/* ---------------- where to pick up ---------------- */

export interface ContinueTarget {
  kind: 'resume' | 'next' | 'start';
  course: Course;
  lesson?: LessonMeta;
  part?: Part;
  /** Step to open at (resume only). */
  step?: number;
  total?: number;
  href: string;
}

/**
 * The one thing to do next: resume the last lesson if it isn't finished, else the lesson after it,
 * else (a new learner) the Path door — the guided route from zero.
 */
export function continueTarget(progress: Store): ContinueTarget | undefined {
  const course = COURSES[0];
  if (!course) return undefined;
  const [cId, lId] = progress.last?.split('/') ?? [];
  const lastCourse = COURSES.find((c) => c.id === cId);
  const lesson = lastCourse && lId ? lastCourse.lessons[lId] : undefined;
  if (lastCourse && lesson) {
    const p = progress.lessons[`${lastCourse.id}/${lesson.id}`];
    if (p && !p.done) {
      return {
        kind: 'resume',
        course: lastCourse,
        lesson,
        part: findEntry(lastCourse, lesson.id)?.part,
        step: p.step,
        total: p.total,
        href: `/${lastCourse.id}/${lesson.id}${p.step ? `?s=${p.step}` : ''}`,
      };
    }
    const nxt = nextReady(lastCourse, lesson.id);
    if (nxt?.meta)
      return { kind: 'next', course: lastCourse, lesson: nxt.meta, part: nxt.part, href: `/${lastCourse.id}/${nxt.stub.id}` };
  }
  return { kind: 'start', course, href: '/path' };
}

/** Lessons done across a course. */
export function courseDone(course: Course, progress: Store) {
  const ready = Object.keys(course.lessons);
  const done = ready.filter((id) => progress.lessons[`${course.id}/${id}`]?.done).length;
  return { done, ready: ready.length, pct: ready.length ? done / ready.length : 0 };
}

export const hasStarted = (progress: Store) => Object.keys(progress.lessons).length > 0;
