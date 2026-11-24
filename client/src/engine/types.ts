/**
 * The content model. Everything a lesson shows is described by these types —
 * the engine and player only render them. See docs/AUTHORING.md.
 */
import type { IconName } from './icons';

/** Colour role: *where* something runs or what family it belongs to. */
export type Tone = 'client' | 'server' | 'data' | 'net' | 'auth' | 'ai' | 'neutral' | 'danger' | 'warn' | 'ok';

/**
 * Which of the site's main topics something belongs to: the main topics (Frontend, Backend,
 * Database, DevOps, AI/ML), plus `start` (the way in) and `projects` (work across the stack).
 * Labels live in content/pillars.ts.
 */
export type PillarId = 'start' | 'frontend' | 'backend' | 'database' | 'devops' | 'aiml' | 'projects';

export type NodeState = 'idle' | 'active' | 'busy' | 'error' | 'ok' | 'dim' | 'ghost';

/** Packet kind: *what* is travelling. */
export type PacketKind = 'req' | 'res' | 'data' | 'err' | 'event' | 'auth';

/** The story beat of a step. */
export type Beat = 'setup' | 'problem' | 'solution' | 'technique' | 'tradeoff' | 'insight' | 'try' | 'recap';

export interface Badge {
  text: string;
  tone?: Tone;
}

/** One row inside a stack / queue node. */
export interface Item {
  id: string;
  text: string;
  tone?: Tone;
  state?: 'idle' | 'active' | 'error' | 'ok' | 'dim';
  sub?: string;
}

/** A line on a mock browser screen. */
export type ScreenLine =
  | { t: 'h'; text: string }
  | { t: 'text'; text: string }
  | { t: 'btn'; text: string; state?: 'idle' | 'active' | 'disabled' }
  | { t: 'input'; text: string; placeholder?: boolean }
  | { t: 'item'; text: string; done?: boolean; flash?: boolean }
  | { t: 'skeleton'; n?: number }
  | { t: 'spinner'; text?: string }
  | { t: 'error'; text: string }
  | { t: 'ok'; text: string };

/** A field of a JSON document node. */
export interface Field {
  k: string;
  v: string;
  hl?: boolean;
  tone?: Tone;
  indent?: number;
}

interface NodeBase {
  /** Centre, in world units. */
  x: number;
  y: number;
  w?: number;
  h?: number;
  label?: string;
  sub?: string;
  tone?: Tone;
  state?: NodeState;
  badge?: Badge;
  icon?: IconName;
  /** 0..1 load bar. */
  meter?: number;
  /** Draw above other nodes. */
  z?: number;
}

export interface BoxNode extends NodeBase { kind: 'box' }
export interface BrowserNode extends NodeBase { kind: 'browser'; url?: string; screen?: ScreenLine[] }
export interface DbNode extends NodeBase { kind: 'db'; items?: string[] }
export interface ActorNode extends NodeBase { kind: 'actor' }
export interface StackNode extends NodeBase {
  kind: 'stack';
  items: Item[];
  empty?: string;
  mono?: boolean;
  /** Where items gather: 'bottom' (a call stack, default) or 'top' (a log). */
  from?: 'top' | 'bottom';
}
export interface QueueNode extends NodeBase { kind: 'queue'; items: Item[]; empty?: string; mono?: boolean }
export interface CodeNode extends NodeBase { kind: 'code'; code: string; lang?: string; file?: string; hl?: number[]; err?: number[] }
export interface DocNode extends NodeBase { kind: 'doc'; fields: Field[] }
export interface ChipNode extends NodeBase { kind: 'chip' }
/** A small circle with a caption underneath: commits, graph vertices, steps on a timeline. */
export interface DotNode extends NodeBase {
  kind: 'dot';
  /** Where the label + sub sit. Default 'below'. */
  caption?: 'below' | 'above';
}
export interface ZoneNode extends NodeBase { kind: 'zone' }
export interface NoteNode extends NodeBase { kind: 'note'; text: string; align?: 'left' | 'center' | 'right' }

export type NodeSpec =
  | BoxNode
  | BrowserNode
  | DbNode
  | ActorNode
  | StackNode
  | QueueNode
  | CodeNode
  | DocNode
  | ChipNode
  | DotNode
  | ZoneNode
  | NoteNode;

export type NodeKind = NodeSpec['kind'];

export type Route = 'straight' | 'hv' | 'vh' | 'hvh' | 'vhv' | 'over' | 'under' | 'left' | 'right';

export interface LinkSpec {
  from: string;
  to: string;
  route?: Route;
  /** How far 'over' / 'under' / 'left' / 'right' routes arc away from the nodes (default 44). */
  bend?: number;
  style?: 'solid' | 'dashed';
  state?: 'idle' | 'active' | 'error' | 'off';
  label?: string;
  tone?: Tone;
  /** Arrowhead at the `to` end. Default true. */
  arrow?: boolean;
}

export interface FlowSpec {
  /** Node ids, in travel order. Consecutive nodes should be linked. */
  path: string[];
  kind?: PacketKind;
  /** Return as this kind (e.g. a response) — back along `path`, or along `returnVia`. */
  back?: PacketKind;
  /** Node ids for the return trip, starting at the last node of `path`. Default: `path` reversed. */
  returnVia?: string[];
  /** One label for the whole trip, or one per hop. */
  label?: string | string[];
  /** One label for the return trip, or one per hop (first = from the far end). */
  backLabel?: string | string[];
  /** Seconds between packets. Default 2.8. */
  every?: number;
  /** Seconds before the first packet. */
  offset?: number;
  /** Seconds a packet pauses at each intermediate node (processing). Default 0.18. */
  dwell?: number;
  /** Speed multiplier. Default 1. */
  speed?: number;
  /** Send a single packet per play-through of the step. */
  once?: boolean;
  /** The packet is rejected at the last node (shows a burst, never returns). */
  fail?: boolean;
}

export interface Scene {
  nodes: Record<string, NodeSpec>;
  links?: LinkSpec[];
  flows?: FlowSpec[];
}

export interface CodeSpec {
  code: string;
  lang?: string;
  file?: string;
  /** 1-based line numbers to highlight. */
  hl?: number[];
  /** 1-based line numbers marked as errors. */
  err?: number[];
}

export interface Callout {
  kind: 'insight' | 'warn' | 'tip' | 'mistake';
  text: string;
}

export interface Check {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export type MetricValue = number | string | null;

/* ---------------- interactive sandboxes ---------------- */

export type ControlValue = number | boolean | string;
export type Values = Record<string, ControlValue>;

export type Control =
  | {
      kind: 'range';
      id: string;
      label: string;
      min: number;
      max: number;
      value: number;
      /** Step for linear sliders (default 1). */
      step?: number;
      /** Logarithmic slider, for ranges like 1,000 → 100,000,000. */
      log?: boolean;
      unit?: string;
      format?: (v: number) => string;
    }
  | { kind: 'toggle'; id: string; label: string; value: boolean }
  | { kind: 'choice'; id: string; label: string; value: string; options: { value: string; label: string }[] };

export interface SandboxResult {
  scene: Scene;
  metrics?: Record<string, MetricValue>;
  /** One rich-text sentence describing the outcome. */
  note?: string;
  tone?: 'ok' | 'warn' | 'danger' | 'neutral';
}

/** A playground: controls the learner changes, and a pure function from their values to what the stage shows. */
export interface Sandbox {
  intro?: string;
  controls: Control[];
  compute: (v: Values) => SandboxResult;
}

export interface TrySpec {
  prompt: string;
  starter: string;
  language?: 'js';
  tests: { label: string; run: string }[];
  solution: string;
  hints: string[];
}

interface StepBase {
  /** Short label for the progress rail. */
  short: string;
  beat: Beat;
  title: string;
  /** Rich-text paragraphs: **bold**, `code`, [[glossary-key]] or [[key|shown text]], {tone:coloured text}. */
  body: string[];
  callout?: Callout;
  code?: CodeSpec;
  /** Lines starting with "+" added, "~" changed, "-" removed. */
  changes?: string[];
  metrics?: Record<string, MetricValue>;
  check?: Check;
  practice?: TrySpec;
}

/** A step shows a fixed scene — or, with a sandbox, a scene computed from the learner’s inputs. */
export type Step = StepBase & ({ scene: Scene; sandbox?: undefined } | { sandbox: Sandbox; scene?: undefined });

export interface MetricDef {
  id: string;
  label: string;
  unit?: string;
  /** Which direction is good (colours the delta). */
  better?: 'lower' | 'higher';
}

export type Level = 'beginner' | 'intermediate' | 'advanced';

/**
 * What a lesson file exports: only the teaching content. Its catalog entry (title,
 * summary, minutes, level) lives in course.ts, so the course map never has to load it.
 */
export interface LessonContent {
  goals: { text: string; step: number }[];
  metrics?: MetricDef[];
  /** Override legend labels for packet kinds. Kinds are detected automatically from flows. */
  legend?: Partial<Record<PacketKind, string>>;
  /** World size in units. Default 1000 × 600. */
  stage?: { w: number; h: number };
  steps: Step[];
}

/** A written lesson's catalog entry. Always available, without loading the content. */
export interface LessonMeta {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  level: Level;
  interactive?: boolean;
}

/** A lesson as the player sees it: catalog entry + loaded content. */
export interface Lesson extends LessonMeta, LessonContent {}

/**
 * One line of a course's table of contents. Planned lessons need only id + title;
 * once lessons/<id>.ts exists, summary, minutes and level are required too.
 */
export interface LessonStub {
  id: string;
  title: string;
  summary?: string;
  minutes?: number;
  level?: Level;
  /** Has a “Try it” sandbox step (shown on the course map). */
  interactive?: boolean;
  /** Main topic. Only for lessons in a part that mixes topics; otherwise the part's `pillar` covers it. */
  pillar?: PillarId;
  /** Ids of lessons (any part) this one builds on. Drawn as “builds on” links on the roadmap graph. */
  needs?: string[];
}

export interface Part {
  id: string;
  num: string;
  title: string;
  blurb: string;
  /** Why the learner needs this part (the pain it solves). Used on the roadmap. */
  why?: string;
  /** 3 concrete things the learner will be able to do after this part. Used on the roadmap. */
  outcomes?: string[];
  tone: Tone;
  /** Main topic of every lesson in this part. Leave it out when lessons differ, and give each lesson its own. */
  pillar?: PillarId;
  /** Drawn in the part's hub on the roadmap graph. */
  icon?: IconName;
  lessons: LessonStub[];
}

/* ---- Gate content (Phase C) ---- */
export interface QuizQuestion {
  id: string;
  q: string;
  kind: 'mcq' | 'multi' | 'order';
  options: string[];
  /** For mcq: index of correct. For multi: array of indices. For order: sorted list of option indices. */
  answer: number | number[];
  explain: string;
  /** The lesson + step this question links back to if the learner gets it wrong. */
  teachAt?: { lessonId: string; step: number };
}

export interface GateChallenge {
  id: string;
  prompt: string;
  starter: string;
  language: 'js';
  tests: { label: string; run: string }[];
  solution: string;
  hints: string[];
}

export interface PartGate {
  partId: string;
  questions: QuizQuestion[];
  challenge?: GateChallenge;
  /** Pass mark 0..1. Default 0.70. */
  passMark?: number;
}

/* ---- Try step (Phase B) ---- */
export interface TryStep extends StepBase {
  kind: 'try';
  prompt: string;
  starter: string;
  language: 'js';
  tests: { label: string; run: string }[];
  solution: string;
  hints: string[];
  /** Scene to show alongside the editor. */
  scene: Scene;
}

export interface GlossaryEntry {
  term: string;
  def: string;
}

export interface CourseDef {
  id: string;
  title: string;
  short: string;
  tagline: string;
  description: string;
  tone: Tone;
  parts: Part[];
  glossary: Record<string, GlossaryEntry>;
  /** Scenes the home-page hero cycles through: a lesson and its 1-based step numbers. */
  hero?: { lesson: string; steps: number[] };
}

/** A course with the catalog entries of its written lessons (content loads on demand). */
export interface Course extends CourseDef {
  lessons: Record<string, LessonMeta>;
}
