import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Check, Copy, GitBranch, Lock, Search } from 'lucide-react';
import { SkillIcon } from './skillpack/icons';
import { TECH_SHEETS, type TechEntry, type TechSheet } from './techpack/data';
import { CodeLines } from '@/lib/highlight';
import { COURSES } from '@/content/registry';
import './techpack.css';
import { PageHead } from './ui';

const course = COURSES[0];
const pad = (n: number) => String(n).padStart(2, '0');

function SheetIcon({ name }: { name: string }) {
  if (name === 'git') return <GitBranch size={26} strokeWidth={2.2} />;
  if (name === 'lock') return <Lock size={26} strokeWidth={2.2} />;
  return <SkillIcon name={name} />;
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1400);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <button
      type="button"
      className="tp-copy"
      data-done={done || undefined}
      aria-label={done ? 'Copied' : 'Copy snippet'}
      onClick={() => navigator.clipboard?.writeText(text).then(() => setDone(true), () => {})}
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
      <span>{done ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

function Entry({ e }: { e: TechEntry }) {
  const lessonTitle = e.lesson && course?.lessons[e.lesson]?.title;
  return (
    <li className="tp-card">
      <div className="tp-card-head">
        <h4>{e.title}</h4>
        <CopyButton text={e.code} />
      </div>
      <pre className="tp-code">
        <CodeLines code={e.code} lang={e.lang ?? 'js'} numbers={false} />
      </pre>
      {e.note && <p className="tp-note">{e.note}</p>}
      {lessonTitle && (
        <Link className="tp-lesson" to={`/${course.id}/${e.lesson}`}>
          Unpacked in “{lessonTitle}” <ArrowRight size={13} />
        </Link>
      )}
    </li>
  );
}

const matches = (e: TechEntry, q: string) =>
  e.title.toLowerCase().includes(q) || e.code.toLowerCase().includes(q) || (e.note ?? '').toLowerCase().includes(q);

export function TechpackPage() {
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = 'Techpack — Unpacked';
  }, []);

  const q = query.trim().toLowerCase();
  const sheets = useMemo<TechSheet[]>(() => {
    if (!q) return TECH_SHEETS;
    return TECH_SHEETS.map((s) => ({
      ...s,
      sections: s.sections
        .map((sec) => ({ ...sec, entries: sec.entries.filter((e) => matches(e, q) || s.name.toLowerCase().includes(q)) }))
        .filter((sec) => sec.entries.length),
    })).filter((s) => s.sections.length);
  }, [q]);

  const total = TECH_SHEETS.reduce((n, s) => n + s.sections.reduce((m, sec) => m + sec.entries.length, 0), 0);

  return (
    <>
      <main className="tp-page">
        <section className="tp-hero wrap">
          <PageHead
            eyebrow="Library · Cheat sheets"
            title="Techpack"
            lede={`The snippets you reach for every day, one sheet per technology: ${TECH_SHEETS.length} sheets, ${total} snippets. Copy one, or follow its link to the lesson that explains why it works.`}
          />

          <div className="tp-bar">
            <nav className="tp-jump" aria-label="Techpack sheets">
              {TECH_SHEETS.map((s) => (
                <a key={s.id} href={`#tp-${s.id}`} className={`tp-chip tp-${s.accent}`}>
                  <span className="tp-chip-ico">
                    <SheetIcon name={s.icon} />
                  </span>
                  {s.name}
                </a>
              ))}
            </nav>
            <label className="tp-search">
              <Search size={16} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search snippets… e.g. populate, useEffect, 401"
                aria-label="Search snippets"
              />
            </label>
          </div>
        </section>

        {sheets.length === 0 && (
          <p className="wrap tp-empty">
            Nothing matches “{query}”. Try a shorter word, or <button onClick={() => setQuery('')}>clear the search</button>.
          </p>
        )}

        {sheets.map((s, si) => (
          <section key={s.id} id={`tp-${s.id}`} className={`tp-sheet wrap tp-${s.accent}`}>
            <header className="tp-sheet-head">
              <span className="tp-sheet-ico">
                <SheetIcon name={s.icon} />
              </span>
              <div>
                <h2>{s.name}</h2>
                <p className="muted">{s.tagline}</p>
              </div>
              <span className="tp-sheet-n">{pad(si + 1)}</span>
            </header>

            {s.sections.map((sec) => (
              <div key={sec.title} className="tp-section">
                <h3>{sec.title}</h3>
                <ul className="tp-grid">
                  {sec.entries.map((e) => (
                    <Entry key={e.title} e={e} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </main>
    </>
  );
}
