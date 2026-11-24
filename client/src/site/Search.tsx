/**
 * The command palette: one box to search and jump anywhere (/ or Ctrl/⌘ K).
 *
 * It finds lessons, pages and topics, gates, glossary terms, common errors (straight to the lesson
 * step that explains them), Techpack snippets, Skill Pack tools and notebooks, and it runs commands
 * (theme, mentor, surprise me…). Matching forgives typos and abbreviations and highlights what
 * matched; a preview pane shows the selected result in full. With nothing typed it offers what to
 * do next and what you opened lately. ">" limits it to commands, "#" to glossary terms, and when
 * nothing fits, the question can go to the AI mentor.
 */
import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router';
import { LayoutGroup, motion } from 'motion/react';
import { Check, Clock, CornerDownLeft, Keyboard, Link2, Moon, Play, Repeat, Search as SearchIcon, Shuffle, Sparkles, Sun, X } from 'lucide-react';
import { COURSES, lessonEntries, loadLesson, peekLesson } from '@/content/registry';
import type { Course, Lesson } from '@/engine/types';
import { CodeLines } from '@/lib/highlight';
import { MENTOR_NAME, openMentor, openMentorWith } from '@/lib/mentor';
import { useDueReviews, useProgress, useSettings } from '@/lib/progress';
import { setTheme, useTheme } from '@/lib/theme';
import { toast } from '@/lib/toast';
import { continueTarget, hasStarted } from './learner';
import { prefetchLessonPage } from './prefetch';
import { MOD_KEY, openShortcuts } from './Hotkeys';
import { SkillIcon } from './skillpack/icons';
import { Glide, Ring } from './ui';
import { staticEntries, type Entry, type Item, type Kind } from './palette/items';
import { parseQuery, prepare, segments } from './palette/match';
import { searchSections, type Row, type Section } from './palette/sections';
import { loadRecent, pushRecent } from './palette/recent';

/* ---------------- context + global shortcut ---------------- */

interface SearchApi {
  /** Open the palette. Safe to pass straight to onClick. */
  open: () => void;
  /** Open it with a query already typed, e.g. ">" for commands. */
  openWith: (query: string) => void;
}

const SearchCtx = createContext<SearchApi>({ open: () => {}, openWith: () => {} });
export const useSearch = () => useContext(SearchCtx);

const typingIn = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest('input, textarea, select, [contenteditable]');

export function SearchProvider({ children }: { children: ReactNode }) {
  // `n` gives every opening a fresh palette (query, selection, highlight animation)
  const [state, setState] = useState({ open: false, query: '', n: 0 });
  const openWith = useCallback((query: string) => setState((s) => ({ open: true, query, n: s.n + 1 })), []);
  const open = useCallback(() => openWith(''), [openWith]);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setState((s) => (s.open ? { ...s, open: false } : { open: true, query: '', n: s.n + 1 }));
      } else if (e.key === '/' && !typingIn(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        openWith('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openWith]);

  const api = useMemo(() => ({ open, openWith }), [open, openWith]);
  return (
    <SearchCtx.Provider value={api}>
      {children}
      {state.open && createPortal(<CommandPalette key={state.n} id={state.n} initial={state.query} close={close} />, document.body)}
    </SearchCtx.Provider>
  );
}

/* ---------------- helpers ---------------- */

const LEVEL: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

/** A lesson's content for the preview, loaded only if the row stays selected for a moment. */
function useLessonSoon(course: Course | undefined, lessonId: string | undefined): Lesson | undefined {
  const [lesson, setLesson] = useState<Lesson | undefined>(() => (course && lessonId ? peekLesson(course, lessonId) : undefined));
  useEffect(() => {
    if (!course || !lessonId) return;
    const cached = peekLesson(course, lessonId);
    if (cached) {
      setLesson(cached);
      return;
    }
    let live = true;
    const t = setTimeout(() => {
      loadLesson(course, lessonId)
        .then((l) => live && setLesson(l))
        .catch(() => {}); // the preview just keeps the catalog details
    }, 140);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [course, lessonId]);
  return lesson?.id === lessonId ? lesson : undefined;
}

const row = (item: Item): Row => ({ item, hl: [], score: 0 });

/* ---------------- the palette ---------------- */

function CommandPalette({ id, initial, close }: { id: number; initial: string; close: () => void }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const progress = useProgress();
  const settings = useSettings();
  const due = useDueReviews().length;
  const [theme] = useTheme();
  const [q, setQ] = useState(initial);
  const [sel, setSel] = useState(0);
  const [recent] = useState(loadRecent);
  const listRef = useRef<HTMLDivElement>(null);
  const course = COURSES[0];
  const statics = useMemo(staticEntries, []);
  const started = hasStarted(progress);

  // Focus goes back where it was. A layout effect, so a dialog this palette opens (the shortcut
  // sheet, the mentor) can still take focus after it.
  useLayoutEffect(() => {
    const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      if (prev?.isConnected) prev.focus({ preventScroll: true });
    };
  }, []);

  const lessonOf = useCallback((item: Item) => (item.lesson ? progress.lessons[`${item.lesson.course.id}/${item.lesson.entry.stub.id}`] : undefined), [progress]);

  /* ---- commands: they depend on the moment ---- */
  const commands = useMemo<Item[]>(() => {
    const out: Item[] = [];
    const t = continueTarget(progress);
    if (t && t.kind !== 'start' && t.lesson) {
      const resume = t.kind === 'resume';
      out.push({
        key: 'cmd:continue',
        kind: 'command',
        title: resume ? `Continue “${t.lesson.title}”` : `Start “${t.lesson.title}”`,
        sub: resume && t.total ? `Step ${t.step} of ${t.total} · ${t.part?.title ?? ''}` : `Up next · ${t.part?.num ?? ''} ${t.part?.title ?? ''}`,
        href: t.href,
        icon: Play,
        tone: t.part?.tone,
        go: 'c',
        hay: 'continue resume where i left off last lesson next',
        boost: 30,
        info: { eyebrow: resume ? 'Pick up where you left off' : 'Up next', body: t.lesson.summary },
        cta: resume ? `Resume at step ${t.step}` : 'Start the lesson',
      });
    }
    const other = theme === 'dark' ? 'light' : 'dark';
    out.push({
      key: 'cmd:theme',
      kind: 'command',
      title: `Switch to ${other} theme`,
      icon: other === 'dark' ? Moon : Sun,
      run: () => setTheme(other),
      hay: 'theme dark light mode appearance colour color night day',
      boost: 30,
      info: { eyebrow: 'Appearance', body: `The whole site, diagrams included, switches to the ${other} theme. Your choice is remembered in this browser.` },
      cta: `Switch to ${other}`,
    });
    if (!settings.noAiMode)
      out.push({
        key: 'cmd:mentor',
        kind: 'command',
        title: `Ask ${MENTOR_NAME}, your AI mentor`,
        icon: Sparkles,
        tone: 'ai',
        keys: [MOD_KEY, 'J'],
        run: openMentor,
        hay: 'ai mentor tutor help chat assistant question ask explain',
        boost: 30,
        info: { eyebrow: 'AI mentor', body: `${MENTOR_NAME} sees your progress and the page you are on, so the help is specific: what to do next, a simpler explanation, a quick quiz.` },
        cta: `Open ${MENTOR_NAME}`,
      });
    if (due)
      out.push({
        key: 'cmd:review',
        kind: 'command',
        title: `Review ${due} due ${due === 1 ? 'card' : 'cards'}`,
        icon: Repeat,
        tone: 'auth',
        href: '/review',
        hay: 'review due cards spaced repetition revise',
        boost: 30,
        info: { eyebrow: 'Spaced review', body: 'A two-minute review keeps what you learned from fading.' },
        cta: 'Start reviewing',
      });
    out.push({
      key: 'cmd:surprise',
      kind: 'command',
      title: 'Surprise me',
      sub: 'Open a random lesson you haven’t finished',
      icon: Shuffle,
      run: () => {
        if (!course) return;
        const all = lessonEntries(course).filter((e) => e.meta);
        const state = (id: string) => progress.lessons[`${course.id}/${id}`];
        const fresh = all.filter((e) => !state(e.stub.id));
        const open = all.filter((e) => !state(e.stub.id)?.done);
        const pool = fresh.length ? fresh : open.length ? open : all;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        if (pick) navigate(`/${course.id}/${pick.stub.id}`);
      },
      hay: 'random surprise shuffle lucky any lesson explore',
      boost: 30,
      info: { eyebrow: 'Explore', body: 'Opens a lesson you haven’t touched yet, picked at random: a quick way to find something new.' },
      cta: 'Open a random lesson',
    });
    out.push({
      key: 'cmd:keys',
      kind: 'command',
      title: 'Keyboard shortcuts',
      icon: Keyboard,
      keys: ['?'],
      run: openShortcuts,
      hay: 'keyboard shortcuts keys hotkeys help cheat sheet',
      boost: 30,
      info: { eyebrow: 'Help', body: 'Every shortcut on one sheet: step through lessons with the arrows, jump between pages with G, search with /.' },
      cta: 'Show the shortcuts',
    });
    const onLessonStep = COURSES.some((c) => c.lessons[pathname.split('/')[2]] && pathname.startsWith(`/${c.id}/`)) && /[?&]s=\d/.test(search);
    out.push({
      key: 'cmd:copy',
      kind: 'command',
      title: onLessonStep ? 'Copy a link to this step' : 'Copy a link to this page',
      icon: Link2,
      run: () => {
        const ok = () => toast(onLessonStep ? 'Link to this step copied' : 'Link copied', 'link');
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(window.location.href).then(ok, () => toast('Couldn’t copy the link', 'info'));
        else toast('Copying isn’t available in this browser', 'info');
      },
      hay: 'copy link url share address send',
      boost: 30,
      info: { eyebrow: 'Share', body: onLessonStep ? 'The link opens this lesson at this exact step.' : 'Copies the address of this page.' },
      cta: 'Copy the link',
    });
    return out;
  }, [progress, theme, settings.noAiMode, due, pathname, search, course, navigate]);

  const commandEntries = useMemo<Entry[]>(() => commands.map((item) => ({ item, p: prepare(item.title, item.hay) })), [commands]);
  const byKey = useMemo(() => new Map([...statics, ...commandEntries].map((e) => [e.item.key, e.item])), [statics, commandEntries]);

  /* ---- the query ---- */
  const mode: Kind | null = q.startsWith('>') ? 'command' : q.startsWith('#') ? 'term' : null;
  const text = mode ? q.slice(1) : q;
  const query = useMemo(() => parseQuery(text), [text]);

  const sections = useMemo<Section[]>(() => {
    if (!query.q) {
      if (mode === 'command') return [{ id: 'cmds', label: 'Commands', rows: commands.map(row) }];
      if (mode === 'term') return [];
      // nothing typed: the next thing to do, what you opened lately, what comes next, commands
      const out: Section[] = [];
      const used = new Set<string>();
      const cont = commands.find((c) => c.key === 'cmd:continue');
      if (cont) {
        out.push({ id: 'jump', label: 'Jump back in', rows: [row(cont)] });
        used.add(cont.key);
        const t = continueTarget(progress);
        if (t?.lesson) used.add(`lesson:${t.course.id}/${t.lesson.id}`);
      }
      const rec = recent
        .map((k) => byKey.get(k))
        .filter((it): it is Item => !!it && !used.has(it.key))
        .slice(0, 4);
      rec.forEach((it) => used.add(it.key));
      if (rec.length) out.push({ id: 'recent', label: 'Recent', rows: rec.map(row) });
      // the unfinished lessons that follow the one you were on
      const lessons = statics.filter((e) => e.item.kind === 'lesson').map((e) => e.item);
      const from = Math.max(0, lessons.findIndex((it) => it.key === `lesson:${progress.last ?? ''}`));
      const next = [...lessons.slice(from), ...lessons.slice(0, from)].filter((it) => !used.has(it.key) && !lessonOf(it)?.done).slice(0, started ? 3 : 2);
      const startPage = started ? undefined : byKey.get('page:start');
      const up = [...(startPage ? [startPage] : []), ...next];
      if (up.length) out.push({ id: 'next', label: started ? 'Up next' : 'Start here', rows: up.map(row) });
      out.push({ id: 'cmds', label: 'Commands', rows: commands.filter((c) => !used.has(c.key)).slice(0, 5).map(row) });
      return out;
    }
    const adjust = (item: Item) => {
      const st = lessonOf(item);
      return st ? (st.done ? -4 : 12) : 0;
    };
    let found = searchSections([...commandEntries, ...statics], query, mode ? [mode] : undefined, adjust);
    // "Continue X" next to the lesson X says the same thing twice: the lesson row resumes too
    const t = continueTarget(progress);
    const resumeKey = t?.lesson ? `lesson:${t.course.id}/${t.lesson.id}` : '';
    if (resumeKey && found.some((s) => s.rows.some((r) => r.item.key === resumeKey)))
      found = found.map((s) => ({ ...s, rows: s.rows.filter((r) => r.item.key !== 'cmd:continue') })).filter((s) => s.rows.length);
    if (!settings.noAiMode && mode !== 'term' && query.q.length >= 2) {
      const question = text.trim();
      found.push({
        id: 'ask',
        label: 'Ask the mentor',
        rows: [
          row({
            key: 'ask',
            kind: 'ask',
            title: `Ask ${MENTOR_NAME}: “${question}”`,
            icon: Sparkles,
            tone: 'ai',
            run: () => openMentorWith(question),
            boost: 0,
            info: { eyebrow: 'AI mentor', body: `${MENTOR_NAME} knows your progress and the page you are on. Your question opens in the mentor, ready to send or edit.` },
            cta: `Ask ${MENTOR_NAME}`,
          }),
        ],
      });
    }
    return found;
  }, [query, mode, text, commands, commandEntries, statics, recent, byKey, progress, lessonOf, started, settings.noAiMode]);

  const flat = useMemo(() => sections.flatMap((s) => s.rows), [sections]);
  const at = Math.min(sel, Math.max(0, flat.length - 1));
  const cur = flat[at];
  const nothing = !!query.q && !sections.some((s) => s.id !== 'ask');

  // keep the selection in view; warm up a lesson that stays selected
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${at}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [at, sections]);
  useEffect(() => {
    const l = cur?.item.lesson;
    if (!l) return;
    const t = setTimeout(() => prefetchLessonPage(l.course, l.entry.stub.id), 160);
    return () => clearTimeout(t);
  }, [cur]);

  /* ---- what Enter does ---- */
  const hrefOf = (item: Item) => {
    if (!item.lesson) return item.href;
    const { course: c, entry } = item.lesson;
    const st = lessonOf(item);
    return st && !st.done && st.step > 0 ? `/${c.id}/${entry.stub.id}?s=${st.step}` : `/${c.id}/${entry.stub.id}`;
  };
  const ctaOf = (item: Item) => {
    if (!item.lesson) return item.cta ?? 'Open';
    const st = lessonOf(item);
    return st?.done ? 'Open the lesson again' : st && st.step > 0 ? `Resume at step ${st.step}` : 'Start the lesson';
  };
  const activate = (item: Item | undefined, newTab = false) => {
    if (!item) return;
    const href = hrefOf(item);
    if (item.kind !== 'ask') pushRecent(item.key);
    if (newTab && href) {
      window.open(href, '_blank', 'noopener');
      return;
    }
    close();
    if (item.run) item.run();
    else if (href) navigate(href);
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    e.stopPropagation(); // keep the page's own shortcuts out of it (the lesson player steps on arrows)
    const n = flat.length;
    const mod = e.metaKey || e.ctrlKey;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      if (n) setSel((at + 1) % n);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      if (n) setSel((at - 1 + n) % n);
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      setSel(Math.min(n - 1, at + 6));
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      setSel(Math.max(0, at - 6));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      activate(cur?.item, mod);
    } else if (e.key === 'Escape' || (mod && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      close();
    } else if (mod && e.key.toLowerCase() === 'j' && !settings.noAiMode) {
      e.preventDefault();
      close();
      openMentor();
    }
  };

  /* ---- a row's right-hand side: progress, shortcut ---- */
  const endOf = (item: Item): ReactNode => {
    const st = lessonOf(item);
    if (st?.done) return <Check size={15} strokeWidth={2.6} className="cmdk-done" aria-label="completed" />;
    if (st && st.total)
      return (
        <span className="cmdk-prog" aria-label={`step ${st.step} of ${st.total}`}>
          <Ring pct={st.step / st.total} size={16} stroke={2.4} />
          {st.step}/{st.total}
        </span>
      );
    if (item.go)
      return (
        <span className="cmdk-keys">
          <kbd>G</kbd>
          <kbd>{item.go.toUpperCase()}</kbd>
        </span>
      );
    if (item.keys)
      return (
        <span className="cmdk-keys">
          {item.keys.map((k) => (
            <kbd key={k}>{k}</kbd>
          ))}
        </span>
      );
    return null;
  };
  const subOf = (item: Item) => {
    const st = lessonOf(item);
    return st && !st.done && st.total ? `Step ${st.step} of ${st.total} · ${item.sub}` : item.sub;
  };

  let i = -1;
  return (
    <div className="cmdk-wrap" onMouseDown={close}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Search and commands" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="cmdk-head">
          <SearchIcon size={18} aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            placeholder="Search lessons, terms, errors, tools…  or type > for commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
            aria-autocomplete="list"
            aria-activedescendant={cur ? `cmdk-o-${at}` : undefined}
            aria-label="Search or run a command"
            spellCheck={false}
            autoComplete="off"
            enterKeyHint="go"
          />
          {mode && <span className="cmdk-mode">{mode === 'command' ? 'Commands' : 'Glossary'}</span>}
          <button type="button" className="cmdk-close" onClick={close} aria-label="Close">
            <kbd>Esc</kbd>
            <X size={18} />
          </button>
        </div>

        <div className="cmdk-body">
          <LayoutGroup id={`cmdk-${id}`}>
            <motion.div className="cmdk-list" id="cmdk-list" role="listbox" aria-label="Results" ref={listRef} layoutScroll>
              {nothing && (
                <div className="cmdk-empty">
                  <strong>Nothing matches “{text.trim()}”</strong>
                  <span>Try fewer letters or another word{settings.noAiMode ? '.' : `, or ask ${MENTOR_NAME} below.`}</span>
                </div>
              )}
              {mode === 'term' && !query.q && (
                <div className="cmdk-empty">
                  <strong>Search the glossary</strong>
                  <span>Type a term after the #, like “# closure”.</span>
                </div>
              )}
              {sections.map((s) => (
                <div key={s.id} className="cmdk-group" role="group" aria-labelledby={`cmdk-g-${s.id}`}>
                  <div className="cmdk-group-label" id={`cmdk-g-${s.id}`}>
                    {s.label}
                  </div>
                  {s.rows.map((r) => {
                    i += 1;
                    const n = i;
                    const { item } = r;
                    const Icon = item.icon;
                    const selected = n === at;
                    const sub = subOf(item);
                    return (
                      <div
                        key={`${s.id}:${item.key}`}
                        id={`cmdk-o-${n}`}
                        data-i={n}
                        role="option"
                        aria-selected={selected}
                        className="cmdk-item"
                        data-kind={item.kind}
                        data-tone={item.tone}
                        data-brand={item.brand ? '' : undefined}
                        onMouseMove={() => !selected && setSel(n)}
                        onClick={(e) => activate(item, e.metaKey || e.ctrlKey)}
                      >
                        {selected && <Glide id="cmdk-sel" className="cmdk-sel" />}
                        <span className="cmdk-ico" aria-hidden>
                          {item.brand ? <SkillIcon name={item.brand} size={18} /> : <Icon size={16} strokeWidth={2.1} />}
                        </span>
                        <span className="cmdk-text">
                          <span className="cmdk-title">
                            {segments(item.title, r.hl).map((seg, k) => (seg.hit ? <mark key={k}>{seg.text}</mark> : <Fragment key={k}>{seg.text}</Fragment>))}
                          </span>
                          {sub && <span className="cmdk-sub">{sub}</span>}
                        </span>
                        <span className="cmdk-end">
                          {endOf(item)}
                          <CornerDownLeft size={14} className="cmdk-enter" aria-hidden />
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </LayoutGroup>

          <aside className="cmdk-preview" aria-label="Preview">
            {cur && (
              <>
                <div className="cmdk-pv-scroll">{cur.item.lesson ? <LessonPreview item={cur.item} key={cur.item.key} /> : <InfoPreview item={cur.item} key={cur.item.key} />}</div>
                <div className="cmdk-pv-cta">
                  <kbd>↵</kbd>
                  <span>{ctaOf(cur.item)}</span>
                  {hrefOf(cur.item) && <span className="cmdk-pv-href">{hrefOf(cur.item)}</span>}
                </div>
              </>
            )}
          </aside>
        </div>

        <div className="cmdk-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> move
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span className="cmdk-foot-tab">
            <kbd>{MOD_KEY}</kbd>
            <kbd>↵</kbd> new tab
          </span>
          <span className="cmdk-foot-modes">
            <kbd>&gt;</kbd> commands <kbd>#</kbd> glossary
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- preview pane ---------------- */

function LessonPreview({ item }: { item: Item }) {
  const { course, entry } = item.lesson!;
  const meta = entry.meta!;
  const progress = useProgress();
  const lesson = useLessonSoon(course, meta.id);
  const st = progress.lessons[`${course.id}/${meta.id}`];
  const step = st && !st.done ? st.step : 0;
  const total = lesson?.steps.length ?? st?.total;
  return (
    <div className="cmdk-pv" data-tone={entry.part.tone}>
      <span className="cmdk-pv-eyebrow">
        <i aria-hidden /> Part {entry.part.num} · {entry.part.title}
      </span>
      <h3>{meta.title}</h3>
      <p>{meta.summary}</p>
      <div className="cmdk-pv-pills">
        <span className="pill">
          <Clock size={12} /> {meta.minutes} min
        </span>
        <span className="pill">{LEVEL[meta.level] ?? meta.level}</span>
        {total ? <span className="pill">{total} steps</span> : null}
        {meta.interactive && (
          <span className="pill" data-tone="ok">
            Try it
          </span>
        )}
      </div>
      {lesson && (
        <div className="cmdk-pv-progress">
          <ol className="cmdk-pv-steps" aria-hidden>
            {lesson.steps.map((s, n) => (
              <li key={n} data-beat={s.beat} data-state={st?.done || n + 1 < step ? 'done' : n + 1 === step ? 'current' : undefined} />
            ))}
          </ol>
          <span>{st?.done ? 'Completed' : step ? `Step ${step} of ${lesson.steps.length} · ${lesson.steps[step - 1]?.short ?? ''}` : 'Not started yet'}</span>
        </div>
      )}
      {lesson && lesson.goals.length > 0 && (
        <div className="cmdk-pv-goals">
          <span className="eyebrow">What you’ll learn</span>
          <ul>
            {lesson.goals.slice(0, 4).map((g) => (
              <li key={g.step}>{g.text}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InfoPreview({ item }: { item: Item }) {
  const info = item.info ?? {};
  const Icon = item.icon;
  return (
    <div className="cmdk-pv" data-tone={item.tone}>
      {info.eyebrow && (
        <span className="cmdk-pv-eyebrow">
          <i aria-hidden /> {info.eyebrow}
        </span>
      )}
      {info.mono ? (
        <pre className="cmdk-pv-mono">{info.mono}</pre>
      ) : (
        <div className="cmdk-pv-head">
          <span className="cmdk-pv-icon" aria-hidden>
            {item.brand ? <SkillIcon name={item.brand} size={26} /> : <Icon size={20} />}
          </span>
          <h3>{item.title}</h3>
        </div>
      )}
      {info.body && <p>{info.body}</p>}
      {info.rows?.map((r) => (
        <div key={r.label} className="cmdk-pv-row">
          <span className="eyebrow">{r.label}</span>
          <p>{r.text}</p>
        </div>
      ))}
      {info.code && (
        <>
          <pre className="cmdk-pv-code">
            <CodeLines code={info.code.text} lang={info.code.lang ?? 'js'} numbers={false} />
          </pre>
          {info.code.note && <p className="cmdk-pv-note">{info.code.note}</p>}
        </>
      )}
    </div>
  );
}
