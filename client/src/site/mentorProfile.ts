/**
 * What the mentor knows about the learner and the page they are on.
 * Pure functions of (content, progress): the profile is rebuilt on every question, so it is never stale.
 * Everything here comes from this browser's progress; nothing is stored by the server.
 */
import { COURSES, getCourse, lessonEntries } from '@/content/registry';
import type { useProgress } from '@/lib/progress';
import { continueTarget } from './learner';

type Store = ReturnType<typeof useProgress>;

export interface MentorProfile {
  streakDays: number;
  done: number;
  total: number;
  dueReviews: number;
  current?: { title: string; step: number; total: number };
  next?: { title: string };
  placement?: { score: number; total: number };
  gates: { part: string; passed: boolean; skipped: boolean; attempts: number; bestScore: number; weak: string[] }[];
  /** Lessons whose explain-back answer still needs work. */
  shaky: string[];
  /** Every written lesson: lets the mentor link to the right one. */
  lessons: { path: string; title: string; status: 'done' | 'started' | 'new' }[];
}

export function buildMentorProfile(progress: Store): MentorProfile {
  const lessons: MentorProfile['lessons'] = [];
  for (const course of COURSES) {
    for (const e of lessonEntries(course)) {
      if (!e.meta) continue;
      const p = progress.lessons[`${course.id}/${e.stub.id}`];
      lessons.push({
        path: `/${course.id}/${e.stub.id}`,
        title: e.meta.title,
        status: p?.done ? 'done' : p ? 'started' : 'new',
      });
    }
  }

  const titleOf = (courseId: string, lessonId: string) => getCourse(courseId)?.lessons[lessonId]?.title;

  const gates: MentorProfile['gates'] = Object.entries(progress.gates).map(([key, g]) => {
    const [courseId, partId] = key.split('/');
    const part = getCourse(courseId)?.parts.find((p) => p.id === partId);
    const weak = new Set<string>();
    for (const w of Object.values(g.weakTopics ?? {})) {
      const t = titleOf(courseId, w.lessonId);
      if (t) weak.add(t);
    }
    return { part: part?.title ?? partId, passed: g.passed, skipped: g.skipped, attempts: g.attempts, bestScore: g.bestScore, weak: [...weak] };
  });

  const shaky = new Set<string>();
  for (const e of progress.explainBacks) {
    if (e.result !== 'needs-work') continue;
    const t = titleOf(e.courseId, e.lessonId);
    if (t) shaky.add(t);
  }

  const target = continueTarget(progress);
  const now = Date.now();

  return {
    streakDays: progress.dash.streakDays,
    done: lessons.filter((l) => l.status === 'done').length,
    total: lessons.length,
    dueReviews: progress.reviews.filter((r) => r.dueAt <= now).length,
    current:
      target?.kind === 'resume' && target.lesson
        ? { title: target.lesson.title, step: target.step ?? 0, total: target.total ?? 0 }
        : undefined,
    next: target?.kind === 'next' && target.lesson ? { title: target.lesson.title } : undefined,
    placement: progress.placement ? { score: progress.placement.score, total: progress.placement.total } : undefined,
    gates,
    shaky: [...shaky],
    lessons,
  };
}

/* ---------------- where the learner is ---------------- */

const STATIC_PAGES: Record<string, string> = {
  '/': 'Home',
  '/start': 'Start Here (placement check)',
  '/me': 'Dashboard',
  '/review': 'Spaced review',
  '/errors': 'Common errors',
  '/handnote': 'My notes',
  '/library': 'Library',
  '/techpack': 'Techpack',
  '/skillpack': 'Skill Pack',
  '/notebooks': 'Notebooks',
  '/capstone': 'Capstone project',
};

/** A plain description of the current route, for pages that do not publish their own context. */
export function describeRoute(pathname: string): { kind: string; title: string } {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (STATIC_PAGES[path]) return { kind: 'page', title: STATIC_PAGES[path] };
  if (path.startsWith('/capstone/')) return { kind: 'capstone', title: 'Capstone project' };
  if (path.startsWith('/notebooks/')) return { kind: 'notebook', title: 'Notebook' };

  const [, courseId, a, b] = path.split('/');
  const course = getCourse(courseId);
  if (!course) return { kind: 'page', title: 'Topic page' };
  if (!a) return { kind: 'course-map', title: `${course.title} — course map` };
  if (a === 'roadmap') return { kind: 'roadmap', title: `${course.title} — roadmap` };
  if (a === 'glossary') return { kind: 'glossary', title: `${course.title} — glossary` };
  if (a === 'gate') {
    const part = course.parts.find((p) => p.id === b);
    return { kind: 'gate', title: `Gate: ${part?.title ?? b}` };
  }
  const lesson = course.lessons[a];
  return lesson ? { kind: 'lesson', title: lesson.title } : { kind: 'page', title: course.title };
}
