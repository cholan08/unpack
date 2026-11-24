import { Link } from 'react-router';
import { ArrowRight, Check, Clock, FastForward, Flag, Lock, SlidersHorizontal, Trophy, X } from 'lucide-react';
import type { Course } from '@/engine/types';
import { ICONS } from '@/engine/icons';
import { gateNodeId, hubNodeId, lessonNodeId, type GNode, type Graph, type HubNode, type LessonNode } from './graph';
import { fmtMinutes, type LessonStatus, type MapStatus } from './status';

const LEVEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

interface Props {
  course: Course;
  graph: Graph;
  status: MapStatus;
  node: GNode;
  onPick: (id: string) => void;
  onClose: () => void;
}

/** The side panel for whatever is selected on the map. */
export function Inspector({ course, graph, status, node, onPick, onClose }: Props) {
  const tone = node.kind === 'lesson' || node.kind === 'hub' || node.kind === 'gate' ? node.part.tone : node.kind === 'finish' ? 'warn' : 'neutral';
  // the card slides in once; picking another node swaps (and re-scrolls) just its content
  return (
    <aside className="rm-insp" data-tone={tone} aria-label="Details">
      <button type="button" className="rm-insp-close" onClick={onClose} aria-label="Close details">
        <X size={16} />
      </button>
      <div className="rm-insp-scroll" key={node.id}>
        {node.kind === 'lesson' && <LessonPanel course={course} graph={graph} status={status} n={node} onPick={onPick} />}
        {node.kind === 'hub' && <HubPanel course={course} status={status} n={node} onPick={onPick} />}
        {node.kind === 'gate' && <GatePanel course={course} graph={graph} status={status} n={node} onPick={onPick} />}
        {node.kind === 'start' && <StartPanel course={course} status={status} onPick={onPick} />}
        {node.kind === 'finish' && <FinishPanel status={status} />}
      </div>
    </aside>
  );
}

function StateDot({ s }: { s: LessonStatus }) {
  return (
    <span className="rm-dot" data-state={s.state} aria-hidden>
      {s.state === 'done' && <Check size={11} strokeWidth={3.2} />}
    </span>
  );
}

function LessonLinks({ title, kind, ids, graph, status, onPick }: { title: string; kind: 'up' | 'down'; ids: string[]; graph: Graph; status: MapStatus; onPick: (id: string) => void }) {
  if (!ids.length) return null;
  return (
    <section className="rm-insp-sec">
      <h3 className="rm-insp-h" data-k={kind}>
        {title}
      </h3>
      <ul className="rm-links">
        {ids.map((id) => {
          const n = graph.byId.get(id) as LessonNode;
          return (
            <li key={id} data-tone={n.part.tone}>
              <button type="button" onClick={() => onPick(id)}>
                <StateDot s={status.lessons[n.stub.id]} />
                <span>{n.stub.title}</span>
                <small className="mono">{n.part.num}</small>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function LessonPanel({ course, graph, status, n, onPick }: { course: Course; graph: Graph; status: MapStatus; n: LessonNode; onPick: (id: string) => void }) {
  const s = status.lessons[n.stub.id];
  const meta = n.meta;
  const cta = s.state === 'done' ? 'Review lesson' : s.state === 'started' ? `Resume at step ${s.step}` : 'Start lesson';
  return (
    <>
      <button type="button" className="rm-insp-eyebrow" onClick={() => onPick(hubNodeId(n.part.id))}>
        Part {n.part.num} · {n.part.title}
      </button>
      <h2 className="rm-insp-title">{n.stub.title}</h2>
      <div className="rm-insp-state" data-state={s.state}>
        {s.state === 'done' && (
          <>
            <Check size={15} strokeWidth={3} /> Done
          </>
        )}
        {s.state === 'started' && (
          <>
            <span className="rm-bar" aria-hidden>
              <i style={{ width: `${Math.round(s.frac * 100)}%` }} />
            </span>
            Step {s.step}
            {s.total ? ` of ${s.total}` : ''}
          </>
        )}
        {s.state === 'new' && <>Not started · lesson {n.index} of {n.part.lessons.length}</>}
        {s.state === 'soon' && <>Being written — coming soon</>}
      </div>
      {meta?.summary && <p className="rm-insp-lede">{meta.summary}</p>}
      {meta && (
        <div className="rm-insp-pills">
          <span className="pill">
            <Clock size={13} /> {meta.minutes} min
          </span>
          <span className="pill">{LEVEL[meta.level]}</span>
          {meta.interactive && (
            <span className="pill rm-pill-try">
              <SlidersHorizontal size={12} /> Try it
            </span>
          )}
        </div>
      )}
      <LessonLinks title="Builds on" kind="up" ids={graph.needs.get(n.id) ?? []} graph={graph} status={status} onPick={onPick} />
      <LessonLinks title="Unlocks" kind="down" ids={graph.unlocks.get(n.id) ?? []} graph={graph} status={status} onPick={onPick} />
      <div className="rm-insp-cta">
        {meta ? (
          <Link className="btn btn--primary" to={`/${course.id}/${n.stub.id}`}>
            {cta} <ArrowRight size={16} />
          </Link>
        ) : (
          <span className="btn" aria-disabled>
            Coming soon
          </span>
        )}
      </div>
    </>
  );
}

function HubPanel({ course, status, n, onPick }: { course: Course; status: MapStatus; n: HubNode; onPick: (id: string) => void }) {
  const part = n.part;
  const p = status.parts[part.id];
  const g = status.gates[part.id];
  const Icon = part.icon ? ICONS[part.icon] : null;
  const open = part.lessons.find((l) => status.lessons[l.id].state === 'started') ?? part.lessons.find((l) => status.lessons[l.id].state === 'new');
  const target = open ?? part.lessons[0];
  return (
    <>
      <div className="rm-insp-hubhead">
        <span className="rm-insp-badge">{Icon ? <Icon size={22} strokeWidth={2} /> : part.num}</span>
        <div>
          <span className="rm-insp-eyebrow is-static">Part {part.num}</span>
          <h2 className="rm-insp-title">{part.title}</h2>
        </div>
      </div>
      <p className="rm-insp-lede">{part.blurb}</p>
      <div className="rm-insp-progress">
        <span className="rm-bar rm-bar--lg" aria-hidden>
          <i style={{ width: `${(p.done / Math.max(1, p.total)) * 100}%` }} />
        </span>
        <span>
          {p.done}/{p.total} lessons · {p.minutesLeft ? `${fmtMinutes(p.minutesLeft)} to go` : 'all done'}
        </span>
      </div>
      {p.skippable && <p className="rm-insp-note">Your placement check says you know this part already — skim it, or go straight to the gate.</p>}
      {part.why && (
        <section className="rm-insp-sec">
          <h3 className="rm-insp-h">Why this matters</h3>
          <p>{part.why}</p>
        </section>
      )}
      {part.outcomes && (
        <section className="rm-insp-sec">
          <h3 className="rm-insp-h">You’ll be able to</h3>
          <ul className="rm-outcomes">
            {part.outcomes.map((o) => (
              <li key={o}>
                <Check size={13} strokeWidth={3} /> {o}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="rm-insp-sec">
        <h3 className="rm-insp-h">Lessons</h3>
        <ol className="rm-links rm-links--ordered">
          {part.lessons.map((l, i) => (
            <li key={l.id}>
              <button type="button" onClick={() => onPick(lessonNodeId(l.id))}>
                <StateDot s={status.lessons[l.id]} />
                <span>
                  <small className="mono">{i + 1}.</small> {l.title}
                </span>
                {l.minutes ? <small>{l.minutes}m</small> : null}
              </button>
            </li>
          ))}
          <li className="rm-links-gate">
            <button type="button" onClick={() => onPick(gateNodeId(part.id))}>
              <span className="rm-dot rm-dot--gate" data-state={g.state} aria-hidden />
              <span>Gate {part.num}</span>
              <small>{g.state}</small>
            </button>
          </li>
        </ol>
      </section>
      <div className="rm-insp-cta">
        <Link className="btn btn--primary" to={`/${course.id}/${target.id}`}>
          {p.complete ? 'Review part' : p.started ? 'Continue part' : 'Start part'} <ArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}

function GatePanel({ course, graph, status, n, onPick }: { course: Course; graph: Graph; status: MapStatus; n: Extract<GNode, { kind: 'gate' }>; onPick: (id: string) => void }) {
  const part = n.part;
  const g = status.gates[part.id];
  const p = status.parts[part.id];
  const next = graph.byId.get(n.to);
  const r = g.result;
  return (
    <>
      <button type="button" className="rm-insp-eyebrow" onClick={() => onPick(hubNodeId(part.id))}>
        Checkpoint · Part {part.num}
      </button>
      <h2 className="rm-insp-title">Gate {part.num}: {part.title}</h2>
      <div className="rm-insp-state" data-state={g.state}>
        {g.state === 'passed' && (
          <>
            <Check size={15} strokeWidth={3} /> Passed{r ? ` · best ${Math.round(r.bestScore * 100)}%` : ''}
          </>
        )}
        {g.state === 'skipped' && (
          <>
            <FastForward size={15} /> Skipped for now
          </>
        )}
        {g.state === 'ready' && (
          <>
            <Flag size={15} /> Ready when you are
          </>
        )}
        {g.state === 'locked' && (
          <>
            <Lock size={14} /> {p.total - p.done} lesson{p.total - p.done === 1 ? '' : 's'} to go first
          </>
        )}
      </div>
      <p className="rm-insp-lede">
        A short quiz on Part {part.num}. Pass it and you know you’re ready for {next?.kind === 'hub' ? `Part ${next.part.num}: ${next.part.title}` : 'the capstone'}. Miss a question and it points you back to the exact step that teaches it.
      </p>
      {r && r.attempts > 0 && (
        <p className="rm-insp-note">
          {r.attempts} attempt{r.attempts === 1 ? '' : 's'} so far · best score {Math.round(r.bestScore * 100)}%
        </p>
      )}
      {g.state === 'locked' && <p className="rm-insp-note">You can still try it now — it’s a good way to find out what you already know.</p>}
      <div className="rm-insp-cta">
        <Link className="btn btn--primary" to={`/${course.id}/gate/${part.id}`}>
          {g.state === 'passed' ? 'Retake the gate' : 'Take the gate'} <ArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}

function StartPanel({ course, status, onPick }: { course: Course; status: MapStatus; onPick: (id: string) => void }) {
  const placed = course.parts.findIndex((p) => !status.parts[p.id].skippable);
  const skippable = course.parts.filter((p) => status.parts[p.id].skippable);
  return (
    <>
      <span className="rm-insp-eyebrow is-static">The way in</span>
      <h2 className="rm-insp-title">Start here</h2>
      {skippable.length ? (
        <p className="rm-insp-lede">
          Your placement check put you at <b>Part {course.parts[placed]?.num}</b>. Parts {skippable.map((p) => p.num).join(', ')} are marked skippable — the red dashed shortcut on the map jumps straight past them.
        </p>
      ) : (
        <p className="rm-insp-lede">Already know some of this? A two-minute placement check finds the right starting part, so you don’t sit through what you know.</p>
      )}
      <div className="rm-insp-cta rm-insp-cta--stack">
        <Link className="btn btn--primary" to="/start">
          {skippable.length ? 'Retake the placement check' : 'Take the placement check'} <ArrowRight size={16} />
        </Link>
        <button type="button" className="btn" onClick={() => onPick(hubNodeId(course.parts[Math.max(0, placed)].id))}>
          Go to Part {course.parts[Math.max(0, placed)].num}
        </button>
      </div>
    </>
  );
}

function FinishPanel({ status }: { status: MapStatus }) {
  const t = status.totals;
  return (
    <>
      <span className="rm-insp-eyebrow is-static">The finish line</span>
      <h2 className="rm-insp-title">
        <Trophy size={22} /> Capstone
      </h2>
      <p className="rm-insp-lede">Build TaskFlow — a real full-stack app — milestone by milestone, using everything on this map.</p>
      <div className="rm-insp-progress">
        <span className="rm-bar rm-bar--lg" aria-hidden>
          <i style={{ width: `${t.pct * 100}%` }} />
        </span>
        <span>
          {t.done}/{t.total} lessons · {t.gatesPassed}/{t.gates} gates
        </span>
      </div>
      <div className="rm-insp-cta">
        <Link className="btn btn--primary" to="/capstone">
          Open the capstone <ArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}
