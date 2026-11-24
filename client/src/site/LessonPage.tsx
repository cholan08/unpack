import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { getCourse, loadLesson, peekLesson } from '@/content/registry';
import type { Course, Lesson } from '@/engine/types';
import { LessonPlayer } from '@/player/LessonPlayer';
import { LessonShell } from './LessonShell';
import { NotFound } from './NotFound';
import { AppFrame } from './AppShell';

/** A wrong lesson URL still gets the site's navigation. */
const Missing = () => (
  <AppFrame>
    <NotFound />
  </AppFrame>
);

/** Loads a lesson's content on demand (cached after the first time). */
function useLesson(course: Course | undefined, lessonId: string | undefined) {
  const key = course && lessonId ? `${course.id}/${lessonId}` : '';
  const [result, setResult] = useState<{ key: string; lesson?: Lesson; failed?: boolean }>(() => ({
    key,
    lesson: course && lessonId ? peekLesson(course, lessonId) : undefined,
  }));

  useEffect(() => {
    if (!course || !lessonId || !course.lessons[lessonId]) return;
    const cached = peekLesson(course, lessonId);
    if (cached) {
      setResult({ key, lesson: cached });
      return;
    }
    let live = true;
    setResult({ key });
    loadLesson(course, lessonId).then(
      (lesson) => live && setResult({ key, lesson }),
      () => live && setResult({ key, failed: true }),
    );
    return () => {
      live = false;
    };
  }, [course, lessonId, key]);

  return result.key === key ? result : { key };
}

export function LessonPage() {
  const { courseId, lessonId } = useParams();
  const course = getCourse(courseId);
  const { lesson, failed } = useLesson(course, lessonId);

  if (!course) return <Missing />;
  if (!lessonId || !course.lessons[lessonId]) {
    // Known but unwritten lessons go back to the course map instead of a dead end.
    const listed = course.parts.some((p) => p.lessons.some((l) => l.id === lessonId));
    return listed ? <Navigate to={`/${course.id}`} replace /> : <Missing />;
  }
  if (failed) return <LessonShell error />;
  if (!lesson) return <LessonShell />;
  // key: a fresh player (and clock) per lesson
  return <LessonPlayer key={`${course.id}/${lesson.id}`} course={course} lesson={lesson} />;
}
