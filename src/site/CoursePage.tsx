import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { ArrowRight, Check, Clock, Search, SlidersHorizontal } from 'lucide-react';
import { courseStats, getCourse, lessonEntries, type LessonEntry } from '@/content/registry';
import type { Course } from '@/engine/types';
import { useProgress } from '@/lib/progress';
import { SiteFooter, SiteHeader } from './SiteHeader';
import { prefetchLessonPage } from './prefetch';
import { NotFound } from './NotFound';

const LEVEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

function LessonCard({ course, e }: { course: Course; e: LessonEntry }) {
  const progress = useProgress();
  const p = progress.lessons[`${course.id}/${e.stub.id}`];
  if (!e.meta) {
    return (
      <div className="lcard" data-soon>
        <span className="lcard-n mono">{String(e.n).padStart(2, '0')}</span>
        <span className="lcard-title">{e.stub.title}</span>
        <span className="lcard-soon">Coming soon</span>
      </div>
    );
  }
  const l = e.meta;
  const status = p?.done ? 'done' : p ? 'started' : 'new';
  const warm = () => prefetchLessonPage(course, l.id);
  return (
    <Link to={`/${course.id}/${l.id}`} className="lcard" data-status={status} onMouseEnter={warm} onFocus={warm} onTouchStart={warm}>
      <span className="lcard-n mono">{String(e.n).padStart(2, '0')}</span>
      <span className="lcard-title">{l.title}</span>
      <span className="lcard-sum">{l.summary}</span>
      <span className="lcard-meta">
        <span>
          <Clock size={12} /> {l.minutes} min
        </span>
        <span>{LEVEL[l.level]}</span>
        {l.interactive && (
          <span className="lcard-try" title="Has an interactive diagram you can play with">
            <SlidersHorizontal size={11} strokeWidth={2.5} /> Try it
          </span>
        )}
        {status === 'done' && (
          <span className="lcard-done">
            <Check size={12} strokeWidth={3} /> Done
          </span>
        )}
        {status === 'started' && (
          <span className="lcard-started">
            Step {p!.step}
            {p!.total ? ` of ${p!.total}` : ''}
          </span>
        )}
      </span>
      {status === 'started' && p!.total && (
        <span className="lcard-bar">
          <i style={{ width: `${(p!.step / p!.total) * 100}%` }} />
        </span>
      )}
    </Link>
  );
}

export function CoursePage() {
  const { courseId } = useParams();
  const course = getCourse(courseId);
  const progress = useProgress();
  useEffect(() => {
    if (course) document.title = `${course.title} — Unpacked`;
  }, [course]);
  if (!course) return <NotFound />;

  const stats = courseStats(course);
  const entries = lessonEntries(course);
  const ready = entries.filter((e) => e.meta);
  const done = ready.filter((e) => progress.lessons[`${course.id}/${e.stub.id}`]?.done).length;
  const resume = ready.find((e) => {
    const p = progress.lessons[`${course.id}/${e.stub.id}`];
    return p && !p.done;
  });
  const nextNew = ready.find((e) => !progress.lessons[`${course.id}/${e.stub.id}`]);
  const cta = resume ?? nextNew ?? ready[0];
  const ctaStep = resume ? progress.lessons[`${course.id}/${resume.stub.id}`]?.step : undefined;

  return (
    <>
      <SiteHeader />
      <main className="course">
        <section className="course-hero">
          <div className="wrap">
            <span className="eyebrow">Course</span>
            <h1 className="display course-title">{course.title}</h1>
            <p className="course-lede">{course.description}</p>
            <div className="course-stats">
              <div>
                <strong>{stats.ready}</strong>
                <span>lessons ready</span>
              </div>
              <div>
                <strong>{stats.total}</strong>
                <span>planned</span>
              </div>
              <div>
                <strong>{Math.round(stats.minutes / 6) / 10}h</strong>
                <span>of lessons so far</span>
              </div>
              <div>
                <strong>
                  {done}/{stats.ready}
                </strong>
                <span>completed</span>
              </div>
            </div>
            <div className="course-progress" aria-label={`${done} of ${stats.ready} lessons completed`}>
              <i style={{ width: `${stats.ready ? (done / stats.ready) * 100 : 0}%` }} />
            </div>
            <div className="course-cta">
              {cta && (
                <Link
                  className="btn btn--primary btn--lg"
                  to={`/${course.id}/${cta.stub.id}${ctaStep ? `?s=${ctaStep}` : ''}`}
                  onMouseEnter={() => prefetchLessonPage(course, cta.stub.id)}
                  onFocus={() => prefetchLessonPage(course, cta.stub.id)}
                >
                  {resume ? 'Continue' : done ? 'Next lesson' : 'Start'}: {cta.meta!.title} <ArrowRight size={16} />
                </Link>
              )}
              <Link className="btn btn--lg" to={`/${course.id}/roadmap`}>
                Roadmap
              </Link>
              <Link className="btn btn--lg" to={`/${course.id}/glossary`}>
                Glossary
              </Link>
            </div>
          </div>
        </section>

        <div className="wrap parts">
          {course.parts.map((part) => {
            const items = entries.filter((e) => e.part.id === part.id);
            const readyN = items.filter((e) => e.meta).length;
            return (
              <section key={part.id} className="part" data-tone={part.tone} id={part.id}>
                <header className="part-head">
                  <span className="part-num display">{part.num}</span>
                  <div>
                    <h2 className="display">{part.title}</h2>
                    <p className="muted">{part.blurb}</p>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      <span className="part-count">
                        {readyN} of {items.length} ready
                      </span>
                      <Link to={`/${course.id}/gate/${part.id}`} className="pill" style={{ color: 'inherit' }}>
                        Part {part.num} Gate →
                      </Link>
                    </div>
                  </div>
                </header>
                <div className="lcards">
                  {items.map((e) => (
                    <LessonCard key={e.stub.id} course={course} e={e} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export function GlossaryPage() {
  const { courseId } = useParams();
  const course = getCourse(courseId);
  const [q, setQ] = useState('');
  const terms = useMemo(
    () =>
      course
        ? Object.entries(course.glossary)
            .map(([k, v]) => ({ k, ...v }))
            .sort((a, b) => a.term.localeCompare(b.term))
        : [],
    [course],
  );
  useEffect(() => {
    if (course) document.title = `Glossary · ${course.short} — Unpacked`;
  }, [course]);
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      el?.scrollIntoView({ block: 'center' });
      el?.setAttribute('data-target', '');
      setTimeout(() => el?.removeAttribute('data-target'), 2200);
    }, 30);
    return () => clearTimeout(t);
  }, [hash]);
  if (!course) return <NotFound />;
  const shown = terms.filter((t) => (t.term + ' ' + t.def).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <SiteHeader />
      <main className="wrap glossary">
        <Link to={`/${course.id}`} className="eyebrow glossary-back">
          ← {course.short}
        </Link>
        <h1 className="display">Glossary</h1>
        <p className="muted">Every term used in the lessons. Hover a dotted word in any lesson to see its entry.</p>
        <label className="glossary-search">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${terms.length} terms…`} aria-label="Search terms" />
        </label>
        <dl className="glossary-list">
          {shown.map((t) => (
            <div key={t.k} id={t.k}>
              <dt>{t.term}</dt>
              <dd>{t.def}</dd>
            </div>
          ))}
          {shown.length === 0 && <p className="muted">No terms match “{q}”.</p>}
        </dl>
      </main>
      <SiteFooter />
    </>
  );
}
