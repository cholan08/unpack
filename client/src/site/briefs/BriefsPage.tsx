/**
 * Part IV — problem briefs (docs/VISION.md §3, §5; docs/PLAN-MANUAL.md M8).
 *  /briefs      four clients, with less help each time: guided → semi-guided → spec only → open
 *  /briefs/:id  one brief, stage by stage: discover (the AI mentor plays the client) → scope →
 *               design → build → ship (a live link) → demo and defend → iterate
 */
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowRight, Bot, Check, ChevronRight, Copy, KeyRound, MessagesSquare, PenLine, RotateCcw, Send, Shield } from 'lucide-react';
import { BRIEFS, STAGES, SUPPORT, getBrief, type Brief, type Stage } from '@/content/briefs';
import { getChapter } from '@/content/manual';
import { COURSES } from '@/content/registry';
import { GlossaryProvider, Rich } from '@/player/RichText';
import { setBriefDefended, toggleBriefStage, useProgress, useSettings, useShips } from '@/lib/progress';
import { MENTOR_NAME, openMentor, openMentorWith, useMentorPage } from '@/lib/mentor';
import { toast } from '@/lib/toast';
import { NotFound } from '../NotFound';
import { chapterHref, chapterTone } from '../manual/shared';
import { ShipProof } from '../doors/ShipProof';
import { askClient, clearInterview, setNote, useBriefWork, useInterviewBusy } from './store';
import '../manual/manual.css';
import '../doors/doors.css';
import './briefs.css';

const glossary = COURSES[0]?.glossary ?? {};
const shipKey = (b: Brief) => `brief:${b.id}`;

/* ---------------- /briefs ---------------- */

export function BriefsPage() {
  const progress = useProgress();
  const ships = useShips();
  useEffect(() => {
    document.title = 'Problem briefs — Unpacked';
  }, []);
  useMentorPage({ kind: 'problem briefs', title: 'Part IV: problem briefs — guided, semi-guided, spec only, open' });
  const shipped = BRIEFS.filter((b) => ships[shipKey(b)]).length;

  return (
    <main className="dr br">
      <div className="wrap">
        <nav className="mn-crumbs br-crumbs" aria-label="Breadcrumb">
          <Link to="/manual">The Manual</Link>
          <ChevronRight size={13} />
          <Link to="/manual#part-products">Part IV · Build products</Link>
        </nav>
        <header className="dr-head">
          <span className="eyebrow" data-tone="warn">
            <MessagesSquare size={14} /> Problem briefs
          </span>
          <h1 className="page-title">Solve a real client’s problem</h1>
          <p className="page-lede">
            Four problems from four clients, with less help each time. Each one goes the way real work goes: discover, scope, design, build, ship,
            demo, iterate. In discovery, {MENTOR_NAME} plays the client — good questions get good answers, vague ones get vague answers.
          </p>
          <ul className="dr-facts">
            <li>
              <strong>{BRIEFS.length}</strong> briefs
            </li>
            <li>
              <strong>{STAGES.length}</strong> stages each
            </li>
            <li>
              <strong>{shipped}</strong> shipped
            </li>
          </ul>
        </header>

        <ol className="br-flow" aria-label="Every brief, stage by stage">
          {STAGES.map((s, i) => (
            <li key={s.id}>
              <span className="mono">{i + 1}</span> {s.title}
            </li>
          ))}
        </ol>

        <ol className="br-list">
          {BRIEFS.map((b, i) => {
            const st = progress.briefs?.[b.id];
            const done = st?.stages.length ?? 0;
            return (
              <li key={b.id}>
                <Link to={`/briefs/${b.id}`} className="br-card card" data-support={b.support}>
                  <span className="br-card-top">
                    <span className="br-support" data-support={b.support}>
                      {i + 1} · {SUPPORT[b.support].label}
                    </span>
                    {ships[shipKey(b)] ? (
                      <span className="br-shipped">
                        <Check size={12} strokeWidth={3} /> Shipped
                      </span>
                    ) : done > 0 ? (
                      <span className="br-progress mono">
                        {done}/{STAGES.length} stages
                      </span>
                    ) : null}
                  </span>
                  <strong className="br-card-title">{b.title}</strong>
                  <span className="br-card-client">
                    <span className="br-avatar" aria-hidden>
                      {b.client.name.charAt(0)}
                    </span>
                    {b.client.name}, {b.client.role} of {b.client.org}
                  </span>
                  <q className="br-card-ask">{b.ask.replace(/^“|”$/g, '')}</q>
                  <span className="br-card-help">{SUPPORT[b.support].text}</span>
                  <span className="br-card-go">
                    {done ? 'Carry on' : 'Open the brief'} <ArrowRight size={14} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        <p className="dr-feed-end">The clients and their organisations are made up; their problems are the kind real ones have.</p>
      </div>
    </main>
  );
}

/* ---------------- /briefs/:id ---------------- */

export function BriefPage() {
  const { briefId } = useParams();
  const brief = getBrief(briefId);
  if (!brief) return <NotFound />;
  return <BriefView key={brief.id} brief={brief} />;
}

function BriefView({ brief }: { brief: Brief }) {
  const progress = useProgress();
  const work = useBriefWork(brief.id);
  const st = progress.briefs?.[brief.id];
  const done = new Set(st?.stages ?? []);
  const idx = BRIEFS.indexOf(brief);
  const next = BRIEFS[idx + 1];

  useEffect(() => {
    document.title = `${brief.title} — Problem briefs · Unpacked`;
  }, [brief]);
  useMentorPage({
    kind: 'problem brief',
    title: `Problem brief (${SUPPORT[brief.support].label}): ${brief.title} — client ${brief.client.name}, ${brief.client.role} of ${brief.client.org}`,
    stepTitle: `Stages done: ${[...done].join(', ') || 'none yet'}`,
    stepBody: ['discover', 'scope', 'design'].map((k) => (work.notes[k] ? `${k}: ${work.notes[k]}` : '')).filter(Boolean).join('\n') || brief.ask,
  });

  return (
    <GlossaryProvider glossary={glossary}>
      <main className="dr br br-one">
        <div className="wrap">
          <nav className="mn-crumbs br-crumbs" aria-label="Breadcrumb">
            <Link to="/manual#part-products">Part IV · Build products</Link>
            <ChevronRight size={13} />
            <Link to="/briefs">Problem briefs</Link>
          </nav>

          <header className="br-head">
            <span className="br-support" data-support={brief.support}>
              Brief {idx + 1} · {SUPPORT[brief.support].label}
            </span>
            <h1 className="page-title">{brief.title}</h1>
            <p className="br-help">{SUPPORT[brief.support].text}</p>
            <div className="br-client card">
              <span className="br-avatar br-avatar--lg" aria-hidden>
                {brief.client.name.charAt(0)}
              </span>
              <div>
                <span className="br-client-who">
                  {brief.client.name} · {brief.client.role}, {brief.client.org}
                </span>
                <q className="br-ask">{brief.ask.replace(/^“|”$/g, '')}</q>
              </div>
            </div>
            {brief.spec && (
              <div className="br-box">
                <h2 className="mn-h3">The spec, as the client wrote it</h2>
                <ul>
                  {brief.spec.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="br-box br-box--row">
              <div>
                <h2 className="mn-h3">Constraints</h2>
                <ul>
                  {brief.constraints.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="mn-h3">A good result</h2>
                <p>{brief.outcome}</p>
              </div>
            </div>
            <div className="br-chapters">
              <span className="mn-small">Chapters you will lean on:</span>
              {brief.chapters.map((id) => {
                const c = getChapter(id);
                return c ? (
                  <Link key={id} to={chapterHref(c)} className="br-chip" data-tone={chapterTone(c)}>
                    <c.glyph size={13} aria-hidden /> {c.short}
                  </Link>
                ) : null;
              })}
            </div>
          </header>

          <ol className="br-stages">
            {STAGES.map((s, i) => (
              <StageView key={s.id} brief={brief} stage={s} n={i + 1} done={done.has(s.id)} />
            ))}
          </ol>

          <nav className="mn-pager" aria-label="Briefs">
            <Link to="/briefs" className="mn-pager-a" data-dir="prev">
              <span>
                <span className="mn-small">All briefs</span>
                <strong>Problem briefs</strong>
              </span>
            </Link>
            {next && (
              <Link to={`/briefs/${next.id}`} className="mn-pager-a" data-dir="next">
                <span>
                  <span className="mn-small">Next, with less help · {SUPPORT[next.support].label}</span>
                  <strong>{next.title}</strong>
                </span>
                <ArrowRight size={16} />
              </Link>
            )}
          </nav>
        </div>
      </main>
    </GlossaryProvider>
  );
}

function StageView({ brief, stage, n, done }: { brief: Brief; stage: Stage; n: number; done: boolean }) {
  const work = useBriefWork(brief.id);
  const guide = brief.guide?.[stage.id];
  return (
    <li className="br-stage card" id={`stage-${stage.id}`} data-done={done || undefined}>
      <header className="br-stage-head">
        <span className="br-stage-n mono">{done ? <Check size={14} strokeWidth={3} /> : n}</span>
        <div>
          <h2>{stage.title}</h2>
          <p>{stage.goal}</p>
        </div>
      </header>

      {guide && (
        <div className="br-guide">
          <span className="eyebrow">{brief.support === 'guided' ? 'Step by step' : 'A hint'}</span>
          <ul>
            {guide.map((g) => (
              <li key={g}>
                <Rich text={g} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {stage.id === 'discover' && <Interview brief={brief} />}
      {stage.id === 'build' && <BuildPrompt brief={brief} />}
      {stage.id === 'ship' && (
        <ShipProof
          id={shipKey(brief)}
          label={`Paste the live link you would send ${brief.client.name}`}
          hint="The public https:// address of what you built. It is kept in this browser as the proof that you shipped this brief."
          done={`It’s live. ${brief.client.name} can open it now.`}
        />
      )}
      {stage.id === 'demo' && <Defend brief={brief} />}

      {stage.note && (
        <label className="br-note">
          <span className="br-note-label">
            <PenLine size={13} /> {stage.note.label}
          </span>
          <textarea
            value={work.notes[stage.id] ?? ''}
            onChange={(e) => setNote(brief.id, stage.id, e.target.value)}
            placeholder={stage.note.placeholder}
            rows={stage.id === 'design' || stage.id === 'scope' ? 5 : 3}
          />
        </label>
      )}

      <label className="br-done">
        <input type="checkbox" checked={done} onChange={() => toggleBriefStage(brief.id, stage.id)} />
        <span className="br-done-box" aria-hidden>
          {done && <Check size={12} strokeWidth={3} />}
        </span>
        <span>
          <b>Done:</b> {stage.done}
        </span>
      </label>
    </li>
  );
}

/** Discovery: the client, played by the mentor — or their notes, when there is no AI. */
function Interview({ brief }: { brief: Brief }) {
  const settings = useSettings();
  const work = useBriefWork(brief.id);
  const busy = useInterviewBusy(brief.id);
  const [draft, setDraft] = useState('');
  const log = useRef<HTMLOListElement>(null);
  const ai = !settings.noAiMode;
  const key = settings.tutorKey?.trim() ?? '';
  const last = work.chat[work.chat.length - 1];

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [work.chat.length, busy]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !key) return;
    void askClient(brief, draft, key);
    setDraft('');
  };

  return (
    <div className="br-interview">
      <div className="br-chat card">
        <div className="br-chat-head">
          <span className="br-avatar" aria-hidden>
            {brief.client.name.charAt(0)}
          </span>
          <span className="br-chat-who">
            <strong>Interview {brief.client.name}</strong>
            <span>
              {brief.client.role}, {brief.client.org} · played by {MENTOR_NAME}
            </span>
          </span>
          {work.chat.length > 0 && (
            <button className="btn btn--ghost btn--sm" onClick={() => clearInterview(brief.id)} title="Start the interview again">
              <RotateCcw size={13} /> Start over
            </button>
          )}
        </div>
        <ol className="br-chat-log" ref={log} aria-live="polite">
          <li data-role="assistant">{brief.ask.replace(/^“|”$/g, '')}</li>
          {work.chat.map((t, i) => (
            <li key={i} data-role={t.role} data-error={t.error || undefined}>
              {t.text}
            </li>
          ))}
          {busy && (
            <li data-role="assistant" className="br-typing" aria-label={`${brief.client.name} is answering`}>
              <i />
              <i />
              <i />
            </li>
          )}
        </ol>
        {ai && key ? (
          <form className="br-chat-form" onSubmit={send}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={work.chat.length ? 'Ask your next question…' : `Ask ${brief.client.name} your first question…`}
              aria-label={`Your question for ${brief.client.name}`}
              maxLength={600}
            />
            <button className="btn btn--primary btn--sm" type="submit" disabled={busy || !draft.trim()} aria-label="Ask">
              <Send size={14} />
            </button>
          </form>
        ) : ai ? (
          <p className="br-chat-off">
            <KeyRound size={14} /> {brief.client.name} is played by {MENTOR_NAME}, which runs on your own model key.{' '}
            <button className="br-linkbtn" onClick={() => openMentor()}>
              Add your key
            </button>{' '}
            — or read the client’s notes below.
          </p>
        ) : (
          <p className="br-chat-off">No-AI mode is on, so nobody plays the client. Read their notes below, as if they had told you.</p>
        )}
        {last?.error && <p className="br-chat-tip">That question didn’t reach {brief.client.name}; ask it again when the server is back.</p>}
        <p className="br-chat-tip">
          Good discovery asks <b>why</b>, <b>who else</b>, <b>what was tried</b> and <b>what must never happen</b>. Type “(out of character) how am I
          doing?” for feedback on your interview.
        </p>
      </div>
      <details className="br-notes">
        <summary>
          <ChevronRight size={15} className="mn-deep-chev" /> Read the client’s notes instead
        </summary>
        <p className="mn-small">Real clients don’t hand you notes. Try the interview first — then check what you missed.</p>
        <ul>
          {[...brief.knows, ...brief.onlyIfAsked].map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

/** Build: turn the learner's own notes into a spec an AI assistant can follow. */
function BuildPrompt({ brief }: { brief: Brief }) {
  const work = useBriefWork(brief.id);
  const prompt = useMemo(
    () =>
      [
        `Help me build version one of a small product for ${brief.client.name}, ${brief.client.role} of ${brief.client.org}.`,
        '',
        `The problem: ${work.notes.discover?.trim() || '[write it in Discover first]'}`,
        '',
        `Version one does / doesn't:\n${work.notes.scope?.trim() || '[write it in Scope first]'}`,
        '',
        `My design:\n${work.notes.design?.trim() || '[write it in Design first]'}`,
        '',
        `Constraints: ${brief.constraints.join(' ')}`,
        '',
        'Rules: follow my design; if you disagree with a choice, say why before changing it. Keep secrets in environment variables. Validate every input on the server. Explain each file in two sentences before writing it, and list anything you were unsure about at the end.',
      ].join('\n'),
    [brief, work.notes],
  );
  const ready = !!(work.notes.discover?.trim() && work.notes.scope?.trim() && work.notes.design?.trim());
  const copy = () =>
    navigator.clipboard?.writeText(prompt).then(
      () => toast('Spec copied'),
      () => toast('Copy didn’t work — select the text instead', 'info'),
    );
  return (
    <div className="br-prompt">
      <span className="br-prompt-head">
        <Bot size={14} /> Your spec for an AI assistant, from your own notes
        <button className="btn btn--sm" onClick={copy} disabled={!ready} title={ready ? 'Copy the spec' : 'Write Discover, Scope and Design first'}>
          <Copy size={13} /> Copy
        </button>
      </span>
      <pre>{prompt}</pre>
      {!ready && <p className="mn-small">Write your notes in Discover, Scope and Design, and they become the spec.</p>}
    </div>
  );
}

/** Demo and defend: a sceptical engineer asks the hard questions about the design. */
function Defend({ brief }: { brief: Brief }) {
  const settings = useSettings();
  const progress = useProgress();
  const work = useBriefWork(brief.id);
  const ship = useShips()[shipKey(brief)];
  const defended = !!progress.briefs?.[brief.id]?.defended;
  const ai = !settings.noAiMode;
  const ask = () =>
    openMentorWith(
      `Defend my design — brief “${brief.title}” for ${brief.client.name} (${brief.client.org}).\n` +
        `Problem: ${work.notes.discover?.trim() || '…'}\nVersion one: ${work.notes.scope?.trim() || '…'}\nDesign: ${work.notes.design?.trim() || '…'}\n` +
        `Live: ${ship?.url ?? 'not shipped yet'}\n` +
        'Review it like a sceptical senior engineer: ask me three hard questions about my choices, one at a time, and push back on weak answers.',
    );
  return (
    <div className="br-defend">
      <div className="br-defend-text">
        <strong>
          <Shield size={14} /> Defend your design
        </strong>
        <span>
          Why these building blocks? What breaks first with ten times the users? What did you leave out, and why? An independent builder can answer
          all three.
        </span>
      </div>
      <div className="br-defend-acts">
        {ai && (
          <button className="btn btn--sm" onClick={ask}>
            <Bot size={14} /> Defend it to {MENTOR_NAME}
          </button>
        )}
        <label className="br-done br-done--inline">
          <input type="checkbox" checked={defended} onChange={() => setBriefDefended(brief.id, !defended)} />
          <span className="br-done-box" aria-hidden>
            {defended && <Check size={12} strokeWidth={3} />}
          </span>
          <span>I answered the hard questions</span>
        </label>
      </div>
    </div>
  );
}
