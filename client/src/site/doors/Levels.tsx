/**
 * Levels as identity (docs/VISION.md §2 and §5): "You can now …", never a percentage.
 *  - LevelWatcher: records a level the moment it is earned, and says so once.
 *  - LevelCard: who you are now, in the sidebar.
 *  - LevelLadder: all six levels on the dashboard, with what the next one needs.
 *  - ChapterBins: progress counted by chapter, part by part.
 */
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Check } from 'lucide-react';
import { LEVELS } from '@/content/levels';
import { CHAPTERS, MANUAL_PARTS, chapterNum, chaptersIn } from '@/content/manual';
import { earnLevels, useProgress } from '@/lib/progress';
import { toast } from '@/lib/toast';
import { chapterTone } from '../manual/shared';
import { levelsOf, nextStep, type LevelState } from './levels';
import { viewOf } from './model';
import './levels.css';

const useLevels = () => {
  const progress = useProgress();
  return useMemo(() => levelsOf(progress), [progress]);
};

/** Records newly earned levels (once) and announces the highest one. Mounted once, on every page. */
export function LevelWatcher() {
  const { fresh } = useLevels();
  const key = fresh.join(',');
  useEffect(() => {
    if (!fresh.length) return;
    earnLevels(fresh);
    const top = LEVELS.find((l) => l.n === Math.max(...fresh));
    if (top) toast(`Level ${top.n} · ${top.name}. ${top.canNow}`, 'check', 6000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

/** Six marks, one per level: the ones you hold are filled. A place on a ladder, not a percentage. */
function Rungs({ held }: { held: number }) {
  return (
    <span className="lv-rungs" aria-hidden>
      {LEVELS.map((l) => (
        <i key={l.n} data-held={l.n <= held || undefined} />
      ))}
    </span>
  );
}

export function LevelCard() {
  const { current, next } = useLevels();
  const step = nextStep(next);
  return (
    <Link to="/me#levels" className="side-level" title="Your level — see what the next one needs">
      <span className="side-level-k">
        Level {current.level.n} · {current.level.name}
        <Rungs held={current.level.n} />
      </span>
      <span className="side-level-can">{current.level.canNow}</span>
      {next && (
        <span className="side-level-next">
          Next: <b>{next.level.name}</b>
          {step && ` · ${step}`}
        </span>
      )}
    </Link>
  );
}

export function LevelLadder() {
  const { ladder, current, next } = useLevels();
  return (
    <section className="dash-sec lv" id="levels" aria-labelledby="levels-h">
      <div className="sec-head">
        <h2 id="levels-h">Who you’re becoming</h2>
        <p>Each level is earned with proof — a live link, chapters finished or tested out — and kept.</p>
      </div>
      <ol className="lv-ladder">
        {ladder.map((l) => (
          <Rung key={l.level.n} l={l} state={l.level.n === current.level.n ? 'current' : l.held ? 'held' : l.level.n === next?.level.n ? 'next' : 'later'} />
        ))}
      </ol>
    </section>
  );
}

function Rung({ l, state }: { l: LevelState; state: 'current' | 'held' | 'next' | 'later' }) {
  return (
    <li className="lv-rung" data-state={state}>
      <span className="lv-n display" aria-hidden>
        {l.held && l.level.n > 0 ? <Check size={16} strokeWidth={3} /> : l.level.n}
      </span>
      <div className="lv-body">
        <span className="lv-head">
          <strong>
            Level {l.level.n} · {l.level.name}
          </strong>
          {state === 'current' && <span className="lv-tag">You are here</span>}
          {state === 'next' && <span className="lv-tag lv-tag--next">Next</span>}
          {l.earnedAt && <span className="lv-when">Earned {new Date(l.earnedAt).toLocaleDateString()}</span>}
        </span>
        <span className="lv-can">{l.level.canNow}</span>
        {state === 'next' ? (
          <ul className="lv-needs">
            {l.needs.map((n, i) => (
              <li key={i} data-met={n.met || undefined}>
                <span className="lv-tick" aria-hidden>
                  {n.met && <Check size={12} strokeWidth={3} />}
                </span>
                <span className="lv-need">
                  <Link to={n.href}>{n.label}</Link>
                  {n.total !== undefined && (
                    <span className="lv-need-count mono">
                      {n.done}/{n.total}
                    </span>
                  )}
                  {n.chapters && n.chapters.some((c) => !c.finished) && (
                    <span className="lv-need-left">
                      Still to go:{' '}
                      {n.chapters
                        .filter((c) => !c.finished)
                        .map((c, j, all) => (
                          <span key={c.chapter.id}>
                            <Link to={c.href}>{c.chapter.title}</Link>
                            {c.chapter.gate && !c.testedOut ? ' (or test out)' : ''}
                            {j < all.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          state === 'later' && <span className="lv-proof">Proof: {l.level.proof}</span>
        )}
      </div>
    </li>
  );
}

/** Progress counted by chapter: every chapter of the Manual as one square, part by part. */
export function ChapterBins() {
  const progress = useProgress();
  const views = useMemo(() => new Map(CHAPTERS.map((c) => [c.id, viewOf(c, progress)])), [progress]);
  const all = [...views.values()].filter((v) => v.open && v.measurable);
  const finished = all.filter((v) => v.finished).length;
  return (
    <section className="dash-sec" aria-labelledby="chapters-h">
      <div className="sec-head">
        <h2 id="chapters-h">Chapters</h2>
        <p>
          <strong>{finished}</strong> of {all.length} chapters finished or tested out
        </p>
      </div>
      <ul className="lv-key" aria-hidden>
        <li data-k="finished">Finished</li>
        <li data-k="started">Started</li>
        <li data-k="open">Not started</li>
        <li data-k="planned">Being written</li>
      </ul>
      <div className="lv-bins">
        {MANUAL_PARTS.map((part) => {
          const list = chaptersIn(part.id).map((c) => views.get(c.id)!);
          const measured = list.filter((v) => v.open && v.measurable);
          return (
            <div key={part.id} className="lv-bin card">
              <span className="lv-bin-head">
                <span className="lv-bin-num display">{part.num}</span>
                <Link to={`/manual#part-${part.id}`} className="lv-bin-name">
                  {part.title}
                </Link>
                <span className="lv-bin-count mono">
                  {measured.filter((v) => v.finished).length}/{measured.length}
                </span>
              </span>
              <span className="lv-squares">
                {list.map((v) => {
                  const st = !v.open ? 'planned' : v.finished ? 'finished' : v.done > 0 ? 'started' : 'open';
                  const label = `Chapter ${chapterNum(v.chapter.id)}: ${v.chapter.title} — ${
                    st === 'planned' ? 'being written' : v.finished ? (v.testedOut && v.done < v.ready ? 'tested out' : 'finished') : v.ready ? `${v.done} of ${v.ready} lessons` : 'not started'
                  }`;
                  return (
                    <Link key={v.chapter.id} to={v.href} className="lv-sq" data-state={st} data-tone={chapterTone(v.chapter)} title={label} aria-label={label} />
                  );
                })}
              </span>
            </div>
          );
        })}
      </div>
      <Link to="/path" className="lv-path-link">
        Follow the path <ArrowRight size={14} />
      </Link>
    </section>
  );
}
