import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, Clock, Gauge, Keyboard, Pause, Play, RotateCcw, Search, Target, X } from 'lucide-react';
import { Stage } from '@/engine/Stage';
import { frameOf } from '@/engine/geometry';
import { defaultValues, stepScene, stepScenes } from '@/engine/sandbox';
import type { ControlValue, MetricValue, Values } from '@/engine/types';
import { SandboxPanel } from './SandboxPanel';
import { PracticePanel } from './PracticePanel';
import { TutorPanel } from './TutorPanel';
import type { Course, Lesson, Step } from '@/engine/types';
import { findEntry, nextReady, prefetchLesson } from '@/content/registry';
import { lessonKey, recordStep, useProgress } from '@/lib/progress';
import { usePrefersReducedMotion, useMediaQuery } from '@/lib/media';
import { ThemeToggle } from '@/site/ThemeToggle';
import { useSearch } from '@/site/Search';
import { GlossaryProvider, Rich } from './RichText';
import { Glide } from '@/site/ui';
import { Callout, Changes, Check as CheckBlock, CodeBlock, Legend, Metrics } from './parts';
import './player.css';

const BEAT_LABEL: Record<Step['beat'], string> = {
  setup: 'Setup',
  problem: 'Problem',
  solution: 'Solution',
  technique: 'Technique',
  tradeoff: 'Trade-off',
  insight: 'Insight',
  try: 'Try it',
  recap: 'Recap',
};
const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
const SPEEDS = [0.5, 1, 2];

export function LessonPlayer({ course, lesson }: { course: Course; lesson: Lesson }) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const total = lesson.steps.length;
  const raw = Number(params.get('s') ?? 0);
  const s = Number.isFinite(raw) ? Math.max(0, Math.min(total, Math.round(raw))) : 0;
  const reduced = usePrefersReducedMotion();
  const wide = useMediaQuery('(min-width: 960px)');
  const [playing, setPlaying] = useState(!reduced);
  const [speed, setSpeed] = useState(1);
  const [help, setHelp] = useState(false);
  const narrRef = useRef<HTMLDivElement>(null);
  const progress = useProgress();
  const { open: openSearch } = useSearch();
  const saved = progress.lessons[lessonKey(course.id, lesson.id)];
  const entry = findEntry(course, lesson.id)!;
  const next = nextReady(course, lesson.id);
  const partLessons = entry.part.lessons;
  const idxInPart = partLessons.findIndex((l) => l.id === lesson.id) + 1;

  const step = s > 0 ? lesson.steps[s - 1] : null;
  const sceneStep = lesson.steps[Math.max(0, s - 1)];
  const prevStep = s > 1 ? lesson.steps[s - 2] : undefined;

  // Sandbox steps: the learner's values per step (kept when moving between steps).
  const [sbValues, setSbValues] = useState<Record<number, Values>>({});
  const sandbox = step?.sandbox;
  const values = useMemo(() => (sandbox ? (sbValues[s] ?? defaultValues(sandbox)) : undefined), [sandbox, sbValues, s]);
  const sbResult = useMemo(() => (sandbox && values ? sandbox.compute(values) : undefined), [sandbox, values]);
  // Metric deltas compare with the previous setting (or the previous step on arrival).
  const lastMetrics = useRef<{ s: number; m?: Record<string, MetricValue> }>();
  // Read the ref only when the shown result changes, so unrelated re-renders (pause, help) keep the deltas.
  const prevMetrics = useMemo(
    () => (sbResult && lastMetrics.current?.s === s ? lastMetrics.current.m : prevStep?.metrics),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sbResult, s],
  );
  useEffect(() => {
    lastMetrics.current = { s, m: sbResult?.metrics ?? step?.metrics };
  }, [s, sbResult, step]);
  const setValue = (id: string, v: ControlValue) => setSbValues((all) => ({ ...all, [s]: { ...(all[s] ?? defaultValues(sandbox!)), [id]: v } }));
  const resetValues = () => setSbValues(({ [s]: _drop, ...rest }) => rest);

  const go = useCallback(
    (n: number) => {
      const c = Math.max(0, Math.min(total, n));
      setParams(c === 0 ? {} : { s: String(c) }, { replace: true });
    },
    [setParams, total],
  );

  useEffect(() => {
    setPlaying(!reduced);
  }, [reduced]);

  useEffect(() => {
    if (s > 0) recordStep(course.id, lesson.id, s, total);
    narrRef.current?.scrollTo({ top: 0 });
    if (!wide) window.scrollTo({ top: 0 });
  }, [s, course.id, lesson.id, total, wide]);

  useEffect(() => {
    document.title = `${lesson.title} · ${course.short} — Unpacked`;
  }, [lesson.title, course.short]);

  // Nearly done: fetch the next lesson in the background so "Next lesson" opens instantly.
  useEffect(() => {
    if (next && s >= total - 1) prefetchLesson(course, next.stub.id);
  }, [s, total, next, course]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable]')) return;
      const onButton = t.closest('button, a');
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          go(s + 1);
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          go(s - 1);
          break;
        case 'Home':
          go(0);
          break;
        case 'End':
          go(total);
          break;
        case 'Enter':
          if (s === 0 && !onButton) go(1);
          break;
        case ' ':
          if (onButton) return;
          e.preventDefault();
          setPlaying((p) => !p);
          break;
        case '?':
          setHelp((h) => !h);
          break;
        case 'Escape':
          if (help) setHelp(false);
          else navigate(`/${course.id}`);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, s, total, help, navigate, course.id]);

  const stage = lesson.stage ?? { w: 1000, h: 600 };
  const view = useMemo(() => frameOf(lesson.steps.flatMap(stepScenes)), [lesson]);
  const finished = s === total;

  return (
    <GlossaryProvider glossary={course.glossary}>
      <div className="player" data-cover={s === 0 || undefined}>
        <header className="pbar">
          <Link to={`/${course.id}`} className="pbar-back" aria-label={`Back to ${course.short}`}>
            <ChevronLeft size={18} />
          </Link>
          <div className="pbar-title">
            <span className="pbar-crumb">
              {entry.part.num} · {entry.part.title}
            </span>
            <span className="pbar-lesson">{lesson.title}</span>
          </div>
          <Segments lesson={lesson} s={s} go={go} />
          <div className="pbar-tools">
            <button className="btn btn--ghost btn--icon" onClick={openSearch} aria-label="Search" title="Search (/ or ⌘K)">
              <Search size={17} />
            </button>
            <button className="btn btn--ghost btn--icon" onClick={() => setHelp(true)} aria-label="Keyboard shortcuts" title="Shortcuts (?)">
              <Keyboard size={17} />
            </button>
            <ThemeToggle />
          </div>
        </header>

        <div className="pmain">
          <section className="narr" ref={narrRef} aria-live="polite">
            {step ? (
              <article className="narr-step" key={s} data-beat={step.beat}>
                <div className="narr-meta">
                  <span className="beat-tag">{BEAT_LABEL[step.beat]}</span>
                  <span className="narr-count">
                    Step {s} <span>of {total}</span>
                  </span>
                </div>
                <h1 className="narr-title display">{step.title}</h1>
                <div className="narr-body">
                  {step.body.map((p, i) => (
                    <p key={i}>
                      <Rich text={p} />
                    </p>
                  ))}
                </div>
                {sandbox && values && sbResult && (
                  <SandboxPanel sandbox={sandbox} values={values} result={sbResult} onChange={setValue} onReset={resetValues} changed={!!sbValues[s]} />
                )}
                {step.practice && <PracticePanel step={step.practice} stepKey={s} />}
                {step.callout && <Callout c={step.callout} />}
                {step.code && <CodeBlock c={step.code} />}
                {step.changes && <Changes lines={step.changes} />}
                {step.check && <CheckBlock c={step.check} key={`check-${s}`} />}
                <TutorPanel
                  lessonTitle={lesson.title}
                  stepTitle={step.title}
                  stepBody={step.body.join(' ')}
                  code={step.code?.code}
                  lessonId={lesson.id}
                  courseId={course.id}
                  stepKey={s}
                />
                {finished && <Finish course={course} next={next} />}
              </article>
            ) : (
              <Cover lesson={lesson} part={`${entry.part.num} · ${entry.part.title}`} pos={`Lesson ${idxInPart} of ${partLessons.length}`} saved={saved} go={go} />
            )}
          </section>

          <section className="pstage" aria-label="Diagram">
            <div className="pstage-top">
              <Legend lesson={lesson} />
              <div className="pstage-ctl">
                <button className="btn btn--sm" onClick={() => setPlaying((p) => !p)} aria-pressed={playing} title="Play / pause traffic (Space)">
                  {playing ? <Pause size={14} /> : <Play size={14} />}
                  <span>{playing ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  className="btn btn--sm btn--ghost"
                  onClick={() => setSpeed((v) => SPEEDS[(SPEEDS.indexOf(v) + 1) % SPEEDS.length])}
                  title="Traffic speed"
                  aria-label={`Speed ${speed}×`}
                >
                  <Gauge size={14} />
                  <span className="mono">{speed}×</span>
                </button>
              </div>
            </div>
            <div className="pstage-canvas" data-dim={s === 0 || undefined}>
              <Stage
                scene={sbResult?.scene ?? stepScene(sceneStep)}
                w={stage.w}
                h={stage.h}
                playing={playing}
                speed={speed}
                stepKey={s}
                instant={reduced}
                minScale={wide ? 0 : 0.5}
                view={view}
                label={step ? `${step.title}. Diagram.` : lesson.title}
              />
              {!wide && <span className="pan-hint">Swipe the diagram to pan</span>}
            </div>
            {step && <Metrics lesson={lesson} values={sbResult?.metrics ?? step.metrics} prev={prevMetrics} />}
          </section>
        </div>

        <nav className="pnav" aria-label="Step navigation">
          <button className="btn" onClick={() => go(s - 1)} disabled={s === 0} aria-label="Previous step">
            <ArrowLeft size={16} />
            <span className="pnav-label">Back</span>
          </button>
          <div className="pnav-mid">
            {step && (
              <span className="pnav-short">
                {s}/{total} · {step.short}
              </span>
            )}
          </div>
          {s === 0 ? (
            <button className="btn btn--primary" onClick={() => go(saved && !saved.done && saved.step > 0 ? saved.step : 1)}>
              <span>{saved && !saved.done && saved.step > 0 ? 'Resume' : 'Start'}</span>
              <ArrowRight size={16} />
            </button>
          ) : finished ? (
            next ? (
              <Link className="btn btn--primary" to={`/${course.id}/${next.stub.id}`}>
                <span className="pnav-label">Next lesson</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link className="btn btn--primary" to={`/${course.id}`}>
                <span>Course map</span>
                <ArrowRight size={16} />
              </Link>
            )
          ) : (
            <button className="btn btn--primary" onClick={() => go(s + 1)} aria-label="Next step">
              <span className="pnav-label">
                Next<span className="pnav-next">: {lesson.steps[s].short}</span>
              </span>
              <ArrowRight size={16} />
            </button>
          )}
        </nav>

        {help && <Shortcuts close={() => setHelp(false)} />}
      </div>
    </GlossaryProvider>
  );
}

function Segments({ lesson, s, go }: { lesson: Lesson; s: number; go: (n: number) => void }) {
  return (
    <ol className="segs" aria-label="Steps">
      {lesson.steps.map((st, i) => (
        <li key={i}>
          <button
            className="seg"
            data-beat={st.beat}
            data-state={i + 1 < s ? 'done' : i + 1 === s ? 'current' : undefined}
            onClick={() => go(i + 1)}
            aria-label={`Step ${i + 1}: ${st.short}`}
            aria-current={i + 1 === s ? 'step' : undefined}
          >
            {/* the "you are here" marker glides along the bar as you step */}
            {i + 1 === s && <Glide id="seg-cursor" className="seg-cursor" />}
            <span className="seg-tip">
              {i + 1} · {st.short}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function Cover({
  lesson,
  part,
  pos,
  saved,
  go,
}: {
  lesson: Lesson;
  part: string;
  pos: string;
  saved?: { step: number; done: boolean };
  go: (n: number) => void;
}) {
  const resume = saved && !saved.done && saved.step > 0 ? saved.step : 0;
  return (
    <article className="cover">
      <span className="eyebrow">
        {part} · {pos}
      </span>
      <h1 className="cover-title display">{lesson.title}</h1>
      <p className="cover-summary">{lesson.summary}</p>
      <div className="cover-pills">
        <span className="pill">
          <Clock size={13} /> {lesson.minutes} min
        </span>
        <span className="pill">{LEVEL_LABEL[lesson.level]}</span>
        <span className="pill">{lesson.steps.length} steps</span>
        {saved?.done && (
          <span className="pill" data-tone="ok">
            <Check size={13} /> Completed
          </span>
        )}
      </div>
      <div className="cover-goals">
        <span className="eyebrow">
          <Target size={13} /> What you’ll learn
        </span>
        <ul>
          {lesson.goals.map((g) => (
            <li key={g.step}>
              <button onClick={() => go(g.step)}>
                <span className="cover-goal-n mono">{String(g.step).padStart(2, '0')}</span>
                <span>{g.text}</span>
                <ArrowRight size={14} className="cover-goal-go" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="cover-cta">
        {resume ? (
          <>
            <button className="btn btn--primary btn--lg" onClick={() => go(resume)}>
              Continue at step {resume}: {lesson.steps[resume - 1].short}
              <ArrowRight size={16} />
            </button>
            <button className="btn btn--lg" onClick={() => go(1)}>
              <RotateCcw size={15} /> Start over
            </button>
          </>
        ) : (
          <button className="btn btn--primary btn--lg" onClick={() => go(1)}>
            Start the lesson <ArrowRight size={16} />
          </button>
        )}
      </div>
      <p className="cover-hint muted">
        Tip: use <kbd>←</kbd> <kbd>→</kbd> to step and <kbd>Space</kbd> to pause the traffic.
      </p>
    </article>
  );
}

function Finish({ course, next }: { course: Course; next?: ReturnType<typeof nextReady> }) {
  return (
    <div className="finish">
      <div className="finish-badge">
        <Check size={18} strokeWidth={2.6} />
      </div>
      <div>
        <strong>Lesson complete</strong>
        <p className="muted">Your progress is saved in this browser.</p>
      </div>
      {next ? (
        <Link className="finish-next" to={`/${course.id}/${next.stub.id}`}>
          <span className="eyebrow">Up next · {next.part.title}</span>
          <span className="finish-next-title">{next.meta!.title}</span>
          <span className="muted">{next.meta!.summary}</span>
          <ArrowRight size={18} className="finish-arrow" />
        </Link>
      ) : (
        <Link className="finish-next" to={`/${course.id}`}>
          <span className="eyebrow">That’s all for now</span>
          <span className="finish-next-title">Back to the course map</span>
          <ArrowRight size={18} className="finish-arrow" />
        </Link>
      )}
    </div>
  );
}

function Shortcuts({ close }: { close: () => void }) {
  const rows = useMemo(
    () => [
      [['→'], 'Next step'],
      [['←'], 'Previous step'],
      [['Space'], 'Play / pause traffic'],
      [['Home', 'End'], 'First / last step'],
      [['/'], 'Search lessons and terms'],
      [['?'], 'Show this panel'],
      [['Esc'], 'Back to the course'],
    ] as const,
    [],
  );
  return (
    <div className="modal-wrap" onClick={close}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong>Keyboard shortcuts</strong>
          <button className="btn btn--ghost btn--icon" onClick={close} aria-label="Close" autoFocus>
            <X size={16} />
          </button>
        </div>
        <dl className="shortcuts">
          {rows.map(([keys, what]) => (
            <div key={what}>
              <dt>{keys.map((k) => <kbd key={k}>{k}</kbd>)}</dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
