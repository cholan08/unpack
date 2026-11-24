import { useId } from 'react';
import type { Sketch, SketchEdge, SketchIcon, SketchNode, SketchShape, Tone } from '@/content/notebooks/types';

/**
 * Hand-drawn diagrams. Shapes and lines go through a gentle displacement filter so they
 * wobble like pen strokes; the text stays crisp. Colours come from hand.css, so both
 * themes work without touching the data.
 */

type Pt = [number, number];

const DEFAULT_SIZE: Record<SketchShape, Pt> = {
  box: [110, 40],
  box2: [110, 40],
  diamond: [100, 56],
  diamond2: [104, 60],
  oval: [90, 36],
  oval2: [96, 40],
  ovalDash: [90, 36],
  circle: [56, 56],
  pill: [110, 36],
  note: [150, 52],
  db: [70, 76],
  cloud: [220, 130],
  pc: [46, 40],
  server: [34, 46],
  laptop: [60, 42],
  user: [34, 38],
  text: [0, 0],
  point: [0, 0],
};
const DOODLES = new Set<SketchShape>(['pc', 'server', 'laptop', 'user']);
const ROUND = new Set<SketchShape>(['oval', 'oval2', 'ovalDash', 'circle', 'cloud']);

const shapeOf = (n: SketchNode): SketchShape => n.shape ?? 'box';
const fontOf = (n: SketchNode) => n.size ?? 14;

function sizeOf(n: SketchNode): Pt {
  const s = shapeOf(n);
  if (s === 'text') {
    const lines = (n.text ?? '').split('\n');
    const fs = fontOf(n);
    return [n.w ?? Math.max(...lines.map((l) => l.length)) * fs * 0.5, n.h ?? lines.length * fs * 1.25];
  }
  const [w, h] = DEFAULT_SIZE[s];
  return [n.w ?? w, n.h ?? h];
}

/** Where the straight line from n's centre towards (tx, ty) leaves n's outline. */
function exitPoint(n: SketchNode, tx: number, ty: number, pad = 3): Pt {
  const s = shapeOf(n);
  const dx = tx - n.x;
  const dy = ty - n.y;
  if (s === 'point' || (dx === 0 && dy === 0)) return [n.x, n.y];
  const [w, h] = sizeOf(n);
  let cx = n.x;
  let cy = n.y;
  let a = w / 2 + pad;
  let b = h / 2 + pad;
  if (s === 'text') {
    a = w / 2 + 6;
    b = h / 2 + 4;
    // x is where the text starts / ends; the box sits beside it
    if (n.anchor === 'start') cx += w / 2;
    if (n.anchor === 'end') cx -= w / 2;
  }
  // doodles carry their label underneath: grow the box downwards
  if (DOODLES.has(s) && n.text) {
    const extra = (n.text.split('\n').length * fontOf(n) * 1.22) / 2 + 2;
    cy += extra;
    b += extra;
  }
  const ex = tx - cx;
  const ey = ty - cy;
  let t: number;
  if (ROUND.has(s)) t = 1 / Math.hypot(ex / a, ey / b);
  else if (s === 'diamond' || s === 'diamond2') t = 1 / (Math.abs(ex) / a + Math.abs(ey) / b);
  else t = Math.min(a / Math.max(Math.abs(ex), 1e-6), b / Math.max(Math.abs(ey), 1e-6));
  return [cx + ex * Math.min(t, 1), cy + ey * Math.min(t, 1)];
}

const fillClass = (tone?: Tone) => `hw-f-${tone ?? 'paper'}`;
const pts = (list: Pt[]) => list.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

function cylinder(x0: number, y0: number, w: number, h: number, bands = 0) {
  const rx = w / 2;
  const ry = Math.min(11, h * 0.15);
  const x1 = x0 + w;
  const top = y0 + ry;
  const bottom = y0 + h - ry;
  const body = `M${x0},${top} L${x0},${bottom} A${rx},${ry} 0 0 0 ${x1},${bottom} L${x1},${top}`;
  const lines: string[] = [];
  for (let i = 1; i <= bands; i++) {
    const y = top + ((bottom - top) * i) / (bands + 1);
    lines.push(`M${x0},${y} A${rx},${ry} 0 0 0 ${x1},${y}`);
  }
  return { body, lines, top, rx, ry, cx: x0 + rx };
}

function cloudPath(cx: number, cy: number, w: number, h: number) {
  const a = w * 0.43;
  const b = h * 0.38;
  const n = 11;
  const p: Pt[] = Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2 + 0.2;
    return [cx + a * Math.cos(t), cy + b * Math.sin(t)];
  });
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const q = p[(i + 1) % n];
    const r = Math.hypot(q[0] - p[i][0], q[1] - p[i][1]) * 0.6;
    d += ` A${r.toFixed(1)},${r.toFixed(1)} 0 0 1 ${q[0].toFixed(1)},${q[1].toFixed(1)}`;
  }
  return d + 'Z';
}

/** Small drawings: a monitor, a server tower, a cylinder, a person, a laptop. */
export function Doodle({ kind, x, y, w, h, tone, fill: fillOverride }: { kind: SketchIcon; x: number; y: number; w: number; h: number; tone?: Tone; fill?: string }) {
  const cx = x + w / 2;
  const x1 = x + w;
  const y1 = y + h;
  const fill = fillOverride ?? fillClass(tone ?? 'blue');
  switch (kind) {
    case 'pc':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h * 0.7} rx={3} className="hw-s hw-f-paper" />
          <rect x={x + 4} y={y + 4} width={w - 8} height={h * 0.7 - 8} rx={1.5} className={`hw-s hw-thin ${fill}`} />
          <path d={`M${cx},${y + h * 0.7} L${cx},${y + h * 0.88} M${x + w * 0.26},${y1} L${x1 - w * 0.26},${y1} L${cx + w * 0.1},${y + h * 0.88} L${cx - w * 0.1},${y + h * 0.88} Z`} className="hw-s hw-f-paper" />
        </g>
      );
    case 'server':
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={3} className={`hw-s ${fill}`} />
          {[0.22, 0.4, 0.58].map((f) => (
            <path key={f} d={`M${x + 5},${y + h * f} L${x1 - 5},${y + h * f}`} className="hw-s hw-thin" />
          ))}
          <circle cx={cx} cy={y + h * 0.8} r={2.2} className="hw-s hw-thin hw-f-ink" />
        </g>
      );
    case 'laptop':
      return (
        <g>
          <rect x={x + w * 0.12} y={y} width={w * 0.76} height={h * 0.7} rx={3} className="hw-s hw-f-paper" />
          <rect x={x + w * 0.12 + 4} y={y + 4} width={w * 0.76 - 8} height={h * 0.7 - 8} rx={1.5} className={`hw-s hw-thin ${fill}`} />
          <path d={`M${x},${y1} L${x + w * 0.1},${y + h * 0.74} L${x1 - w * 0.1},${y + h * 0.74} L${x1},${y1} Z`} className="hw-s hw-f-paper" />
        </g>
      );
    case 'user':
      return (
        <g>
          <circle cx={cx} cy={y + h * 0.27} r={h * 0.22} className={`hw-s ${fill}`} />
          <path d={`M${x + w * 0.06},${y1} C${x + w * 0.06},${y + h * 0.5} ${x1 - w * 0.06},${y + h * 0.5} ${x1 - w * 0.06},${y1} Z`} className={`hw-s ${fill}`} />
        </g>
      );
    case 'db': {
      const c = cylinder(x, y, w, h, 1);
      return (
        <g>
          <path d={c.body} className={`hw-s ${fill}`} />
          {c.lines.map((d) => (
            <path key={d} d={d} className="hw-s hw-thin" />
          ))}
          <ellipse cx={c.cx} cy={c.top} rx={c.rx} ry={c.ry} className="hw-s hw-f-paper" />
        </g>
      );
    }
  }
}

function Shape({ n }: { n: SketchNode }) {
  const s = shapeOf(n);
  const [w, h] = sizeOf(n);
  const x0 = n.x - w / 2;
  const y0 = n.y - h / 2;
  const cls = `hw-s ${fillClass(n.tone)}`;
  switch (s) {
    case 'box':
      return <rect x={x0} y={y0} width={w} height={h} rx={3} className={cls} />;
    case 'box2':
      return (
        <g>
          <rect x={x0} y={y0} width={w} height={h} rx={3} className={cls} />
          <rect x={x0 + 4} y={y0 + 4} width={w - 8} height={h - 8} rx={2} className="hw-s hw-thin hw-f-none" />
        </g>
      );
    case 'pill':
      return <rect x={x0} y={y0} width={w} height={h} rx={h / 2} className={cls} />;
    case 'note':
      return <rect x={x0} y={y0} width={w} height={h} rx={4} className={`${cls} hw-dash`} />;
    case 'diamond':
      return <polygon points={pts([[n.x, y0], [x0 + w, n.y], [n.x, y0 + h], [x0, n.y]])} className={cls} />;
    case 'diamond2':
      return (
        <g>
          <polygon points={pts([[n.x, y0], [x0 + w, n.y], [n.x, y0 + h], [x0, n.y]])} className={cls} />
          <polygon points={pts([[n.x, y0 + 7], [x0 + w - 11, n.y], [n.x, y0 + h - 7], [x0 + 11, n.y]])} className="hw-s hw-thin hw-f-none" />
        </g>
      );
    case 'oval':
    case 'circle':
      return <ellipse cx={n.x} cy={n.y} rx={w / 2} ry={h / 2} className={cls} />;
    case 'ovalDash':
      return <ellipse cx={n.x} cy={n.y} rx={w / 2} ry={h / 2} className={`${cls} hw-dash`} />;
    case 'oval2':
      return (
        <g>
          <ellipse cx={n.x} cy={n.y} rx={w / 2} ry={h / 2} className={cls} />
          <ellipse cx={n.x} cy={n.y} rx={w / 2 - 4.5} ry={h / 2 - 4.5} className="hw-s hw-thin hw-f-none" />
        </g>
      );
    case 'db': {
      const c = cylinder(x0, y0, w, h, n.bands ?? 0);
      return (
        <g>
          <path d={c.body} className={cls} />
          {c.lines.map((d) => (
            <path key={d} d={d} className="hw-s hw-thin hw-f-none" />
          ))}
          <ellipse cx={c.cx} cy={c.top} rx={c.rx} ry={c.ry} className="hw-s hw-f-paper" />
        </g>
      );
    }
    case 'cloud':
      return (
        <g>
          <path d={cloudPath(n.x, n.y, w, h)} className={cls} />
          <ellipse cx={n.x - w * 0.36} cy={n.y + h * 0.47} rx={9} ry={6.5} className={cls} />
          <ellipse cx={n.x - w * 0.45} cy={n.y + h * 0.58} rx={5} ry={3.8} className={cls} />
        </g>
      );
    case 'pc':
    case 'server':
    case 'laptop':
    case 'user':
      return <Doodle kind={s} x={x0} y={y0} w={w} h={h} tone={n.tone} />;
    default:
      return null;
  }
}

function Label({ n }: { n: SketchNode }) {
  if (!n.text) return null;
  const s = shapeOf(n);
  const [, h] = sizeOf(n);
  const fs = fontOf(n);
  const lh = fs * 1.22;
  const lines = n.text.split('\n');
  const anchor = n.anchor ?? 'middle';
  let cx = n.x;
  let cy = n.y;
  if (n.icon) cx += 15;
  if (s === 'db') cy += Math.min(11, h * 0.15) * 0.7;
  if (DOODLES.has(s)) cy = n.y + h / 2 + 4 + (lines.length * lh) / 2;
  const first = cy - ((lines.length - 1) * lh) / 2;
  return (
    <text
      textAnchor={anchor}
      className={`hw-t${n.bold ? ' hw-t-b' : ''}${n.key ? ' hw-t-key' : ''}`}
      style={{ fontSize: fs }}
    >
      {lines.map((l, i) => (
        <tspan key={i} x={cx} y={first + i * lh + fs * 0.34}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

function arrowHead(tip: Pt, from: Pt, len = 9) {
  const ang = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
  const a: Pt = [tip[0] - len * Math.cos(ang - 0.45), tip[1] - len * Math.sin(ang - 0.45)];
  const b: Pt = [tip[0] - len * Math.cos(ang + 0.45), tip[1] - len * Math.sin(ang + 0.45)];
  return `M${pts([a])} L${pts([tip])} L${pts([b])}`;
}

interface EdgeGeo {
  d: string;
  heads: string;
  mid: Pt;
  e: SketchEdge;
}

function edgeGeometry(e: SketchEdge, nodes: Map<string, SketchNode>): EdgeGeo | null {
  const A = nodes.get(e.from);
  const B = nodes.get(e.to);
  if (!A || !B) {
    if (import.meta.env.DEV) console.warn(`[notebooks] sketch edge ${e.from} → ${e.to} names a missing node`);
    return null;
  }
  let d: string;
  let start: Pt;
  let end: Pt;
  let startFrom: Pt;
  let endFrom: Pt;
  let mid: Pt;
  if (e.curve) {
    const len = Math.hypot(B.x - A.x, B.y - A.y) || 1;
    const c: Pt = [(A.x + B.x) / 2 - ((B.y - A.y) / len) * e.curve, (A.y + B.y) / 2 + ((B.x - A.x) / len) * e.curve];
    start = exitPoint(A, c[0], c[1]);
    end = exitPoint(B, c[0], c[1]);
    d = `M${pts([start])} Q${pts([c])} ${pts([end])}`;
    startFrom = endFrom = c;
    mid = [0.25 * start[0] + 0.5 * c[0] + 0.25 * end[0], 0.25 * start[1] + 0.5 * c[1] + 0.25 * end[1]];
  } else {
    const via = e.via ?? [];
    start = exitPoint(A, ...(via[0] ?? [B.x, B.y]));
    end = exitPoint(B, ...(via[via.length - 1] ?? [A.x, A.y]));
    const all: Pt[] = [start, ...via, end];
    d = 'M' + all.map((p) => pts([p])).join(' L');
    startFrom = all[1];
    endFrom = all[all.length - 2];
    const k = Math.floor((all.length - 1) / 2);
    mid = [(all[k][0] + all[k + 1][0]) / 2, (all[k][1] + all[k + 1][1]) / 2];
  }
  const arrow = e.arrow ?? 'to';
  const heads = [
    arrow === 'to' || arrow === 'both' ? arrowHead(end, endFrom) : '',
    arrow === 'from' || arrow === 'both' ? arrowHead(start, startFrom) : '',
  ]
    .join(' ')
    .trim();
  return { d, heads, mid, e };
}

function EdgeLine({ g }: { g: EdgeGeo }) {
  return (
    <g>
      {g.e.double ? (
        <>
          <path d={g.d} className="hw-s hw-line hw-double-out" />
          <path d={g.d} className="hw-line hw-double-in" />
        </>
      ) : (
        <path d={g.d} className={`hw-s hw-line${g.e.dash ? ' hw-dash' : ''}`} />
      )}
      {g.heads && <path d={g.heads} className="hw-s hw-line" />}
    </g>
  );
}

export function SketchView({ d }: { d: Sketch }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const nodes = new Map(d.nodes.map((n) => [n.id, n]));
  const edges = (d.edges ?? []).map((e) => edgeGeometry(e, nodes)).filter((g): g is EdgeGeo => g !== null);
  const alt = d.alt ?? d.nodes.map((n) => n.text?.replace(/\n/g, ' ')).filter(Boolean).join(', ');
  return (
    <svg className="hw-sketch" viewBox={`0 0 ${d.w} ${d.h}`} style={{ maxWidth: d.w }} role="img" aria-label={alt}>
      <defs>
        <Wobble id={`hw${uid}`} w={d.w} h={d.h} />
      </defs>
      <g filter={`url(#hw${uid})`}>
        {edges.map((g, i) => (
          <EdgeLine key={i} g={g} />
        ))}
        {d.nodes.map((n) => (
          <Shape key={n.id} n={n} />
        ))}
        {d.nodes
          .filter((n) => n.icon)
          .map((n) => {
            const [w, h] = sizeOf(n);
            const ih = Math.min(24, h - 10);
            return <Doodle key={n.id + ':icon'} kind={n.icon!} x={n.x - w / 2 + 8} y={n.y - ih / 2} w={ih * 1.1} h={ih} fill={n.tone ? 'hw-f-paper' : undefined} />;
          })}
      </g>
      {d.nodes.map((n) => (
        <Label key={n.id} n={n} />
      ))}
      {edges
        .filter((g) => g.e.label)
        .map((g, i) => (
          <text key={i} x={g.mid[0] + (g.e.lx ?? 0)} y={g.mid[1] + (g.e.ly ?? 0) + 4.5} textAnchor="middle" className="hw-t hw-t-edge">
            {g.e.label}
          </text>
        ))}
    </svg>
  );
}

/** Pen wobble. userSpaceOnUse so perfectly straight lines (zero-height boxes) still render. */
export function Wobble({ id, w, h, scale = 2.3 }: { id: string; w: number; h: number; scale?: number }) {
  return (
    <filter id={id} filterUnits="userSpaceOnUse" x={-20} y={-20} width={w + 40} height={h + 40}>
      <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={4} />
      <feDisplacementMap in="SourceGraphic" scale={scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
}
