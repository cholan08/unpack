/**
 * /about — why Unpacked exists, what it believes, and who built it.
 * The words here are the maker's own: edit WHY, BELIEFS and the maker note freely.
 */
import { useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Eye, Footprints, Heart, KeyRound, Route as RouteIcon, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react';
import type { Tone } from '@/engine/types';
import { COURSES, courseStats } from '@/content/registry';
import { CAPSTONE_MILESTONES } from '@/content/courses/mern/capstone';
import { MENTOR_NAME } from '@/lib/mentor';
import { fmtHours } from './ui';
import './about.css';

/** The person who built it. Shown here, in the footer and on Home. */
export const MAKER = {
  name: 'Cholan',
  role: 'Developer & teacher · creator of Unpacked',
};

/** The problem, told as three short beats. */
const WHY: { tone: Tone; title: string; text: string }[] = [
  {
    tone: 'client',
    title: 'I learned by copying code I couldn’t see',
    text: 'Tutorials showed me what to type, but never what happened after I pressed Enter. A request left the browser and came back with an answer — everything in between was a black box.',
  },
  {
    tone: 'server',
    title: 'Walls of text don’t show movement',
    text: 'Full-stack is about things travelling: a request to a server, a query to a database, a token back to the browser. That is motion, and motion is hard to learn from paragraphs or a talking head.',
  },
  {
    tone: 'data',
    title: 'So I drew it — and then built the tool to draw it',
    text: 'Unpacked is the course I wished I had: every concept is a diagram you step through, with the real code beside it, so you see the problem, watch the fix and understand why it works.',
  },
];

/** What the product promises. Each one is a rule the lessons follow. */
const BELIEFS: { icon: LucideIcon; tone: Tone; title: string; text: string }[] = [
  { icon: Eye, tone: 'client', title: 'See it before you code it', text: 'Every idea starts as a picture. Once you have seen where the data goes, the code reads like a description of it.' },
  { icon: Footprints, tone: 'server', title: 'One small step at a time', text: 'Lessons are short stories — a problem, the fix, the trade-offs — that you move through at your own pace.' },
  { icon: ShieldCheck, tone: 'auth', title: 'Real code, real mistakes', text: 'The code next to each diagram is code you would actually ship, and the common errors are the ones you will actually meet.' },
  { icon: KeyRound, tone: 'net', title: 'Free, and no sign-up', text: 'No account, no paywall, no tracking. Your progress stays in your own browser.' },
  { icon: RouteIcon, tone: 'data', title: 'From zero to deployed', text: 'Not just concepts: the path ends with a real app you build and put online yourself.' },
  { icon: Sparkles, tone: 'ai', title: 'A mentor, not a crutch', text: `${MENTOR_NAME}, the AI mentor, nudges and explains — but the gates and reviews make sure the knowledge is yours.` },
];

export function AboutPage() {
  const course = COURSES[0];
  const stats = course ? courseStats(course) : undefined;

  useEffect(() => {
    document.title = `About — why Unpacked exists · built by ${MAKER.name}`;
  }, []);

  return (
    <main className="wrap about">
      {/* ---- opening ---- */}
      <header className="about-hero">
        <span className="eyebrow">About Unpacked</span>
        <h1 className="page-title">
          Built so you can <em>see</em> how the web works.
        </h1>
        <p className="page-lede">
          Unpacked is a visual course in full-stack development, designed and built by <strong>{MAKER.name}</strong>. This is why it exists, what it
          believes, and the person behind it.
        </p>
      </header>

      {/* ---- the reason for the work ---- */}
      <section className="about-sec">
        <div className="sec-head">
          <h2>Why I built it</h2>
        </div>
        <ol className="about-why">
          {WHY.map((w, n) => (
            <li key={w.title} data-tone={w.tone}>
              <span className="about-why-n mono">{String(n + 1).padStart(2, '0')}</span>
              <div>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- the reason for the product ---- */}
      <section className="about-sec">
        <div className="sec-head">
          <h2>What Unpacked stands for</h2>
          <p>The rules every lesson is built on.</p>
        </div>
        <ul className="about-beliefs">
          {BELIEFS.map(({ icon: Icon, tone, title, text }) => (
            <li key={title} className="card spot" data-tone={tone}>
              <span className="about-belief-ico">
                <Icon size={18} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- what it adds up to ---- */}
      {course && stats && (
        <section className="about-sec">
          <dl className="about-facts card">
            <div className="about-facts-course">
              <dt>Course</dt>
              <dd>{course.title}</dd>
            </div>
            <div>
              <dt>Parts</dt>
              <dd>{course.parts.length}</dd>
            </div>
            <div>
              <dt>Lessons</dt>
              <dd>{stats.ready}</dd>
            </div>
            <div>
              <dt>Of diagrams</dt>
              <dd>{fmtHours(stats.minutes)}</dd>
            </div>
            <div>
              <dt>Capstone milestones</dt>
              <dd>{CAPSTONE_MILESTONES.length}</dd>
            </div>
          </dl>
        </section>
      )}

      {/* ---- the maker ---- */}
      <section className="about-sec">
        <article className="about-maker card">
          <span className="about-maker-mark" aria-hidden>
            {MAKER.name.charAt(0)}
          </span>
          <div className="about-maker-text">
            <span className="eyebrow">Made by</span>
            <h2>{MAKER.name}</h2>
            <span className="about-maker-role">{MAKER.role}</span>
            <p>
              Every lesson, diagram, animation and line of code in this course was written by me. I built Unpacked because I believe anyone can
              understand how the web really works — they just need to be shown, not told. If one diagram here makes something finally “click” for
              you, the whole project was worth it.
            </p>
            <p className="about-sign">
              <Heart size={15} aria-hidden /> — {MAKER.name}
            </p>
          </div>
        </article>
      </section>

      <div className="page-actions about-cta">
        <Link to="/start" className="btn btn--primary btn--lg">
          Start learning <ArrowRight size={16} />
        </Link>
        {course && (
          <Link to={`/${course.id}/roadmap`} className="btn btn--lg">
            <RouteIcon size={16} /> See the roadmap
          </Link>
        )}
      </div>
    </main>
  );
}
