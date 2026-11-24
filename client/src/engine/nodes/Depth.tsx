import { memo, useId } from 'react';
import { BLOCK_R, COIN, ZONE_R, depthOf, extrusion } from '../geometry';
import type { Placed } from '../useSceneTween';
import type { NodeSpec, Tone } from '../types';

const DEFAULT_TONE: Partial<Record<NodeSpec['kind'], Tone>> = { browser: 'client', db: 'data', doc: 'data' };

/** Diagonal stripes in the role colour. One per extrusion, so each takes its own node's tone. */
export function Hatch({ id, gap = 5.6 }: { id: string; gap?: number }) {
  return (
    <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect className="hatch-bg" width={gap} height={gap} />
      <rect className="hatch-line" width={gap * 0.32} height={gap} />
    </pattern>
  );
}

/**
 * The sides of a block: its rounded face (w × h, r) extruded down-right by (dx, dy).
 * Positioned at the face's top-left corner; the face itself is drawn by NodeView on top.
 */
export function Extrusion({ w, h, r, dx, dy, gap }: { w: number; h: number; r: number; dx: number; dy: number; gap?: number }) {
  const id = `hatch-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const { outline, right, crease } = extrusion(w, h, r, dx, dy);
  return (
    <svg className="extrusion" width={w + dx + 4} height={h + dy + 4} viewBox={`-2 -2 ${w + dx + 4} ${h + dy + 4}`} aria-hidden>
      <defs>
        <Hatch id={id} gap={gap} />
      </defs>
      <path className="ext-side" d={outline} fill={`url(#${id})`} />
      <path className="ext-shade" d={right} />
      <path className="ext-crease" d={crease} />
      <path className="ext-edge" d={outline} />
    </svg>
  );
}

/** Where a node's extruded face sits inside its box, and how round it is. */
function faceOf(n: NodeSpec, w: number, h: number): { x: number; y: number; w: number; h: number; r: number } {
  switch (n.kind) {
    case 'actor':
      return { x: (w - COIN) / 2, y: 0, w: COIN, h: COIN, r: COIN / 2 };
    case 'chip':
    case 'dot':
      return { x: 0, y: 0, w, h, r: h / 2 };
    case 'zone':
      return { x: 0, y: 0, w, h, r: ZONE_R };
    default:
      return { x: 0, y: 0, w, h, r: BLOCK_R };
  }
}

/**
 * One block's sides, in the layer under the links (Stage.tsx). Keeps the node's tone and
 * state so the sides recolour (error, ok), lift and fade together with the face.
 */
export const DepthView = memo(function DepthView({ p }: { p: Placed }) {
  const { spec: n, rect } = p;
  const { dx, dy } = depthOf(n);
  if (!dx && !dy) return null;
  const f = faceOf(n, rect.w, rect.h);
  const state = n.state ?? 'idle';
  return (
    <div
      className={`depth depth--${n.kind} paper`}
      data-tone={n.tone ?? DEFAULT_TONE[n.kind] ?? 'neutral'}
      data-state={state}
      style={{
        left: rect.x - rect.w / 2 + f.x,
        top: rect.y - rect.h / 2 + f.y,
        width: f.w,
        height: f.h,
        opacity: p.opacity,
        transform: p.scale === 1 ? undefined : `scale(${p.scale})`,
        transformOrigin: `${rect.w / 2 - f.x}px ${rect.h / 2 - f.y}px`,
      }}
    >
      <Extrusion w={f.w} h={f.h} r={f.r} dx={dx} dy={dy} />
    </div>
  );
});
