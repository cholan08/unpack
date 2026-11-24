/**
 * A small force-directed layout — the physics behind Obsidian-style graph views — with
 * d3-force's semantics but no dependency. Links are springs, every node pushes every other
 * away, a weak pull keeps the whole thing centred, and nodes keep a little personal space.
 * Tick-based and seeded: the same graph from the same start always settles into the same shape.
 * Brute-force pairs are fine at this size (a course is ~100 nodes).
 */
export interface FNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Held here while it's being dragged. */
  fx: number | null;
  fy: number | null;
  /** Personal space (collision radius). */
  r: number;
  /** How hard it pushes others away. */
  charge: number;
}
export interface FLink {
  id: string;
  s: FNode;
  t: FNode;
  /** Rest length. */
  dist: number;
  /** Spring stiffness, 0..1. */
  k: number;
  /** Share of the correction the target takes (the less-connected end moves more). */
  bias: number;
}

/** Multipliers the reader can play with (1 = the tuned defaults). */
export interface Forces {
  repel: number;
  spread: number;
  gravity: number;
}
export const DEFAULT_FORCES: Forces = { repel: 1, spread: 1, gravity: 1 };

const D_MIN2 = 24 * 24;
const D_MAX2 = 1100 * 1100;
const GRAVITY = 0.045;
const COLLIDE = 0.75;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export class ForceSim {
  alpha = 1;
  alphaTarget = 0;
  alphaMin = 0.003;
  alphaDecay = 1 - Math.pow(0.003, 1 / 280);
  velocityDecay = 0.4;
  forces: Forces = { ...DEFAULT_FORCES };
  /** Canvas width ÷ height: the pull to the middle is weaker sideways on a wide canvas, so the graph fills it. */
  aspect = 1;
  private seed = 0x2545f491;

  constructor(
    public nodes: FNode[],
    public links: FLink[],
  ) {}

  /** Still moving (or being held warm by a drag)? */
  get active() {
    return this.alpha >= this.alphaMin || this.alphaTarget > 0;
  }

  private jiggle() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return (this.seed / 4294967296 - 0.5) * 1e-6;
  }

  tick() {
    const a = (this.alpha += (this.alphaTarget - this.alpha) * this.alphaDecay);
    const { repel, spread, gravity } = this.forces;
    const N = this.nodes;

    // springs
    for (const l of this.links) {
      const { s, t } = l;
      let x = t.x + t.vx - s.x - s.vx || this.jiggle();
      let y = t.y + t.vy - s.y - s.vy || this.jiggle();
      let d = Math.sqrt(x * x + y * y);
      d = ((d - l.dist * spread) / d) * a * l.k;
      x *= d;
      y *= d;
      t.vx -= x * l.bias;
      t.vy -= y * l.bias;
      s.vx += x * (1 - l.bias);
      s.vy += y * (1 - l.bias);
    }

    // everyone pushes everyone (inverse-distance, like charged particles)
    for (let i = 0; i < N.length; i++) {
      const p = N[i];
      for (let j = i + 1; j < N.length; j++) {
        const q = N[j];
        const x = q.x - p.x || this.jiggle();
        const y = q.y - p.y || this.jiggle();
        let l = x * x + y * y;
        if (l > D_MAX2) continue;
        if (l < D_MIN2) l = Math.sqrt(D_MIN2 * l);
        const w = (a * repel) / l;
        p.vx -= x * q.charge * w;
        p.vy -= y * q.charge * w;
        q.vx += x * p.charge * w;
        q.vy += y * p.charge * w;
      }
    }

    // a gentle pull to the middle
    const g = GRAVITY * gravity * a;
    const stretch = Math.pow(clamp(this.aspect, 0.5, 2.4), 0.7);
    const gx = g / stretch;
    const gy = g * stretch;
    for (const p of N) {
      p.vx -= p.x * gx;
      p.vy -= p.y * gy;
    }

    // personal space (on where they're about to be)
    for (let i = 0; i < N.length; i++) {
      const p = N[i];
      const px = p.x + p.vx;
      const py = p.y + p.vy;
      const r2p = p.r * p.r;
      for (let j = i + 1; j < N.length; j++) {
        const q = N[j];
        const rr = p.r + q.r;
        let x = px - q.x - q.vx;
        let y = py - q.y - q.vy;
        let l = x * x + y * y;
        if (l >= rr * rr) continue;
        if (x === 0) x = this.jiggle();
        if (y === 0) y = this.jiggle();
        l = x * x + y * y;
        const d = Math.sqrt(l);
        const f = ((rr - d) / d) * COLLIDE;
        x *= f;
        y *= f;
        const r2q = q.r * q.r;
        const share = r2q / (r2p + r2q);
        p.vx += x * share;
        p.vy += y * share;
        q.vx -= x * (1 - share);
        q.vy -= y * (1 - share);
      }
    }

    // move
    const keep = 1 - this.velocityDecay;
    for (const p of N) {
      if (p.fx != null && p.fy != null) {
        p.x = p.fx;
        p.y = p.fy;
        p.vx = p.vy = 0;
        continue;
      }
      p.vx *= keep;
      p.vy *= keep;
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  /** Run until it would have come to rest. */
  settle(maxTicks = 600) {
    for (let i = 0; i < maxTicks && this.alpha >= this.alphaMin; i++) this.tick();
  }
}
