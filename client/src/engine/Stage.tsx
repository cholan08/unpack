import { useLayoutEffect, useRef, useState } from 'react';
import { linkId, linkPoints, midpoint, pathD, type Pt, type View } from './geometry';
import { NodeView } from './nodes/NodeView';
import { DepthView } from './nodes/Depth';
import { PacketLayer } from './PacketLayer';
import { useSceneTween } from './useSceneTween';
import type { LinkSpec, Scene } from './types';
import './stage.css';

const EMPTY_LINKS: LinkSpec[] = [];

const HEAD = 10;

/** A solid triangular head at the end of the polyline. */
function arrowHead(pts: Pt[]): string {
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const p1 = { x: b.x - HEAD * Math.cos(ang - 0.42), y: b.y - HEAD * Math.sin(ang - 0.42) };
  const p2 = { x: b.x - HEAD * Math.cos(ang + 0.42), y: b.y - HEAD * Math.sin(ang + 0.42) };
  return `M${p1.x.toFixed(1)},${p1.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)} L${p2.x.toFixed(1)},${p2.y.toFixed(1)} Z`;
}

/** The line stops inside the head, so its round cap never pokes past the tip. */
function trimEnd(pts: Pt[], by: number): Pt[] {
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len <= by * 1.5) return pts;
  const t = (len - by) / len;
  return [...pts.slice(0, -1), { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }];
}

export interface StageProps {
  scene: Scene;
  w?: number;
  h?: number;
  playing?: boolean;
  speed?: number;
  /** Changes whenever the step changes; restarts the packet clock. */
  stepKey?: unknown;
  /** Below this scale the stage stops shrinking and scrolls instead (keeps labels legible). */
  minScale?: number;
  instant?: boolean;
  label?: string;
  /** The part of the world to show (defaults to all of it). See frameOf(). */
  view?: View;
}

export function Stage({ scene, w = 1000, h = 600, playing = true, speed = 1, stepKey, minScale = 0, instant, label, view }: StageProps) {
  const box = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const { placed, layout } = useSceneTween(scene.nodes, { instant });
  const links = scene.links ?? EMPTY_LINKS;
  const v = view ?? { x: 0, y: 0, w, h };

  useLayoutEffect(() => {
    const el = box.current!;
    const fit = () => {
      const cs = getComputedStyle(el);
      const cw = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const ch = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (cw <= 0 || ch <= 0) return;
      setScale(Math.max(minScale, Math.min(cw / v.w, ch / v.h)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [v.w, v.h, minScale]);

  const rects = layout.current;
  // Links fade with their endpoints so they never dangle during a transition.
  const opacityOf = new Map(placed.map((p) => [p.id, p.opacity]));

  return (
    <div className="stage" ref={box} role="img" aria-label={label}>
      <div className="stage-fit" style={{ width: v.w * scale, height: v.h * scale, visibility: scale ? 'visible' : 'hidden' }}>
        <div className="stage-world" ref={world} style={{ width: w, height: h, transform: `scale(${scale}) translate(${-v.x}px, ${-v.y}px)` }}>
          {placed
            .filter((p) => p.spec.kind === 'zone')
            .map((p) => <NodeView key={p.id} p={p} />)}

          {/* the sides of every block sit under the links, so arrows land on faces */}
          <div className="stage-layer stage-depths">
            {placed
              .filter((p) => p.spec.kind !== 'zone')
              .map((p) => <DepthView key={p.id} p={p} />)}
          </div>

          <svg className="stage-layer stage-links" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden>
            {links.map((l) => {
              const a = rects.get(l.from);
              const b = rects.get(l.to);
              if (!a || !b) return null;
              const pts = linkPoints(a, b, l.route, l.bend);
              const op = Math.min(opacityOf.get(l.from) ?? 1, opacityOf.get(l.to) ?? 1);
              const mid = l.label ? midpoint(pts) : null;
              const lw = l.label ? l.label.length * 6.1 + 14 : 0;
              return (
                <g
                  key={linkId(l)}
                  className="link"
                  data-state={l.state ?? 'idle'}
                  data-style={l.style ?? 'solid'}
                  data-tone={l.tone}
                  style={{ opacity: op }}
                >
                  <path className="link-line" d={pathD(l.arrow !== false ? trimEnd(pts, HEAD - 3) : pts)} />
                  {l.arrow !== false && <path className="link-arrow" d={arrowHead(pts)} />}
                  {l.arrow !== false && <circle className="link-origin" cx={pts[0].x} cy={pts[0].y} r={3.4} />}
                  {mid && (
                    <g className="link-label" transform={`translate(${mid.x.toFixed(1)},${mid.y.toFixed(1)})`}>
                      <rect x={-lw / 2} y={-10} width={lw} height={20} rx={6} />
                      <text y={4}>{l.label}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {placed
            .filter((p) => p.spec.kind !== 'zone')
            .map((p) => <NodeView key={p.id} p={p} />)}

          <PacketLayer
            flows={scene.flows ?? []}
            links={links}
            layout={layout}
            playing={playing}
            speed={speed}
            resetKey={stepKey ?? scene}
            world={world}
            w={w}
            h={h}
          />
        </div>
      </div>
    </div>
  );
}
