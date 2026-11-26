/** Small pieces both Manual pages share: progress by chapter, tones, the status pill. */
import { COURSES } from '@/content/registry';
import { getPillar } from '@/content/pillars';
import { chapterLens, chapterLessons, chapterStatus, statusLabel, type Chapter } from '@/content/manual';
import type { Tone } from '@/engine/types';
import type { useProgress } from '@/lib/progress';

type Store = ReturnType<typeof useProgress>;

const course = COURSES[0];

/** The chapter's colour: its first topic lens, else neutral. */
export const chapterTone = (c: Chapter): Tone => getPillar(chapterLens(c))?.tone ?? 'neutral';

/** Lessons finished out of the chapter's written lessons. */
export function chapterProgress(c: Chapter, progress: Store) {
  const lessons = chapterLessons(c);
  const done = course ? lessons.filter((e) => progress.lessons[`${course.id}/${e.stub.id}`]?.done).length : 0;
  return { done, ready: lessons.length, pct: lessons.length ? done / lessons.length : 0 };
}

/** Where a chapter opens: its own page, or the page that *is* the chapter (the capstone). */
export const chapterHref = (c: Chapter) => c.href ?? `/manual/${c.id}`;

export function StatusPill({ c }: { c: Chapter }) {
  return (
    <span className="mn-status" data-status={chapterStatus(c)}>
      <i aria-hidden />
      {statusLabel(c)}
    </span>
  );
}

export { chapterStatus };
