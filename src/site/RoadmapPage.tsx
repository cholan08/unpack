import { useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Check, Clock, Lock, MapPin } from 'lucide-react';
import { SiteFooter, SiteHeader } from './SiteHeader';
import { COURSES } from '@/content/registry';
import { usePlacement, useProgress, useGates } from '@/lib/progress';
import './roadmap.css';

export function RoadmapPage() {
  const course = COURSES[0];
  const progress = useProgress();
  const placement = usePlacement();
  const gates = useGates();

  useEffect(() => {
    document.title = `Roadmap · ${course?.short ?? ''} — Unpacked`;
  }, [course]);

  if (!course) return null;

  // Compute per-part progress
  const partStatus = course.parts.map((part) => {
    const lessons = part.lessons;
    const done = lessons.filter((l) => progress.lessons[`${course.id}/${l.id}`]?.done).length;
    const started = lessons.some((l) => {
      const p = progress.lessons[`${course.id}/${l.id}`];
      return p && !p.done;
    });
    const gateState = gates[`${course.id}/${part.id}`];
    return { done, started, total: lessons.length, gateState };
  });

  // Find the "you are here" part
  const currentPartIdx = (() => {
    for (let i = course.parts.length - 1; i >= 0; i--) {
      const s = partStatus[i];
      if (s.done === s.total && s.total > 0) return Math.min(i + 1, course.parts.length - 1);
      if (s.started || s.done > 0) return i;
    }
    return placement?.startPart ?? 0;
  })();

  return (
    <>
      <SiteHeader />
      <main className="roadmap wrap">
        <div className="roadmap-head">
          <span className="eyebrow">Course roadmap</span>
          <h1 className="display">{course.title}</h1>
          <p className="muted roadmap-lede">{course.tagline}</p>
        </div>

        <div className="roadmap-track">
          {course.parts.map((part, i) => {
            const s = partStatus[i];
            const isHere = i === currentPartIdx;
            const isDone = s.done === s.total && s.total > 0;
            const isSkippable = placement && i < (placement.startPart ?? 0);
            const gateState = s.gateState;

            return (
              <div
                key={part.id}
                className="roadmap-part"
                data-tone={part.tone}
                data-here={isHere || undefined}
                data-done={isDone || undefined}
                data-skip={isSkippable || undefined}
              >
                <div className="roadmap-part-connector" aria-hidden>
                  {isDone ? <Check size={18} /> : isHere ? <MapPin size={18} /> : <span className="roadmap-num mono">{part.num}</span>}
                </div>
                <div className="roadmap-part-card">
                  <div className="roadmap-part-head">
                    <span className="roadmap-part-num eyebrow">Part {part.num}</span>
                    {isHere && <span className="roadmap-here-badge">You are here</span>}
                    {isSkippable && <span className="roadmap-skip-badge">Skippable</span>}
                    {isDone && <span className="roadmap-done-badge"><Check size={12} /> Done</span>}
                  </div>
                  <h2 className="roadmap-part-title">{part.title}</h2>
                  <p className="roadmap-part-blurb muted">{part.blurb}</p>

                  {/* Why / outcomes from the extended Part type */}
                  {(part as any).why && (
                    <div className="roadmap-why">
                      <span className="eyebrow">Why this matters</span>
                      <p>{(part as any).why}</p>
                    </div>
                  )}
                  {(part as any).outcomes && (
                    <div className="roadmap-outcomes">
                      <span className="eyebrow">You will be able to</span>
                      <ul>
                        {((part as any).outcomes as string[]).map((o, j) => (
                          <li key={j}><Check size={12} /> {o}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="roadmap-part-meta">
                    <span className="pill">
                      <Clock size={12} />
                      {part.lessons.reduce((acc, l) => acc + (l.minutes ?? 0), 0)} min
                    </span>
                    <span className="pill">{s.done}/{s.total} lessons</span>
                    {gateState && (
                      <span className="pill" data-tone={gateState.passed ? 'ok' : gateState.skipped ? 'warn' : 'neutral'}>
                        {gateState.passed ? <><Check size={12} /> Gate passed</> : gateState.skipped ? 'Gate skipped' : <><Lock size={12} /> Gate</>}
                      </span>
                    )}
                  </div>

                  <div className="roadmap-part-actions">
                    <Link
                      to={`/${course.id}/${part.lessons[0]?.id ?? ''}`}
                      className="btn btn--sm"
                      data-primary={isHere || undefined}
                    >
                      {isDone ? 'Review' : s.started ? 'Continue' : 'Start'} Part {part.num} <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
