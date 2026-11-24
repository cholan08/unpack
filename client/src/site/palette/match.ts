/**
 * Ranking for the command palette. Pure functions, no React, so they are cheap to test.
 *
 * A title match always beats a match in the extra words (aliases, summary, definition), and
 * within titles the tiers go: exact → starts with → phrase at a word start → anywhere →
 * every word at a word start → abbreviation ("evl" → Event Loop) → a typo ("corss" → CORS).
 * Short queries only use the strict tiers, so one or two letters never pull in noise.
 * Every title match also returns the ranges to highlight.
 */

export type Range = [start: number, end: number];

export interface Query {
  /** lowercase, single-spaced */
  q: string;
  words: string[];
  /** the query without spaces, for abbreviations */
  compact: string;
}

export interface Prepared {
  /** lowercase title (same length as the original, so ranges map 1:1) */
  lower: string;
  starts: Set<number>;
  /** lowercase extra words */
  hay: string;
}

export interface Hit {
  score: number;
  /** ranges in the title to highlight (empty when only the extra words matched) */
  hl: Range[];
  /**
   * How it matched. `abbr` and `typo` are guesses: the results drop them when the query also
   * matches something directly, so "clos" never drags in "Glossary" as a typo.
   */
  tier: 'direct' | 'abbr' | 'typo' | 'hay';
}

export function parseQuery(raw: string): Query {
  const q = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  const words = q ? q.split(' ') : [];
  return { q, words, compact: words.join('') };
}

const ALNUM = /[\p{L}\p{N}]/u;
const isAlnum = (c: string | undefined) => !!c && ALNUM.test(c);
const isUpper = (c: string) => c !== c.toLowerCase();
const isLower = (c: string) => c !== c.toUpperCase();

/** Where words begin: after a non-letter, or at a lower→Upper step ("useEffect" → u, E). */
export function wordStarts(title: string): Set<number> {
  const s = new Set<number>();
  for (let i = 0; i < title.length; i++) {
    const c = title[i];
    if (!isAlnum(c)) continue;
    const p = title[i - 1];
    if (i === 0 || !isAlnum(p) || (isLower(p) && isUpper(c))) s.add(i);
  }
  return s;
}

export function prepare(title: string, hay = ''): Prepared {
  return { lower: title.toLowerCase(), starts: wordStarts(title), hay: hay.toLowerCase() };
}

/** First index of `w` that begins a word, or -1. */
function atWordStart(lower: string, starts: Set<number>, w: string, from = 0): number {
  let i = lower.indexOf(w, from);
  while (i !== -1) {
    if (starts.has(i)) return i;
    i = lower.indexOf(w, i + 1);
  }
  return -1;
}

/** Does `w` begin some word of `text` (which has no precomputed starts)? */
function wordPrefixIn(text: string, w: string): boolean {
  let i = text.indexOf(w);
  while (i !== -1) {
    if (i === 0 || !isAlnum(text[i - 1])) return true;
    i = text.indexOf(w, i + 1);
  }
  return false;
}

function merge(ranges: Range[]): Range[] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const out: Range[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else out.push([r[0], r[1]]);
  }
  return out;
}

/**
 * Abbreviations: each letter of `pat`, in order, preferring to continue the current run or to
 * start a new word ("evl" → EVent Loop, "ue" → UseEffect). Rejects scattered matches.
 */
export function abbreviation(p: Prepared, pat: string): { quality: number; hl: Range[] } | null {
  const { lower, starts } = p;
  if (pat.length < 2 || pat.length > lower.length) return null;
  const idx: number[] = [];
  let from = 0;
  for (const c of pat) {
    const prev = idx[idx.length - 1];
    let found = -1;
    if (prev !== undefined && lower[prev + 1] === c) found = prev + 1;
    else {
      for (let k = from; k < lower.length; k++)
        if (lower[k] === c && starts.has(k)) {
          found = k;
          break;
        }
      if (found < 0) found = lower.indexOf(c, from);
    }
    if (found < 0) return null;
    idx.push(found);
    from = found + 1;
  }
  const hl: Range[] = [];
  for (const i of idx) {
    const last = hl[hl.length - 1];
    if (last && last[1] === i) last[1] = i + 1;
    else hl.push([i, i + 1]);
  }
  // must start at a word, and not be scattered over many fragments
  if (!starts.has(hl[0][0])) return null;
  if (hl.length > Math.max(2, Math.ceil(pat.length / 3))) return null;
  const atStart = hl.filter(([a]) => starts.has(a)).length;
  if (atStart < hl.length - 1) return null;
  const span = idx[idx.length - 1] - idx[0] + 1;
  return { quality: (atStart / hl.length) * 0.6 + (pat.length / span) * 0.4, hl };
}

/** Optimal-string-alignment distance (Levenshtein + adjacent swaps), stopping early past `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length;
  const n = b.length;
  let prev2: number[] = [];
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[n];
}

/** Every query word close to the start of some title word: "corss" → CORS, "aggregaton" → Aggregation. */
export function typos(p: Prepared, words: string[]): Range[] | null {
  const { lower, starts } = p;
  const titleWords: { at: number; text: string }[] = [];
  for (const at of starts) {
    let end = at;
    while (end < lower.length && isAlnum(lower[end]) && (end === at || !starts.has(end))) end++;
    titleWords.push({ at, text: lower.slice(at, end) });
  }
  const hl: Range[] = [];
  let fuzzyUsed = false;
  for (const w of words) {
    const exact = atWordStart(lower, starts, w);
    if (exact >= 0) {
      hl.push([exact, exact + w.length]);
      continue;
    }
    if (w.length < 4) return null;
    const max = w.length >= 8 ? 2 : 1;
    let best: Range | null = null;
    for (const t of titleWords) {
      for (const len of [w.length - 1, w.length, w.length + 1]) {
        if (len < 3 || t.text.length < len) continue;
        if (editDistance(w, t.text.slice(0, len), max) <= max) {
          best = [t.at, t.at + Math.min(t.text.length, Math.max(len, w.length))];
          break;
        }
      }
      if (best) break;
    }
    if (!best) return null;
    fuzzyUsed = true;
    hl.push(best);
  }
  return fuzzyUsed ? merge(hl) : null;
}

/** Score one item against the query, or null when it doesn't match. */
export function score(p: Prepared, query: Query): Hit | null {
  const { q, words, compact } = query;
  if (!q) return null;
  const { lower, starts } = p;
  const len = q.length;

  let title: Hit | null = null;
  if (lower === q) title = { score: 1000, hl: [[0, lower.length]], tier: 'direct' };
  else if (lower.startsWith(q)) title = { score: 900 - Math.min(80, lower.length - len), hl: [[0, len]], tier: 'direct' };
  else {
    const at = atWordStart(lower, starts, q);
    if (at >= 0) title = { score: 760 - Math.min(60, at), hl: [[at, at + len]], tier: 'direct' };
    else if (len >= 3) {
      const any = lower.indexOf(q);
      if (any >= 0) title = { score: 600 - Math.min(60, any), hl: [[any, any + len]], tier: 'direct' };
    }
  }
  if (!title && words.length > 1) {
    const hl: Range[] = [];
    for (const w of words) {
      const at = atWordStart(lower, starts, w);
      if (at < 0) break;
      hl.push([at, at + w.length]);
    }
    if (hl.length === words.length) title = { score: 520, hl: merge(hl), tier: 'direct' };
    else if (len >= 3 && words.every((w) => w.length >= 2 && lower.includes(w)))
      title = { score: 420, hl: merge(words.map((w) => [lower.indexOf(w), lower.indexOf(w) + w.length] as Range)), tier: 'direct' };
  }
  if (!title && len >= 2) {
    const ab = abbreviation(p, compact);
    if (ab) title = { score: 190 + Math.round(ab.quality * 160), hl: ab.hl, tier: 'abbr' };
  }
  if (!title && len >= 4) {
    const ty = typos(p, words);
    if (ty) title = { score: 280, hl: ty, tier: 'typo' };
  }

  // the extra words: every query word must begin a word there (or, for 3+ letters, appear anywhere)
  let hay = 0;
  if (p.hay && len >= 2) {
    if (words.every((w) => wordPrefixIn(p.hay, w))) hay = 160;
    else if (len >= 3 && words.every((w) => w.length >= 3 && p.hay.includes(w))) hay = 100;
  }

  if (title) return { ...title, score: title.score + (hay ? 15 : 0) };
  if (hay && len >= 2) return { score: hay, hl: [], tier: 'hay' };
  return null;
}

/** Split a title into plain and highlighted runs for rendering. */
export function segments(title: string, hl: Range[]): { text: string; hit: boolean }[] {
  if (!hl.length) return [{ text: title, hit: false }];
  const out: { text: string; hit: boolean }[] = [];
  let at = 0;
  for (const [a, b] of merge(hl)) {
    if (a > at) out.push({ text: title.slice(at, a), hit: false });
    out.push({ text: title.slice(a, b), hit: true });
    at = b;
  }
  if (at < title.length) out.push({ text: title.slice(at), hit: false });
  return out;
}
