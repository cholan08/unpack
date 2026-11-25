/**
 * The three doors on Home (docs/VISION.md §4): Explore, Build and Path. Each door speaks in the
 * learner's own words and shows something live behind it — a question to peek at, the build you
 * are planning (or ideas to start one), the next three steps of the path.
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, Check, Hammer, Route, Telescope } from 'lucide-react';
import { IDEAS, type Curiosity } from '@/content/doors';
import { chapterNum, getChapter } from '@/content/manual';
import { useProgress } from '@/lib/progress';
import { chapterTone } from '../manual/shared';
import { buildName, hasBuild, pathOf, planOf, useBuildState, useSeen } from './model';
import './doors.css';

/** Ideas offered on the Build door (the rest are on the Build page). */
const DOOR_IDEAS = ['shop', 'chat', 'assistant'];

export function Doors({ returning }: { returning: boolean }) {
  return (
    <section className="wrap hm-sec dr-doors" id="doors" aria-labelledby="doors-h">
      <div className="sec-head">
        <h2 id="doors-h">{returning ? 'Three ways in' : 'Where do you want to start?'}</h2>
        <p>Every door opens onto the same chapters.</p>
      </div>
      <div className="dr-doors-grid">
        <ExploreDoor />
        <BuildDoor />
        <PathDoor />
      </div>
    </section>
  );
}

function DoorHead({ to, icon: Icon, name, words }: { to: string; icon: typeof Telescope; name: string; words: string }) {
  return (
    <header className="dr-door-head">
      <span className="dr-door-name">
        <span className="dr-door-ico">
          <Icon size={17} />
        </span>
        {name}
      </span>
      <h3>
        <Link to={to}>{words}</Link>
      </h3>
    </header>
  );
}

/** The questions are the feed's own chunk (they grow), so Home fetches them only to show one. */
let questions: Curiosity[] | undefined;
const loadQuestions = () => import('@/content/doors/explore').then((m) => (questions = m.CURIOSITIES));

function ExploreDoor() {
  const seen = useSeen();
  const [all, setAll] = useState(questions);
  useEffect(() => {
    if (all) return;
    let live = true;
    loadQuestions().then(
      (q) => live && setAll(q),
      () => {}, // the door still works without a sample question
    );
    return () => {
      live = false;
    };
  }, [all]);
  // a different question each visit, preferring ones not peeked at yet (chosen once the list is here)
  const pick = useMemo(() => {
    if (!all) return undefined;
    const fresh = all.filter((c) => !seen.includes(c.id));
    const pool = fresh.length ? fresh : all;
    return pool[Math.floor(Math.random() * pool.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all]);
  const ch = pick && getChapter(pick.chapter);
  return (
    <article className="dr-door" data-tone="net">
      <DoorHead to="/explore" icon={Telescope} name="Explore" words="“How does ___ work?”" />
      <p className="dr-door-lede">A feed of questions you can almost answer. Guess, peek, then watch it happen.</p>
      {pick && ch ? (
        <Link to={`/explore?q=${pick.id}`} className="dr-door-q" data-tone={chapterTone(ch)}>
          <span className="dr-door-q-ch">
            <ch.glyph size={13} aria-hidden /> Chapter {chapterNum(ch.id)} · {ch.short}
          </span>
          <strong>{pick.q}</strong>
          <span className="dr-door-q-go">
            Peek at the answer <ArrowRight size={13} />
          </span>
        </Link>
      ) : (
        <span className="dr-door-q dr-door-q--wait" aria-hidden />
      )}
      <Link to="/explore" className="dr-door-cta">
        {all && seen.length ? `Keep exploring · ${seen.length} of ${all.length} peeked` : `Explore ${all ? `${all.length} questions` : 'the questions'}`} <ArrowRight size={15} />
      </Link>
    </article>
  );
}

function BuildDoor() {
  const progress = useProgress();
  const s = useBuildState();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const plan = useMemo(() => planOf(s, progress), [s, progress]);
  const mine = hasBuild(s);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(text.trim() ? `/build?q=${encodeURIComponent(text.trim())}` : '/build');
  };
  return (
    <article className="dr-door" data-tone="warn">
      <DoorHead to="/build" icon={Hammer} name="Build" words="“I want to build ___”" />
      <p className="dr-door-lede">Describe an idea, or pick one. See the chapters it needs, in order, and where to start.</p>
      {mine ? (
        <Link to="/build" className="dr-door-mine">
          <span className="dr-door-q-ch">Your build</span>
          <strong>{buildName(s, plan)}</strong>
          <span className="dr-door-mine-meta">
            {plan.rows.length} chapters · {plan.finished} finished
            {plan.start && (
              <>
                {' '}
                · next: <b>{plan.start.chapter.title}</b>
              </>
            )}
          </span>
        </Link>
      ) : (
        <>
          <form className="dr-door-form" onSubmit={submit} role="search" aria-label="Describe what you want to build">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="a booking site for a salon" aria-label="I want to build" maxLength={140} />
            <button className="btn btn--sm btn--primary" type="submit" aria-label="Plan it">
              <ArrowRight size={15} />
            </button>
          </form>
          <div className="dr-door-ideas">
            {DOOR_IDEAS.map((id) => {
              const idea = IDEAS.find((i) => i.id === id);
              if (!idea) return null;
              const Icon = idea.icon;
              return (
                <Link key={id} to={`/build?idea=${id}`} className="dr-idea">
                  <Icon size={14} /> {idea.title}
                </Link>
              );
            })}
          </div>
        </>
      )}
      <Link to="/build" className="dr-door-cta">
        {mine ? 'Open your build' : `${IDEAS.length} ideas to start from`} <ArrowRight size={15} />
      </Link>
    </article>
  );
}

function PathDoor() {
  const progress = useProgress();
  const path = useMemo(() => pathOf(progress), [progress]);
  return (
    <article className="dr-door" data-tone="ok">
      <DoorHead to="/path" icon={Route} name="Path" words="“Teach me from zero”" />
      <p className="dr-door-lede">One guided route from knowing nothing to shipping products. Only the next three steps are lit.</p>
      <ol className="dr-door-steps">
        {path.lit.map((st) => (
          <li key={st.chapter.id}>
            <Link to={st.href} data-tone={chapterTone(st.chapter)}>
              <span className="dr-door-step-n mono">{st.litN}</span>
              <span className="dr-door-step-t">{st.chapter.title}</span>
              {st.done > 0 && (
                <span className="dr-door-step-p mono">
                  {st.done}/{st.ready}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
      <Link to="/path" className="dr-door-cta">
        {path.finished ? (
          <>
            <Check size={14} strokeWidth={3} /> {path.finished} of {path.total} chapters finished
          </>
        ) : (
          `See the whole path · ${path.total} chapters`
        )}{' '}
        <ArrowRight size={15} />
      </Link>
    </article>
  );
}
