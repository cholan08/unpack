/**
 * Turns a course into a positioned graph: one hub per part laid along a winding trail,
 * its lessons in a ring around it, a gate between parts, and "builds on" threads between
 * lessons. Pure and deterministic — the same course and column count give the same map.
 */
import type { Course, LessonMeta, LessonStub, Part } from '@/engine/types';
import { angDist, hash, rand, wrapLabel, type Pt } from './shapes';

export const R_LESSON = 21;
export const R_HUB = 62;
export const R_GATE = 21;

/** Spacing between hubs on the trail. */
const SX = 1000;
const SY = 860;
/** Lesson labels (Inter 13.5px; were Kalam 15px, same widths) — rough metrics used for wrapping and bounds. */
export const LABEL_CHARS = 17;
export const LABEL_LH = 19;
const CHAR_W = 7.6;

interface NodeBase {
  id: string;
  /** Home position (world units). */
  x: number;
  y: number;
  r: number;
  seed: number;
  /** Part index; -1 for the start, parts.length for the finish. */
  pi: number;
}
export interface StartNode extends NodeBase {
  kind: 'start';
}
export interface FinishNode extends NodeBase {
  kind: 'finish';
}
export interface HubNode extends NodeBase {
  kind: 'hub';
  part: Part;
  lessons: string[];
  ring: number;
  title: string[];
}
export interface LessonNode extends NodeBase {
  kind: 'lesson';
  part: Part;
  stub: LessonStub;
  meta?: LessonMeta;
  /** 1-based position inside its part. */
  index: number;
  /** 1-based position across the course. */
  n: number;
  hub: string;
  angle: number;
  lines: string[];
  anchor: 'start' | 'middle' | 'end';
  /** Label position relative to the node centre (first baseline). */
  lx: number;
  ly: number;
}
export interface GateNode extends NodeBase {
  kind: 'gate';
  part: Part;
  from: string;
  to: string;
}
export type GNode = StartNode | FinishNode | HubNode | LessonNode | GateNode;

export type EdgeKind = 'spine' | 'spoke' | 'thread' | 'shortcut';
export interface GEdge {
  id: string;
  kind: EdgeKind;
  from: string;
  to: string;
  /** Sideways bow as a fraction of length. */
  bend: number;
  pi: number;
  /** Thread between two different parts. */
  cross?: boolean;
}

export interface Graph {
  nodes: GNode[];
  byId: Map<string, GNode>;
  edges: GEdge[];
  /** node id → lesson node ids it builds on / that build on it */
  needs: Map<string, string[]>;
  unlocks: Map<string, string[]>;
  bounds: { x0: number; y0: number; x1: number; y1: number };
}

export const lessonNodeId = (lessonId: string) => `l:${lessonId}`;
export const hubNodeId = (partId: string) => `p:${partId}`;
export const gateNodeId = (partId: string) => `g:${partId}`;

const ringRadius = (n: number) => 170 + 10 * n;

/** Where the hubs go: a serpentine of `cols` per row with a little hand-placed jitter. */
function hubPositions(count: number, cols: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const c = i % cols;
    const col = row % 2 ? cols - 1 - c : c;
    const s = hash('hub' + i);
    out.push([col * SX + (rand(s, 1) - 0.5) * 70, row * SY + (rand(s, 2) - 0.5) * 90 + (col % 2 ? 40 : -40)]);
  }
  return out;
}

export function buildGraph(course: Course, cols: number, shortcutTo = 0): Graph {
  const parts = course.parts;
  cols = Math.max(1, Math.min(cols, parts.length));
  const hubs = hubPositions(parts.length, cols);
  const nodes: GNode[] = [];
  const edges: GEdge[] = [];

  // start: before the first hub, on the side the trail comes from
  const first = hubs[0];
  const second = hubs[1] ?? [first[0] + SX, first[1]];
  const back = Math.atan2(first[1] - second[1], first[0] - second[0]);
  const start: StartNode = { kind: 'start', id: 'start', x: first[0] + Math.cos(back) * 470, y: first[1] + Math.sin(back) * 470 + 30, r: 46, seed: hash('start'), pi: -1 };

  // finish: one more step along the trail
  const last = hubs[hubs.length - 1];
  const prev = hubs[hubs.length - 2] ?? [last[0] - SX, last[1]];
  const lastRow = Math.floor((parts.length - 1) / cols);
  const rowFull = parts.length % cols === 0;
  let fwd = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
  if (rowFull && cols > 1) fwd = Math.PI / 2; // the row is full: drop below
  else if (cols > 1) fwd = lastRow % 2 ? Math.PI : 0;
  const finish: FinishNode = { kind: 'finish', id: 'finish', x: last[0] + Math.cos(fwd) * 600, y: last[1] + Math.sin(fwd) * 600, r: 50, seed: hash('finish'), pi: parts.length };

  const trail: Pt[] = [[start.x, start.y], ...hubs, [finish.x, finish.y]];
  let n = 0;
  nodes.push(start);
  edges.push({ id: `s:start>${hubNodeId(parts[0].id)}`, kind: 'spine', from: 'start', to: hubNodeId(parts[0].id), bend: 0.08, pi: -1 });

  parts.forEach((part, pi) => {
    const [hx, hy] = hubs[pi];
    const hid = hubNodeId(part.id);
    const inA = Math.atan2(trail[pi][1] - hy, trail[pi][0] - hx);
    const outA = Math.atan2(trail[pi + 2][1] - hy, trail[pi + 2][0] - hx);
    const count = part.lessons.length;
    const R = ringRadius(count);
    // keep the ring clear of the trail in/out and of the hub's title (straight down)
    const avoid = [inA, outA, Math.PI / 2];
    const step = (Math.PI * 2) / Math.max(1, count);
    let best = 0;
    let bestScore = -1;
    for (let k = 0; k < 48; k++) {
      const off = (k / 48) * step;
      let score = Infinity;
      for (let j = 0; j < count; j++) for (const a of avoid) score = Math.min(score, angDist(off + j * step, a));
      if (score > bestScore + 1e-6) {
        bestScore = score;
        best = off;
      }
    }
    // order the slots clockwise from where the trail enters, so lesson 1 greets you
    const slots = Array.from({ length: count }, (_, j) => best + j * step).sort((a, b) => mod(a - inA) - mod(b - inA));

    const hub: HubNode = { kind: 'hub', id: hid, x: hx, y: hy, r: R_HUB, seed: hash(hid), pi, part, lessons: [], ring: R, title: wrapLabel(part.title, 14) };
    nodes.push(hub);

    part.lessons.forEach((stub, li) => {
      const id = lessonNodeId(stub.id);
      const seed = hash(id);
      const a = slots[li];
      const rr = R + (rand(seed, 7) - 0.5) * 18;
      const x = hx + Math.cos(a) * rr;
      const y = hy + Math.sin(a) * rr;
      const lines = wrapLabel(stub.title, LABEL_CHARS);
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const gap = R_LESSON + 9;
      const anchor = cos > 0.36 ? 'start' : cos < -0.36 ? 'end' : 'middle';
      const lx = cos * gap;
      let ly: number;
      if (anchor !== 'middle') ly = sin * gap - ((lines.length - 1) * LABEL_LH) / 2 + 5 + sin * 4;
      else if (sin > 0) ly = sin * gap + 13;
      else ly = sin * gap - (lines.length - 1) * LABEL_LH - 4;
      nodes.push({ kind: 'lesson', id, x, y, r: R_LESSON, seed, pi, part, stub, meta: course.lessons[stub.id], index: li + 1, n: ++n, hub: hid, angle: a, lines, anchor, lx, ly });
      hub.lessons.push(id);
      edges.push({ id: `k:${id}`, kind: 'spoke', from: hid, to: id, bend: 0, pi });
    });

    // gate: on the trail, between this hub and the next stop
    const [nx, ny] = trail[pi + 2];
    const gid = gateNodeId(part.id);
    const gs = hash(gid);
    const side = (rand(gs, 1) - 0.5) * 60;
    const len = Math.hypot(nx - hx, ny - hy) || 1;
    const nextId = pi + 1 < parts.length ? hubNodeId(parts[pi + 1].id) : 'finish';
    nodes.push({
      kind: 'gate',
      id: gid,
      x: (hx + nx) / 2 - ((ny - hy) / len) * side,
      y: (hy + ny) / 2 + ((nx - hx) / len) * side,
      r: R_GATE,
      seed: gs,
      pi,
      part,
      from: hid,
      to: nextId,
    });
    edges.push({ id: `s:${hid}>${gid}`, kind: 'spine', from: hid, to: gid, bend: (rand(gs, 2) - 0.5) * 0.18, pi });
    edges.push({ id: `s:${gid}>${nextId}`, kind: 'spine', from: gid, to: nextId, bend: (rand(gs, 3) - 0.5) * 0.18, pi });
  });
  nodes.push(finish);

  if (shortcutTo > 0 && shortcutTo < parts.length)
    edges.push({ id: 'x:shortcut', kind: 'shortcut', from: 'start', to: hubNodeId(parts[shortcutTo].id), bend: -0.22, pi: -1 });

  // "builds on" threads
  const byId = new Map(nodes.map((nd) => [nd.id, nd]));
  const needs = new Map<string, string[]>();
  const unlocks = new Map<string, string[]>();
  for (const nd of nodes) {
    if (nd.kind !== 'lesson') continue;
    for (const need of nd.stub.needs ?? []) {
      const from = byId.get(lessonNodeId(need));
      if (!from || from.kind !== 'lesson') continue;
      push(needs, nd.id, from.id);
      push(unlocks, from.id, nd.id);
      const s = hash(from.id + nd.id);
      edges.push({ id: `t:${from.id}>${nd.id}`, kind: 'thread', from: from.id, to: nd.id, bend: (rand(s, 0) > 0.5 ? 1 : -1) * (0.12 + rand(s, 1) * 0.1), pi: nd.pi, cross: from.pi !== nd.pi });
    }
  }

  // bounds, including lesson labels
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const nd of nodes) {
    let [l, t, r, b] = [nd.x - nd.r, nd.y - nd.r, nd.x + nd.r, nd.y + nd.r];
    if (nd.kind === 'lesson') {
      const w = Math.max(...nd.lines.map((s) => s.length)) * CHAR_W;
      const lx = nd.x + nd.lx;
      const ax = nd.anchor === 'start' ? lx : nd.anchor === 'end' ? lx - w : lx - w / 2;
      l = Math.min(l, ax);
      r = Math.max(r, ax + w);
      t = Math.min(t, nd.y + nd.ly - 16);
      b = Math.max(b, nd.y + nd.ly + (nd.lines.length - 1) * LABEL_LH + 6);
    }
    if (nd.kind === 'hub') b = Math.max(b, nd.y + nd.r + 130);
    x0 = Math.min(x0, l);
    y0 = Math.min(y0, t);
    x1 = Math.max(x1, r);
    y1 = Math.max(y1, b);
  }
  const pad = 70;
  return { nodes, byId, edges, needs, unlocks, bounds: { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad } };
}

/** Bounds of one part's cluster (hub, ring and labels). */
export function clusterBounds(g: Graph, hubId: string) {
  const hub = g.byId.get(hubId);
  if (!hub || hub.kind !== 'hub') return null;
  const pad = R_LESSON + 150;
  return { x0: hub.x - hub.ring - pad, x1: hub.x + hub.ring + pad, y0: hub.y - hub.ring - 70, y1: hub.y + hub.ring + 80 };
}

const mod = (a: number) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

function push(m: Map<string, string[]>, k: string, v: string) {
  const arr = m.get(k);
  if (arr) arr.push(v);
  else m.set(k, [v]);
}

/** Which nodes and edges light up when `focus` is hovered or selected. */
export type Role = 'self' | 'up' | 'down' | 'ctx';
export function highlight(g: Graph, focus: string | null): { nodes: Map<string, Role>; edges: Map<string, Role> } | null {
  if (!focus) return null;
  const f = g.byId.get(focus);
  if (!f || f.kind === 'start' || f.kind === 'finish') return null;
  const nodes = new Map<string, Role>();
  const edges = new Map<string, Role>();
  if (f.kind === 'lesson') {
    nodes.set(f.id, 'self');
    nodes.set(f.hub, 'ctx');
    edges.set(`k:${f.id}`, 'ctx');
    // everything it builds on, all the way down
    const queue = [f.id];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const up of g.needs.get(cur) ?? []) {
        edges.set(`t:${up}>${cur}`, 'up');
        if (!nodes.has(up)) {
          nodes.set(up, 'up');
          queue.push(up);
        }
      }
    }
    for (const down of g.unlocks.get(f.id) ?? []) {
      if (!nodes.has(down)) nodes.set(down, 'down');
      edges.set(`t:${f.id}>${down}`, 'down');
    }
  } else {
    const hubId = f.kind === 'hub' ? f.id : f.from;
    const hub = g.byId.get(hubId) as HubNode;
    nodes.set(f.id, 'self');
    nodes.set(hubId, f.kind === 'hub' ? 'self' : 'ctx');
    const inside = new Set(hub.lessons);
    for (const id of hub.lessons) {
      nodes.set(id, 'ctx');
      edges.set(`k:${id}`, 'ctx');
    }
    if (f.kind === 'gate') {
      nodes.set(f.to, 'ctx');
      edges.set(`s:${hubId}>${f.id}`, 'ctx');
      edges.set(`s:${f.id}>${f.to}`, 'ctx');
    }
    for (const id of hub.lessons) {
      for (const up of g.needs.get(id) ?? []) {
        if (inside.has(up)) edges.set(`t:${up}>${id}`, 'ctx');
        else {
          if (!nodes.has(up)) nodes.set(up, 'up');
          edges.set(`t:${up}>${id}`, 'up');
        }
      }
      for (const down of g.unlocks.get(id) ?? []) {
        if (inside.has(down)) continue;
        if (!nodes.has(down)) nodes.set(down, 'down');
        edges.set(`t:${id}>${down}`, 'down');
      }
    }
  }
  return { nodes, edges };
}
