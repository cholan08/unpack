import { useId, type ReactNode } from 'react';
import type { Block, ListItem, Notebook, NotebookPage, PageContent, Row, Section, TableSpec, Tone } from '@/content/notebooks/types';
import { Ink } from './Ink';
import { SketchView, Wobble } from './SketchView';

/* ---------------- blocks ---------------- */

function ListView({ items, mark = 'dot', cols }: { items: ListItem[]; mark?: string; cols?: 1 | 2 }) {
  return (
    <ul className={`hw-list hw-list--${mark}${cols === 2 ? ' hw-list--2' : ''}`}>
      {items.map((it, i) => {
        const text = typeof it === 'string' ? it : it.text;
        const sub = typeof it === 'string' ? null : it.sub;
        return (
          <li key={i} data-n={mark === 'circle' || mark === 'num' ? i + 1 : undefined}>
            <Ink text={text} />
            {sub && (
              <ul className="hw-list hw-list--dash">
                {sub.map((s, j) => (
                  <li key={j}>
                    <Ink text={s} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function TableView({ t }: { t: TableSpec }) {
  return (
    <figure className={`hw-tbl${t.small ? ' hw-tbl--small' : ''}`} data-tone={t.tone ?? 'blue'}>
      {t.title && (
        <figcaption>
          <Ink text={t.title} />
        </figcaption>
      )}
      <div className="hw-tbl-scroll">
        <table>
          <thead>
            <tr>
              {t.head.map((h, i) => (
                <th key={i}>
                  <Ink text={h} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>
                    <Ink text={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

function Venn({ shade, a = 'A', b = 'B', apart, tone = 'blue' }: { shade: string; a?: string; b?: string; apart?: boolean; tone?: Tone }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const r = apart ? 36 : 44;
  const c1 = apart ? 62 : 82;
  const c2 = apart ? 158 : 138;
  const cy = 54;
  const hatch = `url(#vh${uid})`;
  return (
    <svg className="hw-venn" viewBox="0 0 220 108" role="img" aria-label={`${a} and ${b}, ${shade === 'none' ? 'every pairing' : shade + ' part shaded'}`}>
      <defs>
        <pattern id={`vh${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
          <rect width="6" height="6" className={`hw-f-${tone}`} />
          <line x1="1" y1="0" x2="1" y2="6" className="hw-hatch" />
        </pattern>
        <clipPath id={`vc${uid}`}>
          <circle cx={c2} cy={cy} r={r} />
        </clipPath>
        <Wobble id={`vw${uid}`} w={220} h={108} />
      </defs>
      {(shade === 'left' || shade === 'full') && <circle cx={c1} cy={cy} r={r} fill={hatch} />}
      {(shade === 'right' || shade === 'full') && <circle cx={c2} cy={cy} r={r} fill={hatch} />}
      {shade === 'inner' && <circle cx={c1} cy={cy} r={r} fill={hatch} clipPath={`url(#vc${uid})`} />}
      <g filter={`url(#vw${uid})`}>
        <circle cx={c1} cy={cy} r={r} className="hw-s hw-f-none" />
        <circle cx={c2} cy={cy} r={r} className="hw-s hw-f-none" />
      </g>
      <text x={apart ? c1 : c1 - r * 0.45} y={cy + 6} textAnchor="middle" className="hw-t hw-t-b hw-t-venn">
        {a}
      </text>
      <text x={apart ? c2 : c2 + r * 0.45} y={cy + 6} textAnchor="middle" className="hw-t hw-t-b hw-t-venn">
        {b}
      </text>
    </svg>
  );
}

export function BlockView({ b }: { b: Block }): ReactNode {
  switch (b.t) {
    case 'p':
      return (
        <p className="hw-p">
          <Ink text={b.text} />
        </p>
      );
    case 'list':
      return <ListView items={b.items} mark={b.mark} cols={b.cols} />;
    case 'pairs':
      return (
        <dl className="hw-pairs">
          {b.items.map(([k, v], i) => (
            <div key={i}>
              <dt>
                <Ink text={k} />
              </dt>
              <dd>
                <Ink text={v} />
              </dd>
            </div>
          ))}
        </dl>
      );
    case 'table':
      return <TableView t={b} />;
    case 'code':
      return (
        <figure className="hw-code" data-tone={b.tone}>
          {b.title && (
            <figcaption className="hw-tag" data-tone={b.tone ?? 'green'}>
              <Ink text={b.title} />
            </figcaption>
          )}
          <pre>{b.code}</pre>
        </figure>
      );
    case 'tag':
      return (
        <span className="hw-tag" data-tone={b.tone ?? 'green'}>
          <Ink text={b.text} />
        </span>
      );
    case 'box':
      return (
        <div className="hw-box" data-tone={b.tone}>
          {b.lines.map((l, i) => (
            <div key={i}>
              <Ink text={l} />
            </div>
          ))}
        </div>
      );
    case 'note':
      return (
        <aside className="hw-note" data-tone={b.tone}>
          {b.title && (
            <div className="hw-note-h">
              <span aria-hidden>★</span> <Ink text={b.title} />
            </div>
          )}
          <Blocks blocks={b.body} />
        </aside>
      );
    case 'sub':
      return (
        <div className="hw-sub">
          <h4 className="hw-sub-h">
            <Ink text={b.title} />
          </h4>
          <Blocks blocks={b.body} />
        </div>
      );
    case 'cols':
      return (
        <div className="hw-cols" style={{ ['--n' as string]: b.cols.length }}>
          {b.cols.map((c, i) => (
            <div key={i} className="hw-cols-c">
              <Blocks blocks={c} />
            </div>
          ))}
        </div>
      );
    case 'cards':
      return (
        <div className="hw-cards">
          {b.items.map((c, i) => (
            <div key={i} className="hw-keyed" data-tone={c.tone}>
              <div className="hw-keyed-k">
                <b>
                  <Ink text={c.label} />
                </b>
                {c.sub && (
                  <small>
                    <Ink text={c.sub} />
                  </small>
                )}
              </div>
              <ListView items={c.points} />
            </div>
          ))}
        </div>
      );
    case 'ops':
      return (
        <div className="hw-ops">
          {b.items.map((it, i) =>
            'table' in it ? (
              <TableView key={i} t={it.table} />
            ) : (
              <div key={i} className="hw-op">
                <span>
                  <Ink text={it.op} />
                </span>
                <svg viewBox="0 0 60 12" aria-hidden>
                  <path d="M2 6 L56 6 M49 1.5 L57 6 L49 10.5" className="hw-s hw-line" />
                </svg>
              </div>
            ),
          )}
        </div>
      );
    case 'venn':
      return <Venn shade={b.shade} a={b.a} b={b.b} apart={b.apart} tone={b.tone} />;
    case 'sketch':
      return (
        <figure className="hw-fig">
          <div className="hw-fig-scroll">
            <SketchView d={b.d} />
          </div>
          {b.caption && (
            <figcaption>
              <Ink text={b.caption} />
            </figcaption>
          )}
        </figure>
      );
  }
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => (
        <BlockView key={i} b={b} />
      ))}
    </>
  );
}

/* ---------------- sections and rows ---------------- */

function SectionView({ s, n }: { s: Section; n: number }) {
  return (
    <section className={`hw-sec${s.star ? ' hw-sec--star' : ''}`}>
      <h3 className="hw-sec-h">
        <span className="hw-sec-n">{n}.</span> <Ink text={s.title} />
      </h3>
      <div className="hw-sec-b">
        <Blocks blocks={s.body} />
      </div>
    </section>
  );
}

function RowView({ row, start }: { row: Row; start: number }) {
  if ('full' in row)
    return (
      <div className="hw-row hw-row--full">
        <div className="hw-col">
          <SectionView s={row.full} n={start} />
        </div>
      </div>
    );
  const [l, r] = row.ratio ?? [1, 1];
  return (
    <div className="hw-row" style={{ ['--cols' as string]: `minmax(0, ${l}fr) minmax(0, ${r}fr)` }}>
      <div className="hw-col">
        {row.left.map((s, i) => (
          <SectionView key={i} s={s} n={start + i} />
        ))}
      </div>
      <div className="hw-col">
        {row.right.map((s, i) => (
          <SectionView key={i} s={s} n={start + row.left.length + i} />
        ))}
      </div>
    </div>
  );
}

const sectionsIn = (row: Row) => ('full' in row ? 1 : row.left.length + row.right.length);

/* ---------------- the page ---------------- */

export function PageHead({ book, page }: { book: Notebook; page: NotebookPage }) {
  return (
    <header className="hw-head">
      <h2 className="hw-title">
        <span className="hw-brace" aria-hidden>
          {'{'}
        </span>
        <span>
          {book.title} — Page {page.num}
        </span>
        <span className="hw-brace" aria-hidden>
          {'}'}
        </span>
      </h2>
      <p className="hw-subtopic">
        <span>Subtopic:</span> {page.title}
      </p>
    </header>
  );
}

export function PageFoot({ book, page, quote }: { book: Notebook; page: NotebookPage; quote?: string }) {
  return (
    <footer className="hw-foot">
      {quote && (
        <blockquote className="hw-quote">
          <span className="hw-brace" aria-hidden>
            {'{'}
          </span>
          <span>
            “<Ink text={quote} />”
          </span>
          <span className="hw-brace" aria-hidden>
            {'}'}
          </span>
        </blockquote>
      )}
      <span className="hw-pnum" aria-label={`Page ${page.num} of ${book.pages.length}`}>
        {page.num}/{book.pages.length}
      </span>
    </footer>
  );
}

/* ---------------- template page (outline only) ---------------- */

function DraftSection({ n, title }: { n: number; title: string }) {
  return (
    <section className="hw-sec hw-sec--draft">
      <h3 className="hw-sec-h">
        <span className="hw-sec-n">{n}.</span> <Ink text={title} />
      </h3>
      <div className="hw-draft-lines" aria-hidden>
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

/**
 * A page whose notes aren't written yet, drawn from its outline: the same header, the planned
 * sections in their boxes, and ruled space under each, like a page set up to be filled in.
 */
export function OutlinePage({ book, page }: { book: Notebook; page: NotebookPage }) {
  const items = page.outline ?? [];
  const half = Math.ceil(items.length / 2);
  return (
    <>
      <PageHead book={book} page={page} />
      <aside className="hw-draft-note">
        <b>✎ Outline page</b> — the handwritten notes for this page are on the way.{' '}
        {items.length ? `It will cover ${items.length} sections:` : 'Its sections haven’t been planned yet.'}
      </aside>
      {items.length > 0 && (
        <div className="hw-rows">
          <div className="hw-row">
            <div className="hw-col">
              {items.slice(0, half).map((t, i) => (
                <DraftSection key={i} n={i + 1} title={t} />
              ))}
            </div>
            <div className="hw-col">
              {items.slice(half).map((t, i) => (
                <DraftSection key={i} n={half + i + 1} title={t} />
              ))}
            </div>
          </div>
        </div>
      )}
      <PageFoot book={book} page={page} />
    </>
  );
}

export function HandPage({ book, page, content }: { book: Notebook; page: NotebookPage; content: PageContent }) {
  let n = 1;
  return (
    <>
      <PageHead book={book} page={page} />
      <div className="hw-rows">
        {content.rows.map((row, i) => {
          const start = n;
          n += sectionsIn(row);
          return <RowView key={i} row={row} start={start} />;
        })}
      </div>
      <PageFoot book={book} page={page} quote={content.quote} />
    </>
  );
}
