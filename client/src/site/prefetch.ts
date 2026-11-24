import { lazy } from 'react';
import { prefetchLesson } from '@/content/registry';
import type { Course } from '@/engine/types';

/** The lesson page — the player and everything only it needs — is its own chunk. */
const loadLessonPage = () => import('./LessonPage');

export const LessonPageLazy = lazy(() => loadLessonPage().then((m) => ({ default: m.LessonPage })));

/** Warm up the player code and one lesson's content, e.g. when a link is hovered. */
export function prefetchLessonPage(course: Course, lessonId: string) {
  loadLessonPage().catch(() => {});
  prefetchLesson(course, lessonId);
}
