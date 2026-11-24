import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { ArrowRight, BookA, Check, ChevronRight, Clock, Route, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { courseStats, getCourse, lessonEntries, type LessonEntry } from '@/content/registry';
import type { Course } from '@/engine/types';
import { useGates, useProgress } from '@/lib/progress';
import { prefetchLessonPage } from './prefetch';
import { NotFound } from './NotFound';
import { PageHead, Ring, fmtHours } from './ui';
import './topic.css';

const LEVEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

/**
 * One lesson as a row in a syllabus: its state (number / progress ring / tick), title and summary,
 * and its length. `n` overrides the number shown (default: position in the course).
 * Keep the `lcard` class: `npm run qa` discovers lessons through `a.lcard`.
 */
export function LessonCard({ course, e, n = e.n }: { course: Course; e: LessonEntry; n?: number }) {
  const progress = useProgress();
  const p = progress.lessons[`${course.id}/${e.stub.id}`];
  const num = String(n).padStart(2, '0');
  if (!e.meta) {
    return (
      <div className="lcard" data-soon>
        <span className="lcard-state">
          <span className="lcard-n mono">{num}</span>
        </span>
        <span className="lcard-body">
          <span className="lcard-title">{e.stub.title}</span>
          <span className="lcard-sum">Coming soon</span>
        </span>
      </div>
    );
  }
  const l = e.meta;
  const status = p?.done ? 'done' : p ? 'started' : 'new';
  const warm = () => prefetchLessonPage(course, l.id);
  const pct = status === 'started' && p!.total ? p!.step / p!.total : 0;
  return (
    <Link to={`/${course.id}/${l.id}`} className="lcard" data-status={status} onMouseEnter={warm} onFocus={warm} onTouchStart={warm}>
      <span className="lcard-state" aria-hidden>
        {status === 'done' ? (
          <span className="lcard-tick">
            <Check size={14} strokeWidth={3} />
          </span>
        ) : status === 'started' ? (
          <Ring pct={pct} size={30} stroke={2.6}>
            <span className="lcard-n mono">{num}</span>
          </Ring>
        ) : (
          <span className="lcard-n mono">{num}</span>
        )}
      </span>
      <span className="lcard-body">
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
          {status === 'done' && <span className="lcard-done">Done</span>}
          {status === 'started' && (
            <span className="lcard-started">
              Step {p!.step}
              {p!.total ? ` of ${p!.total}` : ''}
            </span>
          )}
        </span>
      </span>
      <ChevronRight size={16} className="lcard-go" aria-hidden />
    </Link>
  );
}

export function CoursePage() {
  const { courseId } = useParams();
  const course = getCourse(courseId);
  const progress = useProgress();
  const gates = useGates();
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
  const pct = stats.ready ? done / stats.ready : 0;

  return (
    <main className="course">
      <div className="wrap">
        <PageHead
          eyebrow="Course map"
          title={course.title}
          lede={course.description}
          actions={
            <>
              <Link className="btn" to={`/${course.id}/roadmap`}>
                <Route size={15} /> Roadmap
              </Link>
              <Link className="btn" to={`/${course.id}/glossary`}>
                <BookA size={15} /> Glossary
              </Link>
            </>
          }
        >
          <div className="course-bar">
            <span className="bar" data-tone="ok" aria-label={`${done} of ${stats.ready} lessons completed`}>
              <i style={{ width: `${pct * 100}%` }} />
            </span>
            <span className="course-bar-text">
              <strong>{done}</strong> of {stats.ready} lessons · {fmtHours(stats.minutes)} · {course.parts.length} parts
            </span>
            {cta && (
              <Link
                className="btn btn--primary"
                to={`/${course.id}/${cta.stub.id}${ctaStep ? `?s=${ctaStep}` : ''}`}
                onMouseEnter={() => prefetchLessonPage(course, cta.stub.id)}
                onFocus={() => prefetchLessonPage(course, cta.stub.id)}
              >
                {resume ? 'Continue' : done ? 'Next' : 'Start'}: {cta.meta!.title} <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </PageHead>

        <div className="syl">
          {course.parts.map((part) => {
            const items = entries.filter((e) => e.part.id === part.id);
            const readyN = items.filter((e) => e.meta).length;
            const doneN = items.filter((e) => progress.lessons[`${course.id}/${e.stub.id}`]?.done).length;
            const gate = gates[`${course.id}/${part.id}`];
            return (
              <section key={part.id} className="syl-part" data-tone={part.tone} id={part.id}>
                <header className="syl-head">
                  <span className="syl-num mono">Part {part.num}</span>
                  <h2>{part.title}</h2>
                  <p>{part.blurb}</p>
                  <span className="syl-count">
                    {doneN > 0 ? `${doneN} of ${readyN} done` : `${readyN} lessons`}
                    {readyN < items.length ? ` · ${items.length - readyN} coming` : ''}
                  </span>
                  <Link to={`/${course.id}/gate/${part.id}`} className="syl-gate" data-passed={gate?.passed || undefined}>
                    <ShieldCheck size={14} /> {gate?.passed ? 'Gate passed' : `Part ${part.num} gate`}
                  </Link>
                </header>
                <ol className="syl-list">
                  {items.map((e) => (
                    <li key={e.stub.id}>
                      <LessonCard course={course} e={e} />
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      </div>
    </main>
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
  // group by first letter, A–Z
  const groups = new Map<string, typeof shown>();
  for (const t of shown) {
    const L = /[a-z]/i.test(t.term[0]) ? t.term[0].toUpperCase() : '#';
    groups.set(L, [...(groups.get(L) ?? []), t]);
  }
  return (
    <main className="wrap wrap--narrow glossary">
      <PageHead
        eyebrow={
          <Link to={`/${course.id}`} className="glossary-back">
            {course.short} · Library
          </Link>
        }
        title="Glossary"
        lede="Every term used in the lessons. In a lesson, hover a dotted word to see its entry."
      />
      <label className="field glossary-search">
        <Search size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${terms.length} terms…`} aria-label="Search terms" />
      </label>
      {!q && (
        <nav className="glossary-az" aria-label="Jump to letter">
          {[...groups.keys()].map((L) => (
            <a key={L} href={`#letter-${L}`}>
              {L}
            </a>
          ))}
        </nav>
      )}
      <div className="glossary-list">
        {[...groups].map(([L, list]) => (
          <section key={L} id={`letter-${L}`}>
            <h2 className="glossary-letter">{L}</h2>
            <dl>
              {list.map((t) => (
                <div key={t.k} id={t.k}>
                  <dt>{t.term}</dt>
                  <dd>{t.def}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        {shown.length === 0 && (
          <p className="empty">
            <strong>No terms match “{q}”.</strong>
            Try a shorter word, or search everything with <kbd>/</kbd>.
          </p>
        )}
      </div>
    </main>
  );
}
