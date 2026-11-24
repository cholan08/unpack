/**
 * Handwritten notebooks — the data shape.
 *
 *   notebooks/<book-id>/notebook.ts       cover + ordered page list (loaded up front, tiny)
 *   notebooks/<book-id>/pages/<page>.ts   one page's content (loaded on demand)
 *
 * Text fields marked `Ink` accept light markup:
 *   __underlined__   **bold ink**   ==highlighter==   `code`   x_{sub}   x^{sup}
 */
export type Ink = string;

/** Pen/highlighter colours. Each maps to a soft fill in hand.css (works in both themes). */
export type Tone = 'blue' | 'green' | 'yellow' | 'pink' | 'purple' | 'orange' | 'plain';

export type ListMark = 'dot' | 'star' | 'check' | 'arrow' | 'num' | 'circle' | 'dash';
export type ListItem = Ink | { text: Ink; sub: Ink[] };

export interface TableSpec {
  head: Ink[];
  rows: Ink[][];
  /** Caption drawn above the table, e.g. "Student". */
  title?: Ink;
  /** Header fill. Default blue. */
  tone?: Tone;
  /** Compact example table (auto width) instead of a full-width comparison table. */
  small?: boolean;
}

export type OpItem = { table: TableSpec } | { op: Ink };

export type Block =
  | { t: 'p'; text: Ink }
  | { t: 'list'; items: ListItem[]; mark?: ListMark; cols?: 1 | 2 }
  /** term — meaning rows, e.g. "Hardware – physical machines". */
  | { t: 'pairs'; items: [Ink, Ink][] }
  | ({ t: 'table' } & TableSpec)
  /** Hand-copied code (SQL…) in a ruled box. Not parsed for markup. */
  | { t: 'code'; code: string; title?: Ink; tone?: Tone }
  /** A highlighter label such as "Example:" or "Syntax:". */
  | { t: 'tag'; text: Ink; tone?: Tone }
  /** A small framed fact, e.g. "Primary Key: RollNo". */
  | { t: 'box'; lines: Ink[]; tone?: Tone }
  /** Dashed call-out with an optional ★ title. */
  | { t: 'note'; title?: Ink; body: Block[]; tone?: Tone }
  /** "(1) Hierarchical Model" style sub-heading with its own content. */
  | { t: 'sub'; title: Ink; body: Block[] }
  /** Side-by-side blocks inside one section. */
  | { t: 'cols'; cols: Block[][] }
  /** Colour-keyed label boxes with points beside them (normal forms, states…). */
  | { t: 'cards'; items: { label: Ink; sub?: Ink; tone: Tone; points: Ink[] }[] }
  /** table → operation → table, left to right (relational algebra, foreign keys…). */
  | { t: 'ops'; items: OpItem[] }
  /** Two-circle diagram for joins and set operations. */
  | { t: 'venn'; shade: 'inner' | 'left' | 'right' | 'full' | 'none'; a?: string; b?: string; apart?: boolean; tone?: Tone }
  /** A free-form hand-drawn diagram. */
  | { t: 'sketch'; d: Sketch; caption?: Ink };

export interface Section {
  title: Ink;
  body: Block[];
  /** "Important points" style: starred heading, sticky-note background. */
  star?: boolean;
}

/** One band of the page: a single full-width section, or two columns of sections. */
export type Row =
  | { full: Section }
  | { left: Section[]; right: Section[]; /** column widths, default [1, 1] */ ratio?: [number, number] };

export interface PageContent {
  rows: Row[];
  /** Closing line in the curly-brace banner at the foot of the page. */
  quote?: Ink;
}

/* ---------------- sketches (hand-drawn SVG diagrams) ---------------- */

export type SketchShape =
  | 'box' // entity, plain box
  | 'box2' // double box (weak entity)
  | 'diamond' // relationship
  | 'diamond2' // double diamond (identifying relationship)
  | 'oval' // attribute
  | 'oval2' // double ellipse (multi-valued attribute)
  | 'ovalDash' // dashed ellipse (derived attribute)
  | 'circle'
  | 'pill'
  | 'note' // dashed box
  | 'db' // cylinder
  | 'cloud' // thought bubble
  | 'pc' | 'server' | 'laptop' | 'user' // stand-alone doodles, label underneath
  | 'text' // label only
  | 'point'; // invisible anchor for free lines

export type SketchIcon = 'pc' | 'server' | 'db' | 'user' | 'laptop';

export interface SketchNode {
  id: string;
  /** Centre of the node, in the sketch's own units. */
  x: number;
  y: number;
  w?: number;
  h?: number;
  shape?: SketchShape;
  /** "\n" breaks lines. */
  text?: string;
  tone?: Tone;
  /** Doodle drawn at the left inside a box. */
  icon?: SketchIcon;
  /** Underline the label (primary-key attribute). */
  key?: boolean;
  bold?: boolean;
  size?: number;
  /** Text alignment for `text` nodes: with 'start', x is the left edge of the text. */
  anchor?: 'start' | 'middle' | 'end';
  /** Horizontal bands on a `db` cylinder. */
  bands?: number;
}

export interface SketchEdge {
  from: string;
  to: string;
  label?: string;
  /** Default 'to'. */
  arrow?: 'to' | 'from' | 'both' | 'none';
  dash?: boolean;
  /** Two parallel lines (total participation). */
  double?: boolean;
  /** Bend the line sideways by this many units. */
  curve?: number;
  /** Route through these points. */
  via?: [number, number][];
  /** Nudge the label from the line's midpoint. */
  lx?: number;
  ly?: number;
}

export interface Sketch {
  w: number;
  h: number;
  nodes: SketchNode[];
  edges?: SketchEdge[];
  /** Read-aloud description; defaults to the node labels. */
  alt?: string;
}

/* ---------------- notebook ---------------- */

export interface Cover {
  /** The big shaded title, e.g. "DBMS". */
  big: string;
  /** Banner under the title, e.g. "Database Management System". */
  full: string;
  kicker?: string;
  /** Words inside the thought cloud, top centre. */
  cloud?: string[];
  art?: { topLeft?: Sketch; topRight?: Sketch; left?: Sketch; centre?: Sketch };
  /** Arrow list on the right, e.g. SQL → CREATE, READ… */
  side?: { title: string; items: string[] };
  why?: { title: string; items: string[] };
  /** Motto beside the laptop doodle, bottom right. */
  footer?: string;
}

export interface PageStub {
  /** Also the file name in pages/ and the URL segment. */
  id: string;
  title: string;
}

export interface NotebookDef {
  id: string;
  /** Short name used on tabs and in "DBMS — Page 2". */
  title: string;
  /** Full subject name. */
  name: string;
  tagline: string;
  /** Cover colour on the shelf. */
  color: Exclude<Tone, 'plain'>;
  cover: Cover;
  pages: PageStub[];
}

export interface NotebookPage extends PageStub {
  /** 1 is the cover, content pages start at 2. */
  num: number;
  written: boolean;
}

export interface Notebook extends Omit<NotebookDef, 'pages'> {
  /** Cover first, then every listed page. */
  pages: NotebookPage[];
}
