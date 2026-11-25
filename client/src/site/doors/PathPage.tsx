/**
 * /path — the Path door: "Teach me from zero" (docs/VISION.md §4 and §5).
 *
 * One guided route through every chapter, in stages: ship something → see how it works → make a
 * small app → ship a whole product → add product powers → solve real problems. The whole map is
 * shown, but only the next three steps are lit (§2: beginners freeze in front of too many choices).
 * A chapter counts as finished when every written lesson in it is.
 */
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Check, Compass, Map as MapIcon, Route } from 'lucide-react';
import { COURSES } from '@/content/registry';
import { chapterNum } from '@/content/manual';
import { useProgress } from '@/lib/progress';
import { useMentorPage } from '@/lib/mentor';
import { Ring } from '../ui';
import { StatusPill, chapterTone } from '../manual/shared';
import { LIT, pathOf, type PathStep } from './model';
import '../manual/manual.css';
import './doors.css';

const course = COURSES[0];

export function PathPage() {
  const progress = useProgress();
  const path = useMemo(() => pathOf(progress), [progress]);
  const first = path.lit[0];

  useEffect(() => {
    document.title = 'Path — Unpacked';
  }, []);
  useMentorPage({
    kind: 'path',
    title: 'Path: the guided route from zero to independent builder',
    stepTitle: `Lit next: ${path.lit.map((s) => s.chapter.title).join('; ') || 'nothing — every open chapter is finished'}`,
    stepBody: path.stages.map((g) => `${g.stage.title}: ${g.finished}/${g.steps.length} finished`).join('; '),
  });

  return (
    <main className="dr dr-path">
      <div className="wrap">
        <header className="dr-head">
          <span className="eyebrow" data-tone="ok">
            <Route size={14} /> Path
          </span>
          <h1 className="page-title">Teach me from zero</h1>
          <p className="page-lede">
            One route from knowing nothing to building products on your own. The whole map is here, but only the next {LIT} steps are lit — the
            rest can wait until you get there.
          </p>
          <ul className="dr-facts">
            <li>
              <strong>{path.total}</strong> chapters on the path
            </li>
            <li>
              <strong>{path.open}</strong> ready to read
            </li>
            <li>
              <strong>{path.finished}</strong> finished
            </li>
          </ul>
          <div className="dr-head-acts">
            {first && (
              <Link to={first.href} className="btn btn--primary">
                {path.finished || first.done ? 'Continue' : 'Begin'}: {first.chapter.title} <ArrowRight size={15} />
              </Link>
            )}
            <Link to="/start" className="btn btn--ghost">
              <Compass size={15} /> Know some already? Take the 5-minute check
            </Link>
            {course && (
              <Link to={`/${course.id}/roadmap`} className="btn btn--ghost">
                <MapIcon size={15} /> Every lesson on one map
              </Link>
            )}
          </div>
        </header>

        {path.lit.length > 0 && (
          <section className="dr-next" aria-labelledby="next-h">
            <h2 id="next-h" className="dr-h2">
              Your next {path.lit.length === 1 ? 'step' : `${path.lit.length} steps`}
            </h2>
            <ol className="dr-next-grid">
              {path.lit.map((s) => (
                <li key={s.chapter.id}>
                  <Link to={s.href} className="dr-next-card card" data-tone={chapterTone(s.chapter)}>
                    <span className="dr-next-n mono">{s.litN}</span>
                    <span className="eyebrow">
                      Chapter {chapterNum(s.chapter.id)} · {s.chapter.short}
                    </span>
                    <strong>{s.chapter.title}</strong>
                    <span className="dr-next-q">{s.chapter.question}</span>
                    <span className="dr-next-foot">
                      {s.ready > 0 ? (
                        <>
                          <Ring pct={s.pct} size={18} stroke={2.4} />
                          <span className="mono">
                            {s.done}/{s.ready} lessons
                          </span>
                        </>
                      ) : (
                        <StatusPill c={s.chapter} />
                      )}
                      <ArrowRight size={15} className="mn-go" />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        <ol className="dr-stages" aria-label="The whole path">
          {path.stages.map((g, i) => {
            const allPlanned = g.open === 0;
            const state = allPlanned ? 'planned' : g.finished === g.open ? 'finished' : g.steps.some((s) => s.state === 'lit') ? 'now' : 'later';
            return (
              <li key={g.stage.id} className="dr-stage" data-state={state}>
                <header className="dr-stage-head">
                  <span className="dr-stage-n display">{i + 1}</span>
                  <div>
                    <h2>{g.stage.title}</h2>
                    <p>{g.stage.promise}</p>
                  </div>
                  <span className="dr-stage-count mono" title={`${g.finished} of ${g.steps.length} chapters finished`}>
                    {g.finished}/{g.steps.length}
                  </span>
                </header>
                {allPlanned && (
                  <p className="dr-stage-soon">
                    {i === 0
                      ? 'These chapters are being written now; this is where the path will begin. Until then, start with the next stage.'
                      : 'Every chapter in this stage is still being written. Until then, the path carries on below.'}
                  </p>
                )}
                <ol className="dr-steps">
                  {g.steps.map((s) => (
                    <li key={s.chapter.id}>
                      <StepLink s={s} />
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}

function StepLink({ s }: { s: PathStep }) {
  return (
    <Link to={s.href} className="dr-step" data-state={s.state} data-tone={chapterTone(s.chapter)}>
      <span className="dr-step-mark" aria-hidden>
        {s.state === 'finished' ? <Check size={13} strokeWidth={3} /> : s.state === 'lit' ? s.litN : null}
      </span>
      <span className="dr-step-text">
        <span className="dr-step-title">
          {s.chapter.title} <span className="mn-row-short">· {s.chapter.short}</span>
        </span>
        {s.state === 'lit' && <span className="dr-step-q">{s.chapter.question}</span>}
      </span>
      <span className="dr-step-side">
        {s.state === 'lit' && <span className="dr-step-next">Next</span>}
        {s.ready > 0 && s.state !== 'finished' && (
          <span className="mn-row-prog" title={`${s.done} of ${s.ready} lessons finished`}>
            <Ring pct={s.pct} size={18} stroke={2.4} />
            <span className="mono">
              {s.done}/{s.ready}
            </span>
          </span>
        )}
        {s.state === 'planned' && <StatusPill c={s.chapter} />}
      </span>
    </Link>
  );
}
