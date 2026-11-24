/**
 * A topic page. The main topics (/frontend … /aiml) show their skill plan: what to learn, stage
 * by stage, linked to the lessons, notebooks, cheatsheets and Skill Pack topics for each skill
 * (./plan). The lessons in course order live on the course map, so they are not repeated here.
 *
 * /projects (no plan) lists every lesson labelled with it, under the part it comes from, plus the
 * Capstone. Parts are not reshaped — a part that mixes topics shows only this topic's lessons.
 */
import { useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Flag, Map as MapIcon, Route, ShieldCheck } from 'lucide-react';
import { COURSES, type LessonEntry } from '@/content/registry';
import { MAIN_PILLARS, getPillar } from '@/content/pillars';
import { CAPSTONE_MILESTONES } from '@/content/courses/mern/capstone';
import type { PillarId } from '@/engine/types';
import { useProgress } from '@/lib/progress';
import { LessonCard } from './CoursePage';
import { prefetchLessonPage } from './prefetch';
import { PILLAR_ICON } from './AppShell';
import { continueTarget, statsFor, topicGroups, topicStats } from './learner';
import { Glide, Ring, fmtHours } from './ui';
import { getPlan, type PlanStage } from './plan/data';
import { SkillPlan } from './plan/SkillPlan';
import { lessonHref, planStatus, type PlanStatus } from './plan/status';
import './topic.css';

const key = (e: LessonEntry) => `${e.part.id}/${e.stub.id}`;

export function TopicPage({ id }: { id: PillarId }) {
  const plan = getPlan(id);
  return plan ? <PlanTopic id={id} plan={plan} /> : <SyllabusTopic id={id} />;
}

/* ================= main topics: the skill plan ================= */

function PlanTopic({ id, plan }: { id: PillarId; plan: PlanStage[] }) {
  const pillar = getPillar(id)!;
  const progress = useProgress();
  useEffect(() => {
    document.title = `${pillar.label} — Unpacked`;
  }, [pillar]);

  const status = planStatus(plan, progress);
  const index = MAIN_PILLARS.findIndex((p) => p.id === id);
  const Icon = PILLAR_ICON[id];
  const course = COURSES[0];
  // "lessons in order" opens the course map at the first part holding this topic's lessons
  const firstPart = topicGroups(id)[0]?.part;
  const courseMap = course && firstPart ? `/${course.id}#${firstPart.id}` : undefined;
  const cur = status.current ? status.stages.indexOf(status.current) + 1 : 0;

  return (
    <main className="topic" data-tone={pillar.tone}>
      <div className="wrap">
        <TopicSwitch current={id} />

        <header className="topic-head">
          <div className="topic-head-text">
            <span className="eyebrow topic-kicker">
              <Icon size={14} strokeWidth={2.4} />
              Topic {index + 1} of {MAIN_PILLARS.length} · Skill plan
            </span>
            <h1 className="page-title">{pillar.label}</h1>
            <p className="page-lede">{pillar.blurb}</p>
            <ul className="topic-facts">
              <li>
                <strong>{plan.length}</strong> stages
              </li>
              <li>
                <strong>{status.skills}</strong> skills
              </li>
              {status.lessons > 0 && (
                <li>
                  <strong>{status.lessons}</strong> lessons
                </li>
              )}
              {status.notebooks > 0 && (
                <li>
                  <strong>{status.notebooks}</strong> {status.notebooks === 1 ? 'notebook' : 'notebooks'}
                </li>
              )}
            </ul>
            {status.lessons === 0 && (
              <span className="pill topic-soon-pill" data-tone={pillar.tone}>
                Lessons coming soon · notebooks and topic lists are ready now
              </span>
            )}
          </div>

          <div className="topic-progress card">
            <Ring pct={status.pct} size={64} stroke={5} label={`${status.coreDone} of ${status.core} core skills`}>
              <span className="topic-progress-pct mono">{Math.round(status.pct * 100)}%</span>
            </Ring>
            <div className="topic-progress-text">
              <strong>
                {status.coreDone} of {status.core} core skills
              </strong>
              <span>{status.current ? `Stage ${cur} of ${plan.length}: ${status.current.stage.title}` : 'Every stage done. Nice work.'}</span>
            </div>
            <PlanNext status={status} />
            <span className="topic-progress-links">
              {courseMap && (
                <Link className="tlink" to={courseMap}>
                  <MapIcon size={14} /> Lessons in order
                </Link>
              )}
              {course && (
                <Link className="tlink" to={`/${course.id}/roadmap`}>
                  <Route size={14} /> Roadmap
                </Link>
              )}
            </span>
          </div>
        </header>

        <div className="pl-intro">
          <h2>The plan</h2>
          <p>
            Work down the stages. <strong>Core</strong> skills are the path; <strong>good to know</strong> ones are extras and
            alternatives. Tick a skill when you know it — finishing its lessons ticks it for you.
          </p>
        </div>

        <SkillPlan status={status} />
      </div>
    </main>
  );
}

/** The one button that moves the plan on: resume a lesson left part-way, else the next core skill. */
function PlanNext({ status }: { status: PlanStatus }) {
  const course = COURSES[0];
  if (status.resume) {
    const l = status.resume;
    const warm = () => course && prefetchLessonPage(course, l.meta.id);
    return (
      <Link className="btn btn--tone btn--block" to={lessonHref(l)} onMouseEnter={warm} onFocus={warm}>
        Continue: {l.meta.title} <ArrowRight size={15} />
      </Link>
    );
  }
  const s = status.nextSkill;
  if (!s || !status.current) return null;
  const l = s.nextLesson && !s.nextLesson.done ? s.nextLesson : undefined;
  const { notebook, tool, name } = s.skill;
  const to = l ? lessonHref(l) : notebook ? `/notebooks/${notebook}` : tool ? `/skillpack/${tool}` : `#${status.current.stage.id}`;
  const what = l ? l.meta.title : notebook ? `${name} notebook` : tool ? `${name} topics` : name;
  return (
    <Link className="btn btn--tone btn--block" to={to}>
      Next: {what} <ArrowRight size={15} />
    </Link>
  );
}

/* ================= projects: lessons by part, plus the capstone ================= */

function SyllabusTopic({ id }: { id: PillarId }) {
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
  /** A topic with no lessons yet (e.g. a new one): say so, and point to what to do meanwhile. */
  const empty = s.total === 0;
  const t = continueTarget(progress);

  return (
    <main className="topic" data-tone={pillar.tone}>
      <div className="wrap">
        <TopicSwitch current={id} />

        <header className="topic-head" data-empty={empty || undefined}>
          <div className="topic-head-text">
            <span className="eyebrow topic-kicker">
              <Icon size={14} strokeWidth={2.4} />
              {index >= 0 ? `Topic ${index + 1} of ${MAIN_PILLARS.length}` : 'Uses all four topics'}
            </span>
            <h1 className="page-title">{pillar.label}</h1>
            <p className="page-lede">{pillar.blurb}</p>
            {empty ? (
              <span className="pill topic-soon-pill" data-tone={pillar.tone}>
                Coming soon
              </span>
            ) : (
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
            )}
          </div>

          {!empty && (
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
          )}
        </header>

        {empty && (
          <section className="topic-soon">
            <span className="topic-soon-icon">
              <Icon size={26} strokeWidth={2} />
            </span>
            <div className="topic-soon-text">
              <h2>Lessons are on the way</h2>
              <p>
                There are no {pillar.label} lessons yet. As each one is written it appears here, in the sidebar and on the roadmap — with the same step-by-step
                diagrams as the rest of the course.
              </p>
              <div className="page-actions">
                {t && t.kind !== 'start' ? (
                  <Link className="btn btn--primary" to={t.href}>
                    Meanwhile, continue: {t.lesson!.title} <ArrowRight size={15} />
                  </Link>
                ) : (
                  <Link className="btn btn--primary" to="/start">
                    Meanwhile, start here <ArrowRight size={15} />
                  </Link>
                )}
                {roadmapCourse && (
                  <Link className="btn" to={`/${roadmapCourse.id}/roadmap`}>
                    <Route size={15} /> Roadmap
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

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

/** The main topics side by side, like the stack itself: browser → server → data → shipping → AI. */
function TopicSwitch({ current }: { current: PillarId }) {
  const progress = useProgress();
  return (
    <nav className="topic-switch" aria-label="Main topics">
      {MAIN_PILLARS.map((p) => {
        const s = statsFor(p.id, progress);
        const I = PILLAR_ICON[p.id];
        return (
          <Link key={p.id} to={`/${p.id}`} className="topic-switch-item" data-tone={p.tone} aria-current={p.id === current ? 'page' : undefined}>
            {p.id === current && <Glide id="topic-switch" className="topic-switch-glide" />}
            <Ring pct={s.pct} size={26} stroke={2.4}>
              <I size={12} strokeWidth={2.4} />
            </Ring>
            <span className="topic-switch-name">{p.label}</span>
            <span className="topic-switch-count mono">{s.ready ? `${s.done}/${s.ready}` : 'soon'}</span>
          </Link>
        );
      })}
    </nav>
  );
}
