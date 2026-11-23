import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { BookOpen, Check, CornerDownLeft, Search as SearchIcon, Text } from 'lucide-react';
import { COURSES, lessonEntries } from '@/content/registry';
import { useProgress } from '@/lib/progress';
import { prefetchLessonPage } from './prefetch';

/* ---------------- index: every lesson (catalog only) and glossary term ---------------- */
interface Hit {
  kind: 'lesson' | 'term';
  key: string;
  title: string;
  sub: string;
  href: string;
  courseId: string;
  lessonId?: string;
  hay: string; // lowercase text searched
}

function buildIndex(): Hit[] {
  const out: Hit[] = [];
  for (const c of COURSES) {
    for (const e of lessonEntries(c)) {
      if (!e.meta) continue;
      out.push({
        kind: 'lesson',
        key: `${c.id}/${e.meta.id}`,
        title: e.meta.title,
        sub: `${e.part.num} · ${e.part.title} · ${e.meta.minutes} min`,
        href: `/${c.id}/${e.meta.id}`,
        courseId: c.id,
        lessonId: e.meta.id,
        hay: `${e.meta.title} ${e.meta.summary} ${e.part.title}`.toLowerCase(),
      });
    }
    for (const [k, g] of Object.entries(c.glossary)) {
      out.push({ kind: 'term', key: `${c.id}#${k}`, title: g.term, sub: g.def, href: `/${c.id}/glossary#${k}`, courseId: c.id, hay: `${g.term} ${g.def}`.toLowerCase() });
    }
  }
  return out;
}

/** Every word must appear; titles that start with / contain the query rank first. */
function search(index: Hit[], q: string): Hit[] {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const scored: [number, Hit][] = [];
  for (const h of index) {
    if (!words.every((w) => h.hay.includes(w))) continue;
    const t = h.title.toLowerCase();
    let s = h.kind === 'lesson' ? 10 : 0;
    if (t.startsWith(words[0])) s += 30;
    else if (words.every((w) => t.includes(w))) s += 20;
    scored.push([s, h]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, 12).map(([, h]) => h);
}

/* ---------------- context + global shortcut ---------------- */
const SearchCtx = createContext<{ open: () => void }>({ open: () => {} });
export const useSearch = () => useContext(SearchCtx);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest('input, textarea, select, [contenteditable]');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <SearchCtx.Provider value={{ open }}>
      {children}
      {isOpen && createPortal(<SearchDialog close={() => setOpen(false)} />, document.body)}
    </SearchCtx.Provider>
  );
}

/* ---------------- the dialog ---------------- */
function SearchDialog({ close }: { close: () => void }) {
  const index = useMemo(buildIndex, []);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const navigate = useNavigate();
  const progress = useProgress();
  const listRef = useRef<HTMLUListElement>(null);

  const hits = useMemo(() => {
    if (q.trim()) return search(index, q);
    // nothing typed yet: continue where you left off, then the next unfinished lessons
    const lessons = index.filter((h) => h.kind === 'lesson');
    const last = lessons.find((h) => h.key === progress.last);
    const next = lessons.filter((h) => !progress.lessons[h.key]?.done && h !== last).slice(0, 5);
    return last ? [last, ...next] : next;
  }, [q, index, progress]);

  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`)?.scrollIntoView({ block: 'nearest' });
    const h = hits[sel];
    if (h?.lessonId) {
      const course = COURSES.find((c) => c.id === h.courseId);
      if (course) prefetchLessonPage(course, h.lessonId);
    }
  }, [sel, hits]);

  const go = (h: Hit | undefined) => {
    if (!h) return;
    close();
    navigate(h.href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // keep the lesson player's shortcuts out of it
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(hits.length - 1, s + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(hits[sel]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  return (
    <div className="search-wrap" onMouseDown={close}>
      <div className="search" role="dialog" aria-modal="true" aria-label="Search lessons and terms" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <label className="search-field">
          <SearchIcon size={18} aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search lessons and terms — try “cors”, “index”, “closure”"
            aria-label="Search"
            aria-controls="search-results"
            aria-activedescendant={hits[sel] ? `sr-${sel}` : undefined}
          />
          <kbd>Esc</kbd>
        </label>
        <ul className="search-results" id="search-results" role="listbox" ref={listRef}>
          {!q.trim() && hits.length > 0 && <li className="search-group">{progress.last ? 'Continue' : 'Start here'}</li>}
          {hits.map((h, i) => {
            const done = h.kind === 'lesson' && progress.lessons[h.key]?.done;
            return (
              <li key={h.key} id={`sr-${i}`} role="option" aria-selected={i === sel} data-i={i} className="search-hit" data-kind={h.kind} onMouseMove={() => setSel(i)} onClick={() => go(h)}>
                <span className="search-icon">{h.kind === 'lesson' ? <BookOpen size={16} /> : <Text size={16} />}</span>
                <span className="search-text">
                  <span className="search-title">{h.title}</span>
                  <span className="search-sub">{h.kind === 'lesson' ? h.sub : `Glossary · ${h.sub}`}</span>
                </span>
                {done && <Check size={15} className="search-done" aria-label="completed" />}
                {i === sel && <CornerDownLeft size={14} className="search-enter" aria-hidden />}
              </li>
            );
          })}
          {q.trim() && hits.length === 0 && <li className="search-empty">Nothing matches “{q}”.</li>}
        </ul>
        <div className="search-foot">
          <span><kbd>↑</kbd> <kbd>↓</kbd> move</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>/</kbd> or <kbd>⌘K</kbd> anywhere</span>
        </div>
      </div>
    </div>
  );
}
