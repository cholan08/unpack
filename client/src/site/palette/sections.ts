/** Turns a query into the palette's grouped, ranked results. Pure: the UI decides what is shown around it. */
import { GROUPS, type Entry, type Item, type Kind } from './items';
import { score, type Hit, type Query, type Range } from './match';

export interface Row {
  item: Item;
  /** title ranges to highlight */
  hl: Range[];
  score: number;
}

export interface Section {
  id: string;
  label: string;
  rows: Row[];
}

/** A title match this good means the query was typed on purpose: no need for guesses. */
const STRONG = 600;

/**
 * Every entry that matches, grouped by kind. Groups are ordered by their best match, so the
 * first row is always the best hit overall. `adjust` nudges single items (e.g. a lesson in progress).
 */
export function searchSections(entries: Entry[], query: Query, only?: Kind[], adjust?: (item: Item) => number): Section[] {
  const hits: { item: Item; hit: Hit }[] = [];
  let strong = false;
  for (const { item, p } of entries) {
    if (only && !only.includes(item.kind)) continue;
    const hit = score(p, query);
    if (!hit) continue;
    hits.push({ item, hit });
    if (hit.tier === 'direct' && hit.score >= STRONG) strong = true;
  }

  const byKind = new Map<Kind, Row[]>();
  for (const { item, hit } of hits) {
    // abbreviations and typo fixes are guesses: only when nothing matched directly
    if (strong && (hit.tier === 'abbr' || hit.tier === 'typo')) continue;
    const base = hit.tier === 'hay' ? hit.score * (item.hayWeight ?? 1) : hit.score;
    const row = { item, hl: hit.hl, score: base + item.boost + (adjust?.(item) ?? 0) };
    const list = byKind.get(item.kind);
    if (list) list.push(row);
    else byKind.set(item.kind, [row]);
  }

  const out: (Section & { best: number })[] = [];
  for (const g of GROUPS) {
    const rows = byKind.get(g.kind);
    if (!rows) continue;
    rows.sort((a, b) => b.score - a.score || a.item.title.length - b.item.title.length);
    const best = rows[0].score;
    // A match only in the description ("clos" in "…opening and closing tags") is noise next to
    // real title matches in the same group, so it only shows when the group has nothing better.
    const kept = rows.filter((r) => r.hl.length > 0 || best < 400 || r.score >= best * 0.3);
    out.push({ id: g.kind, label: g.label, rows: kept.slice(0, g.limit), best });
  }
  return out.sort((a, b) => b.best - a.best).map(({ best: _best, ...s }) => s);
}
