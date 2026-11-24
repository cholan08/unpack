/**
 * Home is two pages in one:
 *  - a new learner gets the pitch (a live diagram, how a lesson works, the main topics);
 *  - a returning learner gets a hub: the lesson to continue — drawn at the step they left —
 *    progress by topic, and what is due (reviews, gates).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, BookOpen, Clock, Code2, Flame, MousePointerClick, Orbit, Repeat, RotateCcw, Route, Trophy } from 'lucide-react';
import { Stage } from '@/engine/Stage';
import { frameOf } from '@/engine/geometry';
import { stepScene, stepScenes } from '@/engine/sandbox';
import type { Course, Lesson, Scene } from '@/engine/types';
import { COURSES, courseStats, loadLesson, peekLesson } from '@/content/registry';
import { MAIN_PILLARS, getPillar, type Pillar } from '@/content/pillars';
import { CAPSTONE_MILESTONES } from '@/content/courses/mern/capstone';
import { prefetchLessonPage } from './prefetch';
import { useDash, useDueReviews, useGates, useProgress } from '@/lib/progress';
import { usePrefersReducedMotion } from '@/lib/media';
import { PILLAR_ICON } from './AppShell';
import { continueTarget, courseDone, hasStarted, statsFor, type ContinueTarget } from './learner';
import { Ring, fmtHours } from './ui';

const PLANNED = [
  { title: 'System Design', blurb: 'From one server to millions of users.' },
  { title: 'Git & GitHub', blurb: 'Snapshots, branches, merges and pull requests.' },
  { title: 'Data Structures & Algorithms', blurb: 'Watch every algorithm run, step by step.' },
];

/* ---------------- lesson content on demand ---------------- */

/** A lesson's content, loaded once (it's a small chunk) — undefined until it arrives. */
function useLessonContent(course: Course | undefined, lessonId: string | undefined): Lesson | undefined {
  const [lesson, setLesson] = useState<Lesson | undefined>(() => (course && lessonId ? peekLesson(course, lessonId) : undefined));
  useEffect(() => {
    if (!course || !lessonId) return;
    const cached = peekLesson(course, lessonId);
    if (cached) return setLesson(cached);
    let live = true;
    loadLesson(course, lessonId)
      .then((l) => live && setLesson(l))
      .catch(() => {}); // the preview just stays empty
    return () => {
      live = false;
    };
  }, [course, lessonId]);
  return lesson?.id === lessonId ? lesson : undefined;
}

/** Scenes the hero cycles through — straight from a real lesson. */
function useHeroScenes(): Scene[] {
  const course = COURSES.find((c) => c.hero && c.lessons[c.hero.lesson]);
  const lesson = useLessonContent(course, course?.hero?.lesson);
  return useMemo(
    () => (lesson && course?.hero ? course.hero.steps.filter((n) => lesson.steps[n - 1]).map((n) => stepScene(lesson.steps[n - 1])) : []),
    [lesson, course],
  );
}

/* ---------------- new learner: the pitch ---------------- */

function Hero() {
  const scenes = useHeroScenes();
  const view = useMemo(() => frameOf(scenes, 16), [scenes]);
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  const course = COURSES[0];
  const stats = course ? courseStats(course) : undefined;
  useEffect(() => {
    if (reduced || scenes.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % scenes.length), 6400);
    return () => clearInterval(t);
  }, [reduced, scenes.length]);

  return (
    <section className="hm-hero">
      <div className="wrap hm-hero-in">
        <div className="hm-hero-copy">
          <span className="eyebrow hm-kicker">
            <i aria-hidden /> A visual course in full-stack development
          </span>
          <h1 className="hm-hero-title">
            Full-stack development, <em>unpacked.</em>
          </h1>
          <p className="hm-hero-lede">
            Every concept is an animated diagram you step through — from the{' '}
            <span className="tone-text" data-tone="client">
              browser
            </span>
            , through the{' '}
            <span className="tone-text" data-tone="server">
              server
            </span>
            , to the{' '}
            <span className="tone-text" data-tone="data">
              database
            </span>{' '}
            and back. See the problem, watch the fix, read the real code.
          </p>
          <div className="hm-hero-cta">
            <Link className="btn btn--primary btn--lg" to="/start">
              Start here <ArrowRight size={16} />
            </Link>
            {course && (
              <Link className="btn btn--lg" to={`/${course.id}/roadmap`}>
                <Route size={16} /> See the roadmap
              </Link>
            )}
          </div>
          {stats && (
            <dl className="hm-hero-facts">
              <div>
                <dt>lessons</dt>
                <dd>{stats.ready}</dd>
              </div>
              <div>
                <dt>of diagrams</dt>
                <dd>{fmtHours(stats.minutes)}</dd>
              </div>
              <div>
                <dt>to sign up</dt>
                <dd>Nothing</dd>
              </div>
            </dl>
          )}
        </div>
        <div className="hm-hero-stage" aria-hidden>
          <div className="hm-stage-card">
            {scenes.length > 0 && <Stage scene={scenes[i]} playing={!reduced} stepKey={i} instant={reduced} view={view} />}
          </div>
          <div className="hm-stage-dots">
            {scenes.map((_, n) => (
              <i key={n} data-on={n === i || undefined} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const HOW = [
  { icon: MousePointerClick, title: 'Step through it', text: 'Each lesson is a short story: a problem, the fix, the trade-offs. Use the arrow keys or the buttons.' },
  { icon: Orbit, title: 'Watch it move', text: 'Requests, responses and data travel as live packets, so you can see where time and trouble come from.' },
  { icon: Code2, title: 'Read the real code', text: 'The code that causes each behaviour sits next to the diagram, with the lines that matter lit up.' },
];

function HowItWorks() {
  return (
    <section className="wrap hm-sec">
      <div className="sec-head">
        <h2>How a lesson works</h2>
      </div>
      <ol className="hm-how">
        {HOW.map(({ icon: I, title, text }, n) => (
          <li key={title} className="card">
            <span className="hm-how-n mono">{n + 1}</span>
            <span className="hm-how-icon">
              <I size={19} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------------- returning learner: the hub ---------------- */

function Welcome({ t }: { t: ContinueTarget }) {
  const progress = useProgress();
  const due = useDueReviews().length;
  const dash = useDash();
  const c = courseDone(t.course, progress);
  return (
    <section className="wrap hm-welcome">
      <header className="hm-welcome-head">
        <div>
          <span className="eyebrow">Welcome back</span>
          <h1 className="page-title">{t.kind === 'resume' ? 'Pick up where you left off' : 'Ready for the next one?'}</h1>
        </div>
        <ul className="hm-chips" aria-label="At a glance">
          <li>
            <Ring pct={c.pct} size={18} stroke={2.6} />
            <span>
              <strong>{c.done}</strong>/{c.ready} lessons
            </span>
          </li>
          {dash.streakDays > 0 && (
            <li>
              <Flame size={15} className="hm-chip-flame" />
              <span>
                <strong>{dash.streakDays}</strong>-day streak
              </span>
            </li>
          )}
          {due > 0 && (
            <li>
              <Link to="/review">
                <Repeat size={15} />
                <span>
                  <strong>{due}</strong> {due === 1 ? 'card' : 'cards'} to review
                </span>
              </Link>
            </li>
          )}
        </ul>
      </header>
      <ContinueHero t={t} />
    </section>
  );
}

/** The lesson to continue, drawn at the exact step the learner left. */
function ContinueHero({ t }: { t: ContinueTarget }) {
  const lesson = useLessonContent(t.course, t.lesson?.id);
  const reduced = usePrefersReducedMotion();
  const step = t.kind === 'resume' ? Math.max(1, t.step ?? 1) : 1;
  const view = useMemo(() => (lesson ? frameOf(lesson.steps.flatMap(stepScenes)) : undefined), [lesson]);
  const scene = lesson ? stepScene(lesson.steps[Math.min(step, lesson.steps.length) - 1]) : undefined;
  const meta = t.lesson!;
  const warm = () => prefetchLessonPage(t.course, meta.id);
  const total = lesson?.steps.length ?? t.total;

  return (
    <article className="hm-cont" data-tone={t.part?.tone}>
      <div className="hm-cont-copy">
        <span className="hm-cont-crumb">
          <i aria-hidden /> {t.kind === 'resume' ? 'Continue' : 'Up next'} · {t.part?.num} {t.part?.title}
        </span>
        <h2 className="hm-cont-title">{meta.title}</h2>
        <p className="hm-cont-sum">{meta.summary}</p>
        {lesson && (
          <ol className="hm-cont-steps" aria-label={`Step ${t.kind === 'resume' ? step : 0} of ${total}`}>
            {lesson.steps.map((st, n) => (
              <li key={n} data-beat={st.beat} data-state={t.kind !== 'resume' ? undefined : n + 1 < step ? 'done' : n + 1 === step ? 'current' : undefined} />
            ))}
          </ol>
        )}
        <p className="hm-cont-meta">
          {t.kind === 'resume' && total ? (
            <>
              <strong>
                Step {step} of {total}
              </strong>
              {lesson && <span> · {lesson.steps[step - 1]?.short}</span>}
            </>
          ) : (
            <>
              <Clock size={13} /> {meta.minutes} min · {total ? `${total} steps` : meta.level}
            </>
          )}
        </p>
        <div className="hm-cont-cta">
          <Link className="btn btn--primary btn--lg" to={t.href} onMouseEnter={warm} onFocus={warm}>
            {t.kind === 'resume' ? `Resume at step ${step}` : 'Start lesson'} <ArrowRight size={16} />
          </Link>
          {t.kind === 'resume' && (
            <Link className="btn btn--lg btn--ghost" to={`/${t.course.id}/${meta.id}`} onMouseEnter={warm}>
              <RotateCcw size={15} /> Lesson overview
            </Link>
          )}
        </div>
      </div>
      <Link to={t.href} className="hm-cont-stage" aria-label={`Open ${meta.title}`} tabIndex={-1} onMouseEnter={warm}>
        {scene && view && <Stage scene={scene} w={lesson!.stage?.w} h={lesson!.stage?.h} playing={!reduced} stepKey={step} instant view={view} />}
      </Link>
    </article>
  );
}

function PracticeRow() {
  const progress = useProgress();
  const gates = useGates();
  const due = useDueReviews();
  const course = COURSES[0];
  if (!course) return null;
  const passed = course.parts.filter((p) => gates[`${course.id}/${p.id}`]?.passed).length;
  const scheduled = progress.reviews.length;
  return (
    <section className="wrap hm-sec">
      <div className="sec-head">
        <h2>Make it stick</h2>
        <p>Short reviews and part gates turn “I watched it” into “I know it”.</p>
      </div>
      <div className="hm-practice">
        <Link to="/review" className="card hm-prac" data-tone={due.length ? 'auth' : 'neutral'}>
          <span className="hm-prac-icon">
            <Repeat size={18} />
          </span>
          <strong>{due.length ? `${due.length} ${due.length === 1 ? 'card' : 'cards'} due` : scheduled ? 'All caught up' : 'Review cards'}</strong>
          <span>{due.length ? 'A two-minute review keeps it fresh.' : scheduled ? `${scheduled} scheduled — come back when they're due.` : 'Cards appear as you finish lessons.'}</span>
        </Link>
        <Link to="/me" className="card hm-prac" data-tone="ok">
          <span className="hm-prac-icon">
            <Trophy size={18} />
          </span>
          <strong>
            {passed} of {course.parts.length} gates passed
          </strong>
          <span>Each part ends with a gate: questions and a small coding task.</span>
        </Link>
        <Link to={`/${course.id}/roadmap`} className="card hm-prac" data-tone="net">
          <span className="hm-prac-icon">
            <Route size={18} />
          </span>
          <strong>See the whole path</strong>
          <span>Every part and lesson on one map, with what builds on what.</span>
        </Link>
      </div>
    </section>
  );
}

/* ---------------- both: topics, visual language, courses ---------------- */

function TopicCard({ p, n }: { p: Pillar; n: number }) {
  const progress = useProgress();
  const s = statsFor(p.id, progress);
  const Icon = PILLAR_ICON[p.id];
  const next = s.next;
  return (
    <Link to={`/${p.id}`} className="hm-topic" data-tone={p.tone}>
      <span className="hm-topic-top">
        <Ring pct={s.pct} size={42} stroke={3}>
          <Icon size={18} strokeWidth={2.2} />
        </Ring>
        <span className="hm-topic-n mono">{String(n).padStart(2, '0')}</span>
      </span>
      <h3>{p.label}</h3>
      <p>{p.blurb}</p>
      <span className="hm-topic-meta">
        {s.ready ? (
          <>
            {s.ready} lessons · {fmtHours(s.minutes)}
            {s.done > 0 && <b> · {s.done} done</b>}
          </>
        ) : (
          <span className="pill" data-tone={p.tone}>
            Coming soon
          </span>
        )}
      </span>
      {!next?.e.meta && <span className="hm-topic-next hm-topic-next--soon">Lessons on the way</span>}
      {next?.e.meta && (
        <span className="hm-topic-next">
          <span className="hm-topic-next-text">
            <b>{s.started ? 'Continue' : s.done ? 'Next' : 'Start'}:</b> {next.e.meta.title}
          </span>
          <ArrowRight size={13} />
        </span>
      )}
    </Link>
  );
}

const COUNT = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

function Topics() {
  const progress = useProgress();
  const projects = getPillar('projects')!;
  const ps = statsFor('projects', progress);
  return (
    <section className="wrap hm-sec" id="topics">
      <div className="sec-head">
        <h2>{COUNT[MAIN_PILLARS.length] ?? MAIN_PILLARS.length} topics, one stack</h2>
        <p>Follow the roadmap, or open any topic.</p>
      </div>
      <div className="hm-topics">
        {MAIN_PILLARS.map((p, i) => (
          <TopicCard key={p.id} p={p} n={i + 1} />
        ))}
      </div>
      <Link to="/projects" className="hm-projects" data-tone={projects.tone}>
        <Ring pct={ps.pct} size={42} stroke={3}>
          {(() => {
            const I = PILLAR_ICON.projects;
            return <I size={18} strokeWidth={2.2} />;
          })()}
        </Ring>
        <span className="hm-projects-text">
          <strong>{projects.label}: put it all together</strong>
          <span>
            {ps.ready} design lessons, then the TaskFlow capstone — {CAPSTONE_MILESTONES.length} milestones from an empty folder to a deployed app.
          </span>
        </span>
        <span className="hm-projects-go">
          Open <ArrowRight size={15} />
        </span>
      </Link>
    </section>
  );
}

const ROLES = [
  { tone: 'client', name: 'Client', text: 'runs in the browser — React' },
  { tone: 'server', name: 'Server', text: 'runs on your machine — Node & Express' },
  { tone: 'data', name: 'Data', text: 'stored safely — MongoDB' },
  { tone: 'net', name: 'Network', text: 'everything in between' },
  { tone: 'auth', name: 'Security', text: 'tokens, passwords, keys' },
];

function VisualLanguage() {
  return (
    <section className="wrap hm-sec">
      <div className="hm-roles card">
        <div>
          <span className="eyebrow">One visual language</span>
          <p className="hm-roles-lede">
            Colour always tells you <strong>where code runs</strong>. Learn it once; it means the same thing in every lesson.
          </p>
        </div>
        <ul>
          {ROLES.map((r) => (
            <li key={r.name} data-tone={r.tone}>
              <i />
              <strong>{r.name}</strong>
              <span>{r.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CourseCard({ course }: { course: Course }) {
  const stats = courseStats(course);
  const progress = useProgress();
  const c = courseDone(course, progress);
  return (
    <Link to={`/${course.id}`} className="course-card" data-tone={course.tone}>
      <span className="course-card-parts" aria-hidden>
        {course.parts.map((p) => (
          <i key={p.id} data-tone={p.tone} />
        ))}
      </span>
      <span className="eyebrow">Course · {course.parts.length} parts</span>
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <span className="course-card-meta">
        <span className="pill">
          <BookOpen size={13} /> {stats.ready} lessons
        </span>
        <span className="pill">
          <Clock size={13} /> {fmtHours(stats.minutes)}
        </span>
        {c.done > 0 && (
          <span className="pill" data-tone="ok">
            {c.done} completed
          </span>
        )}
      </span>
      <span className="course-card-go">
        Open the course map <ArrowRight size={15} />
      </span>
    </Link>
  );
}

function Courses() {
  return (
    <section className="wrap hm-sec">
      <div className="sec-head">
        <h2>Courses</h2>
      </div>
      <div className="hm-courses">
        {COURSES.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
        <div className="hm-planned">
          <span className="eyebrow">Coming later</span>
          <ul>
            {PLANNED.map((p) => (
              <li key={p.title}>
                <strong>{p.title}</strong>
                <span>{p.blurb}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const progress = useProgress();
  const t = continueTarget(progress);
  const returning = hasStarted(progress) && t && t.kind !== 'start';
  useEffect(() => {
    document.title = 'Unpacked — full-stack development, one animated diagram at a time';
  }, []);
  return (
    <main className="home">
      {returning ? <Welcome t={t} /> : <Hero />}
      {!returning && <HowItWorks />}
      <Topics />
      {returning && <PracticeRow />}
      <VisualLanguage />
      <Courses />
    </main>
  );
}
