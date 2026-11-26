/**
 * "How one app works" — the whole stack on one page, for someone who has never seen it.
 *
 * One click ("Add: Buy milk") travels through every layer and back: the person, the frontend
 * (screen → fetch → state), the internet, the backend (router → middleware → logic → model) and
 * the database. Each step lights the parts it uses, sends a packet along their wires, and says
 * what happens in plain words, why that tool is there, and the real code behind it. Every wire
 * carries its step number, so the whole route can be read at a glance before pressing anything.
 *
 * It looks like the lessons (engine/stage.css): a desk with raised platforms and paper blocks with
 * hatched sides. Unlike a lesson stage it is laid out with CSS, so it can reflow from a wide row
 * to a tall column. The layout is then measured, and the wires, step numbers and packets are drawn
 * on top of it, using the engine's own routing and packets.
 */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  ArrowUp,
  Braces,
  ChevronLeft,
  ChevronRight,
  Cog,
  Database,
  FileCode2,
  Layers,
  Lightbulb,
  Monitor,
  MousePointerClick,
  Pause,
  Play,
  Rocket,
  Route,
  Server,
  ShieldCheck,
  Sparkles,
  User,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Extrusion } from '@/engine/nodes/Depth';
import { BLOCK_R, ZONE_R, linkId, linkPoints, pathD, pointAt, polyLength, type Pt, type Rect } from '@/engine/geometry';
import { PacketLayer } from '@/engine/PacketLayer';
import type { FlowSpec, LinkSpec, PacketKind, Tone } from '@/engine/types';
import { CodeLines } from '@/lib/highlight';
import { usePrefersReducedMotion } from '@/lib/media';
import './appAnatomy.css';

/** How long each step stays up while the tour plays. */
const STEP_MS = 8000;
/** Packets move slower than in a lesson: these wires are short. */
const PACE = 0.38;

type BlockId = 'you' | 'screen' | 'fetch' | 'state' | 'router' | 'mw' | 'logic' | 'model' | 'mongo';

interface Step {
  /** Label on the step rail. */
  short: string;
  title: string;
  /** Where it happens: colours the step. */
  tone: Tone;
  where: string;
  /** The story in everyday words. */
  plain: string;
  /** Why this tool (or this design) is used at all. */
  why: { q: string; a: string };
  file: string;
  code: string;
  lang: string;
  /** The parts this step uses. */
  on: BlockId[];
  /** What travels, and along which wires (see LINKS). */
  flows: FlowSpec[];
  /** The wire that carries this step's number, and how far along it sits. */
  mark: [from: string, to: string, at?: number];
}

/*
 * The wires. `a@req` / `a@res` are the two lanes of a two-way wire: the request goes out on one,
 * the response comes back on the other (see withLanes).
 */
const LINKS: LinkSpec[] = [
  { from: 'you', to: 'screen' },
  { from: 'screen', to: 'fetch' },
  { from: 'fetch', to: 'state' },
  { from: 'state', to: 'screen' },
  { from: 'fetch@req', to: 'router@req' },
  { from: 'router@res', to: 'fetch@res' },
  { from: 'router', to: 'mw' },
  { from: 'mw', to: 'logic' },
  { from: 'logic', to: 'model' },
  { from: 'model@req', to: 'mongo@req' },
  { from: 'mongo@res', to: 'model@res' },
];

/** Two-way wires, and the words written beside them. */
const PAIRS: { a: string; b: string; say: [string, string] }[] = [
  { a: 'fetch', b: 'router', say: ['the internet', 'HTTP · JSON'] },
  { a: 'model', b: 'mongo', say: ['query', 'read/write'] },
];

const STEPS: Step[] = [
  {
    short: 'Click',
    title: 'You click “Add”',
    tone: 'client',
    where: 'Frontend · in your browser',
    plain: 'Everything starts with a person. You type “Buy milk” into the page and press Add. The rest of this diagram exists to answer that one click.',
    why: {
      q: 'Why React?',
      a: 'You describe the page as small components, like this form, instead of changing the page by hand. When your data changes, React updates the screen for you.',
    },
    file: 'TodoForm.jsx',
    code: `<input\n  value={title}\n  onChange={(e) => setTitle(e.target.value)}\n/>\n<button onClick={addTodo}>Add</button>`,
    lang: 'jsx',
    on: ['you', 'screen'],
    flows: [{ path: ['you', 'screen'], kind: 'event', label: 'click', every: 2.2, speed: PACE }],
    mark: ['you', 'screen'],
  },
  {
    short: 'fetch',
    title: 'The page asks the server',
    tone: 'client',
    where: 'Frontend · fetch',
    plain: 'The click runs your function, addTodo. The browser can’t keep your todo safe on its own, so the function calls fetch, which writes a request for the server: where it goes, what to do, and the data.',
    why: {
      q: 'Why fetch?',
      a: 'It’s built into every browser. One function sends a request and waits for the answer, and the page never reloads.',
    },
    file: 'TodoForm.jsx',
    code: `async function addTodo() {\n  const res = await fetch('/api/todos', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({ title }),\n  });\n}`,
    lang: 'js',
    on: ['screen', 'fetch'],
    flows: [{ path: ['screen', 'fetch'], kind: 'data', label: '{ title }', every: 2.2, speed: PACE }],
    mark: ['screen', 'fetch'],
  },
  {
    short: 'Request',
    title: 'The request crosses the internet',
    tone: 'net',
    where: 'The internet · HTTP',
    plain: 'A request is just text sent to the server’s address. It says what to do (POST) and where (/api/todos), who is asking (a token), and carries your data written as JSON.',
    why: {
      q: 'Why not save straight into the database?',
      a: 'Anyone can open DevTools and change the code running in their own browser. So the rules and the database password stay on a server you control, and the browser can only ask.',
    },
    file: 'the request',
    code: `POST /api/todos HTTP/1.1\nHost: todo.app\nAuthorization: Bearer eyJhbGciOi…\nContent-Type: application/json\n\n{"title":"Buy milk"}`,
    lang: 'http',
    on: ['fetch', 'router'],
    flows: [{ path: ['fetch@req', 'router@req'], kind: 'req', label: 'POST /api/todos', every: 2.4, speed: PACE }],
    mark: ['fetch@req', 'router@req', 0.26],
  },
  {
    short: 'Router',
    title: 'Express finds the right code',
    tone: 'server',
    where: 'Backend · Express',
    plain: 'The backend is a program that is always running, waiting for requests. Express reads the method and the path, POST /api/todos, and runs the functions listed for that route, one after another.',
    why: {
      q: 'Why Express?',
      a: 'Node.js can take requests by itself, but you would have to pick apart every address and header by hand. With Express, each route is one line.',
    },
    file: 'server.js',
    code: `app.use(express.json());   // JSON text → req.body\n\napp.post('/api/todos',\n  requireAuth,     // 1. who is asking?\n  validateTodo,    // 2. is the data OK?\n  createTodo,      // 3. do the work\n);`,
    lang: 'js',
    on: ['router'],
    flows: [{ path: ['router', 'mw'], kind: 'req', every: 1.8, speed: PACE }],
    mark: ['router', 'mw'],
  },
  {
    short: 'Middleware',
    title: 'Middleware checks it first',
    tone: 'server',
    where: 'Backend · middleware',
    plain: 'Middleware functions run before your logic. This one reads the token to find out who is asking. If a check fails, the request stops here with an error such as 401, and your logic never runs.',
    why: {
      q: 'Why middleware?',
      a: 'Lots of routes need the same checks. Write “is this person logged in?” once, then put it in front of every route that needs it.',
    },
    file: 'auth.js',
    code: `function requireAuth(req, res, next) {\n  const user = verifyToken(req.headers.authorization);\n  if (!user) return res.sendStatus(401); // stop here\n  req.user = user;   // remember who it is\n  next();            // pass it on\n}`,
    lang: 'js',
    on: ['mw'],
    flows: [{ path: ['mw', 'logic'], kind: 'req', every: 1.8, speed: PACE }],
    mark: ['mw', 'logic'],
  },
  {
    short: 'Logic',
    title: 'Your logic runs',
    tone: 'server',
    where: 'Backend · Node.js',
    plain: 'This is the part you write: your app’s rules. Here they are simple: tidy the title and record who owns the todo. Then the logic asks the model to save it.',
    why: {
      q: 'Why Node.js?',
      a: 'It runs JavaScript outside the browser, so the frontend and the backend use one language. While one request waits for the database, Node serves the others.',
    },
    file: 'todos.js',
    code: `async function createTodo(req, res) {\n  const title = req.body.title.trim();\n  const todo = await Todo.create({\n    title,\n    owner: req.user.id,\n  });\n  res.status(201).json(todo);\n}`,
    lang: 'js',
    on: ['logic'],
    flows: [{ path: ['logic', 'model'], kind: 'data', every: 1.8, speed: PACE }],
    mark: ['logic', 'model'],
  },
  {
    short: 'Database',
    title: 'MongoDB saves it to disk',
    tone: 'data',
    where: 'Database · Mongoose and MongoDB',
    plain: 'The model is the only part that talks to the database. Mongoose checks the todo against its schema and sends MongoDB an insert. MongoDB writes it to disk and hands it back with a new _id.',
    why: {
      q: 'Why MongoDB and Mongoose?',
      a: 'MongoDB stores documents shaped like the JSON your app already uses, and Mongoose makes sure every todo has the same shape. Unlike the server’s memory, the disk survives a restart.',
    },
    file: 'Todo.js',
    code: `const Todo = mongoose.model('Todo', new Schema({\n  title: { type: String, required: true },\n  done:  { type: Boolean, default: false },\n  owner: { type: ObjectId, ref: 'User' },\n}));\n// Todo.create(…) becomes db.todos.insertOne(…)`,
    lang: 'js',
    on: ['model', 'mongo'],
    flows: [
      {
        path: ['model@req', 'mongo@req'],
        kind: 'data',
        label: 'insertOne',
        back: 'res',
        returnVia: ['mongo@res', 'model@res'],
        backLabel: 'saved ✓',
        every: 3,
        dwell: 0.35,
        speed: PACE,
      },
    ],
    mark: ['model@req', 'mongo@req', 0.3],
  },
  {
    short: 'Response',
    title: 'The answer travels back',
    tone: 'net',
    where: 'The internet · HTTP',
    plain: 'Your logic replies with a status code and the saved todo as JSON. 201 means “created”. That finishes the request, and the server goes back to waiting for the next one.',
    why: {
      q: 'Why status codes?',
      a: 'One number tells the page how it went: 201 created, 400 bad data, 401 not logged in, 500 the server broke. The page can handle each case.',
    },
    file: 'the response',
    code: `HTTP/1.1 201 Created\nContent-Type: application/json\n\n{"_id":"65f2a9c1…","title":"Buy milk","done":false}`,
    lang: 'http',
    on: ['logic', 'router', 'fetch'],
    flows: [{ path: ['router@res', 'fetch@res'], kind: 'res', label: '201 Created', every: 2.4, speed: PACE }],
    mark: ['router@res', 'fetch@res', 0.26],
  },
  {
    short: 'Redraw',
    title: 'React redraws the screen',
    tone: 'client',
    where: 'Frontend · React',
    plain: 'fetch hands the reply back to your function, which adds the saved todo to state. React sees the state change, redraws the list, and “Buy milk” appears. One click, one round trip.',
    why: {
      q: 'Why state?',
      a: 'You never edit the screen directly. You change the data, and React works out which parts of the page need to change.',
    },
    file: 'TodoForm.jsx',
    code: `const saved = await res.json();\nsetTodos((todos) => [...todos, saved]);\n// React redraws the list, and “Buy milk” appears`,
    lang: 'js',
    on: ['fetch', 'state', 'screen', 'you'],
    flows: [{ path: ['fetch', 'state', 'screen', 'you'], kind: 'res', label: ['saved todo', '', ''], every: 3.2, speed: PACE }],
    mark: ['fetch', 'state'],
  },
];

/** Clicking a part jumps to the step where it does its main job. */
const STEP_OF: Record<BlockId, number> = { you: 0, screen: 0, fetch: 1, router: 3, mw: 4, logic: 5, model: 6, mongo: 6, state: 8 };

/* ---------------- the parts ---------------- */

type PartId = 'fetch' | 'state' | 'router' | 'mw' | 'logic' | 'model';

const PARTS: Record<PartId, { icon: LucideIcon; name: string; tag: string; text: string; tone: Tone }> = {
  fetch: { icon: Zap, name: 'API call', tag: 'fetch', text: 'Sends the request, then waits for the reply.', tone: 'client' },
  state: { icon: Braces, name: 'State', tag: 'useState', text: 'What the page remembers right now.', tone: 'client' },
  router: { icon: Route, name: 'Router', tag: 'Express', text: 'Reads the address and picks the code to run.', tone: 'server' },
  mw: { icon: ShieldCheck, name: 'Middleware', tag: 'checks', text: 'Logged in? Sensible data? If not, it stops here.', tone: 'server' },
  logic: { icon: Cog, name: 'Your logic', tag: 'Node.js', text: 'Your app’s rules, in plain JavaScript.', tone: 'server' },
  model: { icon: Layers, name: 'Model', tag: 'Mongoose', text: 'Gives data a fixed shape and talks to MongoDB.', tone: 'server' },
};

type PlatformId = 'fe' | 'be' | 'db';

const PLATFORMS: Record<PlatformId, { tone: Tone; icon: LucideIcon; name: string; where: string; to: string; parts: BlockId[] }> = {
  fe: { tone: 'client', icon: Monitor, name: 'Frontend', where: 'runs in your browser', to: '/frontend', parts: ['screen', 'fetch', 'state'] },
  be: { tone: 'server', icon: Server, name: 'Backend', where: 'runs on a server', to: '/backend', parts: ['router', 'mw', 'logic', 'model'] },
  db: { tone: 'data', icon: Database, name: 'Database', where: 'keeps data on disk', to: '/database', parts: ['mongo'] },
};

const LEGEND: [PacketKind, string][] = [
  ['event', 'your action'],
  ['req', 'request'],
  ['data', 'data'],
  ['res', 'response'],
];

/* ---------------- geometry ---------------- */

/** Half the gap between the two lanes of a two-way wire. */
const LANE = 7;
const HEAD = 10;

/** A solid triangular head at the end of the polyline (as on a lesson stage). */
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

/** Where an element sits inside `root`, ignoring transforms (lit parts rise with `translate`). */
function rectIn(el: HTMLElement, root: HTMLElement): Rect | null {
  let x = 0;
  let y = 0;
  let cur: HTMLElement | null = el;
  while (cur && cur !== root) {
    x += cur.offsetLeft;
    y += cur.offsetTop;
    cur = cur.offsetParent as HTMLElement | null;
  }
  if (cur !== root) return null;
  return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2, w: el.offsetWidth, h: el.offsetHeight };
}

const overlap = (a0: number, a1: number, b0: number, b1: number) => Math.min(a1, b1) - Math.max(a0, b0);

/** True when b sits beside a (so the wire between them runs across, not up and down). */
function beside(a: Rect, b: Rect): boolean {
  const oy = overlap(a.y - a.h / 2, a.y + a.h / 2, b.y - b.h / 2, b.y + b.h / 2);
  const ox = overlap(a.x - a.w / 2, a.x + a.w / 2, b.x - b.w / 2, b.x + b.w / 2);
  if (oy > 14 && ox <= 14) return true;
  if (ox > 14 && oy <= 14) return false;
  return Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
}

/** Adds the request and response lanes of each two-way wire, one either side of its middle. */
function withLanes(rects: Map<string, Rect>) {
  for (const { a, b } of PAIRS) {
    const ra = rects.get(a);
    const rb = rects.get(b);
    if (!ra || !rb) continue;
    const across = beside(ra, rb);
    const shift = (r: Rect, d: number): Rect => (across ? { ...r, y: r.y + d } : { ...r, x: r.x + d });
    rects.set(`${a}@req`, shift(ra, -LANE));
    rects.set(`${b}@req`, shift(rb, -LANE));
    rects.set(`${a}@res`, shift(ra, LANE));
    rects.set(`${b}@res`, shift(rb, LANE));
  }
}

function wirePoints(rects: Map<string, Rect>, from: string, to: string): Pt[] | null {
  const a = rects.get(from);
  const b = rects.get(to);
  return a && b ? linkPoints(a, b) : null;
}

/** Where a step's number sits: on its wire, or just beside it when the wire is too short to hold it. */
function markAt(rects: Map<string, Rect>, [from, to, at = 0.5]: Step['mark']): Pt | null {
  const pts = wirePoints(rects, from, to);
  if (!pts) return null;
  const len = polyLength(pts);
  const p = pointAt(pts, len * at);
  if (len >= 46) return p;
  const a = pts[0];
  const b = pts[pts.length - 1];
  return Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? { x: p.x, y: p.y - 21 } : { x: p.x + 22, y: p.y };
}

/** The wires a step's packets travel on, with the kind of packet on each. */
function litOf(step: Step): Map<string, PacketKind> {
  const lit = new Map<string, PacketKind>();
  const light = (a: string, b: string, k: PacketKind) => {
    const l = LINKS.find((x) => (x.from === a && x.to === b) || (x.from === b && x.to === a));
    if (l) lit.set(linkId(l), k);
  };
  for (const f of step.flows) {
    const kind = f.kind ?? 'req';
    for (let n = 0; n < f.path.length - 1; n++) light(f.path[n], f.path[n + 1], kind);
    if (f.back) {
      const ret = f.returnVia ?? [...f.path].reverse();
      for (let n = 0; n < ret.length - 1; n++) light(ret[n], ret[n + 1], f.back);
    }
  }
  return lit;
}

interface Measured {
  rects: Map<string, Rect>;
  w: number;
  h: number;
}

/** Measures every `[data-node]` inside the map, whenever anything in it changes size. */
function useMeasured(root: RefObject<HTMLDivElement | null>) {
  const layout = useRef(new Map<string, Rect>());
  const [m, setM] = useState<Measured | null>(null);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    let raf = 0;
    let alive = true;
    const measure = () => {
      raf = 0;
      if (!alive) return;
      const rects = new Map<string, Rect>();
      el.querySelectorAll<HTMLElement>('[data-node]').forEach((n) => {
        const r = rectIn(n, el);
        if (r) rects.set(n.dataset.node!, r);
      });
      withLanes(rects);
      layout.current = rects;
      setM({ rects, w: el.offsetWidth, h: el.offsetHeight });
    };
    const later = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver(later);
    ro.observe(el);
    el.querySelectorAll('[data-node], .an-pf').forEach((n) => ro.observe(n));
    document.fonts?.ready.then(later).catch(() => {});
    return () => {
      alive = false;
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [root]);
  return { m, layout };
}

/** The size of an element's parent, kept up to date. */
function useParentSize(ref: RefObject<HTMLElement | null>) {
  const [s, setS] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const fit = () => setS((p) => (p && p.w === el.offsetWidth && p.h === el.offsetHeight ? p : { w: el.offsetWidth, h: el.offsetHeight }));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return s;
}

/* ---------------- paper ---------------- */

/** The hatched sides of the element it sits in: a paper block (default) or a platform (`zone-sides`). */
function Sides({ r = BLOCK_R, dx = 7, dy = 9, gap, className = 'depth' }: { r?: number; dx?: number; dy?: number; gap?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const s = useParentSize(ref);
  return (
    <span ref={ref} className={`${className} an-sides`} aria-hidden>
      {s && <Extrusion w={s.w} h={s.h} r={r} dx={dx} dy={dy} gap={gap} />}
    </span>
  );
}

/** A paper cylinder with a hatched rim, the size of the block it sits in (as on a lesson stage). */
function Cylinder() {
  const ref = useRef<HTMLSpanElement>(null);
  const s = useParentSize(ref);
  const id = `an-db-hatch-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  let shape: ReactNode = null;
  if (s) {
    const { w, h } = s;
    const ry = Math.min(14, h * 0.13);
    const rx = w / 2 - 1;
    const yb = h - ry - 1;
    const yr = yb - 9;
    const body = `M1,${ry} A${rx},${ry} 0 0 1 ${w - 1},${ry} V${yb} A${rx},${ry} 0 0 1 1,${yb} Z`;
    const rim = `M1,${yr} A${rx},${ry} 0 0 0 ${w - 1},${yr} V${yb} A${rx},${ry} 0 0 1 1,${yb} Z`;
    shape = (
      <svg className="db-shape" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <pattern id={id} width="5.5" height="5.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect className="db-hatch-bg" width="5.5" height="5.5" />
            <rect className="db-hatch-line" width="1.7" height="5.5" />
          </pattern>
        </defs>
        <path className="db-body" d={body} />
        <path className="db-rim" d={rim} fill={`url(#${id})`} />
        <ellipse className="db-top" cx={w / 2} cy={ry} rx={rx} ry={ry} />
      </svg>
    );
  }
  return (
    <span ref={ref} className="an-cyl" aria-hidden>
      {shape}
    </span>
  );
}

/* ---------------- the diagram ---------------- */

/** A paper block on a platform. Clicking it jumps to the step where it does its job. */
function Block({ id, tone, on, pick, className = '', children }: { id: BlockId; tone: Tone; on: boolean; pick: (n: number) => void; className?: string; children: ReactNode }) {
  return (
    <button type="button" className={`an-blk paper ${className}`} data-node={id} data-tone={tone} data-on={on || undefined} onClick={() => pick(STEP_OF[id])}>
      {id !== 'mongo' && <Sides />}
      <span className="node-ring" aria-hidden />
      {children}
    </button>
  );
}

function Part({ id, on, pick, children }: { id: PartId; on: boolean; pick: (n: number) => void; children?: ReactNode }) {
  const p = PARTS[id];
  const I = p.icon;
  return (
    <Block id={id} tone={p.tone} on={on} pick={pick}>
      <span className="an-face">
        <span className="an-name">
          <span className="an-ic">
            <I size={14} strokeWidth={2.3} />
          </span>
          {p.name}
          <em className="an-tag">{p.tag}</em>
        </span>
        <span className="an-desc">{p.text}</span>
        {children}
      </span>
    </Block>
  );
}

/** The browser, with the real page on it and a peek at DevTools' Network tab. */
function Screen({ i, on, pick }: { i: number; on: boolean; pick: (n: number) => void }) {
  const added = i >= 8;
  const busy = i >= 1 && i <= 7;
  const net = i >= 7 ? 'done' : i >= 2 ? 'wait' : 'idle';
  return (
    <Block id="screen" tone="client" on={on} pick={pick} className="an-blk--screen">
      <span className="node-card browser an-browser">
        <span className="browser-bar">
          <span className="browser-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="browser-url">todo.app</span>
        </span>
        <span className="browser-body screen an-page">
          <span className="scr-h">My todos</span>
          <span className="scr-item">
            <i />
            Learn MERN
          </span>
          <span className="scr-item">
            <i />
            Call mom
          </span>
          {added && (
            <span className="scr-item" data-flash={i === 8 || undefined}>
              <i />
              Buy milk
            </span>
          )}
          <span className="an-form">
            <span className="scr-input" data-placeholder={added || undefined}>
              {added ? 'New todo…' : 'Buy milk'}
            </span>
            <span className="scr-btn" data-state={i === 0 ? 'active' : busy ? 'disabled' : undefined}>
              {busy ? 'Adding…' : 'Add'}
            </span>
          </span>
        </span>
        <span className="an-net" data-net={net}>
          <span className="an-net-h">DevTools Network</span>
          {net === 'idle' ? (
            <span className="an-net-row an-net-none">no requests yet</span>
          ) : (
            <span className="an-net-row">
              <b>POST</b> /api/todos <em>{net === 'done' ? '201' : 'pending'}</em>
            </span>
          )}
        </span>
      </span>
      <span className="node-badge an-badge">React</span>
    </Block>
  );
}

/** MongoDB: a paper cylinder with the todos collection's documents inside. */
function Mongo({ i, on, pick }: { i: number; on: boolean; pick: (n: number) => void }) {
  return (
    <Block id="mongo" tone="data" on={on} pick={pick} className="an-blk--db">
      <Cylinder />
      <span className="an-db-tx">
        <span className="an-db-name">
          <Database size={14} strokeWidth={2.3} /> MongoDB
        </span>
        <span className="an-db-sub">collection: todos</span>
        <span className="an-docs">
          <span className="an-doc">{'title: "Learn MERN"'}</span>
          <span className="an-doc">{'title: "Call mom"'}</span>
          {i >= 6 ? (
            <span className="an-doc an-doc--new" data-flash={i === 6 || undefined}>
              <span>_id: 65f2a9…</span>
              {'title: "Buy milk"'}
            </span>
          ) : (
            <span className="an-doc an-doc--slot">room for more</span>
          )}
        </span>
      </span>
    </Block>
  );
}

function Platform({ id, on, children }: { id: PlatformId; on: boolean; children: ReactNode }) {
  const p = PLATFORMS[id];
  const I = p.icon;
  return (
    <section className={`an-pf an-pf--${id}`} data-tone={p.tone} data-on={on || undefined} aria-label={`${p.name}, ${p.where}`}>
      <Sides className="zone-sides" r={ZONE_R} dx={10} dy={13} gap={7.5} />
      <span className="an-pf-face" aria-hidden />
      <header className="an-pf-head">
        <span className="an-plate">
          <I size={12} strokeWidth={2.4} />
          {p.name}
        </span>
        <span className="an-pf-where">{p.where}</span>
      </header>
      <div className="an-pf-body">{children}</div>
      <Link to={p.to} className="an-pf-go">
        Learn {p.name.toLowerCase()} <ArrowRight size={13} />
      </Link>
    </section>
  );
}

function Wires({ m, lit }: { m: Measured; lit: Map<string, PacketKind> }) {
  return (
    <svg className="an-wires" width={m.w} height={m.h} viewBox={`0 0 ${m.w} ${m.h}`} aria-hidden>
      {LINKS.map((l) => {
        const pts = wirePoints(m.rects, l.from, l.to);
        if (!pts) return null;
        const id = linkId(l);
        const k = lit.get(id);
        return (
          <g key={id} className="link an-wire" data-on={k ? '' : undefined} data-kind={k}>
            <path className="link-line" d={pathD(trimEnd(pts, HEAD - 3))} />
            <path className="link-arrow" d={arrowHead(pts)} />
            <circle className="link-origin" cx={pts[0].x} cy={pts[0].y} r={3.4} />
          </g>
        );
      })}
      {PAIRS.map(({ a, b, say }) => {
        const req = wirePoints(m.rects, `${a}@req`, `${b}@req`);
        const res = wirePoints(m.rects, `${b}@res`, `${a}@res`);
        if (!req || !res) return null;
        const p = pointAt(req, polyLength(req) / 2);
        const q = pointAt(res, polyLength(res) / 2);
        const across = Math.abs(req[req.length - 1].x - req[0].x) >= Math.abs(req[req.length - 1].y - req[0].y);
        return across ? (
          <g key={a} className="an-cap">
            <text x={p.x} y={Math.max(p.y, q.y) + 25} textAnchor="middle">
              {say[0]}
            </text>
            <text className="an-cap-sub" x={p.x} y={Math.max(p.y, q.y) + 39} textAnchor="middle">
              {say[1]}
            </text>
          </g>
        ) : (
          <g key={a} className="an-cap">
            <text x={Math.min(p.x, q.x) - 16} y={(p.y + q.y) / 2 - 4} textAnchor="end">
              {say[0]}
            </text>
            <text className="an-cap-sub" x={Math.min(p.x, q.x) - 16} y={(p.y + q.y) / 2 + 11} textAnchor="end">
              {say[1]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Each step's number, on the wire it travels. They make the whole route readable at a glance. */
function Marks({ m, i, pick }: { m: Measured; i: number; pick: (n: number) => void }) {
  return (
    <div className="an-marks" aria-hidden>
      {STEPS.map((s, n) => {
        const p = markAt(m.rects, s.mark);
        if (!p) return null;
        return (
          <span
            key={s.short}
            className="an-mark paper"
            data-tone={s.tone}
            data-on={n === i || undefined}
            data-done={n < i || undefined}
            style={{ left: p.x, top: p.y }}
            onClick={() => pick(n)}
            title={`Step ${n + 1}: ${s.title}`}
          >
            {n + 1}
          </span>
        );
      })}
    </div>
  );
}

/** Reduced motion: no moving packets — one still packet, mid-wire, says what is travelling. */
function StillPacket({ m, step }: { m: Measured; step: Step }) {
  const f = step.flows[0];
  const pts = wirePoints(m.rects, f.path[0], f.path[1]);
  if (!pts) return null;
  const p = pointAt(pts, polyLength(pts) * 0.64);
  const label = Array.isArray(f.label) ? f.label[0] : f.label;
  const width = label ? label.length * 6.25 + 14 : 0;
  return (
    <svg className="stage-layer stage-packets" width={m.w} height={m.h} viewBox={`0 0 ${m.w} ${m.h}`} aria-hidden>
      <g className={`pk pk--${f.kind ?? 'req'}`}>
        <circle className="pk-dot" r={7.5} cx={p.x} cy={p.y} />
        {label && (
          <g className="pk-label" transform={`translate(${p.x},${p.y - 30})`}>
            <rect rx={5} ry={5} height={18} width={width} x={-width / 2} />
            <text dy={12.5}>{label}</text>
          </g>
        )}
      </g>
    </svg>
  );
}

/* ---------------- the toolbox ---------------- */

const MERN: { letter: string; name: string; tone: Tone; where: string; job: string; why: string; step: number }[] = [
  {
    letter: 'M',
    name: 'MongoDB',
    tone: 'data',
    where: 'the database',
    job: 'Keeps your data as documents, safe on disk.',
    why: 'Documents look like the JSON your app already uses, so data keeps one shape from the screen to the disk.',
    step: 6,
  },
  {
    letter: 'E',
    name: 'Express',
    tone: 'server',
    where: 'the backend',
    job: 'Receives each request and hands it to the right code.',
    why: 'One line per route, plus middleware for checks, so you never pick raw requests apart by hand.',
    step: 3,
  },
  {
    letter: 'R',
    name: 'React',
    tone: 'client',
    where: 'the frontend',
    job: 'Builds the screen from components and keeps it in step with your data.',
    why: 'Change the data and React redraws only what changed. No hand-written page updates.',
    step: 8,
  },
  {
    letter: 'N',
    name: 'Node.js',
    tone: 'server',
    where: 'the backend',
    job: 'Runs JavaScript on a server that is always on, waiting for requests.',
    why: 'One language for the whole app, and it serves many requests at once while each one waits.',
    step: 5,
  },
];

const AROUND: { tone: Tone; icon: LucideIcon; title: string; lede: string; to: string; items: [string, string][] }[] = [
  {
    tone: 'neutral',
    icon: Wrench,
    title: 'Build it',
    lede: 'Tools you use while making the app. Users never see them.',
    to: '/frontend',
    items: [
      ['npm', 'installs code other people wrote, so you don’t write it again'],
      ['Vite', 'runs the app while you work, then bundles it for browsers'],
      ['DevTools', 'shows every request, so you can see what went wrong'],
    ],
  },
  {
    tone: 'net',
    icon: Rocket,
    title: 'Ship it',
    lede: 'Everything that gets the app to real users and keeps it running.',
    to: '/devops',
    items: [
      ['Git', 'saves every version, so you can undo and work in a team'],
      ['Docker', 'packs the app with all it needs, so it runs the same anywhere'],
      ['CI/CD & hosting', 'tests each change and puts it online for you'],
    ],
  },
  {
    tone: 'ai',
    icon: Sparkles,
    title: 'Add AI',
    lede: 'An optional extra brain. Your backend calls it like any other service.',
    to: '/aiml',
    items: [
      ['LLM API', 'the server sends a model a question and gets an answer'],
      ['Embeddings', 'turn meaning into numbers you can search'],
      ['Vector search', 'finds “similar”, not just “exactly equal”'],
    ],
  },
];

function Tile({ t, show }: { t: (typeof MERN)[number]; show: (n: number) => void }) {
  return (
    <button type="button" className="an-tile paper" data-tone={t.tone} onClick={() => show(t.step)}>
      <Sides r={12} />
      <span className="an-tile-face">
        <span className="an-tile-top">
          <span className="an-letter" aria-hidden>
            {t.letter}
          </span>
          <span className="an-tile-name">
            <strong>{t.name}</strong>
            <span>{t.where}</span>
          </span>
        </span>
        <span className="an-tile-job">{t.job}</span>
        <span className="an-tile-why">
          <b>Why it’s used</b>
          {t.why}
        </span>
        <span className="an-tile-go">
          See it in step {t.step + 1} <ArrowUp size={13} />
        </span>
      </span>
    </button>
  );
}

/* ---------------- section ---------------- */

export function AppAnatomy() {
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [inView, setInView] = useState(false);
  const started = useRef(false); // the tour starts by itself once, the first time it scrolls into view
  const board = useRef<HTMLDivElement>(null);
  const map = useRef<HTMLDivElement>(null);
  const { m, layout } = useMeasured(map);
  const step = STEPS[i];
  const lit = useMemo(() => litOf(step), [step]);
  const touring = playing && inView;

  useEffect(() => {
    const el = board.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.intersectionRatio >= 0.35 && !started.current) {
          started.current = true;
          if (!reduced) setPlaying(true);
        }
      },
      { threshold: [0, 0.35] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (!touring) return;
    const t = setTimeout(() => setI((n) => (n + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(t);
  }, [touring, i]);

  const go = (n: number) => {
    started.current = true;
    setPlaying(false);
    setI((n + STEPS.length) % STEPS.length);
  };
  const toggle = () => {
    started.current = true;
    setPlaying((p) => !p);
  };
  /** From the toolbox: jump to a step and bring the diagram into view. */
  const show = (n: number) => {
    go(n);
    board.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') go(i + 1);
    else if (e.key === 'ArrowLeft') go(i - 1);
    else return;
    e.preventDefault();
  };

  const on = (id: BlockId) => step.on.includes(id);
  const platformOn = (id: PlatformId) => PLATFORMS[id].parts.some(on);

  return (
    <section className="wrap hm-sec an" aria-labelledby="an-h">
      <div className="sec-head">
        <h2 id="an-h">How one app works, start to finish</h2>
        <p>Follow one click through every layer, and see why each tool is there.</p>
      </div>

      <div className="an-board" ref={board} data-tone={step.tone} onKeyDown={onKey}>
        <div className="an-desk">
          <div className="an-desk-top">
            <ul className="an-legend" aria-label="What the moving dots are">
              {LEGEND.map(([k, label]) => (
                <li key={k} data-kind={k}>
                  <i aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
            <span className="an-hint">
              <MousePointerClick size={13} aria-hidden /> Click any part to see its step
            </span>
          </div>

          <div className="an-map" ref={map} data-step={i}>
            <div className="an-you">
              <button type="button" className="an-coin paper" data-node="you" data-tone="neutral" data-on={on('you') || undefined} onClick={() => go(0)} aria-label="You: step 1">
                <Sides r={26} dx={4} dy={6} />
                <span className="node-ring" aria-hidden />
                <span className="an-coin-face">
                  <User size={22} strokeWidth={2.1} />
                </span>
              </button>
              <span className="an-you-tx">
                <strong>You</strong>
                <span>click · read</span>
              </span>
            </div>

            <Platform id="fe" on={platformOn('fe')}>
              <Screen i={i} on={on('screen')} pick={go} />
              <Part id="fetch" on={on('fetch')} pick={go} />
              <Part id="state" on={on('state')} pick={go}>
                <span className="an-val" data-flash={i === 8 || undefined}>
                  todos: {i >= 8 ? 3 : 2} items
                </span>
              </Part>
            </Platform>

            <Platform id="be" on={platformOn('be')}>
              <Part id="router" on={on('router')} pick={go} />
              <Part id="mw" on={on('mw')} pick={go} />
              <Part id="logic" on={on('logic')} pick={go} />
              <Part id="model" on={on('model')} pick={go} />
            </Platform>

            <Platform id="db" on={platformOn('db')}>
              <Mongo i={i} on={on('mongo')} pick={go} />
            </Platform>

            {m && <Wires m={m} lit={lit} />}
            {m && <Marks m={m} i={i} pick={go} />}
            {m &&
              (reduced ? (
                <StillPacket m={m} step={step} />
              ) : (
                <PacketLayer flows={step.flows} links={LINKS} layout={layout} playing={inView} speed={1} resetKey={i} world={map} w={m.w} h={m.h} />
              ))}
          </div>
        </div>

        <div className="an-rail">
          <div className="an-ctl">
            <button type="button" className="btn btn--sm btn--icon" onClick={() => go(i - 1)} aria-label="Previous step">
              <ChevronLeft size={16} />
            </button>
            <button type="button" className="btn btn--sm an-play" onClick={toggle} aria-pressed={playing}>
              {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="btn btn--sm btn--icon" onClick={() => go(i + 1)} aria-label="Next step">
              <ChevronRight size={16} />
            </button>
          </div>
          <ol className="an-stops" aria-label="Steps">
            {STEPS.map((s, n) => (
              <li key={s.short} data-tone={s.tone} data-on={n === i || undefined} data-done={n < i || undefined}>
                <button type="button" className="an-stop" onClick={() => go(n)} aria-current={n === i ? 'step' : undefined} aria-label={`Step ${n + 1}: ${s.title}`}>
                  <span className="an-stop-n">
                    {n + 1}
                    {n === i && touring && !reduced && (
                      <svg key={i} className="an-stop-ring" viewBox="0 0 34 34" aria-hidden>
                        <circle cx="17" cy="17" r="15.5" />
                      </svg>
                    )}
                  </span>
                  <span className="an-stop-l">{s.short}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="an-story" data-tone={step.tone} aria-live={playing ? 'off' : 'polite'}>
          <div className="an-story-copy" key={i}>
            <span className="an-kick">
              <b>{i + 1}</b> of {STEPS.length} · {step.where}
            </span>
            <h3>{step.title}</h3>
            <p>{step.plain}</p>
            <aside className="an-why">
              <span className="an-why-q">
                <Lightbulb size={15} strokeWidth={2.3} aria-hidden /> {step.why.q}
              </span>
              <p>{step.why.a}</p>
            </aside>
          </div>
          <figure className="an-code paper" data-tone={step.tone} key={`c${i}`}>
            <figcaption className="an-code-tab">
              <FileCode2 size={13} aria-hidden /> {step.file}
            </figcaption>
            <pre className="an-code-body">
              <CodeLines code={step.code} lang={step.lang} numbers={false} />
            </pre>
          </figure>
        </div>
      </div>

      <div className="an-sub-head">
        <h3>MERN, letter by letter</h3>
        <p>Four tools, one job each, and the reason each one is worth using.</p>
      </div>
      <div className="an-mern">
        {MERN.map((t) => (
          <Tile key={t.letter} t={t} show={show} />
        ))}
      </div>
      <p className="an-helpers">
        Two helpers carry data between them:{' '}
        <button type="button" className="tlink" onClick={() => show(1)}>
          fetch
        </button>{' '}
        takes it from the browser to the server, and{' '}
        <button type="button" className="tlink" onClick={() => show(6)}>
          Mongoose
        </button>{' '}
        from the server to MongoDB.
      </p>

      <div className="an-sub-head">
        <h3>Around the app</h3>
        <p>
          The diagram is the app itself. These <strong>build it, ship it and extend it</strong>.
        </p>
      </div>
      <div className="an-cast">
        {AROUND.map((c) => {
          const I = c.icon;
          return (
            <Link key={c.title} to={c.to} className="an-card spot" data-tone={c.tone}>
              <span className="an-card-ic">
                <I size={17} strokeWidth={2.1} />
              </span>
              <h4>{c.title}</h4>
              <p>{c.lede}</p>
              <dl>
                {c.items.map(([k, v]) => (
                  <div key={k}>
                    <dt className="mono">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
