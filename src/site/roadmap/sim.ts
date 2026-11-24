import type { GNode, Graph } from './graph';

/**
 * Springs for the "play with it" feel. Every node is pulled toward its home; lessons'
 * homes ride on their hub and gates' on the two stops they join, so dragging a hub makes
 * its whole cluster trail behind like jelly. Runs only while something is moving.
 */
interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const K = 165; // spring stiffness
const C = 15; // damping (~0.6 of critical: one soft overshoot)

export class Sim {
  pos = new Map<string, Body>();
  drag: { id: string; x: number; y: number } | null = null;

  constructor(public g: Graph) {
    for (const n of g.nodes) this.pos.set(n.id, { x: n.x, y: n.y, vx: 0, vy: 0 });
  }

  get(id: string): Body {
    return this.pos.get(id)!;
  }

  private target(n: GNode): [number, number] {
    if (n.kind === 'lesson') {
      const hub = this.g.byId.get(n.hub)!;
      const hp = this.get(n.hub);
      return [hp.x + n.x - hub.x, hp.y + n.y - hub.y];
    }
    if (n.kind === 'gate') {
      const a = this.g.byId.get(n.from)!;
      const b = this.g.byId.get(n.to)!;
      const ap = this.get(n.from);
      const bp = this.get(n.to);
      return [(ap.x + bp.x) / 2 + n.x - (a.x + b.x) / 2, (ap.y + bp.y) / 2 + n.y - (a.y + b.y) / 2];
    }
    return [n.x, n.y];
  }

  /** Advance by dt seconds. Returns how much is still moving. */
  step(dt: number): number {
    let energy = 0;
    for (const n of this.g.nodes) {
      const b = this.get(n.id);
      if (this.drag?.id === n.id) {
        b.vx = (this.drag.x - b.x) / Math.max(dt, 1e-3);
        b.vy = (this.drag.y - b.y) / Math.max(dt, 1e-3);
        b.x = this.drag.x;
        b.y = this.drag.y;
        energy += 1;
        continue;
      }
      const [tx, ty] = this.target(n);
      const ax = K * (tx - b.x) - C * b.vx;
      const ay = K * (ty - b.y) - C * b.vy;
      b.vx += ax * dt;
      b.vy += ay * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      energy += Math.abs(b.vx) + Math.abs(b.vy) + Math.abs(tx - b.x) + Math.abs(ty - b.y);
    }
    return energy;
  }

  /** Put everything exactly home (after it has settled). */
  settle() {
    // twice: a gate's target depends on the hub after it
    for (let pass = 0; pass < 2; pass++)
      for (const n of this.g.nodes) {
        const b = this.get(n.id);
        const [tx, ty] = this.target(n);
        b.x = tx;
        b.y = ty;
        b.vx = b.vy = 0;
      }
  }
}
