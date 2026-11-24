/**
 * A topic's skill plan: stages in order, each a grid of skill tiles. A tile says what the skill is
 * for and links to everything the site has on it (lessons, notebook, cheatsheet, Skill Pack topics);
 * its tick marks it known. Lesson-by-lesson order stays on the course map.
 */
import { Link } from 'react-router';
import { Check, Code2, Hammer, ListTree, NotebookPen, PlayCircle } from 'lucide-react';
import { getNotebook } from '@/content/notebooks/registry';
import { COURSES } from '@/content/registry';
import { toggleKnown } from '@/lib/progress';
import { SkillIcon } from '../skillpack/icons';
import { toolHref } from '../skillpack/lookup';
import { topicCount } from '../skillpack/topics';
import { prefetchLessonPage } from '../prefetch';
import { Ring } from '../ui';
import { lessonHref, type PlanStatus, type SkillStatus, type StageStatus } from './status';
import '../plan.css';

const pad = (n: number) => String(n).padStart(2, '0');

export function SkillPlan({ status }: { status: PlanStatus }) {
  return (
    <ol className="pl-stages">
      {status.stages.map((st, i) => (
        <Stage key={st.stage.id} st={st} n={i + 1} />
      ))}
    </ol>
  );
}

function Stage({ st, n }: { st: StageStatus; n: number }) {
  const { stage } = st;
  return (
    <li className="pl-stage" id={stage.id} data-state={st.state} aria-labelledby={`${stage.id}-h`}>
      <div className="pl-rail" aria-hidden>
        {st.state === 'done' ? (
          <span className="pl-mark pl-mark--done">
            <Check size={16} strokeWidth={3} />
          </span>
        ) : st.state === 'current' ? (
          <Ring pct={st.core ? st.coreDone / st.core : 0} size={38} stroke={3}>
            <span className="pl-mark-n mono">{pad(n)}</span>
          </Ring>
        ) : (
          <span className="pl-mark">
            <span className="pl-mark-n mono">{pad(n)}</span>
          </span>
        )}
      </div>

      <div className="pl-body">
        <header className="pl-stage-head">
          <span className="pl-stage-kicker mono">
            Stage {pad(n)}
            {st.state === 'current' && <span className="pl-now">You are here</span>}
            {st.state === 'done' && <span className="pl-done-tag">Done</span>}
          </span>
          <h2 id={`${stage.id}-h`}>{stage.title}</h2>
          <p className="pl-goal">{stage.goal}</p>
          <span className="pl-stage-meta mono">
            {st.coreDone} of {st.core} core skills · about {stage.time}
          </span>
        </header>

        <ul className="pl-grid">
          {st.skills.map((s) => (
            <li key={s.skill.id}>
              <SkillTile s={s} />
            </li>
          ))}
        </ul>

        <p className="pl-build">
          <Hammer size={15} aria-hidden />
          <span>
            <strong>Prove it:</strong> {stage.build}
          </span>
        </p>
      </div>
    </li>
  );
}

function SkillTile({ s }: { s: SkillStatus }) {
  const { skill } = s;
  const Glyph = skill.glyph;
  const book = skill.notebook ? getNotebook(skill.notebook) : undefined;
  const topics = skill.tool ? topicCount(skill.tool) : 0;
  const course = COURSES[0];
  const next = s.nextLesson;
  const warm = () => next && course && prefetchLessonPage(course, next.meta.id);
  const checkLabel = s.byLessons
    ? `${skill.name}: done — you finished its lessons`
    : s.known
      ? `${skill.name}: marked as known. Click to undo.`
      : `Mark ${skill.name} as known`;

  return (
    <article className="pl-skill" data-level={skill.level} data-done={s.done || undefined}>
      <div className="pl-skill-top">
        <span className="pl-skill-ico" aria-hidden>
          {skill.icon ? <SkillIcon name={skill.icon} size={28} /> : Glyph ? <Glyph size={20} strokeWidth={2.1} /> : null}
        </span>
        <span className="pl-skill-title">
          <h3 className="pl-skill-name">{skill.name}</h3>
          <span className="pl-skill-level">{skill.level === 'core' ? 'Core' : 'Good to know'}</span>
        </span>
        <button
          type="button"
          className="pl-check"
          aria-pressed={s.done}
          aria-label={checkLabel}
          title={checkLabel}
          disabled={s.byLessons}
          onClick={() => toggleKnown(skill.id)}
        >
          <Check size={14} strokeWidth={3} />
        </button>
      </div>

      <p className="pl-skill-what">{skill.what}</p>

      {(next || book || skill.sheet || topics > 0) && (
        <div className="pl-links">
          {next && (
            <Link
              to={lessonHref(next)}
              className="pl-link pl-link--lesson"
              title={s.lessons.map((l) => `${l.done ? '✓' : '·'} ${l.meta.title}`).join('\n')}
              onMouseEnter={warm}
              onFocus={warm}
            >
              <PlayCircle size={13} aria-hidden />
              {s.lessons.length === 1 ? 'Lesson' : `${s.lessonsDone}/${s.lessons.length} lessons`}
              {s.lessons.length === 1 && s.lessonsDone === 1 && <Check size={12} strokeWidth={3} className="pl-link-tick" aria-label="done" />}
            </Link>
          )}
          {book && (
            <Link to={`/notebooks/${book.id}`} className="pl-link">
              <NotebookPen size={13} aria-hidden />
              Notebook
            </Link>
          )}
          {skill.sheet && (
            <Link to={`/techpack#tp-${skill.sheet}`} className="pl-link">
              <Code2 size={13} aria-hidden />
              Cheatsheet
            </Link>
          )}
          {skill.tool && topics > 0 && (
            <Link to={toolHref(skill.tool)} className="pl-link">
              <ListTree size={13} aria-hidden />
              {topics} topics
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
