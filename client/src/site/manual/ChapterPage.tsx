/**
 * /manual/:chapterId — one chapter of the Manual, in the order every chapter follows
 * (docs/VISION.md §3): the question → the idea without a stack → see it move → ways to solve it →
 * the modern way → build it → break it → prove it → go deeper → look it up → next questions.
 *
 * A written chapter (content/manual/written/<id>.ts) fills every section. One that isn't written
 * yet still assembles what the site already has (lessons, errors, the gate, cheat sheets…) and
 * says plainly that the rest is being written.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Eye,
  Hammer,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  NotebookPen,
  PenLine,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import {
  CHAPTERS,
  chapterLessons,
  chapterNotebooks,
  chapterNum,
  getChapter,
  getPart,
  useWriting,
  type BreakIt,
  type Chapter,
  type ChapterWriting,
  type Predict,
  type StepRef,
} from '@/content/manual';
import { COURSES } from '@/content/registry';
import { COMMON_ERRORS } from '@/content/courses/mern/commonErrors';
import { CAPSTONE_MILESTONES } from '@/content/courses/mern/capstone';
import { GlossaryProvider, Rich } from '@/player/RichText';
import { CodeLines } from '@/lib/highlight';
import { gateKey, useGates, useProgress, useSettings } from '@/lib/progress';
import { MENTOR_NAME, openMentorWith, useMentorPage } from '@/lib/mentor';
import { toast } from '@/lib/toast';
import { TECH_SHEETS } from '../techpack/data';
import { TOOL_INDEX, toolHref } from '../skillpack/lookup';
import { SkillIcon } from '../skillpack/icons';
import { LessonCard } from '../CoursePage';
import { NotFound } from '../NotFound';
import { Ring } from '../ui';
import { chapterHref, chapterProgress, chapterStatus, chapterTone, StatusPill } from './shared';
import { BuildTrail } from '../doors/BuildTrail';
import { ShipProof } from '../doors/ShipProof';
import '../doors/levels.css';
import '../topic.css';
import './manual.css';

const course = COURSES[0];
const lessonTitle = (id: string) => course?.lessons[id]?.title;
const stepHref = ([lesson, step]: StepRef) => `/${course?.id ?? 'mern'}/${lesson}?s=${step}`;

export function ChapterPage() {
  const { chapterId } = useParams();
  const ch = getChapter(chapterId);
  if (!ch) return <NotFound />;
  if (ch.href) return <Navigate to={ch.href} replace />;
  return <ChapterView key={ch.id} ch={ch} />;
}

interface Sec {
  id: string;
  label: string;
  node: ReactNode;
}

function ChapterView({ ch }: { ch: Chapter }) {
  const state = useWriting(ch.id);
  const w = state.status === 'ready' ? state.writing : undefined;
  const progress = useProgress();
  const gates = useGates();
  const settings = useSettings();
  const ai = !settings.noAiMode;

  const tone = chapterTone(ch);
  const part = getPart(ch.part);
  const num = chapterNum(ch.id);
  const prog = chapterProgress(ch, progress);
  const idx = CHAPTERS.indexOf(ch);
  const prev = CHAPTERS[idx - 1];
  const next = CHAPTERS[idx + 1];

  useEffect(() => {
    document.title = `${ch.title} — The Manual · Unpacked`;
  }, [ch]);
  useMentorPage({ kind: 'manual chapter', title: `The Manual, chapter ${num}: ${ch.title} (${ch.short})`, stepTitle: ch.question, stepBody: ch.covers });

  const lessons = chapterLessons(ch);
  const notebooks = chapterNotebooks(ch);
  const errors = COMMON_ERRORS.filter((e) => ch.lessons?.includes(e.lessonId));
  const sheets = TECH_SHEETS.filter((s) => ch.sheets?.includes(s.id));
  const tools = (ch.tools ?? []).flatMap((id) => {
    const t = TOOL_INDEX.get(id)?.tool;
    return t ? [t] : [];
  });
  const milestones = CAPSTONE_MILESTONES.filter((m) => ch.milestones?.includes(m.id));
  const gatePart = course?.parts.find((p) => p.id === ch.gate);
  const gate = course && gatePart ? gates[gateKey(course.id, gatePart.id)] : undefined;

  const sections: Sec[] = [];
  sections.push({ id: 'question', label: 'The question', node: <QuestionSec ch={ch} w={w} ai={ai} loading={state.status === 'loading'} /> });
  if (w) sections.push({ id: 'idea', label: 'The idea', node: <IdeaSec w={w} /> });
  if (lessons.length)
    sections.push({
      id: 'how',
      label: 'See it move',
      node: (
        <>
          <p className="mn-lede">
            {lessons.length === 1 ? 'One visual lesson' : `${lessons.length} visual lessons`} — watch the idea move, step by step, with the real code beside it.
            {prog.done > 0 && ` You’ve finished ${prog.done} of ${prog.ready}.`}
          </p>
          <ol className="syl-list mn-lessons">
            {lessons.map((e, i) => (
              <li key={e.stub.id}>
                <LessonCard course={course!} e={e} n={i + 1} />
                {w?.lessonNotes?.[e.stub.id] && (
                  <p className="mn-lnote">
                    <Rich text={w.lessonNotes[e.stub.id]} />
                  </p>
                )}
              </li>
            ))}
          </ol>
        </>
      ),
    });
  if (w) sections.push({ id: 'options', label: 'Ways to solve it', node: <OptionsSec w={w} /> });
  if (w) sections.push({ id: 'modern', label: 'The modern way', node: <ModernSec w={w} /> });
  if (w) sections.push({ id: 'build', label: 'Build it', node: <BuildSec ch={ch} w={w} /> });
  if (w?.breakIt.length || errors.length)
    sections.push({
      id: 'break',
      label: 'Break it',
      node: (
        <>
          {w && w.breakIt.length > 0 && (
            <>
              <p className="mn-lede">Each snippet below runs, and each one is wrong. Find the problem before you reveal it — this is exactly the code an AI assistant (or a tired you) will hand you.</p>
              <div className="mn-breaks">
                {w.breakIt.map((b, i) => (
                  <BreakCard key={b.title} b={b} n={i + 1} />
                ))}
              </div>
            </>
          )}
          {errors.length > 0 && (
            <div className="mn-errors">
              <h3 className="mn-h3">
                <AlertTriangle size={15} /> Errors you will meet here
              </h3>
              <ul>
                {errors.map((e) => (
                  <li key={e.id}>
                    <Link to={`/${course?.id}/${e.lessonId}?s=${e.step}`} className="mn-error">
                      <code>{e.error.length > 110 ? `${e.error.slice(0, 109)}…` : e.error}</code>
                      <span>{e.meaning}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ),
    });
  if (w?.explain.length || gatePart || milestones.length)
    sections.push({
      id: 'prove',
      label: 'Prove it',
      node: (
        <div className="mn-prove">
          {w && w.explain.length > 0 && (
            <div className="mn-explain card">
              <h3 className="mn-h3">
                <MessageSquareText size={15} /> Explain it back
              </h3>
              <p className="mn-small">If you can explain it simply, you understand it. Try each one out loud before you check.</p>
              <ul>
                {w.explain.map((q) => (
                  <li key={q}>
                    <span>
                      <Rich text={q} />
                    </span>
                    {ai ? (
                      <button className="btn btn--sm" onClick={() => openMentorWith(`Explain-back — ${ch.title}: ${q.replace(/\*/g, '')}\nMy answer: `)}>
                        <Bot size={14} /> Explain to {MENTOR_NAME}
                      </button>
                    ) : (
                      <Link className="btn btn--sm" to="/handnote">
                        <PenLine size={14} /> Write it down
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {gatePart && course && (
            <Link to={`/${course.id}/gate/${gatePart.id}`} className="mn-gate card" data-state={gate?.passed ? 'passed' : gate ? 'tried' : 'new'}>
              <span className="mn-gate-ico">{gate?.passed ? <Check size={18} strokeWidth={3} /> : <ShieldCheck size={18} />}</span>
              <span className="mn-gate-text">
                <strong>{gatePart.title} gate</strong>
                <span>{gate?.passed ? `Passed · best ${Math.round(gate.bestScore)}%` : gate ? `Best so far ${Math.round(gate.bestScore)}% — try again` : 'A few questions and a small coding task'}</span>
              </span>
              <ArrowRight size={16} className="mn-go" />
            </Link>
          )}
          {milestones.map((m) => (
            <Link key={m.id} to={`/capstone/${m.id}`} className="mn-gate card" data-state="milestone">
              <span className="mn-gate-ico">
                <Trophy size={17} />
              </span>
              <span className="mn-gate-text">
                <strong>
                  Use it for real: TaskFlow milestone {m.num}
                </strong>
                <span>{m.title}</span>
              </span>
              <ArrowRight size={16} className="mn-go" />
            </Link>
          ))}
        </div>
      ),
    });
  if (w?.deeper.length)
    sections.push({
      id: 'deeper',
      label: 'Go deeper',
      node: (
        <>
          <p className="mn-lede">Questions worth chasing once the basics click. Open one when you’re curious.</p>
          <div className="mn-deeper">
            {w.deeper.map((d) => (
              <details key={d.q} className="mn-deep">
                <summary>
                  <ChevronRight size={16} className="mn-deep-chev" />
                  <Rich text={d.q} />
                </summary>
                <p>
                  <Rich text={d.a} />
                </p>
              </details>
            ))}
          </div>
        </>
      ),
    });
  if (sheets.length || notebooks.length || tools.length)
    sections.push({
      id: 'lookup',
      label: 'Look it up',
      node: (
        <div className="mn-lookup">
          {sheets.map((s) => (
            <Link key={s.id} to={`/techpack#tp-${s.id}`} className="mn-ref card">
              <span className="mn-ref-ico">
                <Code2 size={16} />
              </span>
              <span className="mn-ref-text">
                <strong>{s.name} cheat sheet</strong>
                <span>{s.tagline}</span>
              </span>
            </Link>
          ))}
          {notebooks.map((b) => (
            <Link key={b.id} to={`/notebooks/${b.id}`} className="mn-ref card">
              <span className="mn-ref-ico">
                <NotebookPen size={16} />
              </span>
              <span className="mn-ref-text">
                <strong>{b.name ?? b.title} notebook</strong>
                <span>{b.tagline}</span>
              </span>
            </Link>
          ))}
          {tools.length > 0 && (
            <div className="mn-tools">
              <span className="mn-small">Technologies for this, with their full topic lists:</span>
              <div className="mn-tool-row">
                {tools.map((t) => (
                  <Link key={t.id} to={toolHref(t.id)} className="mn-tool">
                    <SkillIcon name={t.icon} size={18} />
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    });
  sections.push({
    id: 'next',
    label: 'Next',
    node: <NextSec w={w} next={next} />,
  });

  const active = useActiveSection(sections.map((s) => s.id));
  const glossary = course?.glossary ?? {};

  return (
    <GlossaryProvider glossary={glossary}>
      <main className="mn mn-ch" data-tone={tone}>
        <div className="wrap">
          <nav className="mn-crumbs" aria-label="Breadcrumb">
            <Link to="/manual">The Manual</Link>
            <ChevronRight size={13} />
            <Link to={`/manual#part-${part.id}`}>
              Part {part.num} · {part.title}
            </Link>
          </nav>

          <header className="mn-ch-head">
            <span className="mn-ch-glyph" aria-hidden>
              <ch.glyph size={26} strokeWidth={1.9} />
            </span>
            <div className="mn-ch-head-text">
              <span className="eyebrow">
                Chapter {num} · {ch.short}
              </span>
              <h1 className="page-title">{ch.title}</h1>
              <p className="page-lede">{ch.covers}</p>
              <div className="mn-ch-facts">
                <StatusPill c={ch} />
                {prog.ready > 0 && (
                  <span className="mn-fact">
                    <Ring pct={prog.pct} size={18} stroke={2.4} />
                    {prog.done}/{prog.ready} lessons
                  </span>
                )}
                {gatePart && course && gate?.passed && prog.done < prog.ready && (
                  <span className="mn-fact mn-tested" title={`You passed the ${gatePart.title} gate`}>
                    <Check size={13} strokeWidth={3} /> Tested out
                  </span>
                )}
                {gatePart && course && !gate?.passed && prog.ready > 0 && prog.done < prog.ready && (
                  <Link className="mn-fact mn-testout" to={`/${course.id}/gate/${gatePart.id}`}>
                    Know it already? Test out with the {gatePart.title} gate
                  </Link>
                )}
                {w && !w.reviewed && (
                  <span className="mn-fact mn-draft" title="Drafted with AI; the author's review is still to come">
                    Draft — author review pending
                  </span>
                )}
              </div>
            </div>
          </header>
          {/* when this chapter is one the learner's build needs: where it sits, and what comes next */}
          <BuildTrail chapterId={ch.id} />

          <div className="mn-ch-body">
            <aside className="mn-toc" aria-label="In this chapter">
              <span className="mn-toc-h">In this chapter</span>
              <ol>
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#s-${s.id}`} aria-current={active === s.id ? 'location' : undefined}>
                      <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                      {s.label}
                    </a>
                  </li>
                ))}
              </ol>
            </aside>

            <div className="mn-ch-main">
              {sections.map((s, i) => (
                <section key={s.id} id={`s-${s.id}`} className="mn-sec" data-sec={s.id}>
                  <header className="mn-sec-head">
                    <span className="mn-sec-k mono">{String(i + 1).padStart(2, '0')}</span>
                    <h2>{SEC_TITLE[s.id] ?? s.label}</h2>
                  </header>
                  {s.node}
                </section>
              ))}

              <nav className="mn-pager" aria-label="Chapters">
                {prev ? (
                  <Link to={chapterHref(prev)} className="mn-pager-a" data-dir="prev">
                    <ArrowLeft size={16} />
                    <span>
                      <span className="mn-small">Chapter {chapterNum(prev.id)}</span>
                      <strong>{prev.title}</strong>
                    </span>
                  </Link>
                ) : (
                  <span />
                )}
                {next && (
                  <Link to={chapterHref(next)} className="mn-pager-a" data-dir="next">
                    <span>
                      <span className="mn-small">Chapter {chapterNum(next.id)}</span>
                      <strong>{next.title}</strong>
                    </span>
                    <ArrowRight size={16} />
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </div>
      </main>
    </GlossaryProvider>
  );
}

const SEC_TITLE: Record<string, string> = {
  question: 'The question',
  idea: 'The idea, without a stack',
  how: 'See it move',
  options: 'Ways to solve it',
  modern: 'The modern way',
  build: 'Build it',
  break: 'Break it',
  prove: 'Prove it, keep it',
  deeper: 'Go deeper',
  lookup: 'Look it up',
  next: 'Next questions',
};

/** The section currently at the top of the screen, for the chapter index. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join(',');
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(`s-${id}`)).filter((el): el is HTMLElement => !!el);
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.id.slice(2);
          if (e.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        const first = ids.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      { rootMargin: '-15% 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return active;
}

/* ================= sections ================= */

function QuestionSec({ ch, w, ai, loading }: { ch: Chapter; w?: ChapterWriting; ai: boolean; loading: boolean }) {
  return (
    <>
      <blockquote className="mn-question">
        <Sparkles size={18} aria-hidden />
        <p>{ch.question}</p>
      </blockquote>
      {w ? (
        <>
          <div className="mn-story">
            {w.hook.story.map((p) => (
              <p key={p}>
                <Rich text={p} />
              </p>
            ))}
          </div>
          <PredictCard p={w.hook.predict} />
        </>
      ) : loading ? (
        <p className="mn-lede">Loading the chapter…</p>
      ) : (
        <div className="mn-unwritten card">
          <strong>This chapter is being written.</strong>
          <p>
            {chapterLessons(ch).length
              ? 'Its visual lessons are ready below. The rest — the idea without a stack, the ways to solve it, the modern way, a build and a break-it — is on its way.'
              : 'It will cover: ' + ch.covers.charAt(0).toLowerCase() + ch.covers.slice(1)}
          </p>
          {ai && (
            <button className="btn btn--sm" onClick={() => openMentorWith(ch.question)}>
              <Bot size={14} /> Ask {MENTOR_NAME} this question now
            </button>
          )}
        </div>
      )}
    </>
  );
}

function PredictCard({ p }: { p: Predict }) {
  // null: not answered · -1: "just show me" · otherwise the option picked
  const [pick, setPick] = useState<number | null>(null);
  const shown = pick !== null;
  const state = (i: number) => (!shown ? undefined : i === p.answer ? 'right' : i === pick ? 'wrong' : 'dim');
  return (
    <div className="mn-predict card">
      <span className="mn-predict-k">
        <Eye size={14} /> Predict first
      </span>
      <p className="mn-predict-q">
        <Rich text={p.q} />
      </p>
      <ul className="mn-opts">
        {p.options.map((o, i) => (
          <li key={o}>
            <button className="mn-opt" data-state={state(i)} onClick={() => setPick(i)} disabled={shown} aria-pressed={pick === i}>
              <span className="mn-opt-l mono">{String.fromCharCode(65 + i)}</span>
              <span className="mn-opt-t">
                <Rich text={o} />
              </span>
              {state(i) === 'right' && <Check size={16} strokeWidth={3} className="mn-opt-mark" />}
              {state(i) === 'wrong' && <X size={16} strokeWidth={3} className="mn-opt-mark" />}
            </button>
          </li>
        ))}
      </ul>
      {shown ? (
        <div className="mn-reveal" role="status">
          <strong>{pick === p.answer ? 'Yes. ' : pick === -1 ? '' : 'Not quite. '}</strong>
          <Rich text={p.reveal} />
        </div>
      ) : (
        <button className="tlink mn-skip" onClick={() => setPick(-1)}>
          Just show me the answer
        </button>
      )}
    </div>
  );
}

function IdeaSec({ w }: { w: ChapterWriting }) {
  return (
    <>
      <p className="mn-lede">
        <Rich text={w.idea.lede} />
      </p>
      {/* up to 4 cards in one row; 5 or 6 as rows of 3, so no card is left alone */}
      <ol className="mn-jobs" style={{ '--cols': w.idea.jobs.length <= 4 ? w.idea.jobs.length : 3 } as CSSProperties}>
        {w.idea.jobs.map((j, i) => (
          <li key={j.title} className="card">
            <span className="mn-job-n mono">{i + 1}</span>
            <h3>{j.title}</h3>
            <p>
              <Rich text={j.text} />
            </p>
          </li>
        ))}
      </ol>
      <aside className="mn-picture">
        <span className="mn-picture-k">
          <Lightbulb size={15} /> Picture it
        </span>
        <p>
          <Rich text={w.idea.picture} />
        </p>
      </aside>
    </>
  );
}

function OptionsSec({ w }: { w: ChapterWriting }) {
  return (
    <>
      <p className="mn-lede">
        <Rich text={w.options.lede} />
      </p>
      <div className="mn-options">
        {w.options.items.map((o) => (
          <article key={o.name} className="mn-option card">
            <h3>{o.name}</h3>
            <p>
              <Rich text={o.what} />
            </p>
            <dl>
              <div>
                <dt>Pick it when</dt>
                <dd>
                  <Rich text={o.pickWhen} />
                </dd>
              </div>
              <div>
                <dt>You give up</dt>
                <dd>
                  <Rich text={o.cost} />
                </dd>
              </div>
            </dl>
            {(o.examples || o.tools?.length) && (
              <footer>
                {o.examples && <span className="mn-examples">{o.examples}</span>}
                {o.tools?.map((id) => {
                  const t = TOOL_INDEX.get(id)?.tool;
                  return t ? (
                    <Link key={id} to={toolHref(id)} className="mn-tool mn-tool--sm">
                      <SkillIcon name={t.icon} size={14} />
                      {t.name}
                    </Link>
                  ) : null;
                })}
              </footer>
            )}
          </article>
        ))}
      </div>
      <div className="mn-choose card">
        <h3 className="mn-h3">How to choose</h3>
        <table>
          <tbody>
            {w.options.choose.map((c) => (
              <tr key={c.when}>
                <th scope="row">
                  <Rich text={c.when} />
                </th>
                <td>
                  <Rich text={c.pick} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ModernSec({ w }: { w: ChapterWriting }) {
  return (
    <>
      <p className="mn-lede">
        <Rich text={w.modern.lede} />
      </p>
      <div className="mn-defaults card">
        <h3 className="mn-h3">
          <ListChecks size={15} /> Today’s defaults
        </h3>
        <ul>
          {w.modern.defaults.map((d) => (
            <li key={d}>
              <Check size={15} strokeWidth={2.6} />
              <span>
                <Rich text={d} />
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mn-ai">
        <div className="mn-ai-good card">
          <h3 className="mn-h3">
            <Bot size={15} /> Let AI do it
          </h3>
          <ul>
            {w.modern.aiGood.map((g) => (
              <li key={g}>
                <Rich text={g} />
              </li>
            ))}
          </ul>
        </div>
        <div className="mn-ai-wrong card">
          <h3 className="mn-h3">
            <AlertTriangle size={15} /> What AI gets wrong here — check every time
          </h3>
          <ul>
            {w.modern.aiWrong.map((m) => (
              <li key={m.mistake}>
                <span className="mn-mistake">
                  <Rich text={m.mistake} />
                </span>
                <span className="mn-fix">
                  <ArrowRight size={13} />
                  <span>
                    <Rich text={m.fix} />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function BuildSec({ ch, w }: { ch: Chapter; w: ChapterWriting }) {
  const [tab, setTab] = useState<'hand' | 'ai'>('hand');
  const b = w.build;
  return (
    <>
      <div className="mn-build-brief card">
        <span className="mn-build-k">
          <Hammer size={14} /> Mini build
        </span>
        <h3>{b.title}</h3>
        <p>
          <Rich text={b.brief} />
        </p>
      </div>
      <div className="seg-ctl mn-tabs" role="tablist" aria-label="How to build it">
        <button role="tab" aria-selected={tab === 'hand'} onClick={() => setTab('hand')}>
          <PenLine size={14} /> By hand, once
        </button>
        <button role="tab" aria-selected={tab === 'ai'} onClick={() => setTab('ai')}>
          <Bot size={14} /> With AI
        </button>
      </div>
      {tab === 'hand' ? (
        <ol className="mn-steps" role="tabpanel">
          {b.byHand.map((s, i) => (
            <li key={s.title}>
              <span className="mn-step-n mono">{i + 1}</span>
              <div>
                <strong>{s.title}</strong>
                <p>
                  <Rich text={s.text} />
                </p>
                {s.see && lessonTitle(s.see[0]) && (
                  <Link to={stepHref(s.see)} className="mn-see">
                    See it in “{lessonTitle(s.see[0])}”, step {s.see[1]} <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div role="tabpanel">
          <p className="mn-lede">
            <Rich text={b.withAI.lede} />
          </p>
          <PromptBox text={b.withAI.prompt} />
        </div>
      )}
      <VerifyList id={ch.id} items={b.verify} />
      {b.proof && <ShipProof id={ch.id} label={b.proof.label} hint={b.proof.hint} done={b.proof.done} />}
    </>
  );
}

function PromptBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        toast('Prompt copied');
        window.setTimeout(() => setCopied(false), 1800);
      },
      () => toast('Couldn’t copy — select the text instead', 'info'),
    );
  };
  return (
    <div className="mn-prompt">
      <header>
        <span>
          <Bot size={14} /> Your prompt
        </span>
        <button className="btn btn--sm" onClick={copy} data-done={copied || undefined}>
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </header>
      <pre>{text}</pre>
    </div>
  );
}

/** "Check it works": the learner's ticks are a per-browser convenience, so storage may fail quietly. */
function VerifyList({ id, items }: { id: string; items: string[] }) {
  const key = `unpacked:manual:verify:${id}`;
  const [done, setDone] = useState<Set<number>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(key) ?? '[]') as number[]);
    } catch {
      return new Set();
    }
  });
  const toggle = (i: number) =>
    setDone((prev) => {
      const s = new Set(prev);
      if (s.has(i)) s.delete(i);
      else s.add(i);
      try {
        localStorage.setItem(key, JSON.stringify([...s]));
      } catch {
        /* private mode: ticks last for this visit */
      }
      return s;
    });
  return (
    <div className="mn-verify card">
      <h3 className="mn-h3">
        <ShieldCheck size={15} /> Check it works — whoever wrote the code
        <span className="mn-verify-count mono">
          {done.size}/{items.length}
        </span>
      </h3>
      <ul>
        {items.map((v, i) => (
          <li key={v}>
            <label>
              <input type="checkbox" checked={done.has(i)} onChange={() => toggle(i)} />
              <span>
                <Rich text={v} />
              </span>
            </label>
          </li>
        ))}
      </ul>
      {done.size === items.length && <p className="mn-verify-done">Every check passes. That login would hold up in the real world.</p>}
    </div>
  );
}

function BreakCard({ b, n }: { b: BreakIt; n: number }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="mn-break card" data-open={open || undefined}>
      <header>
        <span className="mn-break-n mono">#{n}</span>
        <h3>{b.title}</h3>
      </header>
      <pre className="mn-code">
        <CodeLines code={b.code} lang={b.lang ?? 'js'} err={open ? b.err : undefined} numbers />
      </pre>
      {open ? (
        <div className="mn-reveal" role="status">
          <Rich text={b.answer} />
          {b.see && lessonTitle(b.see[0]) && (
            <Link to={stepHref(b.see)} className="mn-see">
              See it in “{lessonTitle(b.see[0])}”, step {b.see[1]} <ArrowRight size={12} />
            </Link>
          )}
        </div>
      ) : (
        <button className="btn btn--sm mn-break-btn" onClick={() => setOpen(true)}>
          <Eye size={14} /> What’s wrong here?
        </button>
      )}
    </article>
  );
}

function NextSec({ w, next }: { w?: ChapterWriting; next?: Chapter }) {
  const items = useMemo((): { q: string; ch: Chapter }[] => {
    if (w?.next.length)
      return w.next.flatMap((n) => {
        const ch = getChapter(n.chapter);
        return ch ? [{ q: n.q, ch }] : [];
      });
    return next ? [{ q: next.question, ch: next }] : [];
  }, [w, next]);
  if (!items.length) return <p className="mn-lede">You’ve reached the end of the Manual. Time to build something of your own.</p>;
  return (
    <>
      <p className="mn-lede">Every answer opens a new question. Pick the one you want answered next.</p>
      <div className="mn-nextq">
        {items.map(({ q, ch }) => (
          <Link key={q} to={chapterHref(ch)} className="mn-nextq-a card" data-tone={chapterTone(ch)}>
            <span className="mn-nextq-q">{q}</span>
            <span className="mn-nextq-ch">
              <ch.glyph size={14} /> Chapter {chapterNum(ch.id)} · {ch.title}
              <StatusDot ch={ch} />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}

function StatusDot({ ch }: { ch: Chapter }) {
  const s = chapterStatus(ch);
  return <i className="mn-dot" data-status={s} title={s === 'complete' ? 'Complete' : s === 'ready' ? 'Lessons ready' : 'Planned'} />;
}
