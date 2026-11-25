/**
 * Home is the way into the Manual (docs/VISION.md §4):
 *  - a new learner gets the pitch (the manual of technology for building products, a live diagram);
 *  - a returning learner gets the lesson to continue — drawn at the step they left — and what is due;
 *  - both get the three doors: Explore ("How does ___ work?"), Build ("I want to build ___") and
 *    Path ("Teach me from zero"). Topics (Frontend, Backend…) are a filter now, not the way in.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Clock, Code2, Flame, MousePointerClick, Orbit, Repeat, RotateCcw, Route, Trophy } from 'lucide-react';
import { Stage } from '@/engine/Stage';
import { frameOf } from '@/engine/geometry';
import { stepScene, stepScenes } from '@/engine/sandbox';
import type { Course, Lesson, Scene } from '@/engine/types';
import { COURSES, courseStats, loadLesson, peekLesson } from '@/content/registry';
import { CHAPTERS } from '@/content/manual';
import { prefetchLessonPage } from './prefetch';
import { useDash, useDueReviews, useGates, useProgress } from '@/lib/progress';
import { usePrefersReducedMotion } from '@/lib/media';
import { continueTarget, courseDone, hasStarted, type ContinueTarget } from './learner';
import { Ring } from './ui';
import { AppAnatomy } from './AppAnatomy';
import { MAKER } from './AboutPage';
import { Doors } from './doors/Doors';

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

/** A number that counts up from zero the first time it is drawn (instantly under "reduce motion"). */
function CountUp({ to, decimals = 0, ms = 1100 }: { to: number; decimals?: number; ms?: number }) {
  const reduced = usePrefersReducedMotion();
  const [v, setV] = useState(reduced ? to : 0);
  const started = useRef(false);
  useEffect(() => {
    if (reduced || started.current) return setV(to);
    started.current = true;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      setV(to * (1 - Math.pow(1 - p, 3))); // ease out
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      started.current = false;
    };
  }, [to, ms, reduced]);
  return <>{v.toFixed(decimals)}</>;
}

/** "Good evening": the hub greets you for the time of day. */
function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5 || h >= 23) return 'Late-night session';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
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
            <i aria-hidden /> The manual of technology for building products
          </span>
          <h1 className="hm-hero-title">
            Technology, <em>unpacked.</em>
          </h1>
          <p className="hm-hero-lede">
            Every product — a booking site, a chat app, an AI assistant — is built from the same few problems. See how each one works as a live
            diagram, from the{' '}
            <span className="tone-text" data-tone="client">
              screen
            </span>
            , through the{' '}
            <span className="tone-text" data-tone="server">
              server
            </span>
            , to the{' '}
            <span className="tone-text" data-tone="data">
              data
            </span>{' '}
            and back. Then build it yourself, with AI as your pair.
          </p>
          <div className="hm-hero-cta">
            <Link className="btn btn--primary btn--lg" to="/path">
              Teach me from zero <ArrowRight size={16} />
            </Link>
            <a className="btn btn--lg" href="#doors">
              Or pick another way in
            </a>
          </div>
          {stats && (
            <dl className="hm-hero-facts">
              <div>
                <dt>chapters</dt>
                <dd>
                  <CountUp to={CHAPTERS.length} />
                </dd>
              </div>
              <div>
                <dt>visual lessons</dt>
                <dd>
                  <CountUp to={stats.ready} />
                </dd>
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
          <li key={title} className="card spot">
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
          <span className="eyebrow">{greeting()}</span>
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
              <span className="hm-cont-left">
                <Clock size={13} /> about {Math.max(1, Math.round((meta.minutes * (total - step + 1)) / total))} min to finish
              </span>
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
        <Link to="/review" className="card hm-prac spot" data-tone={due.length ? 'auth' : 'neutral'}>
          <span className="hm-prac-icon">
            <Repeat size={18} />
          </span>
          <strong>{due.length ? `${due.length} ${due.length === 1 ? 'card' : 'cards'} due` : scheduled ? 'All caught up' : 'Review cards'}</strong>
          <span>{due.length ? 'A two-minute review keeps it fresh.' : scheduled ? `${scheduled} scheduled — come back when they're due.` : 'Cards appear as you finish lessons.'}</span>
        </Link>
        <Link to="/me" className="card hm-prac spot" data-tone="ok">
          <span className="hm-prac-icon">
            <Trophy size={18} />
          </span>
          <strong>
            {passed} of {course.parts.length} gates passed
          </strong>
          <span>Each part ends with a gate: questions and a small coding task.</span>
        </Link>
        <Link to={`/${course.id}/roadmap`} className="card hm-prac spot" data-tone="net">
          <span className="hm-prac-icon">
            <Route size={18} />
          </span>
          <strong>Every lesson on one map</strong>
          <span>The roadmap: every part and lesson, with what builds on what.</span>
        </Link>
      </div>
    </section>
  );
}

/* ---------------- both: the visual language, and who made it ---------------- */

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

/** The reason behind it all, and who made it — a short note that opens the About page. */
function MadeBy() {
  return (
    <section className="wrap hm-sec">
      <Link to="/about" className="hm-maker card spot" data-tone="client">
        <span className="hm-maker-mark" aria-hidden>
          {MAKER.name.charAt(0)}
        </span>
        <span className="hm-maker-text">
          <span className="eyebrow">Why this exists</span>
          <strong>Built by {MAKER.name}, so you can see what tutorials only describe.</strong>
          <span>The story behind Unpacked, what it stands for, and the person who made it.</span>
        </span>
        <span className="hm-maker-go">
          Read the story <ArrowRight size={15} />
        </span>
      </Link>
    </section>
  );
}

export function HomePage() {
  const progress = useProgress();
  const t = continueTarget(progress);
  const returning = hasStarted(progress) && t && t.kind !== 'start';
  useEffect(() => {
    document.title = 'Unpacked — the manual of technology for building products';
  }, []);
  return (
    <main className="home">
      {returning ? <Welcome t={t} /> : <Hero />}
      <Doors returning={!!returning} />
      {returning && <PracticeRow />}
      {!returning && <HowItWorks />}
      <AppAnatomy />
      <VisualLanguage />
      <MadeBy />
    </main>
  );
}
