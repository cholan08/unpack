import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { List, Map as MapIcon } from 'lucide-react';
import type { Course } from '@/engine/types';
import { getCourse } from '@/content/registry';
import { useGates, usePlacement, useProgress } from '@/lib/progress';
import { NotFound } from './NotFound';
import { RoadmapMap } from './roadmap/RoadmapMap';
import { RoadmapList } from './roadmap/RoadmapList';
import { computeStatus, fmtMinutes } from './roadmap/status';
import { wobblyCircle } from './roadmap/shapes';
import './roadmap.css';

export function RoadmapPage() {
  const { courseId } = useParams();
  const course = getCourse(courseId);
  if (!course) return <NotFound />;
  return <Roadmap key={course.id} course={course} />;
}

function Roadmap({ course }: { course: Course }) {
  const progress = useProgress();
  const placement = usePlacement();
  const gates = useGates();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'list' ? 'list' : 'map';
  const focus = params.get('focus');
  const status = useMemo(() => computeStatus(course, progress, gates, placement), [course, progress, gates, placement]);
  const t = status.totals;

  useEffect(() => {
    document.title = `Roadmap · ${course.short} — Unpacked`;
  }, [course]);

  const setFocus = (id: string | null) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (id) p.set('focus', id);
        else p.delete('focus');
        return p;
      },
      { replace: true },
    );
  const setView = (v: 'map' | 'list', focusId?: string) =>
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      if (v === 'list') p.set('view', 'list');
      else p.delete('view');
      if (focusId) p.set('focus', focusId);
      return p;
    });

  return (
    <>
      <main className="rm" data-view={view}>
        <header className="rm-top">
          <div className="rm-title">
            <span className="eyebrow">Course roadmap</span>
            <h1 className="display">{course.title}</h1>
            <p className="rm-lede">{course.tagline}</p>
          </div>
          <div className="rm-stats" aria-label="Your progress">
            <svg className="rm-donut" viewBox="-40 -40 80 80" aria-hidden>
              <path className="rm-donut-track" d={wobblyCircle(31, 7, 0.03, 10)} />
              <circle className="rm-donut-arc" r="31" pathLength={100} strokeDasharray={`${Math.max(t.pct ? 2 : 0, t.pct * 100)} 100`} transform="rotate(-90)" />
              <text y="8">{Math.round(t.pct * 100)}%</text>
            </svg>
            <dl>
              <div>
                <dt>lessons done</dt>
                <dd>
                  {t.done}
                  <small>/{t.total}</small>
                </dd>
              </div>
              <div>
                <dt>gates passed</dt>
                <dd>
                  {t.gatesPassed}
                  <small>/{t.gates}</small>
                </dd>
              </div>
              <div>
                <dt>still to go</dt>
                <dd>{fmtMinutes(t.minutesLeft)}</dd>
              </div>
            </dl>
          </div>
          <div className="rm-views" role="tablist" aria-label="Roadmap view">
            <button type="button" role="tab" aria-selected={view === 'map'} onClick={() => setView('map')}>
              <MapIcon size={16} /> Map
            </button>
            <button type="button" role="tab" aria-selected={view === 'list'} onClick={() => setView('list')}>
              <List size={16} /> List
            </button>
          </div>
        </header>
        {view === 'map' ? (
          <RoadmapMap course={course} status={status} placementStart={placement?.startPart ?? 0} selected={focus} onSelect={setFocus} />
        ) : (
          <RoadmapList course={course} status={status} onShowOnMap={(id) => setView('map', id)} />
        )}
      </main>
    </>
  );
}
