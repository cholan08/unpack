import type { LinkSpec, NodeSpec, Route } from './types';

export interface Pt {
  x: number;
  y: number;
}

export interface Rect {
  x: number; // centre
  y: number;
  w: number;
  h: number;
}

const CODE_LINE_H = 19;

/** Natural size of a node when the author didn't give one. */
export function nodeSize(n: NodeSpec): { w: number; h: number } {
  const given = (w: number, h: number) => ({ w: n.w ?? w, h: n.h ?? h });
  switch (n.kind) {
    case 'box':
      return given(n.sub ? 176 : 156, n.sub ? 64 : 54);
    case 'browser':
      return given(250, 170);
    case 'db':
      return given(140, 110);
    case 'actor':
      return given(96, 92);
    case 'stack':
      return given(210, 230);
    case 'queue':
      return given(330, 82);
    case 'code': {
      const lines = n.code.split('\n').length;
      return given(320, 38 + lines * CODE_LINE_H + 14);
    }
    case 'doc':
      return given(250, 54 + n.fields.length * 21 + 26);
    case 'chip':
      return given(Math.max(64, 30 + (n.label?.length ?? 4) * 7.6 + (n.icon ? 20 : 0)), 32);
    case 'dot':
      return given(30, 30);
    case 'zone':
      return given(300, 400);
    case 'note':
      return given(220, 44);
  }
}

export function rectOf(n: NodeSpec): Rect {
  const s = nodeSize(n);
  return { x: n.x, y: n.y, w: s.w, h: s.h };
}

/** Where the ray from the centre of `r` towards `p` leaves the rectangle. */
function edgePoint(r: Rect, toward: Pt, pad = 4): Pt {
  const dx = toward.x - r.x;
  const dy = toward.y - r.y;
  if (dx === 0 && dy === 0) return { x: r.x, y: r.y };
  const hw = r.w / 2 + pad;
  const hh = r.h / 2 + pad;
  const sx = dx === 0 ? Infinity : hw / Math.abs(dx);
  const sy = dy === 0 ? Infinity : hh / Math.abs(dy);
  const s = Math.min(sx, sy);
  return { x: r.x + dx * s, y: r.y + dy * s };
}

const side = (r: Rect, dir: 'l' | 'r' | 't' | 'b', pad = 4): Pt =>
  dir === 'l'
    ? { x: r.x - r.w / 2 - pad, y: r.y }
    : dir === 'r'
      ? { x: r.x + r.w / 2 + pad, y: r.y }
      : dir === 't'
        ? { x: r.x, y: r.y - r.h / 2 - pad }
        : { x: r.x, y: r.y + r.h / 2 + pad };

/** The polyline a link follows between two node rectangles. */
export function linkPoints(a: Rect, b: Rect, route: Route = 'straight', bend = 44): Pt[] {
  const right = b.x >= a.x;
  const down = b.y >= a.y;
  switch (route) {
    case 'left':
    case 'right': {
      const s = route === 'left' ? 'l' : 'r';
      const p0 = side(a, s);
      const p3 = side(b, s);
      const x = route === 'left' ? Math.min(p0.x, p3.x) - bend : Math.max(p0.x, p3.x) + bend;
      return [p0, { x, y: p0.y }, { x, y: p3.y }, p3];
    }
    case 'over':
    case 'under': {
      const s = route === 'over' ? 't' : 'b';
      const p0 = side(a, s);
      const p3 = side(b, s);
      const y = route === 'over' ? Math.min(p0.y, p3.y) - bend : Math.max(p0.y, p3.y) + bend;
      return [p0, { x: p0.x, y }, { x: p3.x, y }, p3];
    }
    case 'hv': {
      const p0 = side(a, right ? 'r' : 'l');
      const p2 = side(b, down ? 't' : 'b');
      return [p0, { x: p2.x, y: p0.y }, p2];
    }
    case 'vh': {
      const p0 = side(a, down ? 'b' : 't');
      const p2 = side(b, right ? 'l' : 'r');
      return [p0, { x: p0.x, y: p2.y }, p2];
    }
    case 'hvh': {
      const p0 = side(a, right ? 'r' : 'l');
      const p3 = side(b, right ? 'l' : 'r');
      const mx = (p0.x + p3.x) / 2;
      return [p0, { x: mx, y: p0.y }, { x: mx, y: p3.y }, p3];
    }
    case 'vhv': {
      const p0 = side(a, down ? 'b' : 't');
      const p3 = side(b, down ? 't' : 'b');
      const my = (p0.y + p3.y) / 2;
      return [p0, { x: p0.x, y: my }, { x: p3.x, y: my }, p3];
    }
    default: {
      // Straight: if the boxes share a band on one axis, run a clean level line through it.
      const yLo = Math.max(a.y - a.h / 2, b.y - b.h / 2);
      const yHi = Math.min(a.y + a.h / 2, b.y + b.h / 2);
      const xLo = Math.max(a.x - a.w / 2, b.x - b.w / 2);
      const xHi = Math.min(a.x + a.w / 2, b.x + b.w / 2);
      const bandY = yHi - yLo > 14;
      const bandX = xHi - xLo > 14;
      if (bandY && !bandX) {
        // the smaller box's centre if it fits the band, else the band's middle
        const small = a.h <= b.h ? a : b;
        const y = small.y > yLo + 6 && small.y < yHi - 6 ? small.y : (yLo + yHi) / 2;
        return [side({ ...a, y }, right ? 'r' : 'l'), side({ ...b, y }, right ? 'l' : 'r')];
      }
      if (bandX && !bandY) {
        const small = a.w <= b.w ? a : b;
        const x = small.x > xLo + 6 && small.x < xHi - 6 ? small.x : (xLo + xHi) / 2;
        return [side({ ...a, x }, down ? 'b' : 't'), side({ ...b, x }, down ? 't' : 'b')];
      }
      return [edgePoint(a, b), edgePoint(b, a)];
    }
  }
}

/** SVG path with rounded elbows. */
export function pathD(pts: Pt[], radius = 12): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const prev = pts[i - 1];
    const next = pts[i + 1];
    const r = Math.min(radius, dist(prev, p) / 2, dist(p, next) / 2);
    const a = toward(p, prev, r);
    const b = toward(p, next, r);
    d += ` L${a.x.toFixed(1)},${a.y.toFixed(1)} Q${p.x.toFixed(1)},${p.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L${last.x.toFixed(1)},${last.y.toFixed(1)}`;
  return d;
}

export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

function toward(from: Pt, to: Pt, d: number): Pt {
  const len = dist(from, to) || 1;
  return { x: from.x + ((to.x - from.x) / len) * d, y: from.y + ((to.y - from.y) / len) * d };
}

export function polyLength(pts: Pt[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
  return l;
}

/** Point at distance `d` along the polyline. */
export function pointAt(pts: Pt[], d: number): Pt {
  if (d <= 0) return pts[0];
  for (let i = 1; i < pts.length; i++) {
    const seg = dist(pts[i - 1], pts[i]);
    if (d <= seg) {
      const t = seg === 0 ? 0 : d / seg;
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t };
    }
    d -= seg;
  }
  return pts[pts.length - 1];
}

/** Midpoint along the polyline — where link labels sit. */
export function midpoint(pts: Pt[]): Pt {
  return pointAt(pts, polyLength(pts) / 2);
}

export const linkId = (l: Pick<LinkSpec, 'from' | 'to'>) => `${l.from}>${l.to}`;

export interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The smallest world rectangle that holds every node of every scene (plus captions,
 * badges and arcing links). Used as a steady camera for a whole lesson.
 */
export function frameOf(scenes: { nodes: Record<string, NodeSpec>; links?: LinkSpec[] }[], pad = 26): View | undefined {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const sc of scenes) {
    const rects = new Map<string, Rect>();
    for (const [id, n] of Object.entries(sc.nodes)) {
      const r = rectOf(n);
      rects.set(id, r);
      const above = n.kind === 'dot' && n.caption === 'above';
      const extraTop = above ? 42 : n.badge ? 14 : 0;
      const extraBottom = n.kind === 'browser' && n.label ? 30 : n.kind === 'dot' && !above ? 42 : n.meter !== undefined ? 16 : 0;
      x0 = Math.min(x0, r.x - r.w / 2);
      x1 = Math.max(x1, r.x + r.w / 2);
      y0 = Math.min(y0, r.y - r.h / 2 - extraTop);
      y1 = Math.max(y1, r.y + r.h / 2 + extraBottom);
    }
    for (const l of sc.links ?? []) {
      if (l.route === 'left' || l.route === 'right') {
        const a = rects.get(l.from);
        const b = rects.get(l.to);
        if (!a || !b) continue;
        const bend = l.bend ?? 44;
        if (l.route === 'right') x1 = Math.max(x1, Math.max(a.x + a.w / 2, b.x + b.w / 2) + bend + 10);
        else x0 = Math.min(x0, Math.min(a.x - a.w / 2, b.x - b.w / 2) - bend - 10);
        continue;
      }
      if (l.route !== 'over' && l.route !== 'under') continue;
      const a = rects.get(l.from);
      const b = rects.get(l.to);
      if (!a || !b) continue;
      const bend = l.bend ?? 44;
      if (l.route === 'over') y0 = Math.min(y0, Math.min(a.y - a.h / 2, b.y - b.h / 2) - bend - 16);
      else y1 = Math.max(y1, Math.max(a.y + a.h / 2, b.y + b.h / 2) + bend + 16);
    }
  }
  if (!Number.isFinite(x0)) return undefined;
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
}
