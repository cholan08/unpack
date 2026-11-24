/**
 * A main topic (/frontend, /backend, /database, /devops) or /projects: every lesson labelled
 * with it, across every course, listed under the part it comes from. Parts are not reshaped —
 * a part that mixes topics shows only this topic's lessons, and links to where the rest live.
 */
import { useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Flag, Route, ShieldCheck } from 'lucide-react';
import { COURSES, type LessonEntry } from '@/content/registry';
import { MAIN_PILLARS, getPillar } from '@/content/pillars';
import { CAPSTONE_MILESTONES } from '@/content/courses/mern/capstone';
import type { PillarId } from '@/engine/types';
import { useProgress } from '@/lib/progress';
import { LessonCard } from './CoursePage';
import { prefetchLessonPage } from './prefetch';
import { PILLAR_ICON } from './AppShell';
import { statsFor, topicGroups, topicStats } from './learner';
import { Ring, fmtHours } from './ui';
import './topic.css';

const key = (e: LessonEntry) => `${e.part.id}/${e.stub.id}`;

export function TopicPage({ id }: { id: PillarId }) {
  const pillar = getPillar(id)!;
  const progress = useProgress();
  useEffect(() => {
    document.title = `${pillar.label} — Unpacked`;
  }, [pillar]);

  const groups = topicGroups(id);
  const s = topicStats(groups, progress);
  const index = MAIN_PILLARS.findIndex((p) => p.id === id);
  const roadmapCourse = COURSES[0];
  const Icon = PILLAR_ICON[id];
  // number lessons by their position in this topic
  const order = new Map(groups.flatMap((g) => g.items).map((e, i) => [key(e), i + 1]));

  return (
    <main className="topic" data-tone={pillar.tone}>
      <div className="wrap">
        <TopicSwitch current={id} />

        <header className="topic-head">
          <div className="topic-head-text">
            <span className="eyebrow topic-kicker">
              <Icon size={14} strokeWidth={2.4} />
              {index >= 0 ? `Topic ${index + 1} of ${MAIN_PILLARS.length}` : 'Uses all four topics'}
            </span>
            <h1 className="page-title">{pillar.label}</h1>
            <p className="page-lede">{pillar.blurb}</p>
            <ul className="topic-facts">
              <li>
                <strong>{s.ready}</strong> lessons
              </li>
              <li>
                from <strong>{groups.length}</strong> {groups.length === 1 ? 'part' : 'parts'}
              </li>
              <li>
                <strong>{fmtHours(s.minutes)}</strong> in total
              </li>
            </ul>
          </div>

          <div className="topic-progress card">
            <Ring pct={s.pct} size={64} stroke={5} label={`${s.done} of ${s.ready} done`}>
              <span className="topic-progress-pct mono">{Math.round(s.pct * 100)}%</span>
            </Ring>
            <div className="topic-progress-text">
              <strong>
                {s.done} of {s.ready} done
              </strong>
              {s.next?.e.meta && (
                <span>
                  {s.started ? 'In progress' : s.done ? 'Up next' : 'Start with'}: {s.next.e.meta.title}
                </span>
              )}
            </div>
            {s.next && (
              <Link
                className="btn btn--tone btn--block"
                to={`/${s.next.course.id}/${s.next.e.stub.id}${s.resumeStep ? `?s=${s.resumeStep}` : ''}`}
                onMouseEnter={() => prefetchLessonPage(s.next!.course, s.next!.e.stub.id)}
                onFocus={() => prefetchLessonPage(s.next!.course, s.next!.e.stub.id)}
              >
                {s.started ? 'Continue' : s.done ? 'Next lesson' : 'Start the topic'} <ArrowRight size={15} />
              </Link>
            )}
            {roadmapCourse && (
              <Link className="tlink topic-roadmap" to={`/${roadmapCourse.id}/roadmap`}>
                <Route size={14} /> See it on the roadmap
              </Link>
            )}
          </div>
        </header>

        <div className="syl">
          {groups.map((g) => (
            <section key={`${g.course.id}/${g.part.id}`} className="syl-part" id={g.part.id} data-tone={g.part.tone}>
              <header className="syl-head">
                <span className="syl-num mono">Part {g.part.num}</span>
                <h2>{g.part.title}</h2>
                <p>{g.part.blurb}</p>
                <span className="syl-count">
                  {g.others.length ? `${g.items.length} of ${g.inPart} lessons in this part` : `${g.items.length} lessons`}
                  {COURSES.length > 1 ? ` · ${g.course.short}` : ''}
                </span>
                {g.others.length > 0 ? (
                  <p className="syl-also">
                    <span>The rest of this part:</span>
                    {g.others.map((o) => (
                      <Link key={o.pillar.id} to={`/${o.pillar.id}`} className="pill" data-tone={o.pillar.tone}>
                        {o.pillar.label} · {o.n}
                      </Link>
                    ))}
                  </p>
                ) : (
                  <Link to={`/${g.course.id}/gate/${g.part.id}`} className="syl-gate">
                    <ShieldCheck size={14} /> Part {g.part.num} gate
                  </Link>
                )}
              </header>
              <ol className="syl-list">
                {g.items.map((e) => (
                  <li key={e.stub.id}>
                    <LessonCard course={g.course} e={e} n={order.get(key(e))} />
                  </li>
                ))}
              </ol>
            </section>
          ))}

          {id === 'projects' && (
            <section className="syl-part" id="capstone" data-tone="warn">
              <header className="syl-head">
                <span className="syl-num mono">
                  <Flag size={12} strokeWidth={2.6} /> Capstone
                </span>
                <h2>Build it yourself</h2>
                <p>One real app on your own machine, milestone by milestone.</p>
              </header>
              <ol className="syl-list">
                <li>
                  <Link to="/capstone" className="topic-capstone card">
                    <span className="topic-capstone-n mono">{CAPSTONE_MILESTONES.length} milestones</span>
                    <strong>TaskFlow: a full MERN app, end to end</strong>
                    <span>From an empty folder to a deployed app: React, Express, MongoDB, auth, tests and a pipeline, with checks at every milestone.</span>
                    <span className="tlink">
                      Open the capstone <ArrowRight size={14} />
                    </span>
                  </Link>
                </li>
              </ol>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

/** The four main topics side by side, like the stack itself: browser → server → data → shipping. */
function TopicSwitch({ current }: { current: PillarId }) {
  const progress = useProgress();
  return (
    <nav className="topic-switch" aria-label="Main topics">
      {MAIN_PILLARS.map((p) => {
        const s = statsFor(p.id, progress);
        const I = PILLAR_ICON[p.id];
        return (
          <Link key={p.id} to={`/${p.id}`} className="topic-switch-item" data-tone={p.tone} aria-current={p.id === current ? 'page' : undefined}>
            <Ring pct={s.pct} size={26} stroke={2.4}>
              <I size={12} strokeWidth={2.4} />
            </Ring>
            <span className="topic-switch-name">{p.label}</span>
            <span className="topic-switch-count mono">
              {s.done}/{s.ready}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
