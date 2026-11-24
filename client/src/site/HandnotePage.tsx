import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Download, Pin, PinOff, Plus, Search, Trash2 } from 'lucide-react';
import { COURSES } from '@/content/registry';
import {
  NOTE_COLORS,
  createNote,
  deleteNote,
  isEmptyNote,
  notesToMarkdown,
  updateNote,
  useHandnotes,
  type Handnote,
  type NoteColor,
} from '@/lib/handnotes';
import './handnote.css';

/** Written lessons, grouped by part, for the "about lesson" picker. */
const LESSON_GROUPS = COURSES.flatMap((c) =>
  c.parts
    .map((p) => ({
      label: `${c.short} · ${p.title}`,
      lessons: p.lessons.filter((l) => c.lessons[l.id]).map((l) => ({ key: `${c.id}/${l.id}`, title: l.title })),
    }))
    .filter((g) => g.lessons.length),
);
const LESSON_TITLES = new Map(LESSON_GROUPS.flatMap((g) => g.lessons.map((l) => [l.key, l.title] as const)));

const COLOR_LABEL: Record<NoteColor, string> = { yellow: 'Yellow', blue: 'Blue', green: 'Green', pink: 'Pink', purple: 'Purple' };

function ago(ts: number) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

export function HandnotePage() {
  const notes = useHandnotes();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftColor, setDraftColor] = useState<NoteColor>('yellow');
  const [query, setQuery] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Handnote — Unpacked';
    // Tidy blanks left behind by leaving the page mid-"New note".
    notes.filter(isEmptyNote).forEach((n) => deleteNote(n.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = notes.find((n) => n.id === activeId) ?? null;

  // A note left empty is dropped when you move on, so "New note" never leaves blanks behind.
  const leave = () => {
    if (active && isEmptyNote(active)) deleteNote(active.id);
  };
  const open = (id: string | null) => {
    if (id === activeId) return;
    leave();
    setActiveId(id);
  };
  const startNew = () => {
    leave();
    setActiveId(null);
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  /** Edits to the draft create the note on the first keystroke. */
  const edit = (patch: Partial<Pick<Handnote, 'title' | 'body' | 'color' | 'lesson' | 'pinned'>>) => {
    if (active) return updateNote(active.id, patch);
    if (patch.color) return setDraftColor(patch.color);
    const n = createNote({ color: draftColor, ...patch });
    setActiveId(n.id);
  };

  const remove = () => {
    if (!active) return;
    if (!isEmptyNote(active) && !confirm(`Delete “${active.title || 'Untitled'}”? This can’t be undone.`)) return;
    deleteNote(active.id);
    setActiveId(null);
  };

  const q = query.trim().toLowerCase();
  const board = useMemo(
    () =>
      notes
        .filter((n) => !isEmptyNote(n) || n.id === activeId)
        .filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q) || (n.lesson && LESSON_TITLES.get(n.lesson)?.toLowerCase().includes(q)))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated - a.updated),
    [notes, q, activeId],
  );
  const saved = notes.filter((n) => !isEmptyNote(n));

  const color = active?.color ?? draftColor;
  const lessonKey = active?.lesson ?? '';
  const [lessonCourse, lessonId] = lessonKey.split('/');

  return (
    <>
      <main className="hn-page wrap">
        <header className="hn-head">
          <span className="eyebrow">You · Handnote</span>
          <h1 className="page-title">My notes</h1>
          <p className="hn-lede">
            Write each idea in your own words — that’s where it sticks. Notes save as you type and stay in this browser.
          </p>
          <div className="hn-actions">
            <button className="btn btn--primary" onClick={startNew}>
              <Plus size={18} /> New note
            </button>
            <button
              className="btn"
              disabled={!saved.length}
              onClick={() => download('handnotes.md', notesToMarkdown(saved, (k) => LESSON_TITLES.get(k)))}
            >
              <Download size={17} /> Download .md
            </button>
          </div>
        </header>

        <div className="hn-layout">
          {/* ---------- notepad ---------- */}
          <section className={`hn-pad hn-${color}`} aria-label={active ? 'Edit note' : 'New note'}>
            <div className="hn-pad-top">
              <div className="hn-swatches" role="radiogroup" aria-label="Note colour">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c}
                    role="radio"
                    aria-checked={c === color}
                    aria-label={COLOR_LABEL[c]}
                    className={`hn-swatch hn-${c}`}
                    onClick={() => edit({ color: c })}
                  />
                ))}
              </div>
              <div className="hn-tools">
                <span className="hn-status">{active ? `Saved · ${ago(active.updated)}` : 'New note'}</span>
                <button
                  className="hn-icon-btn"
                  disabled={!active}
                  onClick={() => active && updateNote(active.id, { pinned: !active.pinned })}
                  aria-label={active?.pinned ? 'Unpin note' : 'Pin note'}
                  title={active?.pinned ? 'Unpin' : 'Pin to top'}
                >
                  {active?.pinned ? <PinOff size={17} /> : <Pin size={17} />}
                </button>
                <button className="hn-icon-btn hn-danger" disabled={!active} onClick={remove} aria-label="Delete note" title="Delete">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>

            <input
              ref={titleRef}
              className="hn-title"
              value={active?.title ?? ''}
              onChange={(e) => edit({ title: e.target.value })}
              placeholder="Title — e.g. Why useEffect runs twice"
              aria-label="Note title"
              maxLength={120}
            />
            <textarea
              className="hn-body"
              value={active?.body ?? ''}
              onChange={(e) => edit({ body: e.target.value })}
              placeholder={'Explain it like you would to a friend…\n\n• what problem it solves\n• how it works\n• a gotcha to remember'}
              aria-label="Note text"
            />

            <div className="hn-pad-foot">
              <label className="hn-lesson-pick">
                <span>About lesson</span>
                <select value={lessonKey} onChange={(e) => edit({ lesson: e.target.value || undefined })}>
                  <option value="">— none —</option>
                  {LESSON_GROUPS.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.lessons.map((l) => (
                        <option key={l.key} value={l.key}>
                          {l.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              {lessonId && (
                <Link className="hn-lesson-link" to={`/${lessonCourse}/${lessonId}`}>
                  Open lesson <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </section>

          {/* ---------- board ---------- */}
          <section className="hn-board" aria-label="Saved notes">
            <div className="hn-board-top">
              <h2>
                Pinboard <span className="hn-count">{saved.length}</span>
              </h2>
              {saved.length > 0 && (
                <label className="hn-search">
                  <Search size={15} />
                  <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" aria-label="Search notes" />
                </label>
              )}
            </div>

            {saved.length === 0 ? (
              <div className="hn-empty">
                <p>No notes yet.</p>
                <p className="muted">Start typing on the notepad — your first note pins itself here.</p>
              </div>
            ) : board.length === 0 ? (
              <div className="hn-empty">
                <p>Nothing matches “{query}”.</p>
              </div>
            ) : (
              <ul className="hn-grid">
                {board.map((n, i) => (
                  <li key={n.id}>
                    <button
                      className={`hn-sticky hn-${n.color}`}
                      data-active={n.id === activeId || undefined}
                      style={{ '--tilt': `${[-1.6, 1.1, -0.6, 1.5, -1.1][i % 5]}deg` } as React.CSSProperties}
                      onClick={() => open(n.id)}
                    >
                      {n.pinned && <Pin className="hn-pin" size={16} aria-label="Pinned" />}
                      <strong>{n.title.trim() || 'Untitled'}</strong>
                      {n.body.trim() && <span className="hn-sticky-body">{n.body}</span>}
                      <span className="hn-sticky-meta">
                        {n.lesson && LESSON_TITLES.get(n.lesson) && <span className="hn-tag">{LESSON_TITLES.get(n.lesson)}</span>}
                        <span>{ago(n.updated)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
