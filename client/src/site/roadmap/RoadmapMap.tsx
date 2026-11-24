import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as RFocusEvent,
  type KeyboardEvent as RKeyboardEvent,
  type PointerEvent as RPointerEvent,
  type RefObject,
} from 'react';
import { Link } from 'react-router';
import { ArrowRight, Info, LocateFixed, Maximize2, Minus, MousePointerClick, Plus, Search, Spline, X } from 'lucide-react';
import type { Course, Tone } from '@/engine/types';
import { usePrefersReducedMotion } from '@/lib/media';
import { prefetchLessonPage } from '../prefetch';
import { buildGraph, clusterBounds, highlight, hubNodeId, lessonNodeId, type GEdge, type GNode, type Graph } from './graph';
import { NodeView } from './nodes';
import { Sim } from './sim';
import { bow, fmt } from './shapes';
import { fmtMinutes, type MapStatus } from './status';
import { Inspector } from './Inspector';

const TONES: Tone[] = ['client', 'server', 'data', 'net', 'auth', 'ai', 'neutral', 'danger', 'warn', 'ok'];
const K_MAX = 2.2;
const INSPECTOR_W = 376;
const HINT_KEY = 'unpacked:roadmap-hint';

type Cam = { x: number; y: number; k: number };
type Box = { x0: number; y0: number; x1: number; y1: number };
type Gesture =
  | { type: 'pan'; id: number; lx: number; ly: number; sx: number; sy: number; moved: boolean; vx: number; vy: number; t: number }
  | { type: 'node'; id: number; node: string; sx: number; sy: number; ox: number; oy: number; moved: boolean }
  | { type: 'pinch'; d: number; mx: number; my: number };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const pickCols = (w: number, h: number) => (w / h >= 1.3 ? 4 : w / h >= 0.95 ? 3 : 2);

/** The path for one edge, from the bodies' current positions. */
function edgeD(e: GEdge, sim: Sim, g: Graph): string {
  const a = sim.get(e.from);
  const b = sim.get(e.to);
  if (e.kind === 'spoke') return `M${fmt(a.x)} ${fmt(a.y)}L${fmt(b.x)} ${fmt(b.y)}`;
  const { c } = bow([a.x, a.y], [b.x, b.y], e.bend);
  if (e.kind !== 'thread') return `M${fmt(a.x)} ${fmt(a.y)}Q${fmt(c[0])} ${fmt(c[1])} ${fmt(b.x)} ${fmt(b.y)}`;
  // threads stop at the node outlines so the arrowhead shows
  const ra = g.byId.get(e.from)!.r + 3;
  const rb = g.byId.get(e.to)!.r + 7;
  const ua = Math.hypot(c[0] - a.x, c[1] - a.y) || 1;
  const ub = Math.hypot(c[0] - b.x, c[1] - b.y) || 1;
  const sx = a.x + ((c[0] - a.x) / ua) * ra;
  const sy = a.y + ((c[1] - a.y) / ua) * ra;
  const ex = b.x + ((c[0] - b.x) / ub) * rb;
  const ey = b.y + ((c[1] - b.y) / ub) * rb;
  return `M${fmt(sx)} ${fmt(sy)}Q${fmt(c[0])} ${fmt(c[1])} ${fmt(ex)} ${fmt(ey)}`;
}

/** Which trail segments you've walked, and the one you're on now. */
export function spineStates(g: Graph, st: MapStatus): Map<string, 'done' | 'next'> {
  const out = new Map<string, 'done' | 'next'>();
  const hasShortcut = g.edges.some((e) => e.kind === 'shortcut');
  let marked = false;
  for (const e of g.edges) {
    if (e.kind !== 'spine' && e.kind !== 'shortcut') continue;
    const from = g.byId.get(e.from)!;
    const to = g.byId.get(e.to)!;
    let done = false;
    if (e.kind === 'shortcut') done = st.anyProgress;
    else if (from.kind === 'start') done = st.anyProgress && !hasShortcut;
    else if (from.kind === 'hub') done = st.parts[from.part.id].complete;
    else if (from.kind === 'gate') {
      const gs = st.gates[from.part.id].state;
      done = gs === 'passed' || gs === 'skipped' || (to.kind === 'hub' && st.parts[to.part.id].started);
    }
    if (done) {
      out.set(e.id, 'done');
      continue;
    }
    // the stretch you're walking now: out of the start for a newcomer, else out of your current part
    const leads = st.anyProgress ? e.kind === 'spine' && from.pi >= st.current : from.kind === 'start' && (e.kind === 'shortcut') === hasShortcut;
    if (!marked && leads) {
      out.set(e.id, 'next');
      marked = true;
    }
  }
  return out;
}

interface Props {
  course: Course;
  status: MapStatus;
  placementStart: number;
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function RoadmapMap({ course, status, placementStart, selected, onSelect }: Props) {
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLSpanElement>(null);
  const miniRectRef = useRef<SVGRectElement>(null);
  const gridRef = useRef<SVGPatternElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const cols = size ? pickCols(size.w, size.h) : 4;
  const graph = useMemo(() => buildGraph(course, cols, placementStart), [course, cols, placementStart]);
  const sim = useMemo(() => new Sim(graph), [graph]);
  const [hover, setHover] = useState<string | null>(null);
  const [threads, setThreads] = useState(true);
  const [legend, setLegend] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [intro, setIntro] = useState(true);
  const [hint, setHint] = useState(() => {
    try {
      return !sessionStorage.getItem(HINT_KEY);
    } catch {
      return true;
    }
  });

  const narrow = size ? size.w < 760 : false;
  const insetR = selected && !narrow ? INSPECTOR_W : 0;
  const insetB = selected && narrow && size ? Math.round(size.h * 0.55) : 0;

  const cam = useRef<Cam>({ x: 0, y: 0, k: 0.3 });
  const live = useRef({ graph, sim, insetR, insetB, size, reduced, hover });
  live.current = { graph, sim, insetR, insetB, size, reduced, hover };
  const els = useRef<{ nodes: [SVGGElement, string][]; edges: [SVGPathElement, GEdge][] }>({ nodes: [], edges: [] });
  const gesture = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pointerInput = useRef(false);
  const kbFocus = useRef<string | null>(null);
  /** After a drag, the node springs away under a still pointer: don't flash its hover state. */
  const quietHoverUntil = useRef(0);

  const focusId = hover ?? selected;
  const hl = useMemo(() => highlight(graph, focusId), [graph, focusId]);
  const spine = useMemo(() => spineStates(graph, status), [graph, status]);
  const nextId = status.next ? lessonNodeId(status.next.lessonId) : null;

  /* ---------------- painting ---------------- */

  const placeTip = useCallback(() => {
    const tip = tipRef.current;
    const id = live.current.hover;
    if (!tip || !id) return;
    const p = live.current.sim.pos.get(id);
    const n = live.current.graph.byId.get(id);
    if (!p || !n) return;
    const { x, y, k } = cam.current;
    const sx = p.x * k + x;
    const top = (p.y - n.r) * k + y - 14;
    const below = top < 120;
    const sy = below ? (p.y + n.r) * k + y + 14 : top;
    tip.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, ${below ? '0' : '-100%'})`;
  }, []);

  const apply = useCallback(() => {
    const { x, y, k } = cam.current;
    const c = canvasRef.current;
    const w = worldRef.current;
    if (!c || !w) return;
    w.setAttribute('transform', `translate(${fmt(x)} ${fmt(y)}) scale(${k.toFixed(4)})`);
    let step = 32;
    while (step * k < 22) step *= 2;
    while (step * k > 60) step /= 2;
    // the paper grid slides and scales with the map (an SVG pattern: CSS gradient grids lose
    // their 1px lines in patches when Chrome re-rasterises part of the canvas)
    const s = Math.max(8, Math.round(step * k));
    const grid = gridRef.current;
    if (grid) {
      grid.setAttribute('width', String(s));
      grid.setAttribute('height', String(s));
      grid.setAttribute('x', String(Math.round(((x % s) + s) % s)));
      grid.setAttribute('y', String(Math.round(((y % s) + s) % s)));
      grid.firstElementChild!.setAttribute('d', `M${s - 0.5} 0V${s}M0 ${s - 0.5}H${s}`);
    }
    c.style.setProperty('--inv', (1 / k).toFixed(4));
    c.style.setProperty('--lab', clamp((k - 0.42) / 0.2, 0, 1).toFixed(3));
    c.dataset.lod = k < 0.52 ? 'far' : 'near';
    if (zoomRef.current) zoomRef.current.textContent = `${Math.round(k * 100)}%`;
    const r = miniRectRef.current;
    const sz = live.current.size;
    if (r && sz) {
      r.setAttribute('x', fmt(-x / k));
      r.setAttribute('y', fmt(-y / k));
      r.setAttribute('width', fmt(sz.w / k));
      r.setAttribute('height', fmt(sz.h / k));
    }
    placeTip();
  }, [placeTip]);

  const paint = useCallback(() => {
    const { sim: s, graph: g } = live.current;
    for (const [el, id] of els.current.nodes) {
      const b = s.pos.get(id);
      if (b) el.setAttribute('transform', `translate(${fmt(b.x)} ${fmt(b.y)})`);
    }
    for (const [el, e] of els.current.edges) el.setAttribute('d', edgeD(e, s, g));
    placeTip();
  }, [placeTip]);

  // collect the elements the springs move, then draw them
  useLayoutEffect(() => {
    const svg = canvasRef.current?.querySelector('svg.rm-svg');
    if (!svg) return;
    const byId = new Map(graph.edges.map((e) => [e.id, e]));
    els.current.nodes = [...svg.querySelectorAll<SVGGElement>('g[data-n]')].map((el) => [el, el.dataset.n!]);
    els.current.edges = [...svg.querySelectorAll<SVGPathElement>('path[data-e]')].flatMap((el) => {
      const e = byId.get(el.dataset.e!);
      return e ? [[el, e] as [SVGPathElement, GEdge]] : [];
    });
    paint();
  }, [graph, paint]);

  useLayoutEffect(() => placeTip(), [hover, placeTip]);

  /* ---------------- camera ---------------- */

  /** The part of the canvas the map can use (minus the panel, and the "next up" bar at the bottom). */
  const view = () => {
    const s = live.current.size ?? { w: 1, h: 1 };
    return { w: s.w - live.current.insetR, h: s.h - (live.current.insetB || 66) };
  };
  const kMin = () => {
    const b = live.current.graph.bounds;
    const s = live.current.size ?? { w: 1, h: 1 };
    return Math.min(0.3, 0.8 * Math.min(s.w / (b.x1 - b.x0), s.h / (b.y1 - b.y0)));
  };
  const boxCam = (b: Box, maxK: number, pad = 36): Cam => {
    const v = view();
    const k = clamp(Math.min((v.w - pad * 2) / (b.x1 - b.x0), (v.h - pad * 2) / (b.y1 - b.y0)), kMin(), maxK);
    return { k, x: v.w / 2 - ((b.x0 + b.x1) / 2) * k, y: v.h / 2 - ((b.y0 + b.y1) / 2) * k };
  };
  const pointCam = (wx: number, wy: number, k: number): Cam => {
    const v = view();
    return { k, x: v.w / 2 - wx * k, y: v.h / 2 - wy * k };
  };

  const flyRaf = useRef(0);
  const inertiaRaf = useRef(0);
  const stopMotion = () => {
    cancelAnimationFrame(flyRaf.current);
    cancelAnimationFrame(inertiaRaf.current);
    flyRaf.current = inertiaRaf.current = 0;
  };

  const flyTo = useCallback(
    (to: Cam, ms = 850) => {
      stopMotion();
      if (live.current.reduced || ms <= 0) {
        cam.current = to;
        apply();
        return;
      }
      const from = { ...cam.current };
      const s = live.current.size ?? { w: 1, h: 1 };
      const c0 = { x: (s.w / 2 - from.x) / from.k, y: (s.h / 2 - from.y) / from.k };
      const c1 = { x: (s.w / 2 - to.x) / to.k, y: (s.h / 2 - to.y) / to.k };
      const span = s.w / Math.min(from.k, to.k);
      const bump = clamp((Math.hypot(c1.x - c0.x, c1.y - c0.y) / span) * 0.4, 0, 0.4);
      const dur = ms * (1 + bump);
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        const e = easeInOut(t);
        const k = Math.exp(lerp(Math.log(from.k), Math.log(to.k), e)) * (1 - bump * Math.sin(Math.PI * t));
        const cx = lerp(c0.x, c1.x, e);
        const cy = lerp(c0.y, c1.y, e);
        cam.current = { k, x: s.w / 2 - cx * k, y: s.h / 2 - cy * k };
        if (t === 1) cam.current = to;
        apply();
        flyRaf.current = t < 1 ? requestAnimationFrame(tick) : 0;
      };
      flyRaf.current = requestAnimationFrame(tick);
    },
    [apply],
  );

  const camFor = (id: string): Cam | null => {
    const { graph: g, sim: s } = live.current;
    const n = g.byId.get(id);
    if (!n) return null;
    if (n.kind === 'hub') {
      const b = clusterBounds(g, id)!;
      const p = s.get(id);
      const dx = p.x - n.x;
      const dy = p.y - n.y;
      return boxCam({ x0: b.x0 + dx, x1: b.x1 + dx, y0: b.y0 + dy, y1: b.y1 + dy }, 1.05);
    }
    const p = s.get(id);
    const phone = (live.current.size?.w ?? 1000) < 600;
    const k = clamp(Math.max(cam.current.k, n.kind === 'lesson' ? (phone ? 0.78 : 0.95) : 0.8), kMin(), K_MAX);
    return pointCam(p.x, p.y, k);
  };
  const focusOn = (id: string, ms?: number) => {
    const c = camFor(id);
    if (c) flyTo(c, ms);
  };
  const zoomAt = (px: number, py: number, k: number) => {
    const c = cam.current;
    k = clamp(k, kMin(), K_MAX);
    const wx = (px - c.x) / c.k;
    const wy = (py - c.y) / c.k;
    cam.current = { k, x: px - wx * k, y: py - wy * k };
    apply();
  };
  const zoomBy = (f: number) => {
    const v = view();
    const c = cam.current;
    const k = clamp(c.k * f, kMin(), K_MAX);
    const wx = (v.w / 2 - c.x) / c.k;
    const wy = (v.h / 2 - c.y) / c.k;
    flyTo({ k, x: v.w / 2 - wx * k, y: v.h / 2 - wy * k }, 320);
  };
  const jumpTo = (wx: number, wy: number, smooth: boolean) => {
    const to = pointCam(wx, wy, cam.current.k);
    if (smooth) return flyTo(to, 380);
    stopMotion();
    cam.current = to;
    apply();
  };
  const fitAll = () => flyTo(boxCam(live.current.graph.bounds, 1), 700);
  // "where am I": the whole part you're in, with the next lesson circled in it
  // (on a phone a whole part is too small to read, so go to the lesson itself)
  const homeId = () =>
    live.current.size && live.current.size.w < 600 && nextId ? nextId : hubNodeId(course.parts[Math.min(status.next?.partIndex ?? status.current, course.parts.length - 1)].id);

  // size: measured before first paint, then watched
  useLayoutEffect(() => {
    const c = canvasRef.current!;
    const measure = (w: number, h: number) => setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
    const r = c.getBoundingClientRect();
    measure(r.width, r.height);
    const ro = new ResizeObserver(([e]) => measure(e.contentRect.width, e.contentRect.height));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  // first view: the whole map, then fly to where you are (or straight there without motion)
  const [ready, setReady] = useState(false);
  const initialFocus = useRef(selected);
  useLayoutEffect(() => {
    if (!size) return;
    if (!ready) {
      const target = initialFocus.current && graph.byId.has(initialFocus.current) ? initialFocus.current : homeId();
      cam.current = reduced ? (camFor(target) ?? boxCam(graph.bounds, 1)) : boxCam(graph.bounds, 1);
      apply();
      setReady(true);
      if (reduced) setIntro(false);
      return;
    }
    // the layout changed shape (resize): recentre on what matters
    focusOn(selected ?? homeId(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, size === null]);

  useEffect(() => {
    if (!ready || reduced) return;
    const target = initialFocus.current && graph.byId.has(initialFocus.current) ? initialFocus.current : homeId();
    const t1 = setTimeout(() => focusOn(target, 1250), 1000);
    const t2 = setTimeout(() => setIntro(false), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // a new selection (click, search, inspector link, back button) flies there
  const lastSel = useRef(selected);
  useEffect(() => {
    if (!ready || selected === lastSel.current) return;
    lastSel.current = selected;
    if (selected) focusOn(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, ready]);

  // keep the camera steady when the inspector opens/closes on narrow screens is handled by focusOn;
  // when the canvas resizes, keep the same world point in the middle
  const prevSize = useRef(size);
  const prevGraph = useRef(graph);
  useLayoutEffect(() => {
    const p = prevSize.current;
    const relaid = prevGraph.current !== graph;
    prevSize.current = size;
    prevGraph.current = graph;
    if (!p || !size || !ready || relaid) return;
    cam.current.x += (size.w - p.w) / 2;
    cam.current.y += (size.h - p.h) / 2;
    apply();
  }, [size, ready, apply, graph]);

  /* ---------------- springs ---------------- */

  const simRaf = useRef(0);
  const kick = useCallback(() => {
    if (simRaf.current) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000);
      last = now;
      const s = live.current.sim;
      s.step(dt / 2);
      const e = s.step(dt / 2);
      if (!s.drag && e < 0.8) {
        s.settle();
        paint();
        simRaf.current = 0;
        return;
      }
      paint();
      simRaf.current = requestAnimationFrame(tick);
    };
    simRaf.current = requestAnimationFrame(tick);
  }, [paint]);

  useEffect(
    () => () => {
      cancelAnimationFrame(simRaf.current);
      stopMotion();
    },
    [],
  );

  /* ---------------- input ---------------- */

  // focus highlights only when it came from the keyboard
  useEffect(() => {
    const kb = () => (pointerInput.current = false);
    const ptr = () => (pointerInput.current = true);
    document.addEventListener('keydown', kb, true);
    document.addEventListener('pointerdown', ptr, true);
    return () => {
      document.removeEventListener('keydown', kb, true);
      document.removeEventListener('pointerdown', ptr, true);
    };
  }, []);

  const dismissHint = () => {
    if (!hint) return;
    setHint(false);
    try {
      sessionStorage.setItem(HINT_KEY, '1');
    } catch {
      /* private mode */
    }
  };
  const local = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };
  const toWorld = (px: number, py: number) => [(px - cam.current.x) / cam.current.k, (py - cam.current.y) / cam.current.k] as const;

  const select = (id: string | null) => {
    if (id) {
      const n = graph.byId.get(id);
      if (n?.kind === 'lesson' && n.meta) prefetchLessonPage(course, n.stub.id);
    }
    onSelect(id);
  };

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const t = e.target as Element;
    if (t.closest('.rm-hud, .rm-insp')) return;
    stopMotion();
    dismissHint();
    canvasRef.current!.setPointerCapture(e.pointerId);
    const [px, py] = local(e);
    pointers.current.set(e.pointerId, { x: px, y: py });
    if (pointers.current.size === 2) {
      if (gesture.current?.type === 'node' && sim.drag) {
        sim.drag = null;
        kick();
      }
      const [a, b] = [...pointers.current.values()];
      gesture.current = { type: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      return;
    }
    if (pointers.current.size > 2) return;
    const nodeEl = t.closest<SVGGElement>('g[data-n]');
    if (nodeEl) {
      const id = nodeEl.dataset.n!;
      const b = sim.get(id);
      const [wx, wy] = toWorld(px, py);
      gesture.current = { type: 'node', id: e.pointerId, node: id, sx: px, sy: py, ox: b.x - wx, oy: b.y - wy, moved: false };
    } else {
      gesture.current = { type: 'pan', id: e.pointerId, lx: px, ly: py, sx: px, sy: py, moved: false, vx: 0, vy: 0, t: performance.now() };
    }
  };

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    const gs = gesture.current;
    if (!gs) return;
    const [px, py] = local(e);
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: px, y: py });
    if (gs.type === 'pinch') {
      if (pointers.current.size < 2) return;
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      zoomAt(gs.mx, gs.my, (cam.current.k * d) / (gs.d || 1));
      cam.current.x += mx - gs.mx;
      cam.current.y += my - gs.my;
      apply();
      gs.d = d;
      gs.mx = mx;
      gs.my = my;
      return;
    }
    if (e.pointerId !== gs.id) return;
    if (!gs.moved) {
      if (Math.hypot(px - gs.sx, py - gs.sy) < 5) return;
      gs.moved = true;
      setDragging(true);
      setHover(null);
    }
    if (gs.type === 'node') {
      const [wx, wy] = toWorld(px, py);
      sim.drag = { id: gs.node, x: wx + gs.ox, y: wy + gs.oy };
      kick();
      return;
    }
    const now = performance.now();
    const dt = Math.max(1, now - gs.t);
    const dx = px - gs.lx;
    const dy = py - gs.ly;
    gs.vx = 0.75 * (dx / dt) + 0.25 * gs.vx;
    gs.vy = 0.75 * (dy / dt) + 0.25 * gs.vy;
    gs.t = now;
    gs.lx = px;
    gs.ly = py;
    cam.current.x += dx;
    cam.current.y += dy;
    apply();
  };

  const endPointer = (e: RPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    pointers.current.delete(e.pointerId);
    const gs = gesture.current;
    if (!gs) return;
    if (gs.type === 'pinch') {
      const rest = [...pointers.current.entries()][0];
      gesture.current = rest ? { type: 'pan', id: rest[0], lx: rest[1].x, ly: rest[1].y, sx: rest[1].x, sy: rest[1].y, moved: true, vx: 0, vy: 0, t: performance.now() } : null;
      if (!rest) setDragging(false);
      return;
    }
    if (e.pointerId !== gs.id) return;
    gesture.current = null;
    setDragging(false);
    if (gs.type === 'node') {
      if (gs.moved) {
        sim.drag = null;
        quietHoverUntil.current = performance.now() + 600;
        kick();
      } else if (!cancelled) select(gs.node);
      return;
    }
    if (!gs.moved) {
      if (!cancelled) select(null);
      return;
    }
    // fling
    let { vx, vy } = gs;
    if (reduced || performance.now() - gs.t > 90 || Math.hypot(vx, vy) < 0.08) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      cam.current.x += vx * dt;
      cam.current.y += vy * dt;
      const decay = Math.pow(0.93, dt / 16);
      vx *= decay;
      vy *= decay;
      apply();
      inertiaRaf.current = Math.hypot(vx, vy) > 0.02 ? requestAnimationFrame(tick) : 0;
    };
    inertiaRaf.current = requestAnimationFrame(tick);
  };

  // wheel / trackpad: zoom toward the pointer (pinch arrives as ctrl+wheel); sideways swipes pan
  useEffect(() => {
    const c = canvasRef.current!;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as Element).closest('.rm-insp, .rm-legend, .rm-results')) return;
      e.preventDefault();
      stopMotion();
      dismissHint();
      const [px, py] = local(e);
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      if (!e.ctrlKey && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        cam.current.x -= e.deltaX * unit;
        apply();
        return;
      }
      zoomAt(px, py, cam.current.k * Math.exp(-e.deltaY * unit * (e.ctrlKey ? 0.012 : 0.0018)));
    };
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => c.removeEventListener('wheel', onWheel);
  });

  const onPointerOver = (e: RPointerEvent) => {
    if (gesture.current || e.pointerType !== 'mouse' || performance.now() < quietHoverUntil.current) return;
    const id = (e.target as Element).closest<SVGGElement>('g[data-n]')?.dataset.n ?? null;
    if (id !== hover) setHover(id);
    if (id) {
      const n = graph.byId.get(id);
      if (n?.kind === 'lesson' && n.meta) prefetchLessonPage(course, n.stub.id);
    }
  };
  const onPointerLeave = () => {
    if (!gesture.current && !kbFocus.current) setHover(null);
  };

  /** Arrow keys walk the graph: the nearest node roughly in that direction. */
  const walk = (from: string, dx: number, dy: number) => {
    const p = sim.get(from);
    let best: string | null = null;
    let bestScore = Infinity;
    for (const n of graph.nodes) {
      if (n.id === from) continue;
      const q = sim.get(n.id);
      const vx = q.x - p.x;
      const vy = q.y - p.y;
      const along = vx * dx + vy * dy;
      if (along <= 8) continue;
      const across = Math.abs(vx * dy - vy * dx);
      const score = along + across * 2.2;
      if (score < bestScore) {
        bestScore = score;
        best = n.id;
      }
    }
    if (best) els.current.nodes.find(([, id]) => id === best)?.[0].focus({ preventScroll: true });
  };

  const onKeyDown = (e: RKeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, .rm-insp, .rm-hud')) {
      if (e.key === 'Escape' && t.closest('.rm-insp')) select(null);
      return;
    }
    const nodeId = t.closest<SVGGElement>('g[data-n]')?.dataset.n;
    const arrows: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    if (arrows[e.key]) {
      e.preventDefault();
      const [dx, dy] = arrows[e.key];
      if (nodeId) walk(nodeId, dx, dy);
      else {
        stopMotion();
        cam.current.x -= dx * 90;
        cam.current.y -= dy * 90;
        apply();
      }
      return;
    }
    switch (e.key) {
      case 'Enter':
      case ' ':
        if (nodeId) {
          e.preventDefault();
          select(nodeId);
        }
        break;
      case 'Escape':
        select(null);
        break;
      case '+':
      case '=':
        zoomBy(1.35);
        break;
      case '-':
      case '_':
        zoomBy(1 / 1.35);
        break;
      case '0':
        fitAll();
        break;
      case 'f': // ("/" is the site-wide search)
        e.preventDefault();
        searchRef.current?.focus();
        break;
    }
  };

  const onFocus = (e: RFocusEvent) => {
    const id = (e.target as Element).closest<SVGGElement>('g[data-n]')?.dataset.n;
    if (!id || pointerInput.current) return;
    kbFocus.current = id;
    setHover(id);
    // keep the focused node on screen
    const p = sim.get(id);
    const { x, y, k } = cam.current;
    const v = view();
    const sx = p.x * k + x;
    const sy = p.y * k + y;
    if (sx < 80 || sy < 80 || sx > v.w - 80 || sy > v.h - 80) flyTo(pointCam(p.x, p.y, Math.max(k, 0.7)), 420);
  };
  const onBlur = (e: RFocusEvent) => {
    const id = (e.target as Element).closest<SVGGElement>('g[data-n]')?.dataset.n;
    if (id && kbFocus.current === id) {
      kbFocus.current = null;
      setHover((h) => (h === id ? null : h));
    }
  };

  /* ---------------- render ---------------- */

  const spines = graph.edges.filter((e) => e.kind === 'spine' || e.kind === 'shortcut');
  const spokes = graph.edges.filter((e) => e.kind === 'spoke');
  // lit threads last, so they draw on top
  const threadEdges = graph.edges.filter((e) => e.kind === 'thread').sort((a, b) => (hl?.edges.has(a.id) ? 1 : 0) - (hl?.edges.has(b.id) ? 1 : 0));
  const selNode = selected ? graph.byId.get(selected) ?? null : null;
  const hovNode = hover && !dragging ? graph.byId.get(hover) ?? null : null;
  const next = status.next;
  const nextNode = nextId ? (graph.byId.get(nextId) as Extract<GNode, { kind: 'lesson' }> | undefined) : undefined;
  const delayOf = (pi: number, extra = 0) => (intro ? 120 + Math.max(0, pi) * 75 + extra : 0);

  return (
    <div
      ref={canvasRef}
      className="rm-canvas"
      data-threads={threads || undefined}
      data-focus={hl ? '' : undefined}
      data-dragging={dragging || undefined}
      data-intro={intro || undefined}
      data-panel={selNode ? '' : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endPointer(e, false)}
      onPointerCancel={(e) => endPointer(e, true)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <svg className="rm-svg" role="group" aria-label={`Map of ${course.title}: parts, lessons and how they connect. Use Tab or the arrow keys to move between them.`} onPointerOver={onPointerOver} onPointerLeave={onPointerLeave}>
        <defs>
          <pattern ref={gridRef} id="rm-grid" patternUnits="userSpaceOnUse" width="32" height="32">
            <circle className="rm-grid-dot" cx="16" cy="16" r="1.3" />
          </pattern>
          {TONES.map((t) => (
            <pattern key={t} id={`rm-hatch-${t}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
              {/* "done" fill: a solid wash of the part's colour (the id is kept from the sketch-era hatching) */}
              <rect width="7" height="7" style={{ fill: `color-mix(in srgb, var(--${t}) 20%, var(--surface))` }} />
            </pattern>
          ))}
          {(['faint', 'up', 'down'] as const).map((m) => (
            <marker key={m} id={`rm-arrow-${m}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M1 1.5 L8 5 L1 8.5" className={`rm-arrowhead rm-arrowhead--${m}`} />
            </marker>
          ))}
        </defs>
        <rect className="rm-grid" width="100%" height="100%" fill="url(#rm-grid)" />
        <g ref={worldRef}>
          <g className="rm-edges">
            {spines.map((e) => (
              <path
                key={e.id}
                id={e.kind === 'shortcut' ? 'rm-shortcut-path' : undefined}
                data-e={e.id}
                className={`rm-${e.kind}`}
                data-state={spine.get(e.id)}
                data-lit={hl?.edges.get(e.id)}
                style={{ '--d': `${delayOf(e.pi, 60)}ms` } as CSSProperties}
              />
            ))}
            {spines.some((e) => e.kind === 'shortcut') && (
              <text className="rm-shortcut-label" dy={-8}>
                <textPath href="#rm-shortcut-path" startOffset="50%">
                  placement shortcut
                </textPath>
              </text>
            )}
            {spokes.map((e) => {
              const n = graph.byId.get(e.to) as Extract<GNode, { kind: 'lesson' }>;
              return (
                <path
                  key={e.id}
                  data-e={e.id}
                  className="rm-spoke"
                  data-tone={n.part.tone}
                  data-state={status.lessons[n.stub.id].state}
                  data-lit={hl?.edges.get(e.id)}
                  style={{ '--d': `${delayOf(e.pi, 90)}ms` } as CSSProperties}
                />
              );
            })}
            {threadEdges.map((e) => (
              <path key={e.id} data-e={e.id} className={`rm-thread${e.cross ? ' is-cross' : ''}`} data-lit={hl?.edges.get(e.id)} style={{ '--d': `${delayOf(10, 200)}ms` } as CSSProperties} />
            ))}
          </g>
          <g className="rm-nodes">
            {graph.nodes.map((n) => (
              <NodeView
                key={n.id}
                n={n}
                st={status}
                next={n.id === nextId}
                lit={hl?.nodes.get(n.id)}
                delay={n.kind === 'lesson' ? delayOf(n.pi, 80 + n.index * 28) : n.kind === 'gate' ? delayOf(n.pi, 260) : n.kind === 'finish' ? delayOf(course.parts.length, 120) : delayOf(n.pi)}
              />
            ))}
          </g>
        </g>
      </svg>

      {/* ---- hover card ---- */}
      <div ref={tipRef} className="rm-tip" hidden={!hovNode || hovNode.id === selected} aria-hidden>
        {hovNode && <TipBody n={hovNode} status={status} graph={graph} />}
      </div>

      {/* ---- top left: search + toggles ---- */}
      <div className="rm-hud rm-hud-tl">
        <MapSearch graph={graph} inputRef={searchRef} onPick={(id) => select(id)} />
        <div className="rm-toggles">
          <button type="button" className="rm-chip" aria-pressed={threads} onClick={() => setThreads((v) => !v)} title="Show which lessons build on which">
            <Spline size={14} /> Links
          </button>
          <button type="button" className="rm-chip" aria-pressed={legend} aria-expanded={legend} onClick={() => setLegend((v) => !v)}>
            <Info size={14} /> Key
          </button>
        </div>
        {legend && <Legend />}
      </div>

      {/* ---- top right: zoom ---- */}
      <div className="rm-hud rm-hud-tr" role="toolbar" aria-label="Map view">
        <button type="button" className="rm-tool" onClick={() => zoomBy(1.35)} aria-label="Zoom in" title="Zoom in (+)">
          <Plus size={17} />
        </button>
        <span ref={zoomRef} className="rm-zoom mono" aria-live="off">
          30%
        </span>
        <button type="button" className="rm-tool" onClick={() => zoomBy(1 / 1.35)} aria-label="Zoom out" title="Zoom out (−)">
          <Minus size={17} />
        </button>
        <span className="rm-tool-gap" />
        <button type="button" className="rm-tool" onClick={fitAll} aria-label="Show the whole map" title="Whole map (0)">
          <Maximize2 size={16} />
        </button>
        <button type="button" className="rm-tool" onClick={() => focusOn(homeId())} aria-label="Go to where you are" title="Where am I?">
          <LocateFixed size={17} />
        </button>
      </div>

      {/* ---- bottom left: minimap ---- */}
      <Minimap graph={graph} status={status} rectRef={miniRectRef} onJump={jumpTo} />

      {/* ---- bottom centre: next up ---- */}
      <div className="rm-hud rm-hud-bc">
        {hint && (
          <p className="rm-hint">
            <MousePointerClick size={15} /> Drag to pan · scroll to zoom · grab a bubble and let go
          </p>
        )}
        {next && nextNode ? (
          <div className="rm-next" data-tone={nextNode.part.tone}>
            <button type="button" className="rm-next-where" onClick={() => select(nextNode.id)} title="Show it on the map">
              <span className="rm-next-eyebrow">
                {next.resume ? 'Continue' : 'Next up'} · Part {nextNode.part.num}
              </span>
              <strong>{nextNode.stub.title}</strong>
            </button>
            <Link className="btn btn--sm btn--primary" to={`/${course.id}/${nextNode.stub.id}`}>
              {next.resume ? 'Resume' : 'Start'} <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="rm-next" data-tone="ok">
            <span className="rm-next-where">
              <span className="rm-next-eyebrow">Every lesson done</span>
              <strong>On to the capstone</strong>
            </span>
            <Link className="btn btn--sm btn--primary" to="/capstone">
              Build it <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>

      {selNode && <Inspector course={course} graph={graph} status={status} node={selNode} onPick={select} onClose={() => select(null)} />}
    </div>
  );
}

/* ---------------- pieces ---------------- */

export function TipBody({ n, status, graph }: { n: GNode; status: MapStatus; graph: Graph }) {
  if (n.kind === 'lesson') {
    const s = status.lessons[n.stub.id];
    const needs = graph.needs.get(n.id)?.length ?? 0;
    const unlocks = graph.unlocks.get(n.id)?.length ?? 0;
    return (
      <>
        <span className="rm-tip-eyebrow">
          Part {n.part.num} · lesson {n.index}
        </span>
        <strong>{n.stub.title}</strong>
        <span className="rm-tip-meta">
          {s.state === 'done' ? '✓ done' : s.state === 'started' ? `step ${s.step}${s.total ? ` of ${s.total}` : ''}` : s.state === 'soon' ? 'coming soon' : 'not started'}
          {n.meta ? ` · ${n.meta.minutes} min` : ''}
        </span>
        {(needs > 0 || unlocks > 0) && (
          <span className="rm-tip-links">
            {needs > 0 && <i data-k="up">builds on {needs}</i>}
            {unlocks > 0 && <i data-k="down">unlocks {unlocks}</i>}
          </span>
        )}
      </>
    );
  }
  if (n.kind === 'hub') {
    const p = status.parts[n.part.id];
    return (
      <>
        <span className="rm-tip-eyebrow">Part {n.part.num}</span>
        <strong>{n.part.title}</strong>
        <span className="rm-tip-meta">
          {p.done}/{p.total} lessons · {fmtMinutes(p.minutes)}
        </span>
      </>
    );
  }
  if (n.kind === 'gate') {
    const g = status.gates[n.part.id];
    const label = { passed: '✓ passed', skipped: 'skipped', ready: 'ready when you are', locked: 'after the lessons' }[g.state];
    return (
      <>
        <span className="rm-tip-eyebrow">Checkpoint</span>
        <strong>Gate {n.part.num}</strong>
        <span className="rm-tip-meta">{label}</span>
      </>
    );
  }
  return <strong>{n.kind === 'start' ? 'Start here' : 'Capstone — the finish line'}</strong>;
}

export function MapSearch({ graph, inputRef, onPick }: { graph: Graph; inputRef: RefObject<HTMLInputElement>; onPick: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const scored: { n: GNode; title: string; sub: string; score: number }[] = [];
    for (const n of graph.nodes) {
      if (n.kind === 'lesson') {
        const t = n.stub.title.toLowerCase();
        const score = t.startsWith(s) ? 0 : t.includes(s) ? 1 : (n.meta?.summary ?? '').toLowerCase().includes(s) ? 3 : -1;
        if (score >= 0) scored.push({ n, title: n.stub.title, sub: `Part ${n.part.num} · ${n.part.title}`, score });
      } else if (n.kind === 'hub') {
        const t = n.part.title.toLowerCase();
        const score = t.startsWith(s) ? 0 : t.includes(s) || `part ${n.part.num}`.includes(s) ? 2 : -1;
        if (score >= 0) scored.push({ n, title: n.part.title, sub: `Part ${n.part.num} · ${n.part.lessons.length} lessons`, score });
      }
    }
    return scored.sort((a, b) => a.score - b.score).slice(0, 7);
  }, [q, graph]);

  const pick = (id: string) => {
    onPick(id);
    setQ('');
    inputRef.current?.blur();
  };

  return (
    <div className="rm-search">
      <Search size={15} className="rm-search-icon" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        value={q}
        placeholder="Find a lesson…"
        aria-label="Find a lesson on the map"
        aria-keyshortcuts="F"
        aria-controls="rm-results"
        aria-expanded={results.length > 0}
        role="combobox"
        aria-autocomplete="list"
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(results.length - 1, a + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === 'Enter' && results[active]) {
            e.preventDefault();
            pick(results[active].n.id);
          } else if (e.key === 'Escape') {
            setQ('');
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {q && (
        <button type="button" className="rm-search-clear" aria-label="Clear" onClick={() => setQ('')}>
          <X size={14} />
        </button>
      )}
      {q.trim() && (
        <ul id="rm-results" className="rm-results" role="listbox">
          {results.length === 0 && <li className="rm-results-empty">Nothing called that — try another word</li>}
          {results.map((r, i) => (
            <li key={r.n.id} role="option" aria-selected={i === active} data-tone={'part' in r.n ? r.n.part.tone : undefined}>
              <button type="button" onMouseEnter={() => setActive(i)} onClick={() => pick(r.n.id)}>
                <i aria-hidden />
                <span>
                  <strong>{r.title}</strong>
                  <small>{r.sub}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="rm-legend" role="note">
      <ul>
        <li>
          <svg viewBox="-14 -14 28 28" aria-hidden>
            <circle r="11" className="lg-done" />
            <path d="M-5 0.5 L-1.5 4 L5.5 -4.5" className="lg-tick" />
          </svg>
          Done
        </li>
        <li>
          <svg viewBox="-14 -14 28 28" aria-hidden>
            <circle r="12" className="lg-track" />
            <circle r="12" className="lg-arc" pathLength={100} strokeDasharray="40 100" transform="rotate(-90)" />
            <circle r="8" className="lg-node" />
          </svg>
          In progress
        </li>
        <li>
          <svg viewBox="-14 -14 28 28" aria-hidden>
            <circle r="9" className="lg-node" />
          </svg>
          Not started
        </li>
        <li>
          <svg viewBox="-14 -14 28 28" aria-hidden>
            <circle r="8" className="lg-node" />
            <ellipse rx="12.5" ry="11" className="lg-circled" />
          </svg>
          Next up
        </li>
        <li>
          <svg viewBox="-14 -14 28 28" aria-hidden>
            <circle r="9" className="lg-node" />
            <circle cx="7" cy="-7" r="4" className="lg-try" />
          </svg>
          Try it inside
        </li>
        <li>
          <svg viewBox="-14 -14 28 28" aria-hidden>
            <path d="M0 -11 L11 0 L0 11 L-11 0Z" className="lg-node" />
          </svg>
          Gate (quiz)
        </li>
        <li>
          <svg viewBox="0 0 28 14" aria-hidden>
            <path d="M2 7 H24" className="lg-thread" />
            <path d="M19 3 L25 7 L19 11" className="lg-thread-head" />
          </svg>
          Builds on
        </li>
      </ul>
      <p>Hover or select a lesson: <b data-k="up">blue</b> is what it builds on, <b data-k="down">teal</b> is what it unlocks.</p>
    </div>
  );
}

function Minimap({ graph, status, rectRef, onJump }: { graph: Graph; status: MapStatus; rectRef: RefObject<SVGRectElement>; onJump: (x: number, y: number, smooth: boolean) => void }) {
  const b = graph.bounds;
  const bw = b.x1 - b.x0;
  const bh = b.y1 - b.y0;
  const w = 176;
  const h = Math.round(clamp((w * bh) / bw, 80, 150));
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const toWorld = (e: { clientX: number; clientY: number }) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : null;
  };
  const hubs = graph.nodes.filter((n) => n.kind === 'hub' || n.kind === 'start' || n.kind === 'finish');
  return (
    <div className="rm-hud rm-mini" style={{ width: w, height: h }} aria-hidden>
      <svg
        ref={svgRef}
        viewBox={`${b.x0} ${b.y0} ${bw} ${bh}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
          const p = toWorld(e);
          if (p) onJump(p.x, p.y, true);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const p = toWorld(e);
          if (p) onJump(p.x, p.y, false);
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <polyline className="rm-mini-trail" points={hubs.map((n) => `${n.x},${n.y}`).join(' ')} />
        {graph.nodes.map((n) =>
          n.kind === 'lesson' ? (
            <circle key={n.id} cx={n.x} cy={n.y} r={30} className="rm-mini-dot" data-tone={n.part.tone} data-state={status.lessons[n.stub.id].state} />
          ) : n.kind === 'hub' ? (
            <circle key={n.id} cx={n.x} cy={n.y} r={78} className="rm-mini-hub" data-tone={n.part.tone} />
          ) : null,
        )}
        <rect ref={rectRef} className="rm-mini-view" rx={30} />
      </svg>
    </div>
  );
}
