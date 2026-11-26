/**
 * /explore — the Explore door: "How does ___ work?" (docs/VISION.md §4).
 *
 * A feed of curiosity questions. Each card asks for a guess, then reveals a little; from there it
 * leads to the lesson step where you watch it happen, to the chapter that answers it in full, and
 * on to building it. Peeked questions are remembered in this browser. `?q=<id>` opens one.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowRight, Check, Eye, Hammer, Play, Shuffle, Telescope } from 'lucide-react';
import { CURIOSITIES, type Curiosity } from '@/content/doors/explore';
import { chapterNum, chapterStatus, getChapter } from '@/content/manual';
import { COURSES } from '@/content/registry';
import { PILLARS } from '@/content/pillars';
import type { PillarId } from '@/engine/types';
import { useMentorPage } from '@/lib/mentor';
import { PILLAR_ICON } from '../pillarIcons';
import { prefetchLessonPage } from '../prefetch';
import { chapterHref, chapterTone } from '../manual/shared';
import { buildLinkFor, markSeen, useSeen } from './model';
import '../manual/manual.css';
import './doors.css';

type Lens = PillarId | 'all';
const LENSES = PILLARS.filter((p) => p.id !== 'start');
const course = COURSES[0];

const lensOf = (c: Curiosity) => getChapter(c.chapter)?.lens ?? [];

export function ExplorePage() {
  const seen = useSeen();
  const [params, setParams] = useSearchParams();
  const asked = params.get('q');
  const [lens, setLens] = useState<Lens>('all');
  const [open, setOpen] = useState<Set<string>>(() => new Set(asked ? [asked] : []));
  const flash = useRef<string | null>(asked);

  useEffect(() => {
    document.title = 'Explore — Unpacked';
  }, []);
  useMentorPage({
    kind: 'explore',
    title: 'Explore: a feed of curiosity questions, each leading to a chapter of the Manual',
    stepBody: `${CURIOSITIES.length} questions; the learner has peeked at ${seen.length}.`,
  });

  const list = useMemo(() => CURIOSITIES.filter((c) => lens === 'all' || lensOf(c).includes(lens)), [lens]);

  const reveal = (id: string) => {
    setOpen((s) => new Set(s).add(id));
    markSeen(id);
  };

  /** Bring one card into view, open, and give it focus (after it has rendered). */
  const goTo = (id: string) => {
    reveal(id);
    flash.current = id;
    requestAnimationFrame(() => {
      const el = document.getElementById(`q-${id}`);
      el?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      el?.focus({ preventScroll: true });
    });
  };

  // /explore?q=<id>: open that question once, then tidy the address
  useEffect(() => {
    if (!asked) return;
    if (CURIOSITIES.some((c) => c.id === asked)) goTo(asked);
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const surprise = () => {
    const fresh = list.filter((c) => !seen.includes(c.id) && !open.has(c.id));
    const pool = fresh.length ? fresh : list;
    if (pool.length) goTo(pool[Math.floor(Math.random() * pool.length)].id);
  };

  const peeked = CURIOSITIES.filter((c) => seen.includes(c.id)).length;

  return (
    <main className="dr dr-explore">
      <div className="wrap">
        <header className="dr-head">
          <span className="eyebrow" data-tone="net">
            <Telescope size={14} /> Explore
          </span>
          <h1 className="page-title">
            How does <span className="dr-blank">___</span> work?
          </h1>
          <p className="page-lede">
            Questions you can almost answer. Have a guess, peek at a hint, then watch it happen — every answer opens the next question, and
            each one leads to something you can build.
          </p>
          <ul className="dr-facts">
            <li>
              <strong>{CURIOSITIES.length}</strong> questions
            </li>
            <li>
              <strong>{new Set(CURIOSITIES.map((c) => c.chapter)).size}</strong> chapters they lead to
            </li>
            <li>
              <strong>{peeked}</strong> peeked at
            </li>
          </ul>
        </header>

        <div className="dr-toolbar">
          <div className="mn-filter dr-filter" role="group" aria-label="Show questions for a topic">
            <button className="mn-chip" aria-pressed={lens === 'all'} onClick={() => setLens('all')}>
              All
            </button>
            {LENSES.map((p) => {
              const Icon = PILLAR_ICON[p.id];
              const n = CURIOSITIES.filter((c) => lensOf(c).includes(p.id)).length;
              return (
                <button key={p.id} className="mn-chip" data-tone={p.tone} aria-pressed={lens === p.id} onClick={() => setLens(p.id)} disabled={!n}>
                  <Icon size={13} /> {p.label} <span className="mono">{n}</span>
                </button>
              );
            })}
          </div>
          <button className="btn btn--sm dr-surprise" onClick={surprise}>
            <Shuffle size={14} /> Surprise me
          </button>
        </div>

        <div className="dr-feed">
          {list.map((c) => (
            <QuestionCard key={c.id} c={c} open={open.has(c.id)} seen={seen.includes(c.id)} onPeek={() => reveal(c.id)} />
          ))}
        </div>

        <p className="dr-feed-end">
          That’s every question for now. Each chapter has more — <Link to="/manual">open the Manual</Link> and follow one.
        </p>
      </div>
    </main>
  );
}

function QuestionCard({ c, open, seen, onPeek }: { c: Curiosity; open: boolean; seen: boolean; onPeek: () => void }) {
  const ch = getChapter(c.chapter)!;
  const planned = chapterStatus(ch) === 'planned';
  const build = buildLinkFor(ch.id);
  const lesson = c.see && course?.lessons[c.see[0]];
  const warm = () => lesson && course && prefetchLessonPage(course, lesson.id);

  return (
    <article id={`q-${c.id}`} className="dr-q card" data-tone={chapterTone(ch)} data-open={open || undefined} tabIndex={-1} aria-labelledby={`qt-${c.id}`}>
      <span className="dr-q-ch">
        <ch.glyph size={14} aria-hidden />
        <span>
          Chapter {chapterNum(ch.id)} · {ch.short}
          {planned && <em> · planned</em>}
        </span>
        {seen && (
          <span className="dr-q-seen" title="You’ve peeked at this one">
            <Check size={12} strokeWidth={3} aria-label="Peeked" />
          </span>
        )}
      </span>
      <h2 className="dr-q-text" id={`qt-${c.id}`}>
        {c.q}
      </h2>
      {open ? (
        <div className="dr-q-peek">
          <p>{c.peek}</p>
          <div className="dr-q-acts">
            {lesson && c.see && (
              <Link className="btn btn--sm btn--primary" to={`/${course!.id}/${lesson.id}?s=${c.see[1]}`} onMouseEnter={warm} onFocus={warm}>
                <Play size={13} /> See it move
              </Link>
            )}
            <Link className="btn btn--sm" to={chapterHref(ch)}>
              {planned ? 'What the chapter will cover' : `Read chapter ${chapterNum(ch.id)}`} <ArrowRight size={13} />
            </Link>
          </div>
          {lesson && <span className="dr-q-lesson">Lesson: {lesson.title}</span>}
          {build && (
            <Link className="dr-q-build" to={build.href}>
              <Hammer size={13} /> {build.label}
            </Link>
          )}
        </div>
      ) : (
        <div className="dr-q-foot">
          <span className="dr-q-nudge">Have a guess first.</span>
          <button className="btn btn--sm" onClick={onPeek}>
            <Eye size={14} /> Peek
          </button>
        </div>
      )}
    </article>
  );
}
