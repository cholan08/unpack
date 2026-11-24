import { Link } from 'react-router';
import { ArrowRight, Check, FastForward, Flag, Lock, Map as MapIcon } from 'lucide-react';
import type { Course } from '@/engine/types';
import { ICONS } from '@/engine/icons';
import { prefetchLessonPage } from '../prefetch';
import { hubNodeId } from './graph';
import { fmtMinutes, type MapStatus } from './status';

/** The same journey as a plain outline: parts in order, lessons as stops. */
export function RoadmapList({ course, status, onShowOnMap }: { course: Course; status: MapStatus; onShowOnMap: (id: string) => void }) {
  return (
    <ol className="rml">
      {course.parts.map((part, pi) => {
        const p = status.parts[part.id];
        const g = status.gates[part.id];
        const Icon = part.icon ? ICONS[part.icon] : null;
        const here = status.current === pi;
        const pct = p.done / Math.max(1, p.total);
        return (
          <li key={part.id} className="rml-part" data-tone={part.tone} data-here={here || undefined} data-done={p.complete || undefined} data-skip={p.skippable || undefined}>
            <div className="rml-rail" aria-hidden>
              <svg viewBox="-34 -34 68 68" className="rml-hub">
                <circle r="30" className="rml-hub-track" />
                <circle r="30" className="rml-hub-arc" pathLength={100} strokeDasharray={`${pct * 100} 100`} transform="rotate(-90)" />
                <circle r="23" className="rml-hub-fill" />
              </svg>
              <span className="rml-hub-icon">{Icon ? <Icon size={20} strokeWidth={2.2} /> : part.num}</span>
            </div>
            <div className="rml-body">
              <div className="rml-head">
                <span className="rml-num mono">Part {part.num}</span>
                {here && <span className="rml-badge rml-badge--here">You are here</span>}
                {p.skippable && <span className="rml-badge rml-badge--skip">Skippable</span>}
                {p.complete && (
                  <span className="rml-badge rml-badge--done">
                    <Check size={12} strokeWidth={3} /> Done
                  </span>
                )}
              </div>
              <h2 className="rml-title">{part.title}</h2>
              <p className="rml-blurb">{part.blurb}</p>
              <ol className="rml-lessons">
                {part.lessons.map((l, i) => {
                  const s = status.lessons[l.id];
                  const isNext = status.next?.lessonId === l.id;
                  const inner = (
                    <>
                      <span className="rml-stop" data-state={s.state} aria-hidden>
                        {s.state === 'done' ? <Check size={11} strokeWidth={3.4} /> : i + 1}
                      </span>
                      <span className="rml-ltitle">{l.title}</span>
                      {s.state === 'started' && <span className="rml-lmeta">step {s.step}</span>}
                      {isNext && <span className="rml-lnext">next</span>}
                    </>
                  );
                  return (
                    <li key={l.id} data-state={s.state} data-next={isNext || undefined}>
                      {course.lessons[l.id] ? (
                        <Link to={`/${course.id}/${l.id}`} onMouseEnter={() => prefetchLessonPage(course, l.id)} onFocus={() => prefetchLessonPage(course, l.id)}>
                          {inner}
                        </Link>
                      ) : (
                        <span className="rml-soon">{inner}</span>
                      )}
                    </li>
                  );
                })}
                <li className="rml-gate" data-state={g.state}>
                  <Link to={`/${course.id}/gate/${part.id}`}>
                    <span className="rml-stop rml-stop--gate" aria-hidden>
                      {g.state === 'passed' ? <Check size={11} strokeWidth={3.4} /> : g.state === 'skipped' ? <FastForward size={11} /> : g.state === 'ready' ? <Flag size={11} /> : <Lock size={10} />}
                    </span>
                    <span className="rml-ltitle">Gate</span>
                  </Link>
                </li>
              </ol>
              <div className="rml-foot">
                <span className="rml-meta">
                  {p.done}/{p.total} lessons · {fmtMinutes(p.minutes)}
                </span>
                <button type="button" className="rml-onmap" onClick={() => onShowOnMap(hubNodeId(part.id))}>
                  <MapIcon size={14} /> Show on map
                </button>
                <Link className="rml-go" to={`/${course.id}/${(part.lessons.find((l) => status.lessons[l.id].state !== 'done') ?? part.lessons[0]).id}`}>
                  {p.complete ? 'Review' : p.started ? 'Continue' : 'Start'} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
