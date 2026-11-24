/**
 * The roadmap as a knowledge graph (the Graph view): the same nodes and edges the Trail map
 * uses — parts, lessons, gates, "builds on" links — turned into bodies and springs for the
 * force layout, plus how to colour them (by topic, by part, or by your progress).
 */
import type { PillarId, Tone } from '@/engine/types';
import { PILLARS, getPillar } from '@/content/pillars';
import type { GEdge, GNode, Graph, HubNode, LessonNode } from './graph';
import { ForceSim, type FLink, type FNode, type Forces } from './force';
import { wrapLabel } from './shapes';
import type { MapStatus } from './status';

export type ColorBy = 'topic' | 'part' | 'progress';

export interface NetNode extends FNode {
  g: GNode;
  /** Drawn radius (world units). */
  vr: number;
  /** "Builds on" links in and out — more links, bigger dot. */
  deg: number;
  lines: string[];
  /** Where the layout starts from. */
  x0: number;
  y0: number;
}
export interface NetLink extends FLink {
  e: GEdge;
  s: NetNode;
  t: NetNode;
}
export interface Net {
  nodes: NetNode[];
  links: NetLink[];
  byId: Map<string, NetNode>;
}

/** The trail map's positions, shrunk and pulled in: the layout bursts out from here. */
const SEED_SCALE = 0.12;

export const lessonPillar = (n: LessonNode): PillarId => n.stub.pillar ?? n.part.pillar ?? 'start';

/** A part's topic: its own label, else whatever most of its lessons are. */
export function hubPillar(n: HubNode, g: Graph): PillarId {
  if (n.part.pillar) return n.part.pillar;
  const count = new Map<PillarId, number>();
  for (const id of n.lessons) {
    const l = g.byId.get(id) as LessonNode;
    const p = lessonPillar(l);
    count.set(p, (count.get(p) ?? 0) + 1);
  }
  let best: PillarId = 'start';
  let max = 0;
  for (const p of PILLARS) {
    const c = count.get(p.id) ?? 0;
    if (c > max) {
      max = c;
      best = p.id;
    }
  }
  return best;
}

export function buildNet(graph: Graph): Net {
  const b = graph.bounds;
  const cx = (b.x0 + b.x1) / 2;
  const cy = (b.y0 + b.y1) / 2;
  const nodes: NetNode[] = graph.nodes.map((g) => {
    const x0 = (g.x - cx) * SEED_SCALE;
    const y0 = (g.y - cy) * SEED_SCALE;
    const deg = g.kind === 'lesson' ? (graph.needs.get(g.id)?.length ?? 0) + (graph.unlocks.get(g.id)?.length ?? 0) : 0;
    let vr: number;
    let r: number;
    let charge: number;
    let lines: string[];
    switch (g.kind) {
      case 'hub':
        vr = 14 + 1.6 * Math.sqrt(g.lessons.length);
        r = vr + 34;
        charge = 1100;
        lines = wrapLabel(g.part.title, 16);
        break;
      case 'lesson':
        vr = 5 + 1.6 * Math.sqrt(deg + 1);
        r = vr + 21;
        charge = 110;
        lines = wrapLabel(g.stub.title, 20);
        break;
      case 'gate':
        vr = 6.5;
        r = 15;
        charge = 90;
        lines = [`Gate ${g.part.num}`];
        break;
      case 'start':
        vr = 11;
        r = 28;
        charge = 300;
        lines = ['Start'];
        break;
      case 'finish':
        vr = 13;
        r = 32;
        charge = 300;
        lines = ['Capstone'];
        break;
    }
    return { id: g.id, g, x: x0, y: y0, x0, y0, vx: 0, vy: 0, fx: null, fy: null, r, vr, charge, deg, lines };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const count = new Map<string, number>();
  const edges = graph.edges.filter((e) => e.kind !== 'shortcut');
  for (const e of edges) {
    count.set(e.from, (count.get(e.from) ?? 0) + 1);
    count.set(e.to, (count.get(e.to) ?? 0) + 1);
  }
  const links: NetLink[] = edges.map((e) => {
    const s = byId.get(e.from)!;
    const t = byId.get(e.to)!;
    let dist: number;
    let k: number;
    if (e.kind === 'spoke') {
      dist = 54;
      k = 0.85;
    } else if (e.kind === 'spine') {
      dist = s.g.kind === 'start' ? 130 : 105;
      k = 0.6;
    } else if (e.cross) {
      // a link between parts: long and weak, so parts keep their own cluster
      dist = 220;
      k = 0.015;
    } else {
      dist = 48;
      k = 0.3;
    }
    const cs = count.get(e.from) ?? 1;
    const ct = count.get(e.to) ?? 1;
    return { id: e.id, e, s, t, dist, k, bias: cs / (cs + ct) };
  });
  return { nodes, links, byId };
}

/** Put every node back where the layout starts. */
export function resetNet(net: Net) {
  for (const n of net.nodes) {
    n.x = n.x0;
    n.y = n.y0;
    n.vx = n.vy = 0;
    n.fx = n.fy = null;
  }
}

/** Where the layout will come to rest from its start (a dry run on a copy). */
export function settledPositions(net: Net, forces: Forces, aspect: number): Map<string, { x: number; y: number }> {
  const copy = new Map(net.nodes.map((n) => [n.id, { ...n, x: n.x0, y: n.y0, vx: 0, vy: 0, fx: null, fy: null }]));
  const sim = new ForceSim(
    [...copy.values()],
    net.links.map((l) => ({ ...l, s: copy.get(l.s.id)!, t: copy.get(l.t.id)! })),
  );
  sim.forces = { ...forces };
  sim.aspect = aspect;
  sim.settle();
  return new Map([...copy.values()].map((n) => [n.id, { x: n.x, y: n.y }]));
}

/** Bounds of a set of positioned nodes, with room for their labels. */
export function netBounds(nodes: Iterable<{ x: number; y: number; vr: number; lines: string[] }>) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const n of nodes) {
    // a lesson's name can sit to either side of it, so leave its full width both ways
    const half = n.vr + 6 + Math.max(...n.lines.map((s) => s.length)) * 6.2;
    x0 = Math.min(x0, n.x - half);
    x1 = Math.max(x1, n.x + half);
    y0 = Math.min(y0, n.y - n.vr - 8);
    y1 = Math.max(y1, n.y + n.vr + 14 + n.lines.length * 13);
  }
  return { x0, y0, x1, y1 };
}

/* ---------------- colour groups (Obsidian's "groups") ---------------- */

export interface Group {
  key: string;
  label: string;
  tone: Tone;
  /** Lessons in it. */
  count: number;
}

const PROGRESS: Record<string, { label: string; tone: Tone }> = {
  done: { label: 'Done', tone: 'ok' },
  started: { label: 'In progress', tone: 'client' },
  new: { label: 'Not started', tone: 'neutral' },
  soon: { label: 'Coming soon', tone: 'neutral' },
};

/** Which group a node falls in for a colouring (start/finish belong to none). */
export function groupOf(n: NetNode, by: ColorBy, st: MapStatus, graph: Graph): Omit<Group, 'count'> | null {
  const g = n.g;
  if (g.kind === 'start' || g.kind === 'finish') return null;
  if (by === 'part') return { key: g.part.id, label: g.part.title, tone: g.part.tone };
  if (by === 'topic') {
    if (g.kind === 'gate') return null;
    const p = getPillar(g.kind === 'lesson' ? lessonPillar(g) : hubPillar(g, graph))!;
    return { key: p.id, label: p.label, tone: p.tone };
  }
  let state: string;
  if (g.kind === 'lesson') state = st.lessons[g.stub.id].state;
  else if (g.kind === 'hub') {
    const p = st.parts[g.part.id];
    state = p.complete ? 'done' : p.started ? 'started' : 'new';
  } else {
    const s = st.gates[g.part.id].state;
    state = s === 'passed' || s === 'skipped' ? 'done' : 'new';
  }
  return { key: state, ...PROGRESS[state] };
}

/** The legend: every group in reading order, with how many lessons it holds. */
export function groupsFor(net: Net, by: ColorBy, st: MapStatus, graph: Graph): Group[] {
  const out = new Map<string, Group>();
  for (const n of net.nodes) {
    const grp = groupOf(n, by, st, graph);
    if (!grp) continue;
    const cur = out.get(grp.key) ?? { ...grp, count: 0 };
    if (n.g.kind === 'lesson') cur.count++;
    out.set(grp.key, cur);
  }
  const list = [...out.values()];
  if (by === 'topic') list.sort((a, b) => PILLARS.findIndex((p) => p.id === a.key) - PILLARS.findIndex((p) => p.id === b.key));
  if (by === 'progress') list.sort((a, b) => Object.keys(PROGRESS).indexOf(a.key) - Object.keys(PROGRESS).indexOf(b.key));
  return list.filter((g) => g.count > 0);
}
