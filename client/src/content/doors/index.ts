/**
 * The three doors into the Manual (docs/VISION.md §4): Explore, Build and Path.
 * Content only — the pages live in src/site/doors/. Every door leads into the same chapters.
 *
 * Build and Path are small and Home needs them at once. The Explore questions are the feed's own
 * chunk — import them from './explore' (the Explore page does; Home fetches them on demand).
 */
import { COURSES } from '@/content/registry';
import { CHAPTERS } from '@/content/manual';
import { CORE, CRAFT, FEATURES, IDEAS } from './build';
import { PATH } from './path';

export { CORE, CRAFT, FEATURES, IDEAS, PATH };
export type { Curiosity } from './explore';
export type { Feature, Idea, Need } from './build';
export type { PathStage } from './path';

/* ---------------- dev checks: a broken link is a console warning (so QA fails) ---------------- */

if (import.meta.env.DEV) {
  const course = COURSES[0];
  const chapter = (id: string, where: string) => {
    if (!CHAPTERS.some((c) => c.id === id)) console.warn(`[doors] ${where} links chapter "${id}", which isn't in chapters.ts`);
  };
  const lesson = (id: string, where: string) => {
    if (course && !course.lessons[id]) console.warn(`[doors] ${where} links lesson "${id}", which isn't written`);
  };
  const unique = (ids: string[], what: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) console.warn(`[doors] ${what} id "${id}" is used twice`);
      seen.add(id);
    }
  };

  void import('./explore').then(({ CURIOSITIES }) => {
    unique(CURIOSITIES.map((c) => c.id), 'Explore question');
    for (const c of CURIOSITIES) {
      chapter(c.chapter, `Explore "${c.id}"`);
      if (c.see) {
        lesson(c.see[0], `Explore "${c.id}"`);
        if (c.see[1] < 1) console.warn(`[doors] Explore "${c.id}" links step ${c.see[1]}; steps start at 1`);
      }
    }
    // Every chapter should have at least one question in the feed.
    for (const ch of CHAPTERS) if (!CURIOSITIES.some((c) => c.chapter === ch.id)) console.warn(`[doors] chapter "${ch.id}" has no Explore question`);
  });

  unique(FEATURES.map((f) => f.id), 'Build feature');
  unique(IDEAS.map((i) => i.id), 'Build idea');
  for (const n of [...CORE, ...CRAFT]) chapter(n.chapter, 'Build');
  for (const f of FEATURES) for (const n of f.needs) chapter(n.chapter, `Build feature "${f.id}"`);
  for (const i of IDEAS) {
    for (const f of i.features) if (!FEATURES.some((x) => x.id === f)) console.warn(`[doors] Build idea "${i.id}" uses feature "${f}", which doesn't exist`);
    if (i.study && 'lesson' in i.study) lesson(i.study.lesson, `Build idea "${i.id}"`);
  }

  // The path holds every chapter exactly once.
  const onPath = PATH.flatMap((s) => s.chapters);
  unique(onPath, 'Path chapter');
  for (const id of onPath) chapter(id, 'Path');
  for (const ch of CHAPTERS) if (!onPath.includes(ch.id)) console.warn(`[doors] chapter "${ch.id}" is not on the Path`);
}
