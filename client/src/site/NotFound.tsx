import { useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowRight, Search } from 'lucide-react';
import { useSearch } from './Search';
import { SkillIcon } from './skillpack/icons';
import { COURSES } from '@/content/registry';
import { staticEntries, type Item, type Kind } from './palette/items';
import { parseQuery } from './palette/match';
import { searchSections } from './palette/sections';

/** The kind of page the URL's section holds: /skillpack/… is a tool, /mern/… a lesson. */
function kindOfSection(parts: string[]): Kind | undefined {
  const [first, second] = parts;
  if (first === 'skillpack') return 'tool';
  if (first === 'notebooks') return 'notebook';
  if (first === 'techpack') return 'snippet';
  if (COURSES.some((c) => c.id === first)) return second === 'gate' ? 'gate' : 'lesson';
  return undefined;
}

/**
 * Best guesses for a broken link, from the same typo-tolerant matching as the palette:
 * /mern/clsoures → Scope & Closures, /skillpack/raect → React. Results from the section the
 * link pointed into come first.
 */
function guessesFor(pathname: string): Item[] {
  let parts: string[];
  try {
    parts = decodeURIComponent(pathname).split('/').filter(Boolean);
  } catch {
    parts = pathname.split('/').filter(Boolean);
  }
  const words = (parts[parts.length - 1] ?? '').replace(/[-_.+]+/g, ' ').trim();
  if (words.length < 3) return [];
  const wanted = kindOfSection(parts);
  const sections = searchSections(staticEntries(), parseQuery(words), ['lesson', 'page', 'gate', 'tool', 'notebook', 'snippet'], (item) =>
    item.kind === wanted ? 150 : 0,
  );
  return sections
    .flatMap((s) => s.rows)
    .filter((r) => r.item.href)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.item);
}

export function NotFound() {
  const { open } = useSearch();
  const { pathname } = useLocation();
  const guesses = useMemo(() => guessesFor(pathname), [pathname]);
  return (
    <main className="wrap notfound">
      <span className="notfound-code mono">404</span>
      <h1 className="page-title">This page didn’t make the round trip.</h1>
      <p className="page-lede">
        {guesses.length
          ? 'The link may be old or mistyped. One of these is probably what you were after:'
          : 'The link may be old, or the lesson hasn’t been written yet. Search for it, or head back home.'}
      </p>
      {guesses.length > 0 && (
        <ul className="notfound-guesses">
          {guesses.map((g) => {
            const Icon = g.icon;
            return (
              <li key={g.key}>
                <Link to={g.href!} className="notfound-guess spot" data-tone={g.tone}>
                  <span className="notfound-guess-ico" aria-hidden>
                    {g.brand ? <SkillIcon name={g.brand} size={20} /> : <Icon size={17} />}
                  </span>
                  <span className="notfound-guess-text">
                    <strong>{g.title}</strong>
                    {g.sub && <span>{g.sub}</span>}
                  </span>
                  <ArrowRight size={16} className="notfound-guess-go" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className="page-actions">
        <Link to="/" className="btn btn--primary">
          Back home <ArrowRight size={15} />
        </Link>
        <button className="btn" onClick={open}>
          <Search size={15} /> Search
        </button>
      </div>
    </main>
  );
}
