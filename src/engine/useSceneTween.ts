import { useLayoutEffect, useReducer, useRef, type MutableRefObject } from 'react';
import { rectOf, type Rect } from './geometry';
import type { NodeSpec } from './types';

export interface Placed {
  id: string;
  spec: NodeSpec;
  rect: Rect;
  opacity: number;
  scale: number;
  exiting: boolean;
}

interface Snap {
  spec: NodeSpec;
  rect: Rect;
  opacity: number;
  scale: number;
  exiting: boolean;
  order: number;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Tweens node rectangles between scene snapshots: shared ids move, new ids fade in,
 * missing ids fade out. `layout` always holds the rectangles currently on screen,
 * so links and packets can follow nodes mid-animation.
 */
export function useSceneTween(
  nodes: Record<string, NodeSpec>,
  { duration = 560, instant = false }: { duration?: number; instant?: boolean } = {},
): { placed: Placed[]; layout: MutableRefObject<Map<string, Rect>>; animating: boolean } {
  const cur = useRef(new Map<string, Snap>());
  const layout = useRef(new Map<string, Rect>());
  const raf = useRef(0);
  const animating = useRef(false);
  const first = useRef(true);
  const [, force] = useReducer((n: number) => n + 1, 0);

  useLayoutEffect(() => {
    cancelAnimationFrame(raf.current);
    const ids = Object.keys(nodes);
    const from = new Map<string, Snap>();
    const to = new Map<string, Snap>();

    ids.forEach((id, order) => {
      const spec = nodes[id];
      const rect = rectOf(spec);
      const prev = cur.current.get(id);
      to.set(id, { spec, rect, opacity: 1, scale: 1, exiting: false, order });
      from.set(id, prev && !prev.exiting ? { ...prev, spec, order } : { spec, rect, opacity: 0, scale: 0.94, exiting: false, order });
    });
    cur.current.forEach((snap, id) => {
      if (to.has(id)) return;
      from.set(id, { ...snap, exiting: true });
      to.set(id, { ...snap, opacity: 0, scale: 0.96, exiting: true });
    });

    const commit = (t: number) => {
      const next = new Map<string, Snap>();
      to.forEach((target, id) => {
        const f = from.get(id)!;
        const tm = easeInOut(t);
        const entering = f.opacity === 0 && !target.exiting;
        const tFade = target.exiting ? easeInOut(clamp01(t / 0.5)) : entering ? easeInOut(clamp01((t - 0.25) / 0.75)) : tm;
        next.set(id, {
          spec: target.spec,
          order: target.order,
          exiting: target.exiting,
          rect: {
            x: lerp(f.rect.x, target.rect.x, tm),
            y: lerp(f.rect.y, target.rect.y, tm),
            w: lerp(f.rect.w, target.rect.w, tm),
            h: lerp(f.rect.h, target.rect.h, tm),
          },
          opacity: lerp(f.opacity, target.opacity, tFade),
          scale: lerp(f.scale, target.scale, tFade),
        });
      });
      if (t >= 1) next.forEach((s, id) => s.exiting && next.delete(id));
      cur.current = next;
      const l = new Map<string, Rect>();
      next.forEach((s, id) => !s.exiting && l.set(id, s.rect));
      layout.current = l;
    };

    if (instant || first.current) {
      first.current = false;
      commit(1);
      animating.current = false;
      force();
      return;
    }

    const start = performance.now();
    animating.current = true;
    const tick = (now: number) => {
      const t = clamp01((now - start) / duration);
      commit(t);
      force();
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else animating.current = false;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [nodes, duration, instant]);

  const placed: Placed[] = [];
  cur.current.forEach((s, id) => placed.push({ id, spec: s.spec, rect: s.rect, opacity: s.opacity, scale: s.scale, exiting: s.exiting }));
  const rank = (p: Placed) => (p.spec.kind === 'zone' ? -1000 : (p.spec.z ?? 0));
  placed.sort((a, b) => rank(a) - rank(b));

  return { placed, layout, animating: animating.current };
}
