/**
 * Site-wide keyboard shortcuts.
 *  - "G then …": press G, then a letter, to jump to a page (G then D → Dashboard, G then C → your
 *    lesson). The letters match the `go` keys on the command palette's pages (palette/items.ts).
 *    Hesitate after G and a small panel lists the letters; fluent users never see it flash.
 *  - "?" opens the shortcut sheet on any page (the lesson player opens the same sheet itself).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { X } from 'lucide-react';
import { COURSES } from '@/content/registry';
import { useProgress, useSettings } from '@/lib/progress';
import { MENTOR_NAME } from '@/lib/mentor';
import { continueTarget } from './learner';

/** The platform's modifier key, for labels: ⌘ on Apple devices, Ctrl elsewhere. */
export const MOD_KEY = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? '⌘' : 'Ctrl';

/** How long the "G then …" chord waits for its second key. */
const ARMED_MS = 5000;
/** Show the letter panel only if the second key hasn't come by then. */
const HINT_AFTER_MS = 450;

/** letter → path */
function goTable(): Record<string, string> {
  const c = COURSES[0]?.id ?? 'mern';
  return {
    h: '/',
    s: '/start',
    b: '/manual',
    x: '/explore',
    i: '/build',
    p: '/path',
    d: '/me',
    r: `/${c}/roadmap`,
    v: '/review',
    n: '/handnote',
    l: '/library',
    m: `/${c}`,
    e: '/errors',
    a: '/about',
  };
}

const TABLE = goTable();
const BY_PATH = new Map(Object.entries(TABLE).map(([k, to]) => [to, k]));

/** The second key of the "G then …" shortcut for a path, if it has one. */
export const goHint = (to: string): string | undefined => BY_PATH.get(to);

/** Every "G then …" target, in the order the panel and the sheet list them. */
export const GO_LIST: { key: string; label: string }[] = [
  { key: 'c', label: 'Continue your lesson' },
  { key: 'h', label: 'Home' },
  { key: 'b', label: 'The Manual' },
  { key: 'x', label: 'Explore' },
  { key: 'i', label: 'Build' },
  { key: 'p', label: 'Path' },
  { key: 'd', label: 'Dashboard' },
  { key: 'r', label: 'Roadmap' },
  { key: 'v', label: 'Review' },
  { key: 'm', label: 'Course map' },
  { key: 'l', label: 'Library' },
  { key: 'n', label: 'My notes' },
  { key: 'e', label: 'Common errors' },
  { key: 's', label: 'Start Here' },
  { key: 'a', label: 'About & maker' },
];

/** Ask the shortcut sheet to open (the command palette uses this). */
export const SHORTCUTS_EVENT = 'unpacked:shortcuts';
export const openShortcuts = () => window.dispatchEvent(new Event(SHORTCUTS_EVENT));

const typingIn = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest('input, textarea, select, [contenteditable]');
const inLesson = () => !!document.querySelector('.player');

/** Listens for the shortcuts anywhere (lesson player included) and draws the letter panel and the sheet. */
export function Hotkeys() {
  const navigate = useNavigate();
  const progress = useProgress();
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const [hint, setHint] = useState(false);
  const [sheet, setSheet] = useState(false);
  const armed = useRef<{ at: number; hintTimer: number } | null>(null);

  const disarm = useCallback(() => {
    if (armed.current) clearTimeout(armed.current.hintTimer);
    armed.current = null;
    setHint(false);
  }, []);

  /** Go to the target of `key`; false when the key isn't one. */
  const go = useCallback(
    (key: string) => {
      const to = key === 'c' ? (continueTarget(progressRef.current)?.href ?? '/path') : TABLE[key];
      if (!to) return false;
      setSheet(false);
      navigate(to);
      return true;
    },
    [navigate],
  );

  useEffect(() => {
    // Capture phase: a chord's second key must not also reach the page (Esc would leave a lesson).
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typingIn(e.target)) {
        if (armed.current) disarm();
        return;
      }
      const key = e.key.toLowerCase();
      if (armed.current) {
        const live = Date.now() - armed.current.at < ARMED_MS;
        disarm();
        if (key === 'escape') {
          e.preventDefault();
          e.stopPropagation();
        } else if (live && go(key)) {
          e.preventDefault();
          e.stopPropagation();
        }
        return; // anything else just cancels the chord and does its usual job
      }
      if (key === 'g' && !e.shiftKey && !e.repeat) {
        armed.current = { at: Date.now(), hintTimer: window.setTimeout(() => setHint(true), HINT_AFTER_MS) };
        return;
      }
      if (e.key === '?' && !inLesson()) {
        e.preventDefault();
        setSheet((s) => !s);
      }
    };
    const onOpen = () => setSheet(true);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener(SHORTCUTS_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener(SHORTCUTS_EVENT, onOpen);
      disarm();
    };
  }, [go, disarm]);

  // the panel goes away on its own if nothing is pressed
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(disarm, ARMED_MS - HINT_AFTER_MS);
    return () => clearTimeout(t);
  }, [hint, disarm]);

  return (
    <>
      {hint && (
        <div className="gohint" role="note" aria-label="Go to: press a letter">
          <span className="gohint-title">
            <kbd>G</kbd> Go to…
          </span>
          <ul>
            {GO_LIST.map((g) => (
              <li key={g.key}>
                <button
                  // mousedown, so the panel doesn't lose the chord to a focus change first
                  onMouseDown={(e) => {
                    e.preventDefault();
                    disarm();
                    go(g.key);
                  }}
                >
                  <kbd>{g.key.toUpperCase()}</kbd>
                  <span>{g.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {sheet && <ShortcutSheet close={() => setSheet(false)} lesson={inLesson()} />}
    </>
  );
}

const LESSON_KEYS: [string[], string][] = [
  [['→'], 'Next step'],
  [['←'], 'Previous step'],
  [['Space'], 'Play / pause the traffic'],
  [['Home', 'End'], 'First / last step'],
  [['Esc'], 'Back to the course'],
];

/** Every shortcut on one sheet. In a lesson, the lesson's own keys come first. */
export function ShortcutSheet({ close, lesson = false }: { close: () => void; lesson?: boolean }) {
  const settings = useSettings();
  const anywhere: [string[], string][] = [
    [['/', 'or', MOD_KEY, 'K'], 'Search or jump anywhere'],
    ...(settings.noAiMode ? [] : ([[[MOD_KEY, 'J'], `Ask ${MENTOR_NAME}, your mentor`]] as [string[], string][])),
    [['?'], 'Show this sheet'],
  ];
  const rows = (list: [string[], string][]) => (
    <dl className="shortcuts">
      {list.map(([keys, what]) => (
        <div key={keys.join('+') + what}>
          <dt>
            {keys.map((k, i) =>
              k === 'or' ? (
                <span key={i} className="keysheet-or">
                  or
                </span>
              ) : (
                <kbd key={i}>{k}</kbd>
              ),
            )}
          </dt>
          <dd>{what}</dd>
        </div>
      ))}
    </dl>
  );
  return (
    <div className="modal-wrap" onClick={close}>
      <div
        className="modal keysheet"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            close();
          }
        }}
      >
        <div className="modal-head">
          <strong>Keyboard shortcuts</strong>
          <button className="btn btn--ghost btn--icon" onClick={close} aria-label="Close" autoFocus>
            <X size={16} />
          </button>
        </div>
        <div className="keysheet-cols">
          <div>
            {lesson && (
              <section>
                <h3>In this lesson</h3>
                {rows(LESSON_KEYS)}
              </section>
            )}
            <section>
              <h3>Anywhere</h3>
              {rows(anywhere)}
            </section>
          </div>
          <section>
            <h3>
              Go to <span>press G, then…</span>
            </h3>
            {rows(GO_LIST.map((g) => [[g.key.toUpperCase()], g.label]))}
          </section>
        </div>
      </div>
    </div>
  );
}
