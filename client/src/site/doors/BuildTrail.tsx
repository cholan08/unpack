/**
 * "Your build" on a chapter page: when this chapter is one the learner's build needs, say where it
 * sits in that build and link the next one — so the Build door is a path through just those chapters.
 */
import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Hammer } from 'lucide-react';
import { useProgress } from '@/lib/progress';
import { buildName, hasBuild, planOf, useBuildState } from './model';
import './doors.css';

export function BuildTrail({ chapterId }: { chapterId: string }) {
  const progress = useProgress();
  const s = useBuildState();
  const plan = useMemo(() => (hasBuild(s) ? planOf(s, progress) : undefined), [s, progress]);
  const i = plan?.rows.findIndex((r) => r.chapter.id === chapterId) ?? -1;
  if (!plan || i < 0) return null;
  const next = plan.rows[i + 1];
  return (
    <nav className="dr-trail" aria-label="Your build">
      <Link to="/build" className="dr-trail-name">
        <Hammer size={14} />
        <span>
          Your build: <strong>{buildName(s, plan)}</strong>
        </span>
      </Link>
      <span className="dr-trail-pos mono">
        {i + 1} of {plan.rows.length}
      </span>
      {next ? (
        <Link to={next.href} className="dr-trail-next">
          <span>
            Next for it: <strong>{next.chapter.title}</strong>
          </span>
          <ArrowRight size={14} />
        </Link>
      ) : (
        <span className="dr-trail-next dr-trail-last">The last chapter it needs</span>
      )}
    </nav>
  );
}
