/**
 * /manual — the Manual's table of contents: four parts, every chapter as the problem it solves,
 * with its curiosity question, its status and the learner's progress. The main topics (Frontend,
 * Backend…) are a filter here, not the structure (docs/VISION.md §3).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, BookOpen } from 'lucide-react';
import { CHAPTERS, MANUAL_PARTS, chapterNum, chapterStatus, chaptersIn, type Chapter } from '@/content/manual';
import { PILLARS } from '@/content/pillars';
import type { PillarId } from '@/engine/types';
import { useProgress } from '@/lib/progress';
import { PILLAR_ICON } from '../pillarIcons';
import { Ring } from '../ui';
import { chapterHref, chapterProgress, chapterTone, StatusPill } from './shared';
import './manual.css';

type Lens = PillarId | 'all';

const LENSES = PILLARS.filter((p) => p.id !== 'start');
const FILTER_KEY = 'unpacked:manual:lens';

export function ManualPage() {
  const progress = useProgress();
  const [lens, setLens] = useState<Lens>(() => {
    try {
      const v = localStorage.getItem(FILTER_KEY) as Lens | null;
      return v && (v === 'all' || LENSES.some((p) => p.id === v)) ? v : 'all';
    } catch {
      return 'all';
    }
  });
  const pick = (l: Lens) => {
    setLens(l);
    try {
      localStorage.setItem(FILTER_KEY, l);
    } catch {
      /* the filter just won't be remembered */
    }
  };

  useEffect(() => {
    document.title = 'The Manual — Unpacked';
  }, []);

  const complete = CHAPTERS.filter((c) => chapterStatus(c) === 'complete').length;
  const ready = CHAPTERS.filter((c) => chapterStatus(c) === 'ready').length;
  const shows = (c: Chapter) => lens === 'all' || c.lens.includes(lens);

  // The chapter to open next: the first one in reading order with lessons still to finish.
  const nextUp = CHAPTERS.find((c) => {
    const p = chapterProgress(c, progress);
    return chapterStatus(c) !== 'planned' && !c.href && p.ready > 0 && p.done < p.ready;
  });

  return (
    <main className="mn mn-toc-page">
      <div className="wrap">
        <header className="mn-hero">
          <span className="eyebrow">
            <BookOpen size={14} /> The Manual
          </span>
          <h1 className="page-title">
            The manual of technology for <em>building products</em>.
          </h1>
          <p className="page-lede">
            Every product — a booking site, a chat app, an AI assistant — is built from the same problems. Each chapter takes one problem: how it works,
            the ways to solve it, how it is built today with AI, and a build of your own. Follow your curiosity; every answer leads to the next question.
          </p>
          <ul className="mn-hero-facts">
            <li>
              <strong>{CHAPTERS.length}</strong> chapters
            </li>
            <li>
              <strong>{complete}</strong> complete
            </li>
            <li>
              <strong>{ready}</strong> with lessons ready
            </li>
          </ul>
          {nextUp && (
            <Link to={chapterHref(nextUp)} className="mn-nextup card" data-tone={chapterTone(nextUp)}>
              <span className="mn-nextup-ico">
                <nextUp.glyph size={20} />
              </span>
              <span className="mn-nextup-text">
                <span className="eyebrow">Pick up here · Chapter {chapterNum(nextUp.id)}</span>
                <strong>{nextUp.title}</strong>
                <span>{nextUp.question}</span>
              </span>
              <ArrowRight size={18} className="mn-go" />
            </Link>
          )}
        </header>

        <div className="mn-filter" role="group" aria-label="Show chapters for a topic">
          <button className="mn-chip" aria-pressed={lens === 'all'} onClick={() => pick('all')}>
            All
          </button>
          {LENSES.map((p) => {
            const Icon = PILLAR_ICON[p.id];
            const n = CHAPTERS.filter((c) => c.lens.includes(p.id)).length;
            return (
              <button key={p.id} className="mn-chip" data-tone={p.tone} aria-pressed={lens === p.id} onClick={() => pick(p.id)} disabled={!n}>
                <Icon size={13} /> {p.label} <span className="mono">{n}</span>
              </button>
            );
          })}
        </div>

        {MANUAL_PARTS.map((part) => {
          const list = chaptersIn(part.id).filter(shows);
          if (!list.length) return null;
          return (
            <section key={part.id} id={`part-${part.id}`} className="mn-part">
              <header className="mn-part-head">
                <span className="mn-part-num display">{part.num}</span>
                <div>
                  <h2>{part.title}</h2>
                  <p>{part.promise}</p>
                </div>
              </header>
              <ol className="mn-rows">
                {list.map((c) => (
                  <li key={c.id}>
                    <ChapterRow c={c} progress={progress} />
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function ChapterRow({ c, progress }: { c: Chapter; progress: ReturnType<typeof useProgress> }) {
  const status = chapterStatus(c);
  const p = chapterProgress(c, progress);
  return (
    <Link to={chapterHref(c)} className="mn-row" data-tone={chapterTone(c)} data-status={status}>
      <span className="mn-row-num mono">{String(chapterNum(c.id)).padStart(2, '0')}</span>
      <span className="mn-row-ico" aria-hidden>
        <c.glyph size={18} />
      </span>
      <span className="mn-row-text">
        <span className="mn-row-title">
          {c.title} <span className="mn-row-short">· {c.short}</span>
        </span>
        <span className="mn-row-q">{c.question}</span>
      </span>
      <span className="mn-row-side">
        <StatusPill c={c} />
        {p.ready > 0 && (
          <span className="mn-row-prog" title={`${p.done} of ${p.ready} lessons finished`}>
            <Ring pct={p.pct} size={20} stroke={2.4} />
            <span className="mono">
              {p.done}/{p.ready}
            </span>
          </span>
        )}
      </span>
    </Link>
  );
}
