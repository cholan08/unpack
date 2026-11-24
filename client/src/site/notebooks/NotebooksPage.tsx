import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import './fonts';
import { COVER_ID, NOTEBOOKS, writtenPages } from '@/content/notebooks/registry';
import type { Notebook } from '@/content/notebooks/types';
import { PILLARS } from '@/content/pillars';
import { useAllBookProgress, useBookProgress } from '@/lib/notebookProgress';
import { pageHref } from './NotebookReader';
import './hand.css';
import './notebooks.css';

const STATUS_LABEL = { outline: 'Outline', progress: 'In progress', complete: 'Complete' } as const;

/** Longest word of the cover title, so the label's lettering can size itself to fit. */
const longestWord = (s: string) => Math.max(...s.split(/\s+/).map((w) => w.length));

function Tile({ book }: { book: Notebook }) {
  const { seen, last } = useBookProgress(book.id);
  const { written, total, status } = writtenPages(book);
  const read = book.pages.filter((p) => seen.includes(p.id)).length;
  const resume = last && last !== COVER_ID ? book.pages.find((p) => p.id === last) : undefined;
  return (
    <li data-color={book.color}>
      <Link to={pageHref(book, resume?.id ?? COVER_ID)} className="nb-tile-link" aria-label={`${book.name}: ${STATUS_LABEL[status]}, ${book.pages.length} pages`}>
        <div className="nb-mini" aria-hidden>
          <span className="nb-spiral" />
          <span className="nb-edge" />
          <div className="nb-mini-label" style={{ ['--len' as string]: Math.max(4, longestWord(book.cover.big)) }}>
            {book.cover.big}
          </div>
        </div>
        <div className="nb-tile-body">
          <h3>{book.name}</h3>
          <p>{book.tagline}</p>
          <div className="nb-tile-meta">
            <span className={`badge${status === 'complete' ? ' badge--ok' : status === 'progress' ? ' badge--warn' : ''}`}>
              {status === 'progress' ? `${written}/${total} written` : STATUS_LABEL[status]}
            </span>
            <span>{book.pages.length} pages</span>
            <span className="nb-go">{resume ? `Continue p.${resume.num}` : 'Open'} →</span>
          </div>
          {read > 0 && (
            <span className="bar bar--sm" aria-label={`${read} of ${book.pages.length} pages read`}>
              <i style={{ width: `${(read / book.pages.length) * 100}%`, ['--tone' as string]: 'var(--c1)' }} />
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

/** Notebooks you've opened past the cover, most recent first in shelf order. */
function ContinueStrip() {
  const progress = useAllBookProgress();
  const open = NOTEBOOKS.flatMap((b) => {
    const last = progress[b.id]?.last;
    const page = last && last !== COVER_ID ? b.pages.find((p) => p.id === last) : undefined;
    return page ? [{ book: b, page }] : [];
  });
  if (!open.length) return null;
  return (
    <nav className="nb-continue" aria-label="Continue reading">
      <span>Continue</span>
      {open.slice(0, 4).map(({ book, page }) => (
        <Link key={book.id} to={pageHref(book, page.id)} className="nb-resume-link" data-color={book.color}>
          <i aria-hidden />
          <span>
            {book.title} <small>· p.{page.num} {page.title}</small>
          </span>
        </Link>
      ))}
    </nav>
  );
}

const haystack = (b: Notebook) =>
  [b.title, b.name, b.tagline, b.cover.big, ...b.pages.flatMap((p) => [p.title, ...(p.outline ?? [])])].join(' ').toLowerCase();

export function NotebooksPage() {
  const [params, setParams] = useSearchParams();
  const topic = params.get('topic') ?? 'all';
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = 'Notebooks — Unpacked';
  }, []);

  const groups = useMemo(
    () => PILLARS.map((p) => ({ pillar: p, books: NOTEBOOKS.filter((b) => b.pillar === p.id) })).filter((g) => g.books.length),
    [],
  );
  const q = query.trim().toLowerCase();
  const shown = groups
    .filter((g) => topic === 'all' || g.pillar.id === topic)
    .map((g) => ({ ...g, books: q ? g.books.filter((b) => haystack(b).includes(q)) : g.books }))
    .filter((g) => g.books.length);

  const totals = NOTEBOOKS.reduce(
    (t, b) => {
      const w = writtenPages(b);
      return { pages: t.pages + w.total, written: t.written + w.written };
    },
    { pages: 0, written: 0 },
  );

  const pick = (id: string) => {
    const next = new URLSearchParams(params);
    if (id === 'all') next.delete('topic');
    else next.set('topic', id);
    setParams(next, { replace: true });
  };

  return (
    <main className="nb-shelf-page hw">
      <div className="wrap">
        <header className="page-head">
          <div className="page-head-text">
            <span className="eyebrow">Handwritten study notes</span>
            <h1 className="page-title">Notebooks</h1>
            <p className="page-lede">
              Exam-ready notes written out by hand, one notebook per subject: {NOTEBOOKS.length} subjects, {totals.pages} pages planned,{' '}
              {totals.written} written so far. Pages still being written show their outline. Flip through with{' '}
              <kbd aria-label="Left arrow">
                <ArrowLeft size={12} />
              </kbd>{' '}
              <kbd aria-label="Right arrow">
                <ArrowRight size={12} />
              </kbd>
              .
            </p>
          </div>
        </header>

        <ContinueStrip />

        <div className="nb-tools">
          <div className="seg-ctl" role="tablist" aria-label="Filter by topic">
            <button role="tab" aria-selected={topic === 'all'} onClick={() => pick('all')}>
              All <b>{NOTEBOOKS.length}</b>
            </button>
            {groups.map((g) => (
              <button key={g.pillar.id} role="tab" aria-selected={topic === g.pillar.id} onClick={() => pick(g.pillar.id)}>
                {g.pillar.label} <b>{g.books.length}</b>
              </button>
            ))}
          </div>
          <label className="field nb-find">
            <Search size={16} aria-hidden />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a subject or topic… e.g. JWT, Docker" aria-label="Search notebooks" />
          </label>
        </div>

        {shown.map((g) => (
          <section key={g.pillar.id} className="nb-group" style={{ ['--tone' as string]: `var(--${g.pillar.tone})` }} aria-labelledby={`nb-g-${g.pillar.id}`}>
            <header className="nb-group-head">
              <h2 id={`nb-g-${g.pillar.id}`}>{g.pillar.label}</h2>
              <p>{g.pillar.blurb}</p>
            </header>
            <ul className="nb-grid">
              {g.books.map((b) => (
                <Tile key={b.id} book={b} />
              ))}
            </ul>
          </section>
        ))}

        {shown.length === 0 && (
          <div className="empty" style={{ marginTop: 26 }}>
            <strong>No notebook matches “{query}”</strong>
            <span>
              Try a shorter word, or{' '}
              <button
                className="tlink"
                onClick={() => {
                  setQuery('');
                  pick('all');
                }}
              >
                show every notebook
              </button>
              .
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
