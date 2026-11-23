import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Code2, MousePointerClick, Orbit, Clock, BookOpen } from 'lucide-react';
import { Stage } from '@/engine/Stage';
import { frameOf } from '@/engine/geometry';
import { stepScene } from '@/engine/sandbox';
import type { Course, Lesson, Scene } from '@/engine/types';
import { COURSES, courseStats, lessonEntries, loadLesson, peekLesson } from '@/content/registry';
import { prefetchLessonPage } from './prefetch';
import { useProgress } from '@/lib/progress';
import { usePrefersReducedMotion } from '@/lib/media';
import { SiteFooter, SiteHeader } from './SiteHeader';

const PLANNED = [
  { title: 'System Design', blurb: 'From one server to millions of users.' },
  { title: 'Git & GitHub', blurb: 'Snapshots, branches, merges and pull requests.' },
  { title: 'Data Structures & Algorithms', blurb: 'Watch every algorithm run, step by step.' },
];

/** Scenes the hero cycles through — straight from a real lesson, loaded on demand. */
function useHeroScenes(): Scene[] {
  const course = COURSES.find((c) => c.hero && c.lessons[c.hero.lesson]);
  const pick = (l: Lesson) => course!.hero!.steps.filter((n) => l.steps[n - 1]).map((n) => stepScene(l.steps[n - 1]));
  const [scenes, setScenes] = useState<Scene[]>(() => {
    const cached = course?.hero && peekLesson(course, course.hero.lesson);
    return cached ? pick(cached) : [];
  });
  useEffect(() => {
    if (!course?.hero || scenes.length) return;
    let live = true;
    loadLesson(course, course.hero.lesson)
      .then((l) => live && setScenes(pick(l)))
      .catch(() => {}); // the hero just stays empty
    return () => {
      live = false;
    };
  }, []);
  return scenes;
}

function Hero() {
  const scenes = useHeroScenes();
  const view = useMemo(() => frameOf(scenes, 16), [scenes]);
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  const progress = useProgress();
  const course = COURSES[0];
  useEffect(() => {
    if (reduced || scenes.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % scenes.length), 6400);
    return () => clearInterval(t);
  }, [reduced, scenes.length]);

  const last = progress.last?.split('/');
  const lastCourse = last && COURSES.find((c) => c.id === last[0]);
  const lastLesson = lastCourse?.lessons[last![1]];
  const lastStep = lastLesson ? progress.lessons[progress.last!]?.step : undefined;
  const first = course && lessonEntries(course).find((e) => e.meta);

  return (
    <section className="hero">
      <div className="wrap hero-in">
        <div className="hero-copy">
          <span className="eyebrow hero-eyebrow">A visual course</span>
          <h1 className="display hero-title">
            Full-stack development, <em>unpacked.</em>
          </h1>
          <p className="hero-lede">
            Every concept is an animated diagram you step through — from the {''}
            <span className="tone-text" data-tone="client">browser</span>, through the {''}
            <span className="tone-text" data-tone="server">server</span>, to the {''}
            <span className="tone-text" data-tone="data">database</span> and back. See the problem, watch the fix, read the real code.
          </p>
          <div className="hero-cta">
            {lastLesson && lastCourse ? (
              <Link
                className="btn btn--primary btn--lg"
                to={`/${lastCourse.id}/${lastLesson.id}${lastStep ? `?s=${lastStep}` : ''}`}
                onMouseEnter={() => prefetchLessonPage(lastCourse, lastLesson.id)}
              >
                Continue: {lastLesson.title} <ArrowRight size={16} />
              </Link>
            ) : (
              first && (
                <Link className="btn btn--primary btn--lg" to={`/${course.id}/${first.stub.id}`} onMouseEnter={() => prefetchLessonPage(course, first.stub.id)}>
                  Start with {first.meta!.title} <ArrowRight size={16} />
                </Link>
              )
            )}
            {course && (
              <Link className="btn btn--lg" to={`/${course.id}`}>
                <BookOpen size={16} /> See the course map
              </Link>
            )}
          </div>
        </div>
        <div className="hero-stage" aria-hidden>
          <div className="hero-stage-card">
            {scenes.length > 0 && <Stage scene={scenes[i]} playing={!reduced} stepKey={i} instant={reduced} view={view} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function CourseCard({ course }: { course: Course }) {
  const stats = courseStats(course);
  const progress = useProgress();
  const done = Object.keys(course.lessons).filter((id) => progress.lessons[`${course.id}/${id}`]?.done).length;
  return (
    <Link to={`/${course.id}`} className="course-card" data-tone={course.tone}>
      <div className="course-card-parts" aria-hidden>
        {course.parts.map((p) => (
          <i key={p.id} data-tone={p.tone} />
        ))}
      </div>
      <span className="eyebrow">Course · {course.parts.length} parts</span>
      <h3 className="display">{course.title}</h3>
      <p>{course.description}</p>
      <div className="course-card-meta">
        <span className="pill">
          <BookOpen size={13} /> {stats.ready} of {stats.total} lessons ready
        </span>
        <span className="pill">
          <Clock size={13} /> {stats.minutes} min so far
        </span>
        {done > 0 && (
          <span className="pill" data-tone="ok">
            {done} completed
          </span>
        )}
      </div>
      <span className="course-card-go">
        Open course <ArrowRight size={16} />
      </span>
    </Link>
  );
}

const HOW = [
  { icon: MousePointerClick, title: 'Step through it', text: 'Each lesson is a short story: a problem, the fix, the trade-offs. Use the arrow keys or the buttons.' },
  { icon: Orbit, title: 'Watch it move', text: 'Requests, responses and data travel as live packets, so you can see where time and trouble come from.' },
  { icon: Code2, title: 'Read the real code', text: 'The code that causes each behaviour sits next to the diagram, with the lines that matter lit up.' },
];

const ROLES = [
  { tone: 'client', name: 'Client', text: 'runs in the browser — React' },
  { tone: 'server', name: 'Server', text: 'runs on your machine — Node & Express' },
  { tone: 'data', name: 'Data', text: 'stored safely — MongoDB' },
  { tone: 'net', name: 'Network', text: 'everything in between' },
  { tone: 'auth', name: 'Security', text: 'tokens, passwords, keys' },
];

export function HomePage() {
  useEffect(() => {
    document.title = 'Unpacked — full-stack development, one animated diagram at a time';
  }, []);
  return (
    <>
      <SiteHeader />
      <main className="home">
        <Hero />

        <section className="wrap section">
          <div className="section-head">
            <span className="eyebrow">Courses</span>
            <h2 className="display">Start here</h2>
          </div>
          <div className="courses">
            {COURSES.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
            <div className="planned">
              <span className="eyebrow">Coming later</span>
              <ul>
                {PLANNED.map((p) => (
                  <li key={p.title}>
                    <strong>{p.title}</strong>
                    <span className="muted">{p.blurb}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="wrap section">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2 className="display">Built to be seen, not memorised</h2>
          </div>
          <div className="how">
            {HOW.map(({ icon: I, title, text }) => (
              <div key={title} className="how-card">
                <span className="how-icon">
                  <I size={20} />
                </span>
                <h3>{title}</h3>
                <p className="muted">{text}</p>
              </div>
            ))}
          </div>
          <div className="roles">
            <div>
              <span className="eyebrow">One visual language</span>
              <p className="roles-lede">Colour always tells you <strong>where code runs</strong>. Learn it once; it means the same thing in every lesson.</p>
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
      </main>
      <SiteFooter />
    </>
  );
}
