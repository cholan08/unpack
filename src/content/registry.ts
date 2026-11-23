/**
 * Discovers every course and lesson under ./courses automatically.
 *   courses/<course-id>/course.ts        — course definition + table of contents (loaded up front)
 *   courses/<course-id>/lessons/<id>.ts  — one lesson's content (loaded on demand, its own chunk)
 * The lesson's file name is its id. A lesson listed in a part without a file shows as "Coming soon".
 */
import type { Course, CourseDef, Lesson, LessonContent, LessonMeta, LessonStub, Part } from '@/engine/types';

const courseMods = import.meta.glob<{ default: CourseDef }>('./courses/*/course.ts', { eager: true });
// Not eager: each lesson becomes a separate chunk, fetched the first time someone needs it.
const lessonLoaders = import.meta.glob<{ default: LessonContent }>('./courses/*/lessons/*.ts');

/** "./courses/mern/lessons/cors.ts" → ["mern", "cors"] */
const parsePath = (path: string) => {
  const parts = path.split('/');
  return [parts[2], parts[4].replace(/\.ts$/, '')] as const;
};

const loaders = new Map<string, () => Promise<{ default: LessonContent }>>();
for (const [path, load] of Object.entries(lessonLoaders)) {
  const [courseId, lessonId] = parsePath(path);
  loaders.set(`${courseId}/${lessonId}`, load);
}

function build(): Course[] {
  return Object.entries(courseMods).map(([path, mod]) => {
    const def = mod.default;
    const dir = path.split('/')[2];
    const stubs = new Map<string, LessonStub>(def.parts.flatMap((p) => p.lessons.map((l) => [l.id, l] as const)));
    const lessons: Record<string, LessonMeta> = {};

    for (const key of loaders.keys()) {
      const [courseId, lessonId] = key.split('/');
      if (courseId !== dir) continue;
      const stub = stubs.get(lessonId);
      if (!stub) {
        if (import.meta.env.DEV) console.warn(`[content] lessons/${lessonId}.ts is not listed in any part of "${def.id}"`);
        continue;
      }
      const missing = (['summary', 'minutes', 'level'] as const).filter((k) => stub[k] === undefined);
      if (missing.length && import.meta.env.DEV) console.warn(`[content] "${def.id}/${lessonId}" is written but its entry in course.ts lacks: ${missing.join(', ')}`);
      lessons[lessonId] = { id: lessonId, title: stub.title, summary: stub.summary ?? '', minutes: stub.minutes ?? 0, level: stub.level ?? 'beginner', interactive: stub.interactive };
    }
    if (import.meta.env.DEV && def.hero && !lessons[def.hero.lesson]) console.warn(`[content] hero lesson "${def.hero.lesson}" of "${def.id}" isn't written`);
    return { ...def, lessons };
  });
}

export const COURSES: Course[] = build();

export const getCourse = (id: string | undefined) => COURSES.find((c) => c.id === id);

/* ---------------- loading lesson content ---------------- */

const pending = new Map<string, Promise<Lesson>>();
const loaded = new Map<string, Lesson>();

/** The full lesson, if it has already been loaded (lets pages render without a loading flash). */
export const peekLesson = (course: Course, lessonId: string) => loaded.get(`${course.id}/${lessonId}`);

/** Loads (once) and returns a lesson's content merged with its catalog entry. */
export function loadLesson(course: Course, lessonId: string): Promise<Lesson> {
  const key = `${course.id}/${lessonId}`;
  const meta = course.lessons[lessonId];
  const load = loaders.get(key);
  if (!meta || !load) return Promise.reject(new Error(`No lesson "${key}"`));
  let p = pending.get(key);
  if (!p) {
    p = load().then(
      (mod) => {
        const lesson: Lesson = { ...meta, ...mod.default };
        if (import.meta.env.DEV && !!meta.interactive !== lesson.steps.some((st) => st.sandbox))
          console.warn(`[content] "${key}": set interactive: ${!meta.interactive} in course.ts to match its sandbox steps`);
        loaded.set(key, lesson);
        return lesson;
      },
      (err) => {
        pending.delete(key); // allow a retry
        throw err;
      },
    );
    pending.set(key, p);
  }
  return p;
}

/** Fire-and-forget warm-up, e.g. on hover. Failures are ignored here and surface on real use. */
export function prefetchLesson(course: Course, lessonId: string) {
  if (course.lessons[lessonId]) loadLesson(course, lessonId).catch(() => {});
}

/* ---------------- table of contents helpers ---------------- */

export interface LessonEntry {
  part: Part;
  stub: LessonStub;
  /** Present when the lesson is written. */
  meta?: LessonMeta;
  /** Position across the whole course, 1-based. */
  n: number;
}

export function lessonEntries(course: Course): LessonEntry[] {
  let n = 0;
  return course.parts.flatMap((part) => part.lessons.map((stub) => ({ part, stub, meta: course.lessons[stub.id], n: ++n })));
}

export function findEntry(course: Course, lessonId: string) {
  return lessonEntries(course).find((e) => e.stub.id === lessonId);
}

/** The next lesson that has been written. */
export function nextReady(course: Course, lessonId: string): LessonEntry | undefined {
  const all = lessonEntries(course);
  const i = all.findIndex((e) => e.stub.id === lessonId);
  return all.slice(i + 1).find((e) => e.meta);
}

export function courseStats(course: Course) {
  const ready = Object.values(course.lessons);
  return {
    total: lessonEntries(course).length,
    ready: ready.length,
    minutes: ready.reduce((m, l) => m + l.minutes, 0),
  };
}
