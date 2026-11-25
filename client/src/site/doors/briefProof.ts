/**
 * Has the learner shipped a problem brief at this level of support? Levels 4 and 5 ask for one.
 * Problem briefs (Part IV) arrive in M8; until then nothing counts, and the need points at the
 * chapter page, which says honestly that briefs are being written.
 */
import type { useProgress } from '@/lib/progress';

type Store = ReturnType<typeof useProgress>;
export type Support = 'guided' | 'semi-guided' | 'spec' | 'open';

export function briefsShipped(_support: Support, _progress: Store): { met: boolean; href: string } {
  return { met: false, href: '/manual/briefs' };
}
