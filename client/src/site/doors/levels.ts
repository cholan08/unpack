/**
 * Levels, worked out from progress (content in src/content/levels.ts).
 *
 * The level you hold is the top of an unbroken climb from Level 0 (where everyone starts): each
 * level counts once it is earned, or its proof is met and every level below it is held. A level,
 * once earned, is remembered (`levels` in progress) and never taken away.
 */
import { LEVELS, type Level, type LevelNeed } from '@/content/levels';
import { PATH } from '@/content/doors';
import { getChapter } from '@/content/manual';
import type { useProgress } from '@/lib/progress';
import { viewOf, type ChapterView } from './model';
import { briefsShipped } from './briefProof';

type Store = ReturnType<typeof useProgress>;

export interface NeedState {
  need: LevelNeed;
  label: string;
  href: string;
  met: boolean;
  /** For a stage: its chapters that have something to finish. */
  chapters?: ChapterView[];
  done?: number;
  total?: number;
}

export interface LevelState {
  level: Level;
  needs: NeedState[];
  /** Every need is met right now. */
  met: boolean;
  /** When it was earned, if it was. */
  earnedAt?: number;
  /** Part of the climb you have made. */
  held: boolean;
}

export interface LevelsView {
  ladder: LevelState[];
  /** The level held now (Level 0 for everyone at the start). */
  current: LevelState;
  /** The next level to work towards, if any. */
  next?: LevelState;
  /** Levels held but not yet recorded as earned (the watcher records them). */
  fresh: number[];
}

function needState(need: LevelNeed, progress: Store): NeedState {
  if (need.kind === 'ship') return { need, label: need.label, href: need.href, met: !!progress.ships?.[need.id] };
  if (need.kind === 'brief') {
    const b = briefsShipped(need.support, progress);
    return { need, label: need.label, href: b.href, met: b.met };
  }
  const stage = PATH.find((s) => s.id === need.stage);
  const chapters = (stage?.chapters ?? [])
    .filter((id) => !need.except?.includes(id))
    .flatMap((id) => {
      const c = getChapter(id);
      return c ? [viewOf(c, progress)] : [];
    })
    .filter((v) => v.open && v.measurable);
  const done = chapters.filter((v) => v.finished).length;
  return {
    need,
    label: `Finish or test out of the chapters in “${stage?.title ?? need.stage}”`,
    href: '/path',
    met: chapters.length > 0 && done === chapters.length,
    chapters,
    done,
    total: chapters.length,
  };
}

export function levelsOf(progress: Store): LevelsView {
  const earned = progress.levels ?? {};
  const states = LEVELS.map((level) => {
    const needs = level.needs.map((n) => needState(n, progress));
    return { level, needs, met: needs.every((n) => n.met), earnedAt: earned[level.n] as number | undefined };
  });
  // climb from Level 0 while each level is earned or met
  let top = 0;
  for (const l of states.slice(1)) {
    if (l.earnedAt || l.met) top = l.level.n;
    else break;
  }
  const ladder: LevelState[] = states.map((l) => ({ ...l, held: l.level.n <= top }));
  const current = ladder.find((l) => l.level.n === top) ?? ladder[0];
  const next = ladder.find((l) => l.level.n === top + 1);
  const fresh = ladder.filter((l) => l.level.n > 0 && l.held && !l.earnedAt).map((l) => l.level.n);
  return { ladder, current, next, fresh };
}

/** The next level's progress in a few words: "3 of 6 chapters", "put your first page online". */
export function nextStep(next: LevelState | undefined): string | undefined {
  if (!next) return undefined;
  const open = next.needs.find((n) => !n.met);
  if (!open) return 'ready to earn';
  if (open.total !== undefined) return `${open.done} of ${open.total} chapters`;
  return open.label.charAt(0).toLowerCase() + open.label.slice(1);
}
