/**
 * The AI mentor: a persistent guide docked in the corner of every page (including the full-screen lesson player).
 * One conversation follows the learner around. Each question carries a fresh summary of their progress and the page
 * they are on, so answers are specific ("your Closures gate answers were weak") instead of generic.
 * It is off in No-AI mode, and needs the learner's own API key (stored in this browser only).
 */
import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowRight, KeyRound, RotateCcw, Send, Trash2, X } from 'lucide-react';
import {
  askMentor,
  clearMentorChat,
  clearMentorPrefill,
  closeMentor,
  MENTOR_NAME,
  retryMentor,
  toggleMentor,
  useMentor,
  type MentorContext,
} from '@/lib/mentor';
import { saveTutorKey, useProgress, useSettings } from '@/lib/progress';
import { useMediaQuery } from '@/lib/media';
import { continueTarget } from './learner';
import { buildMentorProfile, describeRoute } from './mentorProfile';
import { MentorText } from './MentorText';
import { MentorFace, type MentorMood } from './MentorFace';
import { MOD_KEY } from './Hotkeys';
import './mentor.css';

/**
 * The mentor's button for the lesson player's top bar. On wide screens the floating launcher
 * would sit on top of the step timeline, so the player shows this instead (see mentor.css).
 */
export function MentorButton() {
  const settings = useSettings();
  const m = useMentor();
  if (settings.noAiMode) return null;
  return (
    <button
      className="btn btn--ghost pbar-mentor"
      onClick={toggleMentor}
      aria-pressed={m.open}
      aria-label={`${m.open ? 'Close' : 'Ask'} ${MENTOR_NAME}, your AI mentor`}
      title={`${MENTOR_NAME}, your AI mentor (${MOD_KEY}+J)`}
    >
      <MentorFace size={24} mood={m.busy ? 'thinking' : 'idle'} track={!m.open} />
      <span>{MENTOR_NAME}</span>
    </button>
  );
}

const SUGGESTIONS: Record<string, string[]> = {
  lesson: ['Explain this step in simpler words', 'Quiz me on this lesson', 'Where would I hit this in a real app?'],
  gate: ['How should I prepare for this gate?', 'Which of my weak spots matter most here?'],
  capstone: ['Help me plan this milestone', 'What should I check before moving on?'],
  default: ['What should I do next?', 'What are my weak spots?', 'Plan my study week'],
};

function KeySetup() {
  const [value, setValue] = useState('');
  const save = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim()) saveTutorKey(value.trim());
  };
  return (
    <form className="mentor-key" onSubmit={save}>
      <div className="mentor-key-head">
        <KeyRound size={14} />
        <strong>Connect your model key</strong>
      </div>
      <p>
        The mentor runs on your own API key: xAI (Grok) or Anthropic (Claude), detected from the key. It stays in this browser and is sent only with your questions, never logged or stored on a server.
      </p>
      <div className="mentor-key-row">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="xai-... or sk-ant-..."
          aria-label="xAI or Anthropic API key"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="btn btn--sm btn--primary" disabled={!value.trim()}>
          Save
        </button>
      </div>
    </form>
  );
}

/** Where the learner stands, drawn from their own progress. Works without a key. */
function Standing({ onNavigate }: { onNavigate: () => void }) {
  const progress = useProgress();
  const t = continueTarget(progress);
  const due = progress.reviews.filter((r) => r.dueAt <= Date.now()).length;
  const streak = progress.dash.lastActiveDate ? progress.dash.streakDays || 1 : 0;

  return (
    <div className="mentor-standing">
      <div className="mentor-hello">
        <MentorFace size={46} mood="happy" />
        <p>
          {streak > 1 ? `${streak}-day streak. ` : ''}
          Hi, I'm {MENTOR_NAME}, your mentor. I can see your progress and where you are, so ask me anything about the course.
        </p>
      </div>
      {t && (
        <Link to={t.href} className="mentor-next" onClick={onNavigate}>
          <span className="mentor-next-eyebrow">{t.kind === 'resume' ? 'Pick up where you left off' : t.kind === 'next' ? 'Up next' : 'New here?'}</span>
          <span className="mentor-next-title">
            {t.kind === 'start' ? 'Take the 5-minute check' : t.lesson?.title}
            {t.kind === 'resume' && t.total ? <span className="mono"> · step {t.step}/{t.total}</span> : null}
          </span>
          <ArrowRight size={14} />
        </Link>
      )}
      {due > 0 && (
        <Link to="/review" className="mentor-next mentor-next--due" onClick={onNavigate}>
          <span className="mentor-next-eyebrow">Spaced review</span>
          <span className="mentor-next-title">
            {due} card{due === 1 ? '' : 's'} due
          </span>
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

export function MentorDock() {
  const settings = useSettings();
  const progress = useProgress();
  const m = useMentor();
  const { pathname } = useLocation();
  const narrow = useMediaQuery('(max-width: 959px)');
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const route = describeRoute(pathname);
  const page = useMemo(() => ({ ...route, ...m.page, path: pathname }), [route.kind, route.title, m.page, pathname]);
  const apiKey = settings.tutorKey?.trim() ?? '';

  // The face's mood: thinking while a reply is on its way, a quick smile when one arrives, worried after an error.
  const [hover, setHover] = useState(false);
  const [pleased, setPleased] = useState(false);
  // the launcher unmounts under the cursor when the panel opens, so it never gets a mouseleave
  useEffect(() => {
    if (m.open) setHover(false);
  }, [m.open]);
  const seen = useRef(m.messages.length);
  const lastMsg = m.messages[m.messages.length - 1];
  useEffect(() => {
    const grew = m.messages.length > seen.current;
    seen.current = m.messages.length;
    if (!grew || m.busy || lastMsg?.role !== 'assistant' || lastMsg.error) {
      setPleased(false);
      return;
    }
    setPleased(true);
    const t = setTimeout(() => setPleased(false), 2200);
    return () => clearTimeout(t);
  }, [m.messages.length, m.busy, lastMsg]);
  const mood: MentorMood = m.busy ? 'thinking' : lastMsg?.error ? 'oops' : pleased || hover ? 'happy' : 'idle';

  // Ctrl/Cmd+J toggles the mentor from anywhere (including the lesson player, which uses plain letter keys).
  useEffect(() => {
    if (settings.noAiMode) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        toggleMentor();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settings.noAiMode]);

  // Escape closes the panel when focus is inside it.
  const onPanelKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeMentor();
  };

  useEffect(() => {
    if (m.open && apiKey) inputRef.current?.focus();
  }, [m.open, apiKey]);

  // A question handed over from elsewhere (the command palette): waiting in the composer, cursor at the end.
  useEffect(() => {
    if (!m.open || m.prefill === null) return;
    setDraft(m.prefill);
    clearMentorPrefill();
    const id = requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el || el.disabled) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
    return () => cancelAnimationFrame(id);
  }, [m.open, m.prefill]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [m.messages.length, m.busy, m.open]);

  // The mentor is a guide, not a requirement: in No-AI mode it disappears entirely.
  if (settings.noAiMode) return null;

  const context = (): MentorContext => ({ apiKey, profile: buildMentorProfile(progress), page });
  const send = (text: string) => {
    if (!apiKey || !text.trim()) return;
    setDraft('');
    void askMentor(text, context());
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
  };
  const onComposerKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(draft);
    }
  };
  const onNavigate = () => {
    if (narrow) closeMentor(); // the sheet covers the page on small screens
  };

  const last = m.messages[m.messages.length - 1];
  const chips = SUGGESTIONS[page.kind] ?? SUGGESTIONS.default;
  const where = page.stepTitle ? `${page.title} · ${page.stepTitle}` : page.title;

  return (
    <div className="mentor" data-open={m.open || undefined} data-lifted={page.kind === 'lesson' || undefined}>
      {!m.open && (
        <button
          className="mentor-launcher"
          onClick={toggleMentor}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          aria-label={`Open ${MENTOR_NAME}, your AI mentor`}
          title={`${MENTOR_NAME}, your AI mentor (Ctrl+J)`}
        >
          <MentorFace size={34} mood={mood} track />
          <span>{MENTOR_NAME}</span>
        </button>
      )}

      {m.open && (
        <section className="mentor-panel" role="dialog" aria-label={`${MENTOR_NAME}, AI mentor`} onKeyDown={onPanelKey}>
          <header className="mentor-head">
            <div className="mentor-id">
              <MentorFace size={40} mood={mood} track />
              <div>
                <strong>{MENTOR_NAME}</strong>
                <span className="mentor-where" title={where}>
                  {where}
                </span>
              </div>
            </div>
            <div className="mentor-tools">
              {m.messages.length > 0 && (
                <button className="btn btn--ghost btn--icon btn--sm" onClick={clearMentorChat} aria-label="Clear conversation" title="Clear conversation">
                  <Trash2 size={15} />
                </button>
              )}
              <button className="btn btn--ghost btn--icon btn--sm" onClick={closeMentor} aria-label={`Close ${MENTOR_NAME}`}>
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="mentor-scroll" ref={listRef} aria-live="polite">
            {m.messages.length === 0 && (
              <>
                <Standing onNavigate={onNavigate} />
                {!apiKey && <KeySetup />}
                {apiKey && (
                  <div className="mentor-chips" role="group" aria-label="Suggested questions">
                    {chips.map((c) => (
                      <button key={c} className="mentor-chip" onClick={() => send(c)} disabled={m.busy}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {m.messages.map((msg) => {
              const bubble = (
                <div className={`mentor-msg mentor-msg--${msg.role}`} data-error={msg.error || undefined}>
                  {msg.role === 'assistant' && !msg.error ? <MentorText text={msg.text} onNavigate={onNavigate} /> : <p>{msg.text}</p>}
                </div>
              );
              return msg.role === 'assistant' ? (
                <div key={msg.id} className="mentor-row">
                  <MentorFace size={28} mood={msg.error ? 'oops' : 'idle'} />
                  {bubble}
                </div>
              ) : (
                <Fragment key={msg.id}>{bubble}</Fragment>
              );
            })}

            {m.busy && (
              <div className="mentor-row">
                <MentorFace size={28} mood="thinking" />
                <div className="mentor-msg mentor-msg--assistant mentor-typing" aria-label={`${MENTOR_NAME} is thinking`}>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}

            {last?.error && !m.busy && apiKey && (
              <button className="btn btn--sm mentor-retry" onClick={() => retryMentor(context())}>
                <RotateCcw size={13} /> Try again
              </button>
            )}
          </div>

          {m.messages.length > 0 && !apiKey && <KeySetup />}

          <form className="mentor-composer" onSubmit={submit}>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onComposerKey}
              placeholder={apiKey ? 'Ask about this page, your progress, or what to learn next…' : 'Add your key above to chat'}
              rows={2}
              disabled={!apiKey}
              maxLength={4000}
              aria-label={`Message ${MENTOR_NAME}`}
            />
            <button type="submit" className="btn btn--primary btn--icon" disabled={!apiKey || m.busy || !draft.trim()} aria-label="Send">
              <Send size={15} />
            </button>
          </form>
          <p className="mentor-foot">Enter to send · Shift+Enter for a new line · Ctrl+J to toggle</p>
        </section>
      )}
    </div>
  );
}
