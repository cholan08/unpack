/**
 * Hand-drawn geometry for the roadmap graph. Everything is deterministic (seeded by node id),
 * so the map looks sketched but never changes between visits or renders.
 */

export type Pt = [number, number];

/** FNV-1a string hash → unsigned 32-bit int. */
export function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Repeatable pseudo-random number in [0, 1) for (seed, i). */
export function rand(seed: number, i: number): number {
  let t = (seed + Math.imul(i + 1, 0x9e3779b9)) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const f = (n: number) => n.toFixed(1);

/** Smooth closed curve through points (Catmull-Rom → cubic Bézier). */
function closedSpline(pts: Pt[]): string {
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}

/**
 * Hand-drawn look on or off. Off (the site's clean "Studio" design): circles are true circles and
 * polygons keep only their softened corners. On: radii drift and sides bow, like a pen sketch.
 * Positions and sizes are the same either way, so the layout (and QA) don't change.
 */
export const SKETCHY = false;

/** A circle drawn by hand: the radius drifts a little as the pen goes round. */
export function wobblyCircle(r: number, seed: number, amp = 0.045, n = 10): string {
  if (!SKETCHY) return `M${f(-r)} 0A${f(r)} ${f(r)} 0 1 0 ${f(r)} 0A${f(r)} ${f(r)} 0 1 0 ${f(-r)} 0Z`;
  const rot = rand(seed, 99) * Math.PI * 2;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const rr = r * (1 + (rand(seed, i) - 0.5) * 2 * amp);
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return closedSpline(pts);
}

/** A polygon whose sides bow slightly, with softened corners. */
export function wobblyPoly(corners: Pt[], seed: number, amp = 2.2): string {
  if (!SKETCHY) amp = 0;
  const pts: Pt[] = [];
  corners.forEach((c, i) => {
    const nx = corners[(i + 1) % corners.length];
    pts.push([c[0] + (rand(seed, i * 3) - 0.5) * amp, c[1] + (rand(seed, i * 3 + 1) - 0.5) * amp]);
    const bow = (rand(seed, i * 3 + 2) - 0.5) * amp * 2;
    const mx = (c[0] + nx[0]) / 2;
    const my = (c[1] + nx[1]) / 2;
    const len = Math.hypot(nx[0] - c[0], nx[1] - c[1]) || 1;
    pts.push([mx - ((nx[1] - c[1]) / len) * bow, my + ((nx[0] - c[0]) / len) * bow]);
  });
  // polyline with gently rounded joins
  let d = '';
  pts.forEach((p, i) => {
    const prev = pts[(i - 1 + pts.length) % pts.length];
    const next = pts[(i + 1) % pts.length];
    const a: Pt = [p[0] + (prev[0] - p[0]) * 0.18, p[1] + (prev[1] - p[1]) * 0.18];
    const b: Pt = [p[0] + (next[0] - p[0]) * 0.18, p[1] + (next[1] - p[1]) * 0.18];
    d += `${i ? 'L' : 'M'}${f(a[0])} ${f(a[1])}Q${f(p[0])} ${f(p[1])} ${f(b[0])} ${f(b[1])}`;
  });
  return d + 'Z';
}

/** A star burst (for the finish line). */
export function burst(r: number, inner: number, spikes: number, seed: number): string {
  const corners: Pt[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = -Math.PI / 2 + (i / (spikes * 2)) * Math.PI * 2;
    const rr = (i % 2 ? inner : r) * (SKETCHY ? 1 + (rand(seed, i) - 0.5) * 0.12 : 1);
    corners.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return wobblyPoly(corners, seed, 1.5);
}

/** Split a title into short lines for a label. */
export function wrapLabel(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= max) cur += ' ' + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  // avoid a lonely last word when the line before it has room to share
  if (lines.length > 1 && lines[lines.length - 1].length <= 3) {
    const tail = lines.pop()!;
    lines[lines.length - 1] += ' ' + tail;
  }
  return lines;
}

/** Smallest absolute difference between two angles (radians). */
export function angDist(a: number, b: number): number {
  const d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
}

/** Quadratic curve from a to b bowed sideways by `bend` × its length. Returns the control point too. */
export function bow(a: Pt, b: Pt, bend: number): { c: Pt; len: number } {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return { c: [(a[0] + b[0]) / 2 - dy * bend, (a[1] + b[1]) / 2 + dx * bend], len };
}

export const fmt = f;
