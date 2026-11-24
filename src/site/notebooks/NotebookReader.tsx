import { useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, NotebookPen } from 'lucide-react';
import './fonts';
import { COVER_ID, getNotebook, usePageContent, warmNotebook } from '@/content/notebooks/registry';
import type { Notebook, NotebookPage } from '@/content/notebooks/types';
import { markPageSeen, useBookProgress } from '@/lib/notebookProgress';
import { usePrefersReducedMotion } from '@/lib/media';
import { SiteFooter, SiteHeader } from '../SiteHeader';
import { NotFound } from '../NotFound';
import { CoverPage } from './CoverPage';
import { HandPage, PageFoot, PageHead } from './HandPage';
import './hand.css';
import './notebooks.css';

export const pageHref = (book: Notebook, pageId: string) =>
  pageId === COVER_ID ? `/notebooks/${book.id}` : `/notebooks/${book.id}/${pageId}`;

function Scribbles() {
  return (
    <div className="hw-skel" aria-hidden>
      {[92, 78, 85, 60, 88, 70, 80, 54].map((w, i) => (
        <span key={i} style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

function PageBody({ book, page }: { book: Notebook; page: NotebookPage }) {
  const isCover = page.id === COVER_ID;
  const state = usePageContent(book.id, page.id, !isCover && page.written);
  if (isCover) return <CoverPage book={book} linkFor={(id) => pageHref(book, id)} />;
  if (!page.written || state.status === 'error')
    return (
      <>
        <PageHead book={book} page={page} />
        <div className="hw-unwritten">
          <NotebookPen size={34} strokeWidth={1.6} />
          <p>{page.written ? 'This page didn’t load. Check your connection and flip back to it.' : 'This page is still being written.'}</p>
        </div>
        <PageFoot book={book} page={page} />
      </>
    );
  if (state.status === 'loading')
    return (
      <>
        <PageHead book={book} page={page} />
        <Scribbles />
      </>
    );
  return <HandPage book={book} page={page} content={state.page} />;
}

function Toc({ book, page }: { book: Notebook; page: NotebookPage }) {
  const { seen } = useBookProgress(book.id);
  const read = book.pages.filter((p) => seen.includes(p.id)).length;
  return (
    <aside className="nb-toc" aria-label={`${book.title} contents`}>
      <Link to="/notebooks" className="nb-back">
        <ArrowLeft size={15} /> All notebooks
      </Link>
      <div className="nb-toc-box" data-color={book.color}>
        <div className="nb-toc-title">
          <b>{book.title}</b>
          <small>{book.name}</small>
        </div>
        <div className="nb-meter" role="progressbar" aria-valuemin={0} aria-valuemax={book.pages.length} aria-valuenow={read} aria-label="Pages read">
          <span style={{ width: `${(read / book.pages.length) * 100}%` }} />
        </div>
        <small className="nb-meter-l">
          {read} of {book.pages.length} pages read
        </small>
        <ol className="nb-toc-list">
          {book.pages.map((p) => (
            <li key={p.id}>
              <NavLink to={pageHref(book, p.id)} end aria-current={p.id === page.id ? 'page' : undefined} data-soon={!p.written || undefined}>
                <span className="nb-toc-n">{p.num}</span>
                <span className="nb-toc-t">{p.title}</span>
                {seen.includes(p.id) && <Check size={14} className="nb-toc-seen" aria-label="read" />}
              </NavLink>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}

export function NotebookReader() {
  const { bookId, pageId } = useParams();
  const book = getNotebook(bookId);
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const idx = book ? book.pages.findIndex((p) => p.id === (pageId ?? COVER_ID)) : -1;
  const page = book?.pages[idx];
  const prev = book?.pages[idx - 1];
  const next = book?.pages[idx + 1];

  // Direction of the flip, for the page-turn animation.
  const lastIdx = useRef(idx);
  const dir = idx >= lastIdx.current ? 1 : -1;
  useEffect(() => {
    lastIdx.current = idx;
  }, [idx]);

  useEffect(() => {
    if (book) warmNotebook(book);
  }, [book]);

  useEffect(() => {
    if (!book || !page) return;
    markPageSeen(book.id, page.id);
    document.title = `${page.id === COVER_ID ? book.name : page.title} — ${book.title} Notebook — Unpacked`;
  }, [book, page]);

  useEffect(() => {
    if (!book) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if ((e.target as HTMLElement).closest?.('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      const to = e.key === 'ArrowRight' ? next : e.key === 'ArrowLeft' ? prev : undefined;
      if (to) {
        e.preventDefault();
        navigate(pageHref(book, to.id));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [book, prev, next, navigate]);

  if (!book || !page) return <NotFound />;

  const total = book.pages.length;
  const motionProps = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
    : {
        initial: { opacity: 0, x: 34 * dir, rotate: 0.5 * dir },
        animate: { opacity: 1, x: 0, rotate: 0 },
        exit: { opacity: 0, x: -34 * dir, rotate: -0.5 * dir },
        transition: { duration: 0.2, ease: [0.2, 0.7, 0.2, 1] as const },
      };

  return (
    <>
      <SiteHeader />
      <main className="nb-read hw">
        <div className="nb-read-in">
          <Toc book={book} page={page} />

          <div className="nb-stage">
            <div className="nb-bar">
              <nav className="nb-crumbs" aria-label="Breadcrumb">
                <Link to="/notebooks">Notebooks</Link>
                <span aria-hidden>/</span>
                <Link to={pageHref(book, COVER_ID)}>{book.title}</Link>
              </nav>
              <label className="nb-pick">
                <span className="sr-only">Jump to page</span>
                <select value={page.id} onChange={(e) => navigate(pageHref(book, e.target.value))}>
                  {book.pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.num}. {p.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="nb-flip">
                <span className="nb-count">
                  Page <b>{page.num}</b> of {total}
                </span>
                <button className="nb-icon" onClick={() => prev && navigate(pageHref(book, prev.id))} disabled={!prev} aria-label="Previous page">
                  <ChevronLeft size={18} />
                </button>
                <button className="nb-icon" onClick={() => next && navigate(pageHref(book, next.id))} disabled={!next} aria-label="Next page">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="hw-stack">
              <AnimatePresence mode="wait" initial={false}>
                <motion.article key={page.id} className={`hw-sheet${page.id === COVER_ID ? ' hw-sheet--cover' : ''}`} {...motionProps}>
                  <PageBody book={book} page={page} />
                </motion.article>
              </AnimatePresence>
            </div>

            <nav className="nb-dots" aria-label="Pages">
              {book.pages.map((p) => (
                <Link key={p.id} to={pageHref(book, p.id)} aria-label={`Page ${p.num}: ${p.title}`} aria-current={p.id === page.id ? 'page' : undefined} />
              ))}
            </nav>

            <nav className="nb-pager" aria-label="Previous and next page">
              {prev ? (
                <Link to={pageHref(book, prev.id)} className="nb-pg nb-pg--prev">
                  <ArrowLeft size={18} />
                  <span>
                    <small>Page {prev.num}</small>
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link to={pageHref(book, next.id)} className="nb-pg nb-pg--next">
                  <span>
                    <small>Page {next.num}</small>
                    {next.title}
                  </span>
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <Link to="/notebooks" className="nb-pg nb-pg--next">
                  <span>
                    <small>The end</small>
                    Back to the shelf
                  </span>
                  <ArrowRight size={18} />
                </Link>
              )}
            </nav>
            <p className="nb-hint">
              Tip: flip pages with{' '}
              <kbd aria-label="Left arrow">
                <ArrowLeft size={12} />
              </kbd>{' '}
              <kbd aria-label="Right arrow">
                <ArrowRight size={12} />
              </kbd>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
