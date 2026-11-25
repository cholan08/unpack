/**
 * Has the learner shipped a problem brief with at most this much help? Levels 4 and 5 ask for one.
 * A harder brief counts for an easier requirement (an open brief also proves "semi-guided").
 * The open level (5) also needs the design defended, as an independent builder must.
 */
import { BRIEFS, SUPPORT_RANK, type Support } from '@/content/briefs';
import type { useProgress } from '@/lib/progress';

type Store = ReturnType<typeof useProgress>;
export type { Support };

export function briefsShipped(support: Support, progress: Store): { met: boolean; href: string } {
  const hard = BRIEFS.filter((b) => SUPPORT_RANK[b.support] >= SUPPORT_RANK[support]);
  const met = hard.some((b) => !!progress.ships?.[`brief:${b.id}`] && (support !== 'open' || !!progress.briefs?.[b.id]?.defended));
  const first = hard.find((b) => b.support === support) ?? hard[0];
  return { met, href: first ? `/briefs/${first.id}` : '/briefs' };
}
