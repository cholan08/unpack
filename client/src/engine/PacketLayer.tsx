import { useEffect, useRef, type MutableRefObject } from 'react';
import { linkPoints, pointAt, polyLength, type Pt, type Rect } from './geometry';
import type { FlowSpec, LinkSpec, PacketKind } from './types';

const BASE_SPEED = 290; // world units per second
const DEFAULT_EVERY = 2.8;
const DEFAULT_DWELL = 0.18;
const BURST = 0.75;

type Seg =
  | { t: 'move'; pts: Pt[]; dur: number; kind: PacketKind; label?: string; end: string }
  | { t: 'wait'; at: Pt; dur: number; kind: PacketKind; label?: string };

interface Timeline {
  segs: Seg[];
  total: number;
  burstAt?: Pt;
}

function hopPoints(a: string, b: string, links: LinkSpec[], layout: Map<string, Rect>): Pt[] | null {
  const ra = layout.get(a);
  const rb = layout.get(b);
  if (!ra || !rb) return null;
  const fwd = links.find((l) => l.from === a && l.to === b);
  if (fwd) return linkPoints(ra, rb, fwd.route, fwd.bend);
  const rev = links.find((l) => l.from === b && l.to === a);
  if (rev) return linkPoints(rb, ra, rev.route, rev.bend).slice().reverse();
  return linkPoints(ra, rb, 'straight');
}

function buildTimeline(f: FlowSpec, links: LinkSpec[], layout: Map<string, Rect>): Timeline | null {
  const speed = BASE_SPEED * (f.speed ?? 1);
  const dwell = f.dwell ?? DEFAULT_DWELL;
  const kind = f.kind ?? 'req';
  const segs: Seg[] = [];
  const legs: { from: string; to: string; kind: PacketKind; label?: string }[] = [];
  const pick = (l: string | string[] | undefined, i: number) => (Array.isArray(l) ? l[i] : l);
  for (let i = 0; i < f.path.length - 1; i++) legs.push({ from: f.path[i], to: f.path[i + 1], kind, label: pick(f.label, i) });
  if (f.back && !f.fail) {
    const ret = f.returnVia ?? [...f.path].reverse();
    for (let j = 0; j < ret.length - 1; j++) legs.push({ from: ret[j], to: ret[j + 1], kind: f.back, label: pick(f.backLabel, j) });
  }
  let total = 0;
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const pts = hopPoints(leg.from, leg.to, links, layout);
    if (!pts) return null;
    if (i > 0) {
      const turnaround = f.back && i === f.path.length - 1;
      const w = turnaround ? dwell * 2.2 : dwell;
      if (w > 0) {
        segs.push({ t: 'wait', at: pts[0], dur: w, kind: leg.kind, label: leg.label });
        total += w;
      }
    }
    const dur = Math.max(0.25, polyLength(pts) / speed);
    segs.push({ t: 'move', pts, dur, kind: leg.kind, label: leg.label, end: leg.to });
    total += dur;
  }
  const last = segs[segs.length - 1];
  const tl: Timeline = { segs, total };
  if (f.fail && last?.t === 'move') {
    tl.burstAt = last.pts[last.pts.length - 1];
    tl.total += BURST;
  }
  return tl;
}

interface Sample {
  p: Pt;
  tail: Pt[];
  kind: PacketKind;
  label?: string;
  burst?: number; // 0..1 progress of the rejection burst
}

function sample(tl: Timeline, tau: number): Sample | null {
  let t = tau;
  for (const s of tl.segs) {
    if (t <= s.dur) {
      if (s.t === 'wait') return { p: s.at, tail: [], kind: s.kind, label: s.label };
      const len = polyLength(s.pts);
      const d = (t / s.dur) * len;
      const p = pointAt(s.pts, d);
      const tail = [pointAt(s.pts, d - 10), pointAt(s.pts, d - 20)];
      return { p, tail, kind: s.kind, label: s.label };
    }
    t -= s.dur;
  }
  if (tl.burstAt && t <= BURST) return { p: tl.burstAt, tail: [], kind: 'err', burst: t / BURST };
  return null;
}

const SVGNS = 'http://www.w3.org/2000/svg';

function makePacket(): SVGGElement {
  const g = document.createElementNS(SVGNS, 'g');
  g.setAttribute('class', 'pk');
  g.innerHTML =
    '<circle class="pk-tail pk-tail-2" r="3.5"></circle><circle class="pk-tail pk-tail-1" r="5"></circle>' +
    '<circle class="pk-dot" r="7.5"></circle>' +
    '<g class="pk-burst"><circle r="10"></circle><path d="M-5,-5 L5,5 M5,-5 L-5,5"></path></g>' +
    '<g class="pk-label"><rect rx="5" ry="5" height="18"></rect><text dy="12.5"></text></g>';
  return g;
}

export function PacketLayer({
  flows,
  links,
  layout,
  playing,
  speed,
  resetKey,
  world,
  w,
  h,
}: {
  flows: FlowSpec[];
  links: LinkSpec[];
  layout: MutableRefObject<Map<string, Rect>>;
  playing: boolean;
  speed: number;
  resetKey: unknown;
  world: MutableRefObject<HTMLDivElement | null>;
  w: number;
  h: number;
}) {
  const layer = useRef<SVGGElement>(null);
  const clock = useRef(0);
  const props = useRef({ flows, links, playing, speed });
  props.current = { flows, links, playing, speed };

  // New step: restart the clock. Paused steps show a frozen frame with packets mid-flight.
  useEffect(() => {
    clock.current = props.current.playing ? -0.45 : 0.9;
  }, [resetKey]);

  useEffect(() => {
    const g = layer.current!;
    const pool: SVGGElement[] = [];
    let last = performance.now();
    let raf = 0;

    const pulse = (id: string, kind: PacketKind) => {
      const el = world.current?.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"] > .node-ring`);
      if (!el) return;
      el.style.setProperty('--hit', `var(--pk-${kind})`);
      el.animate(
        [
          { opacity: 0.9, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(1.06)' },
        ],
        { duration: 520, easing: 'cubic-bezier(.2,.7,.3,1)' },
      );
    };

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const { flows, links, playing, speed } = props.current;
      const prev = clock.current;
      if (playing) clock.current += dt * speed;
      const c = clock.current;
      const out: Sample[] = [];

      for (const f of flows) {
        const tl = buildTimeline(f, links, layout.current);
        if (!tl) continue;
        const every = f.every ?? DEFAULT_EVERY;
        const offset = f.offset ?? 0;
        const kMax = f.once ? 0 : Math.floor((c - offset) / every);
        const kMin = f.once ? 0 : Math.max(0, Math.ceil((c - offset - tl.total) / every));
        for (let k = kMin; k <= kMax; k++) {
          const start = offset + k * every;
          const tau = c - start;
          if (tau < 0 || tau > tl.total) continue;
          const s = sample(tl, tau);
          if (s) out.push(s);
          // Pulse nodes the packet reached since the last frame.
          if (playing && c > prev) {
            const tauPrev = prev - start;
            let acc = 0;
            for (const seg of tl.segs) {
              acc += seg.dur;
              if (seg.t === 'move' && tauPrev < acc && tau >= acc) pulse(seg.end, seg.kind);
            }
          }
        }
      }

      while (pool.length < out.length) {
        const p = makePacket();
        g.appendChild(p);
        pool.push(p);
      }
      pool.forEach((el, i) => {
        const s = out[i];
        if (!s) {
          el.style.display = 'none';
          return;
        }
        el.style.display = '';
        el.setAttribute('class', `pk pk--${s.kind}${s.burst !== undefined ? ' is-burst' : ''}`);
        const [dot, burst, label] = [el.children[2], el.children[3], el.children[4]] as SVGElement[];
        const [t1, t2] = [el.children[1], el.children[0]] as SVGCircleElement[];
        dot.setAttribute('cx', String(s.p.x));
        dot.setAttribute('cy', String(s.p.y));
        t1.setAttribute('cx', String(s.tail[0]?.x ?? s.p.x));
        t1.setAttribute('cy', String(s.tail[0]?.y ?? s.p.y));
        t2.setAttribute('cx', String(s.tail[1]?.x ?? s.p.x));
        t2.setAttribute('cy', String(s.tail[1]?.y ?? s.p.y));
        if (s.burst !== undefined) {
          const e = 1 - Math.pow(1 - s.burst, 3);
          burst.setAttribute('transform', `translate(${s.p.x},${s.p.y}) scale(${0.6 + e * 1.4})`);
          burst.style.opacity = String(1 - s.burst);
        }
        if (s.label && s.burst === undefined) {
          const text = label.children[1] as SVGTextElement;
          const rect = label.children[0] as SVGRectElement;
          if (text.textContent !== s.label) text.textContent = s.label;
          const width = s.label.length * 6.25 + 14;
          rect.setAttribute('width', String(width));
          rect.setAttribute('x', String(-width / 2));
          text.setAttribute('x', '0');
          label.setAttribute('transform', `translate(${s.p.x},${s.p.y - 30})`);
          label.style.display = '';
        } else {
          label.style.display = 'none';
        }
      });

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      pool.forEach((p) => p.remove());
    };
  }, [layout, world]);

  return (
    <svg className="stage-layer stage-packets" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden>
      <g ref={layer} />
    </svg>
  );
}
