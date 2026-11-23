import { Link, useParams } from 'react-router';
import { ChevronLeft, RotateCcw, WifiOff } from 'lucide-react';
import { findEntry, getCourse } from '@/content/registry';

/**
 * Shown while a lesson's code or content is loading, and when loading fails.
 * Lives in the main bundle so it can appear instantly; fades in only if loading takes a moment.
 * Recovery is a reload: browsers remember a failed import() for the life of the page,
 * so retrying in place would fail again. The URL keeps the step; progress is saved.
 */
export function LessonShell({ error }: { error?: boolean }) {
  const { courseId, lessonId } = useParams();
  const course = getCourse(courseId);
  const meta = course && lessonId ? course.lessons[lessonId] : undefined;
  const part = course && lessonId ? findEntry(course, lessonId)?.part : undefined;
  return (
    <div className="shell" data-error={error || undefined} aria-busy={!error}>
      <header className="shell-bar">
        <Link to={course ? `/${course.id}` : '/'} className="shell-back" aria-label="Back to the course">
          <ChevronLeft size={18} />
        </Link>
        <div className="shell-title">
          {part && (
            <span>
              {part.num} · {part.title}
            </span>
          )}
          <strong>{meta?.title ?? 'Loading…'}</strong>
        </div>
      </header>
      <div className="shell-main">
        <section className="shell-narr">
          {error ? (
            <div className="shell-error" role="alert">
              <WifiOff size={22} />
              <h1 className="display">Couldn’t load this lesson</h1>
              <p className="muted">Check your connection and try again. Your place in the lesson is kept.</p>
              <div className="shell-actions">
                <button className="btn btn--primary" onClick={() => location.reload()}>
                  <RotateCcw size={15} /> Try again
                </button>
                {course && (
                  <Link className="btn" to={`/${course.id}`}>
                    Back to the course
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="shell-skeleton" aria-hidden>
              <i style={{ width: '28%' }} />
              <i className="shell-h" style={{ width: '82%' }} />
              <i className="shell-h" style={{ width: '58%' }} />
              <i style={{ width: '96%' }} />
              <i style={{ width: '90%' }} />
              <i style={{ width: '72%' }} />
            </div>
          )}
        </section>
        <section className="shell-stage" aria-hidden>
          {!error && (
            <span className="shell-loading">
              <i /> Loading lesson…
            </span>
          )}
        </section>
      </div>
    </div>
  );
}
