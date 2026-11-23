/**
 * Tiny builders that keep lesson files short and readable.
 * Positions are node centres in world units (default world 1000 × 600).
 */
import type {
  ActorNode,
  BoxNode,
  BrowserNode,
  ChipNode,
  CodeNode,
  Control,
  CourseDef,
  DbNode,
  DocNode,
  DotNode,
  Field,
  FlowSpec,
  Item,
  LessonContent,
  LinkSpec,
  NodeSpec,
  NoteNode,
  QueueNode,
  Sandbox,
  StackNode,
  ZoneNode,
} from '@/engine/types';

type Opts<T> = Partial<Omit<T, 'kind' | 'x' | 'y'>>;

export const box = (x: number, y: number, label: string, o: Opts<BoxNode> = {}): BoxNode => ({ kind: 'box', x, y, label, ...o });
export const browser = (x: number, y: number, o: Opts<BrowserNode> = {}): BrowserNode => ({ kind: 'browser', x, y, ...o });
export const db = (x: number, y: number, label: string, o: Opts<DbNode> = {}): DbNode => ({ kind: 'db', x, y, label, ...o });
export const actor = (x: number, y: number, label: string, o: Opts<ActorNode> = {}): ActorNode => ({ kind: 'actor', x, y, label, ...o });
export const chip = (x: number, y: number, label: string, o: Opts<ChipNode> = {}): ChipNode => ({ kind: 'chip', x, y, label, ...o });
export const dot = (x: number, y: number, label: string, o: Opts<DotNode> = {}): DotNode => ({ kind: 'dot', x, y, label, ...o });
export const note = (x: number, y: number, text: string, o: Opts<NoteNode> = {}): NoteNode => ({ kind: 'note', x, y, text, ...o });
export const zone = (x: number, y: number, w: number, h: number, label: string, o: Opts<ZoneNode> = {}): ZoneNode => ({
  kind: 'zone',
  x,
  y,
  w,
  h,
  label,
  ...o,
});
export const code = (x: number, y: number, src: string, o: Opts<CodeNode> = {}): CodeNode => ({ kind: 'code', x, y, code: src, ...o });
export const doc = (x: number, y: number, label: string, fields: Field[], o: Opts<DocNode> = {}): DocNode => ({
  kind: 'doc',
  x,
  y,
  label,
  fields,
  ...o,
});
export const stack = (x: number, y: number, label: string, items: Item[], o: Opts<StackNode> = {}): StackNode => ({
  kind: 'stack',
  x,
  y,
  label,
  items,
  ...o,
});
export const queue = (x: number, y: number, label: string, items: Item[], o: Opts<QueueNode> = {}): QueueNode => ({
  kind: 'queue',
  x,
  y,
  label,
  items,
  ...o,
});

export const item = (id: string, text: string, o: Partial<Omit<Item, 'id' | 'text'>> = {}): Item => ({ id, text, ...o });
export const field = (k: string, v: string, o: Partial<Omit<Field, 'k' | 'v'>> = {}): Field => ({ k, v, ...o });

export const link = (from: string, to: string, o: Partial<Omit<LinkSpec, 'from' | 'to'>> = {}): LinkSpec => ({ from, to, ...o });
export const flow = (path: string[], o: Partial<Omit<FlowSpec, 'path'>> = {}): FlowSpec => ({ path, ...o });

type Nodes = Record<string, NodeSpec>;

/**
 * Derive a scene's nodes from another: merge partial changes into existing nodes,
 * add new ones (pass a full node), or remove one (pass null).
 */
export function patch(nodes: Nodes, changes: Record<string, Partial<NodeSpec> | NodeSpec | null>): Nodes {
  const out: Nodes = { ...nodes };
  for (const [id, ch] of Object.entries(changes)) {
    if (ch === null) delete out[id];
    else if (out[id]) out[id] = { ...out[id], ...ch } as NodeSpec;
    else out[id] = ch as NodeSpec;
  }
  return out;
}

/** Keep only the listed nodes (handy to build up a scene from a final layout). */
export const pick = (nodes: Nodes, ids: string[]): Nodes => Object.fromEntries(ids.filter((id) => nodes[id]).map((id) => [id, nodes[id]]));

/** A lesson file's default export. Title, summary, minutes and level go in course.ts. */
export const defineLesson = (l: LessonContent) => l;
export const defineCourse = (c: CourseDef) => c;

/* ---------------- sandbox helpers ---------------- */

export const range = (id: string, label: string, o: Omit<Extract<Control, { kind: 'range' }>, 'kind' | 'id' | 'label'>): Control => ({ kind: 'range', id, label, ...o });
export const toggle = (id: string, label: string, value = false): Control => ({ kind: 'toggle', id, label, value });
export const choice = (id: string, label: string, options: [string, string][], value = options[0][0]): Control => ({
  kind: 'choice',
  id,
  label,
  value,
  options: options.map(([v, l]) => ({ value: v, label: l })),
});
export const defineSandbox = (s: Sandbox) => s;

/** 1234567 → "1,234,567" */
export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/** Seconds → a human duration: "3 ms", "40 s", "5 min", "3 days", "60 years", "longer than the universe". */
export function humanTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return 'forever';
  if (seconds < 1) return `${Math.max(1, Math.round(seconds * 1000))} ms`;
  // [how many of the current unit make the next one, the next unit's name]
  const steps: [number, string][] = [[60, 'min'], [60, 'hour'], [24, 'day'], [365, 'year'], [1e3, 'thousand years'], [1e3, 'million years']];
  let v = seconds;
  let name = 's';
  for (const [size, next] of steps) {
    if (v < size) break;
    v /= size;
    name = next;
  }
  if (name === 'million years' && v > 13800) return 'longer than the universe has existed';
  const n = v < 10 ? Math.round(v * 10) / 10 : Math.round(v);
  const plural = (name === 'hour' || name === 'day' || name === 'year') && n !== 1 ? 's' : '';
  return `${n.toLocaleString('en-US')} ${name}${plural}`;
}
