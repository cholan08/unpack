import { Link } from 'react-router';
import { writtenPages } from '@/content/notebooks/registry';
import type { Notebook } from '@/content/notebooks/types';
import { SketchView, Doodle, Wobble } from './SketchView';

/** Small tilt per letter, so the big title looks lettered by hand. */
const TILT = [-3, 2, -1.5, 2.5, -2, 1.5, -2.5, 1];

function Cloud({ words }: { words: string[] }) {
  const lines = words.map((w, i) => (i === 0 ? `“${w}` : i === words.length - 1 ? `${w}”` : w));
  return (
    <SketchView
      d={{
        w: 240,
        h: 168,
        alt: lines.join(' '),
        nodes: [{ id: 'c', shape: 'cloud', x: 124, y: 80, w: 228, h: 150, text: lines.join('\n'), size: 17, bold: true }],
      }}
    />
  );
}

function LaptopDoodle() {
  return (
    <svg viewBox="0 0 120 78" className="hw-cv-laptop" aria-hidden>
      <defs>
        <Wobble id="hw-cv-lap" w={120} h={78} />
      </defs>
      <g filter="url(#hw-cv-lap)">
        <Doodle kind="laptop" x={4} y={6} w={112} h={68} />
        <Doodle kind="db" x={46} y={16} w={28} h={26} />
      </g>
    </svg>
  );
}

export function CoverPage({ book, linkFor }: { book: Notebook; linkFor: (pageId: string) => string }) {
  const c = book.cover;
  const topics = book.pages.slice(1);
  const progress = writtenPages(book);
  return (
    <div className="hw-cover">
      {c.art?.topLeft && (
        <div className="hw-cv hw-cv-tl">
          <SketchView d={c.art.topLeft} />
        </div>
      )}
      {c.cloud && (
        <div className="hw-cv hw-cv-cloud">
          <Cloud words={c.cloud} />
        </div>
      )}
      {c.art?.topRight && (
        <div className="hw-cv hw-cv-tr">
          <SketchView d={c.art.topRight} />
        </div>
      )}

      <h1 className="hw-big" aria-label={c.big} style={{ ['--len' as string]: Math.max(4, c.big.length) }}>
        {[...c.big].map((ch, i) => (
          <span key={i} aria-hidden style={{ ['--r' as string]: `${TILT[i % TILT.length]}deg` }}>
            {ch}
          </span>
        ))}
      </h1>
      <div className="hw-banner">{c.full}</div>

      {c.art?.left && (
        <div className="hw-cv hw-cv-left">
          <SketchView d={c.art.left} />
        </div>
      )}
      <div className="hw-cv hw-cv-kicker">
        <p>{c.kicker ?? 'Complete Handwritten Study Handbook'}</p>
        <div className="hw-badge">
          <span className="hw-spark hw-spark--l" aria-hidden />
          <b>{book.pages.length} Pages</b>
          <span className="hw-spark hw-spark--r" aria-hidden />
        </div>
        {progress.status !== 'complete' && (
          <p className="hw-cv-status">
            {progress.status === 'outline'
              ? '✎ Outline ready: notes coming page by page'
              : `✎ ${progress.written} of ${progress.total} pages written so far`}
          </p>
        )}
      </div>
      {c.side && (
        <div className="hw-cv hw-cv-side">
          <div className="hw-side-h">{c.side.title}</div>
          <ul className="hw-list hw-list--arrow">
            {c.side.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </div>
      )}

      <nav className="hw-cv hw-cv-topics" aria-label="Key topics">
        <div className="hw-cv-box-h">Key Topics:</div>
        <ol className="hw-list hw-list--dot">
          {topics.map((p) => (
            <li key={p.id}>
              {p.written ? <Link to={linkFor(p.id)}>{p.title}</Link> : <span className="hw-soon">{p.title}</span>}
            </li>
          ))}
        </ol>
      </nav>
      {c.art?.centre && (
        <div className="hw-cv hw-cv-hub">
          <SketchView d={c.art.centre} />
        </div>
      )}
      {c.why && (
        <div className="hw-cv hw-cv-why">
          <div className="hw-cv-box-h">{c.why.title}</div>
          <ul className="hw-list hw-list--check">
            {c.why.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </div>
      )}
      {c.footer && (
        <div className="hw-cv hw-cv-foot">
          <LaptopDoodle />
          <p>{c.footer}</p>
        </div>
      )}
    </div>
  );
}
