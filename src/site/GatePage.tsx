import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowRight, Check, X, AlertTriangle, Lock, Trophy, ListChecks, Code2, Target, ChevronLeft } from 'lucide-react';
import { getCourse } from '@/content/registry';
import { saveGateResult, skipGate, useGates, useProgress } from '@/lib/progress';
import type { PartGate, QuizQuestion } from '@/engine/types';
// The editor and code runner load only when a gate's coding task opens (not with every page).
const PracticePanel = lazy(() => import('@/player/PracticePanel').then((m) => ({ default: m.PracticePanel })));
import './gate.css';

/** Load the gate content lazily per part */
async function loadGate(courseId: string, partId: string): Promise<PartGate | null> {
  try {
    const mod = await import(`../content/courses/${courseId}/gates/${partId}.ts`);
    return mod.default ?? mod.gate ?? null;
  } catch {
    return null;
  }
}

const PASS_MARK = 0.7;

type GatePhase = 'intro' | 'quiz' | 'challenge' | 'result';

interface QuizState {
  answers: Record<string, number | number[]>;
  revealed: Set<string>;
}

export function GatePage() {
  const { courseId = 'mern', partId = '' } = useParams();
  const navigate = useNavigate();
  const course = getCourse(courseId);
  const gates = useGates();
  const progress = useProgress();
  const [gate, setGate] = useState<PartGate | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<GatePhase>('intro');
  const [qi, setQi] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>({ answers: {}, revealed: new Set() });
  const [score, setScore] = useState(0);
  /** The coding challenge: solved on its own (without opening the solution)? */
  const [challenge, setChallenge] = useState<{ solved: boolean; sawSolution: boolean } | null>(null);
  const onChallengeRun = useCallback((solved: boolean, sawSolution: boolean) => setChallenge({ solved, sawSolution }), []);

  const part = course?.parts.find((p) => p.id === partId);
  const gateState = gates[`${courseId}/${partId}`];

  useEffect(() => {
    if (courseId && partId) {
      loadGate(courseId, partId).then((g) => {
        setGate(g);
        setLoading(false);
      });
    }
  }, [courseId, partId]);

  useEffect(() => {
    if (part) document.title = `Gate · ${part.title} — Unpacked`;
  }, [part]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase]);

  if (!course || !part) return null;
  if (loading)
    return (
      <main className="wrap gate">
        <p className="gate-loading">Loading gate…</p>
      </main>
    );
  if (!gate)
    return (
      <main className="gate wrap">
        <div className="empty gate-empty">
          <Lock size={28} />
          <strong>Gate coming soon</strong>
          <p>This part's gate is being written. Check back soon.</p>
          <Link to={`/${courseId}`} className="btn">
            Back to course map
          </Link>
        </div>
      </main>
    );

  const currentQ = gate.questions[qi];
  const passMark = gate.passMark ?? PASS_MARK;

  function answer(qid: string, val: number | number[]) {
    setQuizState((s) => ({
      answers: { ...s.answers, [qid]: val },
      revealed: new Set([...s.revealed, qid]),
    }));
  }

  function nextQuestion() {
    if (!gate) return;
    if (qi < gate.questions.length - 1) setQi((n) => n + 1);
    else finishQuiz();
  }

  function quizScore() {
    if (!gate) return 0;
    let correct = 0;
    for (const q of gate.questions) {
      const ans = quizState.answers[q.id];
      if (ans === undefined) continue;
      if (Array.isArray(q.answer)) {
        if (Array.isArray(ans) && JSON.stringify([...ans].sort()) === JSON.stringify([...q.answer].sort())) correct++;
      } else if (ans === q.answer) correct++;
    }
    return correct / gate.questions.length;
  }

  /** Questions decide the pass; the coding challenge (when there is one) is shown alongside it. */
  function record(s: number) {
    saveGateResult(courseId, partId, { bestScore: s, passed: s >= passMark, skipped: false, ts: Date.now(), weakTopics: buildWeakTopics() });
    setPhase('result');
  }

  function finishQuiz() {
    const s = quizScore();
    setScore(s);
    if (gate?.challenge) setPhase('challenge');
    else record(s);
  }

  function buildWeakTopics() {
    if (!gate) return {};
    const weak: Record<string, { lessonId: string; step: number }> = {};
    for (const q of gate.questions) {
      const ans = quizState.answers[q.id];
      const correct = Array.isArray(q.answer)
        ? Array.isArray(ans) && JSON.stringify([...ans].sort()) === JSON.stringify([...q.answer].sort())
        : ans === q.answer;
      if (!correct && q.teachAt) weak[q.id] = q.teachAt;
    }
    return weak;
  }

  function handleSkip() {
    skipGate(courseId, partId);
    navigate(`/${courseId}`);
  }

  function restart() {
    setPhase('intro');
    setQi(0);
    setQuizState({ answers: {}, revealed: new Set() });
    setChallenge(null);
  }

  const passed = score >= passMark;
  const nextPart = course.parts[course.parts.findIndex((p) => p.id === partId) + 1];
  const steps = gate.challenge ? 2 : 1;

  return (
    <main className="gate wrap wrap--narrow" data-tone={part.tone}>
      <Link to={`/${courseId}#${part.id}`} className="gate-back">
        <ChevronLeft size={15} /> Part {part.num} · {part.title}
      </Link>

      {/* Intro */}
      {phase === 'intro' && (
        <section className="gate-section">
          <span className="eyebrow gate-kicker">Part {part.num} gate</span>
          <h1 className="page-title">Prove it: {part.title}</h1>
          <p className="page-lede">Short questions{gate.challenge ? ' and a small coding task' : ''} on this part. Every question you miss links back to the step that explains it.</p>

          <ul className="gate-facts">
            <li className="card">
              <ListChecks size={18} />
              <strong>{gate.questions.length} questions</strong>
              <span>Multiple choice</span>
            </li>
            {gate.challenge && (
              <li className="card">
                <Code2 size={18} />
                <strong>1 coding task</strong>
                <span>Runs in your browser</span>
              </li>
            )}
            <li className="card">
              <Target size={18} />
              <strong>{Math.round(passMark * 100)}% to pass</strong>
              <span>Retake any time</span>
            </li>
          </ul>

          {gateState?.passed && (
            <div className="gate-already-passed">
              <Trophy size={17} /> You passed this gate (best {Math.round(gateState.bestScore * 100)}%). Retake it any time.
            </div>
          )}

          <div className="gate-covers">
            <span className="eyebrow">What it covers</span>
            <ul>
              {part.lessons.map((l) => {
                const p = progress.lessons[`${course.id}/${l.id}`];
                const meta = course.lessons[l.id];
                return (
                  <li key={l.id} data-done={p?.done || undefined}>
                    {meta ? <Link to={`/${course.id}/${l.id}`}>{l.title}</Link> : <span>{l.title}</span>}
                    <span className="gate-cover-state">{p?.done ? <Check size={13} strokeWidth={3} /> : p ? 'started' : 'not yet'}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="gate-actions">
            <button className="btn btn--primary btn--lg" onClick={() => setPhase('quiz')}>
              Start the gate <ArrowRight size={16} />
            </button>
            <button className="btn btn--lg btn--ghost" onClick={handleSkip}>
              Skip for now
            </button>
          </div>
        </section>
      )}

      {/* Quiz */}
      {phase === 'quiz' && currentQ && (
        <section className="gate-section">
          <div className="gate-progress">
            <span className="eyebrow">
              {steps > 1 ? 'Step 1 of 2 · ' : ''}Question {qi + 1} of {gate.questions.length}
            </span>
            <div className="bar gate-bar">
              <i style={{ width: `${(qi / gate.questions.length) * 100}%` }} />
            </div>
          </div>
          <GateQuestion
            q={currentQ}
            courseId={courseId}
            answered={quizState.answers[currentQ.id]}
            revealed={quizState.revealed.has(currentQ.id)}
            onAnswer={(val) => answer(currentQ.id, val)}
            onNext={nextQuestion}
            isLast={qi === gate.questions.length - 1}
          />
        </section>
      )}

      {/* Coding challenge */}
      {phase === 'challenge' && gate.challenge && (
        <section className="gate-section">
          <div className="gate-progress">
            <span className="eyebrow">Step 2 of 2 · Coding task</span>
            <div className="bar gate-bar">
              <i style={{ width: '100%' }} />
            </div>
          </div>
          <p className="gate-q">Write it, run it, make the tests pass.</p>
          <Suspense fallback={<p className="gate-loading">Loading the editor…</p>}>
            <PracticePanel step={gate.challenge} stepKey={gate.challenge.id} onResult={onChallengeRun} />
          </Suspense>
          <div className="gate-actions">
            <button className="btn btn--primary" onClick={() => record(score)}>
              {challenge?.solved ? 'Finish the gate' : 'Finish without solving it'} <ArrowRight size={15} />
            </button>
          </div>
        </section>
      )}

      {/* Result */}
      {phase === 'result' && (
        <section className="gate-section">
          <div className={`gate-result-badge ${passed ? 'gate-result-badge--pass' : 'gate-result-badge--fail'}`}>{passed ? <Trophy size={28} /> : <AlertTriangle size={28} />}</div>
          <span className="eyebrow">Gate result</span>
          <h1 className="page-title">{passed ? 'Gate passed!' : 'Not quite yet'}</h1>
          <p className="page-lede">
            You scored <strong>{Math.round(score * 100)}%</strong> on the questions (pass mark {Math.round(passMark * 100)}%).{' '}
            {passed ? 'Great work.' : 'Review the steps below and try again.'}
          </p>
          {gate.challenge && (
            <p className="gate-challenge-result" data-ok={(challenge?.solved && !challenge.sawSolution) || undefined}>
              {challenge?.solved && !challenge.sawSolution ? <Check size={15} strokeWidth={3} /> : <Code2 size={15} />}
              {challenge?.solved
                ? challenge.sawSolution
                  ? 'Coding task: passed using the solution — try it again on your own later.'
                  : 'Coding task: solved on your own.'
                : 'Coding task: not solved yet.'}
            </p>
          )}

          {/* Weak topics links */}
          {!passed && Object.keys(buildWeakTopics()).length > 0 && (
            <div className="gate-weak">
              <span className="eyebrow">Review these</span>
              <ul className="gate-weak-list">
                {gate.questions.map((q) => {
                  const ans = quizState.answers[q.id];
                  const correct = Array.isArray(q.answer)
                    ? Array.isArray(ans) && JSON.stringify([...ans].sort()) === JSON.stringify([...q.answer].sort())
                    : ans === q.answer;
                  if (correct || !q.teachAt) return null;
                  return (
                    <li key={q.id}>
                      <Link to={`/${courseId}/${q.teachAt!.lessonId}?s=${q.teachAt!.step}`} className="gate-weak-link">
                        <X size={13} /> <span>{q.q}</span>
                        <ArrowRight size={13} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="gate-actions">
            {passed && nextPart ? (
              <Link className="btn btn--primary btn--lg" to={`/${courseId}/${nextPart.lessons[0]?.id ?? ''}`}>
                Continue to Part {nextPart.num} <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <button className="btn btn--primary" onClick={restart}>
                  Try again
                </button>
                <Link className="btn" to={`/${courseId}`}>
                  Back to course map
                </Link>
              </>
            )}
            {!passed && (
              <button className="btn btn--ghost" onClick={handleSkip}>
                Skip for now
              </button>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function GateQuestion({
  q,
  courseId,
  answered,
  revealed,
  onAnswer,
  onNext,
  isLast,
}: {
  q: QuizQuestion;
  courseId: string;
  answered?: number | number[];
  revealed: boolean;
  onAnswer: (v: number | number[]) => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const isCorrect = (i: number) => {
    if (Array.isArray(q.answer)) return q.answer.includes(i);
    return q.answer === i;
  };
  const wasSelected = (i: number) => {
    if (answered === undefined) return false;
    if (Array.isArray(answered)) return answered.includes(i);
    return answered === i;
  };

  return (
    <div className="gate-question card">
      <p className="gate-q">{q.q}</p>
      {q.kind === 'multi' && <p className="gate-multi-hint muted">Select all that apply</p>}
      <ul className="gate-options">
        {q.options.map((opt, i) => {
          const sel = wasSelected(i);
          const corr = isCorrect(i);
          return (
            <li key={i}>
              <button
                className="gate-option"
                data-state={revealed ? (corr ? 'correct' : sel ? 'wrong' : 'dim') : sel ? 'selected' : undefined}
                onClick={() => !revealed && onAnswer(i)}
                disabled={revealed && q.kind !== 'multi'}
              >
                <span className="gate-opt-letter">{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
                {revealed && corr && <Check size={15} className="gate-opt-icon" />}
                {revealed && sel && !corr && <X size={15} className="gate-opt-icon" />}
              </button>
            </li>
          );
        })}
      </ul>
      {revealed && (
        <div className="gate-explain">
          <p>{q.explain}</p>
          {q.teachAt && (
            <Link to={`/${courseId}/${q.teachAt.lessonId}?s=${q.teachAt.step}`} className="gate-teach-link">
              Review this in the lesson <ArrowRight size={13} />
            </Link>
          )}
        </div>
      )}
      <div className="gate-nav">
        {revealed ? (
          <button className="btn btn--primary" onClick={onNext}>
            {isLast ? 'See results' : 'Next question'} <ArrowRight size={15} />
          </button>
        ) : (
          <button className="btn btn--ghost" onClick={onNext}>
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
