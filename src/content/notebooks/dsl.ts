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
  Row,
  Section,
  Sketch,
  TableSpec,
  Tone,
} from './types';

export const defineNotebook = (def: NotebookDef) => def;
export const definePage = (page: PageContent) => page;

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
