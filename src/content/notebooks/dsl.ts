/**
 * Small builders for writing notebook pages. A page reads like the paper it becomes:
 *
 *   export default definePage({
 *     rows: [
 *       row(sec('What is DBMS ?', ul('...', '...')), sec('Key Components', pairs(['Data', 'stored facts']))),
 *       full(exam('...', '...')),
 *     ],
 *     quote: 'One line to remember.',
 *   });
 *
 * Sections are numbered automatically in reading order (left column, then right).
 */
import type {
  Block,
  Ink,
  ListItem,
  ListMark,
  NotebookDef,
  OpItem,
  PageContent,
  PageStub,
  Row,
  Section,
  Sketch,
  SketchEdge,
  SketchNode,
  TableSpec,
  Tone,
} from './types';

export const defineNotebook = (def: NotebookDef) => def;
export const definePage = (page: PageContent) => page;

/* ---- page list (notebook.ts) ---- */

/** A page and the sections it will cover: `pg('jsx', 'JSX & Components', 'What JSX compiles to', 'Props')`. */
export const pg = (id: string, title: string, ...outline: string[]): PageStub => ({ id, title, outline });

/** The closing "Quick Revision & Interview Questions" page every notebook ends with. */
export const revision = (...differences: string[]): PageStub =>
  pg(
    'revision',
    'Quick Revision & Interview Questions',
    'Summary tables of the key terms',
    ...(differences.length ? [`Important differences: ${differences.join(' · ')}`] : []),
    'Top interview questions',
    'Key takeaways (final revision)',
  );

/* ---- cover art: small generated doodles, so a new cover needs words, not coordinates ---- */

type Doodle = 'db' | 'pc' | 'server' | 'laptop' | 'user' | 'cloud';
const DOODLE_SIZE: Record<Doodle, { w: number; h: number; bands?: number }> = {
  db: { w: 78, h: 92, bands: 2 },
  pc: { w: 90, h: 74 },
  server: { w: 60, h: 86 },
  laptop: { w: 104, h: 70 },
  user: { w: 66, h: 78 },
  cloud: { w: 118, h: 82 },
};

/** Top-left: one big doodle with a word under it. */
export function iconArt(shape: Doodle, label: string, tone: Tone = 'blue'): Sketch {
  return {
    w: 130,
    h: 136,
    alt: label,
    nodes: [
      { id: 'i', shape, x: 65, y: 54, ...DOODLE_SIZE[shape], tone },
      { id: 't', shape: 'text', x: 65, y: 122, text: label, size: 20, bold: true },
    ],
  };
}

/** Top-right: up to four steps, snaking left → right, then back. */
export function flowArt(steps: string[], tone: Tone = 'blue'): Sketch {
  const at: [number, number][] = [[72, 32], [212, 32], [212, 118], [72, 118]];
  const nodes: SketchNode[] = steps.slice(0, 4).map((text, i) => ({
    id: `s${i}`,
    shape: 'pill',
    x: at[i][0],
    y: at[i][1],
    w: 128,
    h: 40,
    text,
    size: text.length > 14 ? 12.5 : 14,
    bold: true,
    tone: i === 0 ? tone : undefined,
  }));
  const edges: SketchEdge[] = nodes.slice(1).map((n, i) => ({ from: nodes[i].id, to: n.id }));
  return { w: 284, h: 150, nodes, edges, alt: steps.join(' → ') };
}

/** Left: a tiny editor window with a few lines of code (keep lines under ~24 characters). */
export function codeArt(lines: string[], title = 'Code'): Sketch {
  const top = 30;
  const boxH = 30 + lines.length * 19;
  const nodes: SketchNode[] = [
    { id: 'h', shape: 'text', x: 95, y: 13, text: title, size: 15, bold: true },
    { id: 'b', shape: 'box', x: 95, y: top + boxH / 2, w: 186, h: boxH, tone: 'plain' },
    ...[0, 1, 2].map((i): SketchNode => ({ id: `d${i}`, shape: 'circle', x: 14 + i * 11, y: top + 9, w: 6, h: 6, tone: (['pink', 'yellow', 'green'] as Tone[])[i] })),
    ...lines.map((text, i): SketchNode => ({ id: `l${i}`, shape: 'text', x: 12, y: top + 30 + i * 19, text, size: 12.5, anchor: 'start' })),
  ];
  return { w: 190, h: top + boxH + 4, nodes, alt: `${title}: ${lines.join(' ')}` };
}

/**
 * Centre: a hub with four labels around it. The two top labels flow in, the two bottom ones flow out.
 * `shape: 'box'` puts the word inside a box; any doodle draws it with the word underneath.
 */
export function hubArt(centre: string, around: [string, string, string, string], shape: Doodle | 'box' = 'box', tone: Tone = 'blue'): Sketch {
  const hub: SketchNode[] =
    shape === 'box'
      ? [{ id: 'c', shape: 'box', x: 170, y: 112, w: Math.max(120, centre.length * 11 + 36), h: 62, text: centre, size: 18, bold: true, tone }]
      : [
          { id: 'c', shape, x: 170, y: shape === 'db' ? 104 : 100, ...(shape === 'db' ? { w: 108, h: 124, bands: 2 } : { w: DOODLE_SIZE[shape].w * 1.25, h: DOODLE_SIZE[shape].h * 1.25 }), tone },
          { id: 'cl', shape: 'text', x: 170, y: shape === 'db' ? 190 : 176, text: centre, size: 16, bold: true },
        ];
  const corners: [number, number][] = [[44, 34], [296, 34], [46, 196], [294, 196]];
  const labels: SketchNode[] = around.map((text, i) => ({ id: `a${i}`, shape: 'text', x: corners[i][0], y: corners[i][1], text, size: 15 }));
  return {
    w: 340,
    h: 232,
    alt: `${centre}: ${around.join(', ').replace(/\n/g, ' ')}`,
    nodes: [...hub, ...labels],
    edges: [
      { from: 'a0', to: 'c', curve: 18 },
      { from: 'a1', to: 'c', curve: -18 },
      { from: 'c', to: 'a2', curve: -14 },
      { from: 'c', to: 'a3', curve: 14 },
    ],
  };
}

/* ---- layout ---- */

export const sec = (title: Ink, ...body: Block[]): Section => ({ title, body });

/** Starred "Important Points (Exam)" section. */
export const exam = (...items: Ink[]): Section => ({
  title: 'Important Points (Exam)',
  star: true,
  body: [{ t: 'list', mark: 'star', items }],
});

const asList = (s: Section | Section[]) => (Array.isArray(s) ? s : [s]);

/** Two columns. Each side takes one section or a stack of them. */
export const row = (left: Section | Section[], right: Section | Section[], ratio?: [number, number]): Row => ({
  left: asList(left),
  right: asList(right),
  ratio,
});

export const full = (section: Section): Row => ({ full: section });

/* ---- blocks ---- */

export const p = (text: Ink): Block => ({ t: 'p', text });

const list = (mark: ListMark) => (...items: ListItem[]): Block => ({ t: 'list', mark, items });
export const ul = list('dot');
export const stars = list('star');
export const checks = list('check');
export const arrows = list('arrow');
export const nums = list('num');
export const circles = list('circle');
export const dashes = list('dash');
/** Bullets flowing in two columns. */
export const ul2 = (...items: ListItem[]): Block => ({ t: 'list', mark: 'dot', items, cols: 2 });
export const stars2 = (...items: ListItem[]): Block => ({ t: 'list', mark: 'star', items, cols: 2 });

/** A bullet with indented sub-points. */
export const li = (text: Ink, ...sub: Ink[]): ListItem => ({ text, sub });

export const pairs = (...items: [Ink, Ink][]): Block => ({ t: 'pairs', items });

export const table = (head: Ink[], rows: Ink[][], opts: Omit<TableSpec, 'head' | 'rows'> = {}): Block => ({
  t: 'table',
  head,
  rows,
  ...opts,
});
/** A compact example table with a caption. */
export const mini = (title: Ink | undefined, head: Ink[], rows: Ink[][], tone?: Tone): Block => ({
  t: 'table',
  title,
  head,
  rows,
  tone,
  small: true,
});
export const spec = (title: Ink | undefined, head: Ink[], rows: Ink[][], tone?: Tone): TableSpec => ({
  title,
  head,
  rows,
  tone,
  small: true,
});

export const code = (src: string, title?: Ink, tone?: Tone): Block => ({ t: 'code', code: dedent(src), title, tone });
export const tag = (text: Ink, tone: Tone = 'green'): Block => ({ t: 'tag', text, tone });
export const box = (...lines: Ink[]): Block => ({ t: 'box', lines });
export const toneBox = (tone: Tone, ...lines: Ink[]): Block => ({ t: 'box', lines, tone });
export const note = (title: Ink | undefined, ...body: Block[]): Block => ({ t: 'note', title, body });
export const sub = (title: Ink, ...body: Block[]): Block => ({ t: 'sub', title, body });
export const cols = (...columns: Block[][]): Block => ({ t: 'cols', cols: columns });
export const cards = (...items: { label: Ink; sub?: Ink; tone: Tone; points: Ink[] }[]): Block => ({ t: 'cards', items });
export const ops = (...items: OpItem[]): Block => ({ t: 'ops', items });
export const op = (label: Ink): OpItem => ({ op: label });
export const tbl = (t: TableSpec): OpItem => ({ table: t });
export const venn = (
  shade: 'inner' | 'left' | 'right' | 'full' | 'none',
  opts: { a?: string; b?: string; apart?: boolean; tone?: Tone } = {},
): Block => ({ t: 'venn', shade, ...opts });
export const sketch = (d: Sketch, caption?: Ink): Block => ({ t: 'sketch', d, caption });

/**
 * Let code be indented with the page source. Strips the common indent of the lines after
 * the first (the first line usually starts right after the backtick), and of every line
 * when the literal starts on a new line.
 */
function dedent(src: string): string {
  const startsOnNewLine = src.startsWith('\n');
  const lines = src.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n');
  const body = startsOnNewLine ? lines : lines.slice(1);
  const indents = body.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length);
  if (!indents.length) return lines.join('\n');
  const cut = Math.min(...indents);
  // Inline first line + a small indent means the author wrote relative indentation on purpose.
  if (!startsOnNewLine && cut < 6) return lines.join('\n');
  return lines.map((l, i) => (startsOnNewLine || i > 0 ? l.slice(Math.min(cut, l.match(/^ */)![0].length)) : l)).join('\n');
}
