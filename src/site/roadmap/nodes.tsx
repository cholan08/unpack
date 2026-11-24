import { memo, type CSSProperties } from 'react';
import { FastForward, Flag, Lock, Trophy } from 'lucide-react';
import { ICONS } from '@/engine/icons';
import { LABEL_LH, type GNode, type Role } from './graph';
import type { MapStatus } from './status';
import { fmtMinutes } from './status';
import { burst, rand, wobblyCircle, wobblyPoly } from './shapes';

const TICK = 'M-8 0.5 L-2.5 6.5 L8.5 -7.5';

/** A red-pen loop drawn around the next lesson, like a teacher circling it. */
function circled(r: number, seed: number): string {
  const turns = 1.18;
  const steps = 28;
  const start = rand(seed, 5) * Math.PI * 2;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = start + t * turns * Math.PI * 2;
    const rr = r * (1 + 0.1 * Math.sin(t * 7 + seed) + (t - 0.5) * 0.12);
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * rr * 1.08).toFixed(1)} ${(Math.sin(a) * rr * 0.94).toFixed(1)}`;
  }
  return d;
}

export function nodeLabel(n: GNode, st: MapStatus): string {
  switch (n.kind) {
    case 'lesson': {
      const s = st.lessons[n.stub.id];
      const state = s.state === 'done' ? 'done' : s.state === 'started' ? `in progress, step ${s.step} of ${s.total ?? '?'}` : s.state === 'soon' ? 'coming soon' : 'not started';
      return `Lesson ${n.index} of Part ${n.part.num}: ${n.stub.title} — ${state}`;
    }
    case 'hub': {
      const p = st.parts[n.part.id];
      return `Part ${n.part.num}: ${n.part.title} — ${p.done} of ${p.total} lessons done`;
    }
    case 'gate':
      return `Gate after Part ${n.part.num} — ${st.gates[n.part.id].state}`;
    case 'start':
      return 'Start here';
    case 'finish':
      return 'Finish line: the capstone';
  }
}

interface Props {
  n: GNode;
  st: MapStatus;
  next: boolean;
  lit?: Role;
  delay: number;
}

export const NodeView = memo(function NodeView({ n, st, next, lit, delay }: Props) {
  const tone = n.kind === 'lesson' || n.kind === 'hub' || n.kind === 'gate' ? n.part.tone : undefined;
  let state: string | undefined;
  if (n.kind === 'lesson') state = st.lessons[n.stub.id].state;
  else if (n.kind === 'hub') state = st.parts[n.part.id].complete ? 'done' : st.parts[n.part.id].started ? 'started' : 'new';
  else if (n.kind === 'gate') state = st.gates[n.part.id].state;
  return (
    <g
      className={`rm-node rm-${n.kind}`}
      data-n={n.id}
      data-tone={tone}
      data-state={state}
      data-lit={lit}
      data-next={next || undefined}
      data-skip={(n.kind === 'hub' || n.kind === 'lesson') && st.parts[n.part.id].skippable ? '' : undefined}
      tabIndex={0}
      role="button"
      aria-label={nodeLabel(n, st)}
    >
      <g className="rm-pop" style={{ '--d': `${delay}ms` } as CSSProperties}>
        {n.kind === 'lesson' && <Lesson n={n} st={st} next={next} />}
        {n.kind === 'hub' && <Hub n={n} st={st} />}
        {n.kind === 'gate' && <Gate n={n} st={st} />}
        {n.kind === 'start' && <Start n={n} />}
        {n.kind === 'finish' && <Finish n={n} st={st} />}
      </g>
    </g>
  );
});

function Lesson({ n, st, next }: { n: Extract<GNode, { kind: 'lesson' }>; st: MapStatus; next: boolean }) {
  const s = st.lessons[n.stub.id];
  const done = s.state === 'done';
  return (
    <>
      {next && <circle className="rm-pulse" r={n.r} />}
      {s.state === 'started' && (
        <>
          <circle className="rm-arc-track" r={n.r + 7} />
          <circle className="rm-arc" r={n.r + 7} pathLength={100} strokeDasharray={`${Math.max(4, s.frac * 100)} 100`} transform="rotate(-90)" />
        </>
      )}
      <path className="rm-shape" d={wobblyCircle(n.r, n.seed)} style={done ? { fill: `url(#rm-hatch-${n.part.tone})` } : undefined} />
      <path className="rm-sketch" d={wobblyCircle(n.r + 1.6, n.seed + 11, 0.08, 7)} />
      {done ? <path className="rm-tick" d={TICK} /> : <text className="rm-idx" y={5.5}>{n.index}</text>}
      {n.meta?.interactive && (
        <g className="rm-try" transform={`translate(${(n.r * 0.74).toFixed(1)} ${(-n.r * 0.74).toFixed(1)})`}>
          <circle r={6.5} />
        </g>
      )}
      {next && <path className="rm-circled" d={circled(n.r + 11, n.seed)} pathLength={100} />}
      <text className="rm-label" x={n.lx} y={n.ly} textAnchor={n.anchor}>
        {n.lines.map((l, i) => (
          <tspan key={i} x={n.lx} dy={i ? LABEL_LH : 0}>
            {l}
          </tspan>
        ))}
      </text>
    </>
  );
}

function Hub({ n, st }: { n: Extract<GNode, { kind: 'hub' }>; st: MapStatus }) {
  const p = st.parts[n.part.id];
  const Icon = n.part.icon ? ICONS[n.part.icon] : null;
  const ringR = n.r + 13;
  return (
    <>
      <circle className="rm-hub-track" r={ringR} />
      {p.done > 0 && <circle className="rm-hub-arc" r={ringR} pathLength={100} strokeDasharray={`${(p.done / p.total) * 100} 100`} transform="rotate(-90)" />}
      <path className="rm-shape" d={wobblyCircle(n.r, n.seed, 0.035, 12)} />
      <path className="rm-sketch" d={wobblyCircle(n.r + 2.5, n.seed + 7, 0.05, 9)} />
      {Icon && <Icon className="rm-hub-icon" x={-17} y={-31} size={34} strokeWidth={2} aria-hidden />}
      <text className="rm-hub-num" y={Icon ? 30 : 12}>
        {n.part.num}
      </text>
      {p.complete && (
        <g className="rm-hub-done" transform={`translate(${(n.r * 0.74).toFixed(1)} ${(-n.r * 0.74).toFixed(1)})`}>
          <circle r={14} />
          <path d={TICK} transform="scale(0.72)" />
        </g>
      )}
      {p.skippable && (
        <g className="rm-stamp" transform={`translate(${-n.r - 6} ${-n.r + 2}) rotate(-14)`}>
          <rect x={-46} y={-15} width={92} height={26} rx={4} />
          <text y={5}>skippable</text>
        </g>
      )}
      <text className="rm-hub-title" y={n.r + 20}>
        {n.title.map((l, i) => (
          <tspan key={i} x={0} dy={i ? '1em' : '0.92em'}>
            {l}
          </tspan>
        ))}
      </text>
      <text className="rm-hub-sub" y={n.r + 20 + n.title.length * 34 + 20}>
        {p.done}/{p.total} done · {fmtMinutes(p.minutes)}
      </text>
    </>
  );
}

function Gate({ n, st }: { n: Extract<GNode, { kind: 'gate' }>; st: MapStatus }) {
  const g = st.gates[n.part.id];
  const r = n.r;
  const shape = wobblyPoly(
    [
      [0, -r - 3],
      [r + 3, 0],
      [0, r + 3],
      [-r - 3, 0],
    ],
    n.seed,
  );
  return (
    <>
      {g.state === 'ready' && <circle className="rm-pulse" r={r} />}
      <path className="rm-shape" d={shape} style={g.state === 'passed' ? { fill: 'url(#rm-hatch-ok)' } : undefined} />
      {g.state === 'passed' && <path className="rm-tick" d={TICK} transform="scale(0.85)" />}
      {g.state === 'skipped' && <FastForward className="rm-gate-icon" x={-8} y={-8} size={16} strokeWidth={2.4} aria-hidden />}
      {g.state === 'ready' && <Flag className="rm-gate-icon" x={-8} y={-9} size={16} strokeWidth={2.4} aria-hidden />}
      {g.state === 'locked' && <Lock className="rm-gate-icon" x={-7} y={-8} size={14} strokeWidth={2.4} aria-hidden />}
      <text className="rm-gate-label" y={r + 22}>
        gate {n.part.num}
      </text>
    </>
  );
}

function Start({ n }: { n: Extract<GNode, { kind: 'start' }> }) {
  return (
    <>
      <path
        className="rm-shape"
        d={wobblyPoly(
          [
            [-64, -26],
            [64, -26],
            [64, 26],
            [-64, 26],
          ],
          n.seed,
          3,
        )}
      />
      <Flag className="rm-start-icon" x={-50} y={-11} size={22} strokeWidth={2.2} aria-hidden />
      <text className="rm-start-text" x={14} y={9}>
        Start
      </text>
      <text className="rm-gate-label" y={50}>
        placement check
      </text>
    </>
  );
}

function Finish({ n, st }: { n: Extract<GNode, { kind: 'finish' }>; st: MapStatus }) {
  const all = st.totals.done === st.totals.total;
  return (
    <>
      <path className="rm-shape" d={burst(n.r + 6, n.r - 8, 11, n.seed)} style={all ? { fill: 'url(#rm-hatch-warn)' } : undefined} />
      <Trophy className="rm-finish-icon" x={-16} y={-17} size={32} strokeWidth={2} aria-hidden />
      <text className="rm-hub-title" y={n.r + 22}>
        <tspan x={0} dy="0.92em">
          Capstone
        </tspan>
      </text>
      <text className="rm-hub-sub" y={n.r + 22 + 34 + 20}>
        the finish line
      </text>
    </>
  );
}
