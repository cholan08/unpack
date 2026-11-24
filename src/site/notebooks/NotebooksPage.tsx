import { useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import './fonts';
import { COVER_ID, NOTEBOOKS } from '@/content/notebooks/registry';
import type { Notebook } from '@/content/notebooks/types';
import { useBookProgress } from '@/lib/notebookProgress';
import { pageHref } from './NotebookReader';
import './hand.css';
import './notebooks.css';

function ShelfBook({ book }: { book: Notebook }) {
  const { seen, last } = useBookProgress(book.id);
  const read = book.pages.filter((p) => seen.includes(p.id)).length;
  const lastPage = book.pages.find((p) => p.id === last);
  const resume = lastPage && lastPage.id !== COVER_ID ? lastPage : undefined;
  return (
    <article className="nb-book" data-color={book.color}>
      <Link to={pageHref(book, resume?.id ?? COVER_ID)} className="nb-cover-link" aria-label={`Open the ${book.title} notebook`}>
        <div className="nb-cover">
          <span className="nb-spiral" aria-hidden />
          <span className="nb-edge" aria-hidden />
          <div className="nb-label">
            <b>{book.title}</b>
            <span>{book.name}</span>
          </div>
          <div className="nb-cover-foot">{book.pages.length} pages</div>
        </div>
      </Link>

      <div className="nb-book-info">
        <h2>{book.name}</h2>
        <p className="nb-tagline">{book.tagline}</p>
        <ol className="nb-topics" aria-label="Contents">
          {book.pages.slice(1).map((p) => (
            <li key={p.id}>
              <Link to={pageHref(book, p.id)} data-seen={seen.includes(p.id) || undefined} data-soon={!p.written || undefined}>
                <span>{p.num}</span>
                {p.title}
              </Link>
            </li>
          ))}
        </ol>
        <div className="nb-book-prog">
          <div className="nb-meter" role="progressbar" aria-valuemin={0} aria-valuemax={book.pages.length} aria-valuenow={read} aria-label="Pages read">
            <span style={{ width: `${(read / book.pages.length) * 100}%` }} />
          </div>
          <small>
            {read} of {book.pages.length} pages read
          </small>
        </div>
        <div className="nb-book-cta">
          <Link className="btn btn--primary" to={pageHref(book, resume?.id ?? COVER_ID)}>
            {resume ? `Continue on page ${resume.num}` : 'Open notebook'} <ArrowRight size={16} />
          </Link>
          {resume && (
            <Link className="btn btn--ghost" to={pageHref(book, COVER_ID)}>
              Start from the cover
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function NotebooksPage() {
  useEffect(() => {
    document.title = 'Notebooks — Unpacked';
  }, []);

  return (
    <>
      <main className="nb-shelf-page hw">
        <section className="wrap nb-hero">
          <span className="eyebrow">Handwritten study notes</span>
          <h1 className="page-title">Notebooks</h1>
          <p className="nb-lede">
            Exam-ready notes, written out by hand: boxed headings, ruled tables, diagrams, and the points examiners ask about. One
            notebook per subject. Open one and flip through it with{' '}
            <kbd aria-label="Left arrow">
              <ArrowLeft size={12} />
            </kbd>{' '}
            <kbd aria-label="Right arrow">
              <ArrowRight size={12} />
            </kbd>
            .
          </p>
        </section>
        <section className="wrap nb-shelf" aria-label="Notebooks">
          {NOTEBOOKS.map((b) => (
            <ShelfBook key={b.id} book={b} />
          ))}
        </section>
      </main>
    </>
  );
}
