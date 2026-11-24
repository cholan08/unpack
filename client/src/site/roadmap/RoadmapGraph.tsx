/**
 * Graph view: the course as a living knowledge graph, in the spirit of Obsidian's graph view —
 * dots sized by how connected they are, coloured by topic, labels that fade in as you zoom,
 * real physics you can grab. Hover a lesson to light up everything it builds on (and what it
 * unlocks) while the rest fades back; Neo4j-style arrows and captions spell out the direction.
 * Same nodes, inspector, search and progress as the Trail map.
 */
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
} from 'react';
import { Link } from 'react-router';
import { ArrowRight, LocateFixed, Maximize2, Minus, MousePointerClick, Plus, RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { Course } from '@/engine/types';
import { usePrefersReducedMotion } from '@/lib/media';
import { prefetchLessonPage } from '../prefetch';
import { buildGraph, highlight, lessonNodeId, type LessonNode, type Role } from './graph';
import { DEFAULT_FORCES, ForceSim, type Forces } from './force';
import { buildNet, groupOf, groupsFor, netBounds, resetNet, settledPositions, type ColorBy, type NetLink, type NetNode } from './net';
import { MapSearch, TipBody, spineStates } from './RoadmapMap';
import { Inspector } from './Inspector';
import { fmt } from './shapes';
import type { MapStatus } from './status';
import '../roadmap-graph.css';

const K_MIN = 0.18;
const K_MAX = 3.2;
const INSPECTOR_W = 376;
const HINT_KEY = 'unpacked:graph-hint';
const DISPLAY_KEY = 'unpacked:graph-display';

type Cam = { x: number; y: number; k: number };
type Box = { x0: number; y0: number; x1: number; y1: number };
type Gesture =
  | { type: 'pan'; id: number; lx: number; ly: number; sx: number; sy: number; moved: boolean; vx: number; vy: number; t: number }
  | { type: 'node'; id: number; node: string; sx: number; sy: number; ox: number; oy: number; moved: boolean }
  | { type: 'pinch'; d: number; mx: number; my: number };

interface Display {
  colorBy: ColorBy;
  threads: boolean;
  spokes: boolean;
  arrows: boolean;
  labels: boolean;
  forces: Forces;
}
const DEFAULT_DISPLAY: Display = { colorBy: 'topic', threads: true, spokes: true, arrows: true, labels: true, forces: DEFAULT_FORCES };
const COLOR_BY: { id: ColorBy; label: string }[] = [
  { id: 'topic', label: 'Topic' },
  { id: 'part', label: 'Part' },
  { id: 'progress', label: 'Progress' },
];
const FORCE_SLIDERS: { id: keyof Forces; label: string; min: number; max: number }[] = [
  { id: 'repel', label: 'Repel', min: 0.3, max: 2.5 },
  { id: 'spread', label: 'Link length', min: 0.5, max: 2 },
  { id: 'gravity', label: 'Gravity', min: 0, max: 3 },
];

function loadDisplay(): Display {
  try {
    const raw = localStorage.getItem(DISPLAY_KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<Display>;
      const colorBy = COLOR_BY.some((c) => c.id === v.colorBy) ? v.colorBy! : DEFAULT_DISPLAY.colorBy;
      return { ...DEFAULT_DISPLAY, ...v, colorBy, forces: { ...DEFAULT_FORCES, ...v.forces } };
    }
  } catch {
    /* no storage: defaults */
  }
  return DEFAULT_DISPLAY;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface Props {
  course: Course;
  status: MapStatus;
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function RoadmapGraph({ course, status, selected, onSelect }: Props) {
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLSpanElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const graph = useMemo(() => buildGraph(course, 4, 0), [course]);
  const net = useMemo(() => buildNet(graph), [graph]);
  const [display, setDisplay] = useState(loadDisplay);
  const sim = useMemo(() => new ForceSim(net.nodes, net.links), [net]);
  sim.forces = display.forces;

  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const aspect = size ? size.w / size.h : 1.6;
  sim.aspect = aspect;
  const [hover, setHover] = useState<string | null>(null);
  const [spot, setSpot] = useState<string | null>(null);
  const [panel, setPanel] = useState(false);
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

  const cam = useRef<Cam>({ x: 0, y: 0, k: 1 });
  const live = useRef({ net, sim, insetR, insetB, size, reduced, hover });
  live.current = { net, sim, insetR, insetB, size, reduced, hover };
  const els = useRef<{ nodes: [SVGGElement, NetNode][]; tops: [SVGGElement, NetNode][]; edges: [SVGLineElement, NetLink][]; caps: [SVGTextElement, NetLink][] }>({
    nodes: [],
    tops: [],
    edges: [],
    caps: [],
  });
  const gesture = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pointerInput = useRef(false);
  const kbFocus = useRef<string | null>(null);

  // what's lit: a hovered/selected node and its chain, else a legend group
  const focusId = hover ?? selected;
  const hl = useMemo(() => highlight(graph, focusId), [graph, focusId]);
  const groupByNode = useMemo(() => new Map(net.nodes.map((n) => [n.id, groupOf(n, display.colorBy, status, graph)])), [net, display.colorBy, status, graph]);
  const groups = useMemo(() => groupsFor(net, display.colorBy, status, graph), [net, display.colorBy, status, graph]);
  const spotIds = useMemo(() => (spot ? new Set(net.nodes.filter((n) => groupByNode.get(n.id)?.key === spot).map((n) => n.id)) : null), [spot, net, groupByNode]);
  useEffect(() => setSpot(null), [display.colorBy]);
  const nodeLit = (id: string): Role | undefined => (hl ? hl.nodes.get(id) : spotIds?.has(id) ? 'ctx' : undefined);
  const edgeLit = (l: NetLink): Role | undefined => (hl ? hl.edges.get(l.id) : spotIds && spotIds.has(l.s.id) && spotIds.has(l.t.id) ? 'ctx' : undefined);
  const spine = useMemo(() => spineStates(graph, status), [graph, status]);
  const nextId = status.next ? lessonNodeId(status.next.lessonId) : null;

  /* ---------------- painting ---------------- */

  const placeTip = useCallback(() => {
    const tip = tipRef.current;
    const id = live.current.hover;
    if (!tip || !id) return;
    const n = live.current.net.byId.get(id);
    if (!n) return;
    const { x, y, k } = cam.current;
    const sx = n.x * k + x;
    const top = (n.y - n.vr) * k + y - 12;
    const below = top < 110;
    const sy = below ? (n.y + n.vr) * k + y + 34 : top;
    tip.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, ${below ? '0' : '-100%'})`;
  }, []);

  const apply = useCallback(() => {
    const { x, y, k } = cam.current;
    const c = canvasRef.current;
    const w = worldRef.current;
    if (!c || !w) return;
    w.setAttribute('transform', `translate(${fmt(x)} ${fmt(y)}) scale(${k.toFixed(4)})`);
    c.style.setProperty('--inv', (1 / k).toFixed(4));
    // lesson names fade in between 70% and 95% zoom (Obsidian's "text fade threshold")
    c.style.setProperty('--lab', clamp((k - 0.7) / 0.25, 0, 1).toFixed(3));
    c.dataset.lod = k < 0.6 ? 'far' : 'near';
    if (zoomRef.current) zoomRef.current.textContent = `${Math.round(k * 100)}%`;
    placeTip();
  }, [placeTip]);

  const paint = useCallback(() => {
    const { byId } = live.current.net;
    for (const [el, n] of els.current.nodes) {
      el.setAttribute('transform', `translate(${fmt(n.x)} ${fmt(n.y)})`);
      if (n.g.kind !== 'lesson') continue;
      // a lesson's name goes on the side facing away from its part, like a mind map
      const hub = byId.get(n.g.hub)!;
      const dx = n.x - hub.x;
      const dy = n.y - hub.y;
      const side = Math.abs(dx) > Math.abs(dy) * 0.85 ? (dx > 0 ? 'r' : 'l') : dy > 0 ? 'b' : 't';
      if (el.dataset.side !== side) el.dataset.side = side;
    }
    for (const [el, n] of els.current.tops) el.setAttribute('transform', `translate(${fmt(n.x)} ${fmt(n.y)})`);
    for (const [el, l] of els.current.edges) {
      let x1 = l.s.x;
      let y1 = l.s.y;
      let x2 = l.t.x;
      let y2 = l.t.y;
      if (l.e.kind !== 'spoke') {
        // stop at the rims so the arrowhead shows
        const dx = x2 - x1;
        const dy = y2 - y1;
        const d = Math.hypot(dx, dy) || 1;
        const a = l.s.vr + 1.5;
        const b = l.t.vr + 2.5;
        if (d > a + b + 4) {
          x1 += (dx / d) * a;
          y1 += (dy / d) * a;
          x2 -= (dx / d) * b;
          y2 -= (dy / d) * b;
        }
      }
      el.setAttribute('x1', fmt(x1));
      el.setAttribute('y1', fmt(y1));
      el.setAttribute('x2', fmt(x2));
      el.setAttribute('y2', fmt(y2));
    }
    for (const [el, l] of els.current.caps) {
      let ang = (Math.atan2(l.t.y - l.s.y, l.t.x - l.s.x) * 180) / Math.PI;
      if (ang > 90) ang -= 180;
      else if (ang < -90) ang += 180;
      el.setAttribute('transform', `translate(${fmt((l.s.x + l.t.x) / 2)} ${fmt((l.s.y + l.t.y) / 2)}) rotate(${ang.toFixed(1)})`);
    }
    placeTip();
  }, [placeTip]);

  // after every render: find the elements the physics moves, and put them where they are
  useLayoutEffect(() => {
    const svg = canvasRef.current?.querySelector('svg.kg-svg');
    if (!svg) return;
    const { byId } = net;
    const linkById = new Map(net.links.map((l) => [l.id, l]));
    els.current.nodes = [...svg.querySelectorAll<SVGGElement>('g[data-n]')].map((el) => [el, byId.get(el.dataset.n!)!]);
    els.current.tops = [...svg.querySelectorAll<SVGGElement>('g[data-o]')].map((el) => [el, byId.get(el.dataset.o!)!]);
    els.current.edges = [...svg.querySelectorAll<SVGLineElement>('line[data-e]')].map((el) => [el, linkById.get(el.dataset.e!)!]);
    els.current.caps = [...svg.querySelectorAll<SVGTextElement>('text[data-c]')].map((el) => [el, linkById.get(el.dataset.c!)!]);
    paint();
  });

  /* ---------------- physics ---------------- */

  const raf = useRef(0);
  const run = useCallback(() => {
    if (raf.current) return;
    const tick = () => {
      const s = live.current.sim;
      s.tick();
      paint();
      raf.current = s.active ? requestAnimationFrame(tick) : 0;
    };
    raf.current = requestAnimationFrame(tick);
  }, [paint]);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      stopMotion();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* ---------------- camera ---------------- */

  /** The part of the canvas the graph can use: minus the panel, the "next up" bar, and (when narrow) the search bar. */
  const view = () => {
    const s = live.current.size ?? { w: 1, h: 1 };
    return { w: s.w - live.current.insetR, h: s.h - (live.current.insetB || 70), top: s.w < 760 ? 92 : 0 };
  };
  const boxCam = (b: Box, maxK: number, pad = 48): Cam => {
    const v = view();
    const k = clamp(Math.min((v.w - pad * 2) / (b.x1 - b.x0), (v.h - v.top - pad * 2) / (b.y1 - b.y0)), K_MIN, maxK);
    return { k, x: v.w / 2 - ((b.x0 + b.x1) / 2) * k, y: v.top + (v.h - v.top) / 2 - ((b.y0 + b.y1) / 2) * k };
  };
  const pointCam = (wx: number, wy: number, k: number): Cam => {
    const v = view();
    return { k, x: v.w / 2 - wx * k, y: v.top + (v.h - v.top) / 2 - wy * k };
  };

  const flyRaf = useRef(0);
  const inertiaRaf = useRef(0);
  const stopMotion = () => {
    cancelAnimationFrame(flyRaf.current);
    cancelAnimationFrame(inertiaRaf.current);
    flyRaf.current = inertiaRaf.current = 0;
  };
  const flyTo = useCallback(
    (to: Cam, ms = 800) => {
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
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / ms);
        const e = easeInOut(t);
        const k = Math.exp(lerp(Math.log(from.k), Math.log(to.k), e));
        cam.current = t === 1 ? to : { k, x: s.w / 2 - lerp(c0.x, c1.x, e) * k, y: s.h / 2 - lerp(c0.y, c1.y, e) * k };
        apply();
        flyRaf.current = t < 1 ? requestAnimationFrame(tick) : 0;
      };
      flyRaf.current = requestAnimationFrame(tick);
    },
    [apply],
  );

  const camFor = (id: string): Cam | null => {
    const n = live.current.net.byId.get(id);
    if (!n) return null;
    if (n.g.kind === 'hub') {
      const members = [n, ...n.g.lessons.map((l) => live.current.net.byId.get(l)!)];
      return boxCam(netBounds(members), 1.6, 60);
    }
    return pointCam(n.x, n.y, clamp(Math.max(cam.current.k, 1.3), K_MIN, K_MAX));
  };
  const focusOn = (id: string, ms?: number) => {
    const c = camFor(id);
    if (c) flyTo(c, ms);
  };
  const zoomAt = (px: number, py: number, k: number) => {
    const c = cam.current;
    k = clamp(k, K_MIN, K_MAX);
    const wx = (px - c.x) / c.k;
    const wy = (py - c.y) / c.k;
    cam.current = { k, x: px - wx * k, y: py - wy * k };
    apply();
  };
  const zoomBy = (f: number) => {
    const v = view();
    const c = cam.current;
    const k = clamp(c.k * f, K_MIN, K_MAX);
    const wx = (v.w / 2 - c.x) / c.k;
    const wy = (v.h / 2 - c.y) / c.k;
    flyTo({ k, x: v.w / 2 - wx * k, y: v.h / 2 - wy * k }, 300);
  };
  const fitAll = (ms = 650) => flyTo(boxCam(netBounds(live.current.net.nodes), 1.4), ms);

  // size: measured before first paint, then watched; a resize keeps the same point in the middle
  useLayoutEffect(() => {
    const c = canvasRef.current!;
    const measure = (w: number, h: number) => setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
    const r = c.getBoundingClientRect();
    measure(r.width, r.height);
    const ro = new ResizeObserver(([e]) => measure(e.contentRect.width, e.contentRect.height));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);
  const prevSize = useRef(size);
  useLayoutEffect(() => {
    const p = prevSize.current;
    prevSize.current = size;
    if (p && size) {
      cam.current.x += (size.w - p.w) / 2;
      cam.current.y += (size.h - p.h) / 2;
    }
    apply();
  }, [size, apply]);

  // first view: frame where the layout will settle, then let it burst out into place
  const started = useRef(false);
  const initialFocus = useRef(selected);
  useLayoutEffect(() => {
    if (!size || started.current) return;
    started.current = true;
    const end = settledPositions(net, display.forces, aspect);
    const endNodes = net.nodes.map((n) => ({ ...n, ...end.get(n.id)! }));
    cam.current = boxCam(netBounds(endNodes), 1.4);
    apply();
    if (reduced) {
      for (const n of net.nodes) Object.assign(n, end.get(n.id));
      sim.alpha = 0;
      paint();
      setIntro(false);
      if (initialFocus.current && net.byId.has(initialFocus.current)) focusOn(initialFocus.current, 0);
      return;
    }
    run();
    const t1 = setTimeout(() => setIntro(false), 1400);
    const t2 = setTimeout(() => {
      if (initialFocus.current && live.current.net.byId.has(initialFocus.current)) focusOn(initialFocus.current, 1000);
    }, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size === null]);

  // a new selection (click, search, inspector link, back button) flies there
  const lastSel = useRef(selected);
  useEffect(() => {
    if (!started.current || selected === lastSel.current) return;
    lastSel.current = selected;
    if (selected) focusOn(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // forces changed: warm the physics back up
  const forcesKey = JSON.stringify(display.forces);
  const firstForces = useRef(forcesKey);
  useEffect(() => {
    if (forcesKey === firstForces.current) return;
    firstForces.current = forcesKey;
    sim.alpha = Math.max(sim.alpha, 0.5);
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcesKey]);

  useEffect(() => {
    try {
      localStorage.setItem(DISPLAY_KEY, JSON.stringify(display));
    } catch {
      /* private mode */
    }
  }, [display]);

  /** Start the layout over from the beginning and watch it settle. */
  const relayout = () => {
    const end = settledPositions(net, display.forces, aspect);
    const endNodes = net.nodes.map((n) => ({ ...n, ...end.get(n.id)! }));
    flyTo(boxCam(netBounds(endNodes), 1.4), 700);
    resetNet(net);
    if (reduced) {
      for (const n of net.nodes) Object.assign(n, end.get(n.id));
      sim.alpha = 0;
      paint();
      return;
    }
    sim.alpha = 1;
    run();
  };

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

  const release = (id: string) => {
    const n = net.byId.get(id);
    if (n) n.fx = n.fy = null;
    sim.alphaTarget = 0;
    run();
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
      if (gesture.current?.type === 'node') release(gesture.current.node);
      const [a, b] = [...pointers.current.values()];
      gesture.current = { type: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      return;
    }
    if (pointers.current.size > 2) return;
    const nodeEl = t.closest<SVGGElement>('g[data-n]');
    if (nodeEl) {
      const n = net.byId.get(nodeEl.dataset.n!)!;
      const [wx, wy] = toWorld(px, py);
      gesture.current = { type: 'node', id: e.pointerId, node: n.id, sx: px, sy: py, ox: n.x - wx, oy: n.y - wy, moved: false };
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
      if (gs.type === 'pan') setHover(null);
    }
    if (gs.type === 'node') {
      // drag a node: the physics stays warm, so its neighbours follow on their springs
      const n = net.byId.get(gs.node)!;
      const [wx, wy] = toWorld(px, py);
      n.fx = wx + gs.ox;
      n.fy = wy + gs.oy;
      sim.alphaTarget = 0.3;
      sim.alpha = Math.max(sim.alpha, 0.3);
      run();
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
      if (gs.moved) release(gs.node);
      else if (!cancelled) select(gs.node);
      return;
    }
    if (!gs.moved) {
      if (!cancelled) {
        select(null);
        setSpot(null);
      }
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
      if ((e.target as Element).closest('.rm-insp, .kg-panel, .kg-groups, .rm-results')) return;
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
    if (gesture.current || e.pointerType !== 'mouse') return;
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
    const p = net.byId.get(from)!;
    let best: string | null = null;
    let bestScore = Infinity;
    for (const q of net.nodes) {
      if (q.id === from) continue;
      const vx = q.x - p.x;
      const vy = q.y - p.y;
      const along = vx * dx + vy * dy;
      if (along <= 4) continue;
      const score = along + Math.abs(vx * dy - vy * dx) * 2.2;
      if (score < bestScore) {
        bestScore = score;
        best = q.id;
      }
    }
    if (best) els.current.nodes.find(([, n]) => n.id === best)?.[0].focus({ preventScroll: true });
  };

  const onKeyDown = (e: RKeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, .rm-insp, .rm-hud')) {
      if (e.key === 'Escape' && t.closest('.rm-insp')) select(null);
      if (e.key === 'Escape' && t.closest('.kg-panel')) setPanel(false);
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
        setSpot(null);
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
    const n = net.byId.get(id)!;
    const { x, y, k } = cam.current;
    const v = view();
    const sx = n.x * k + x;
    const sy = n.y * k + y;
    if (sx < 80 || sy < 80 || sx > v.w - 80 || sy > v.h - 80) flyTo(pointCam(n.x, n.y, Math.max(k, 1)), 420);
  };
  const onBlur = (e: RFocusEvent) => {
    const id = (e.target as Element).closest<SVGGElement>('g[data-n]')?.dataset.n;
    if (id && kbFocus.current === id) {
      kbFocus.current = null;
      setHover((h) => (h === id ? null : h));
    }
  };

  /** Light up one colour group (and frame it), or turn the spotlight off. */
  const spotlight = (key: string) => {
    if (spot === key) return setSpot(null);
    setSpot(key);
    const members = net.nodes.filter((n) => groupByNode.get(n.id)?.key === key);
    if (members.length) flyTo(boxCam(netBounds(members), 1.4, 60), 700);
  };
  const setForce = (id: keyof Forces, v: number) => setDisplay((d) => ({ ...d, forces: { ...d.forces, [id]: v } }));
  const toggle = (k: 'threads' | 'spokes' | 'arrows' | 'labels') => setDisplay((d) => ({ ...d, [k]: !d[k] }));

  /* ---------------- render ---------------- */

  // lit links draw last, on top
  const links = net.links
    .filter((l) => (l.e.kind === 'thread' ? display.threads : l.e.kind === 'spoke' ? display.spokes : true) || (hl?.edges.has(l.id) ?? false))
    .sort((a, b) => (edgeLit(a) ? 1 : 0) - (edgeLit(b) ? 1 : 0));
  // Neo4j-style captions on the "builds on" links you're tracing
  const captions = hl ? net.links.filter((l) => l.e.kind === 'thread' && (hl.edges.get(l.id) === 'up' || hl.edges.get(l.id) === 'down')) : [];
  const selNode = selected ? (graph.byId.get(selected) ?? null) : null;
  const hovNode = hover && !dragging ? (graph.byId.get(hover) ?? null) : null;
  const next = status.next;
  const nextNode = nextId ? (graph.byId.get(nextId) as LessonNode | undefined) : undefined;

  return (
    <div
      ref={canvasRef}
      className="rm-canvas kg-canvas"
      data-focus={hl || spotIds ? '' : undefined}
      data-spot={!hl && spotIds ? '' : undefined}
      data-dragging={dragging || undefined}
      data-intro={intro || undefined}
      data-panel={selNode ? '' : undefined}
      data-arrows={display.arrows || undefined}
      data-labels={display.labels || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endPointer(e, false)}
      onPointerCancel={(e) => endPointer(e, true)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <svg
        className="kg-svg"
        role="group"
        aria-label={`Graph of ${course.title}: parts, lessons and which lessons build on which. Use Tab or the arrow keys to move between them.`}
        onPointerOver={onPointerOver}
        onPointerLeave={onPointerLeave}
      >
        <defs>
          {(['faint', 'up', 'down'] as const).map((m) => (
            <marker key={m} id={`kg-arrow-${m}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto">
              <path d="M0 0.8 L10 5 L0 9.2 Z" className={`kg-head kg-head--${m}`} />
            </marker>
          ))}
          <radialGradient id="kg-vignette" cx="50%" cy="45%" r="70%">
            <stop offset="0" className="kg-vig-in" />
            <stop offset="1" className="kg-vig-out" />
          </radialGradient>
        </defs>
        <rect className="kg-bg" width="100%" height="100%" fill="url(#kg-vignette)" />
        <g ref={worldRef} className="kg-world">
          <g className="kg-edges">
            {links.map((l) => (
              <line key={l.id} data-e={l.id} className={`kg-edge kg-${l.e.kind}${l.e.cross ? ' is-cross' : ''}`} data-lit={edgeLit(l)} data-state={spine.get(l.id)} />
            ))}
          </g>
          <g className="kg-caps" aria-hidden>
            {captions.map((l) => (
              <text key={l.id} data-c={l.id} className="kg-cap" data-k={hl!.edges.get(l.id)} dy={-4}>
                UNLOCKS
              </text>
            ))}
          </g>
          <g className="kg-nodes">
            {net.nodes.map((n) => (
              <GraphNode key={n.id} n={n} status={status} tone={groupByNode.get(n.id)?.tone} next={n.id === nextId} lit={nodeLit(n.id)} selected={n.id === selected} />
            ))}
          </g>
          <g className="kg-toplabels" aria-hidden>
            {net.nodes
              .filter((n) => n.g.kind === 'hub' || n.g.kind === 'start' || n.g.kind === 'finish')
              .map((n) => (
                <g key={n.id} data-o={n.id} className="kg-olabel" data-kind={n.g.kind} data-lit={nodeLit(n.id)} style={{ '--vr': n.vr, '--ln': n.lines.length } as CSSProperties}>
                  <NodeLabel lines={n.lines} />
                </g>
              ))}
          </g>
        </g>
      </svg>

      {/* ---- hover card ---- */}
      <div ref={tipRef} className="rm-tip" hidden={!hovNode || hovNode.id === selected} aria-hidden>
        {hovNode && <TipBody n={hovNode} status={status} graph={graph} />}
      </div>

      {/* ---- top left: search + display ---- */}
      <div className="rm-hud rm-hud-tl">
        <MapSearch graph={graph} inputRef={searchRef} onPick={(id) => select(id)} />
        <div className="rm-toggles">
          <button type="button" className="rm-chip" aria-pressed={panel} aria-expanded={panel} aria-controls="kg-panel" onClick={() => setPanel((v) => !v)}>
            <SlidersHorizontal size={14} /> Display
          </button>
          <button type="button" className="rm-chip" onClick={relayout} title="Start the layout over and watch it settle">
            <RotateCcw size={14} /> Re-layout
          </button>
        </div>
        {panel && (
          <div className="kg-panel" id="kg-panel" role="group" aria-label="Graph display">
            <p className="kg-h">Colour by</p>
            <div className="kg-seg" role="radiogroup" aria-label="Colour by">
              {COLOR_BY.map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={display.colorBy === c.id} onClick={() => setDisplay((d) => ({ ...d, colorBy: c.id }))}>
                  {c.label}
                </button>
              ))}
            </div>
            <p className="kg-h">Show</p>
            <div className="kg-switches">
              <Switch on={display.threads} onToggle={() => toggle('threads')} label="“Builds on” links" />
              <Switch on={display.spokes} onToggle={() => toggle('spokes')} label="Lesson → part links" />
              <Switch on={display.arrows} onToggle={() => toggle('arrows')} label="Arrows" />
              <Switch on={display.labels} onToggle={() => toggle('labels')} label="Lesson names" />
            </div>
            <p className="kg-h">
              Forces
              {JSON.stringify(display.forces) !== JSON.stringify(DEFAULT_FORCES) && (
                <button type="button" className="kg-link" onClick={() => setDisplay((d) => ({ ...d, forces: DEFAULT_FORCES }))}>
                  Reset
                </button>
              )}
            </p>
            {FORCE_SLIDERS.map((f) => (
              <label key={f.id} className="kg-slider">
                <span>{f.label}</span>
                <input type="range" min={f.min} max={f.max} step={0.05} value={display.forces[f.id]} onChange={(e) => setForce(f.id, Number(e.target.value))} />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* ---- top right: zoom ---- */}
      <div className="rm-hud rm-hud-tr" role="toolbar" aria-label="Graph view">
        <button type="button" className="rm-tool" onClick={() => zoomBy(1.35)} aria-label="Zoom in" title="Zoom in (+)">
          <Plus size={17} />
        </button>
        <span ref={zoomRef} className="rm-zoom mono" aria-live="off">
          100%
        </span>
        <button type="button" className="rm-tool" onClick={() => zoomBy(1 / 1.35)} aria-label="Zoom out" title="Zoom out (−)">
          <Minus size={17} />
        </button>
        <span className="rm-tool-gap" />
        <button type="button" className="rm-tool" onClick={() => fitAll()} aria-label="Show the whole graph" title="Whole graph (0)">
          <Maximize2 size={16} />
        </button>
        <button type="button" className="rm-tool" onClick={() => nextId && focusOn(nextId)} aria-label="Go to your next lesson" title="Where am I?" disabled={!nextId}>
          <LocateFixed size={17} />
        </button>
      </div>

      {/* ---- bottom left: colour groups (click one to spotlight it) ---- */}
      <div className="rm-hud kg-groups">
        <p className="kg-h">{display.colorBy === 'topic' ? 'Topics' : display.colorBy === 'part' ? 'Parts' : 'Your progress'}</p>
        <ul>
          {groups.map((g) => (
            <li key={g.key} data-tone={g.tone} data-k={display.colorBy === 'progress' ? g.key : undefined}>
              <button type="button" aria-pressed={spot === g.key} onClick={() => spotlight(g.key)} title={`Spotlight ${g.label}`}>
                <i aria-hidden />
                <span>{g.label}</span>
                <small>{g.count}</small>
              </button>
            </li>
          ))}
        </ul>
        <div className="kg-key" aria-label="Key">
          <span>
            <i className="kg-key-done" /> done
          </span>
          <span>
            <i className="kg-key-new" /> to do
          </span>
          <span>
            <i className="kg-key-gate" /> gate
          </span>
        </div>
      </div>

      {/* ---- bottom centre: next up ---- */}
      <div className="rm-hud rm-hud-bc">
        {hint && (
          <p className="rm-hint">
            <MousePointerClick size={15} /> Hover to trace links · drag a dot and let go · scroll to zoom
          </p>
        )}
        {next && nextNode ? (
          <div className="rm-next" data-tone={nextNode.part.tone}>
            <button type="button" className="rm-next-where" onClick={() => select(nextNode.id)} title="Show it on the graph">
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

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} className="kg-switch" onClick={onToggle}>
      <span>{label}</span>
      <i aria-hidden />
    </button>
  );
}

function NodeLabel({ lines }: { lines: string[] }) {
  return (
    <text className="kg-label">
      {lines.map((s, i) => (
        <tspan key={i} x={0} dy={i ? '1.2em' : 0}>
          {s}
        </tspan>
      ))}
    </text>
  );
}

function GraphNode({ n, status, tone, next, lit, selected }: { n: NetNode; status: MapStatus; tone?: string; next: boolean; lit?: Role; selected: boolean }) {
  const g = n.g;
  const label = <NodeLabel lines={n.lines} />;
  const common = {
    style: { '--vr': n.vr, '--ln': n.lines.length } as CSSProperties,
    'data-n': n.id,
    'data-kind': g.kind,
    'data-tone': tone ?? (g.kind === 'finish' ? 'warn' : 'neutral'),
    'data-lit': lit,
    'data-sel': selected || undefined,
    tabIndex: 0,
    role: 'button',
  } as const;

  if (g.kind === 'lesson') {
    const s = status.lessons[g.stub.id];
    const stateLabel = s.state === 'done' ? 'done' : s.state === 'started' ? 'in progress' : s.state === 'soon' ? 'coming soon' : 'not started';
    return (
      <g {...common} className="kg-node kg-lesson" data-state={s.state} data-next={next || undefined} aria-label={`${g.stub.title} — part ${g.part.num}, ${stateLabel}`}>
        <circle className="kg-hit" r={n.vr + 7} />
        {next && <circle className="kg-pulse" r={n.vr + 5} />}
        {s.state === 'done' && <circle className="kg-halo" r={n.vr + 4.5} />}
        <circle className="kg-dot" r={n.vr} />
        {s.state === 'started' && <circle className="kg-arc" r={n.vr + 3} pathLength={100} strokeDasharray={`${Math.max(8, s.frac * 100)} 100`} transform="rotate(-90)" />}
        {label}
      </g>
    );
  }
  if (g.kind === 'hub') {
    const p = status.parts[g.part.id];
    const pct = p.done / Math.max(1, p.total);
    return (
      <g {...common} className="kg-node kg-hub" data-state={p.complete ? 'done' : p.started ? 'started' : 'new'} aria-label={`Part ${g.part.num}: ${g.part.title} — ${p.done} of ${p.total} lessons done`}>
        <circle className="kg-hit" r={n.vr + 6} />
        <circle className="kg-hub-track" r={n.vr + 4.5} />
        {pct > 0 && <circle className="kg-hub-arc" r={n.vr + 4.5} pathLength={100} strokeDasharray={`${pct * 100} 100`} transform="rotate(-90)" />}
        <circle className="kg-dot" r={n.vr} />
        <text className="kg-hub-num" dy="0.36em">
          {g.part.num}
        </text>
      </g>
    );
  }
  if (g.kind === 'gate') {
    const s = status.gates[g.part.id].state;
    const r = n.vr + 1.5;
    return (
      <g {...common} className="kg-node kg-gate" data-state={s} aria-label={`Gate ${g.part.num} quiz — ${s}`}>
        <circle className="kg-hit" r={n.vr + 6} />
        <path className="kg-dot" d={`M0 ${-r}L${r} 0L0 ${r}L${-r} 0Z`} />
        {label}
      </g>
    );
  }
  return (
    <g {...common} className={`kg-node kg-${g.kind}`} aria-label={g.kind === 'start' ? 'Start here' : 'Capstone — the finish line'}>
      <circle className="kg-hit" r={n.vr + 6} />
      <circle className="kg-ring" r={n.vr + 4.5} />
      <circle className="kg-dot" r={n.vr} />
    </g>
  );
}
