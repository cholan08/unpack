import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowRight, Check, X, AlertTriangle, Lock, Trophy } from 'lucide-react';
import { SiteFooter, SiteHeader } from './SiteHeader';
import { getCourse } from '@/content/registry';
import { saveGateResult, skipGate, useGates } from '@/lib/progress';
import type { PartGate, QuizQuestion } from '@/engine/types';
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
  const [gate, setGate] = useState<PartGate | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<GatePhase>('intro');
  const [qi, setQi] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>({ answers: {}, revealed: new Set() });
  const [score, setScore] = useState(0);

  const part = course?.parts.find((p) => p.id === partId);
  const gateState = gates[`${courseId}/${partId}`];

  useEffect(() => {
    if (courseId && partId) {
      loadGate(courseId, partId).then((g) => { setGate(g); setLoading(false); });
    }
  }, [courseId, partId]);

  useEffect(() => {
    if (part) document.title = `Gate · ${part.title} — Unpacked`;
  }, [part]);

  if (!course || !part) return null;
  if (loading) return <div className="gate-loading">Loading gate…</div>;
  if (!gate) return (
    <>
      <SiteHeader />
      <main className="gate wrap">
        <div className="gate-empty">
          <Lock size={32} />
          <h1>Gate coming soon</h1>
          <p className="muted">This part's gate is being written. Check back soon.</p>
          <Link to={`/${courseId}`} className="btn">Back to course map</Link>
        </div>
      </main>
      <SiteFooter />
    </>
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

  function finishQuiz() {
    if (!gate) return;
    let correct = 0;
    for (const q of gate.questions) {
      const ans = quizState.answers[q.id];
      if (ans === undefined) continue;
      if (Array.isArray(q.answer)) {
        if (Array.isArray(ans) && JSON.stringify([...ans].sort()) === JSON.stringify([...q.answer].sort())) correct++;
      } else {
        if (ans === q.answer) correct++;
      }
    }
    const s = correct / gate.questions.length;
    setScore(s);
    if (gate.challenge) {
      setPhase('challenge');
    } else {
      const passed = s >= passMark;
      saveGateResult(courseId, partId, {
        bestScore: s, passed, skipped: false, ts: Date.now(),
        weakTopics: buildWeakTopics(),
      });
      setPhase('result');
    }
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

  const passed = score >= passMark;
  const nextPart = course.parts[course.parts.findIndex((p) => p.id === partId) + 1];

  return (
    <>
      <SiteHeader />
      <main className="gate wrap">
        {/* Intro */}
        {phase === 'intro' && (
          <section className="gate-section">
            <span className="eyebrow">Part {part.num} · Gate</span>
            <h1 className="display">Prove it: {part.title}</h1>
            <p className="gate-lede">
              {gate.questions.length} questions{gate.challenge ? ' + 1 coding challenge' : ''}.
              Pass mark: {Math.round(passMark * 100)}%. Failed questions link back to the step that explains them.
            </p>
            {gateState?.passed && (
              <div className="gate-already-passed">
                <Trophy size={18} /> You already passed this gate! You can retake it to improve your score.
              </div>
            )}
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
              <span className="eyebrow">Question {qi + 1} of {gate.questions.length}</span>
              <div className="gate-progress-bar">
                <div className="gate-progress-fill" style={{ width: `${(qi / gate.questions.length) * 100}%` }} />
              </div>
            </div>
            <GateQuestion
              q={currentQ}
              answered={quizState.answers[currentQ.id]}
              revealed={quizState.revealed.has(currentQ.id)}
              onAnswer={(val) => answer(currentQ.id, val)}
              onNext={nextQuestion}
              isLast={qi === gate.questions.length - 1}
            />
          </section>
        )}

        {/* Result */}
        {phase === 'result' && (
          <section className="gate-section">
            <div className={`gate-result-badge ${passed ? 'gate-result-badge--pass' : 'gate-result-badge--fail'}`}>
              {passed ? <Trophy size={28} /> : <AlertTriangle size={28} />}
            </div>
            <span className="eyebrow">Gate result</span>
            <h1 className="display">{passed ? 'Gate passed!' : 'Not quite yet'}</h1>
            <p className="gate-lede">
              You scored <strong>{Math.round(score * 100)}%</strong>. Pass mark is {Math.round(passMark * 100)}%.{' '}
              {passed ? 'Great work.' : 'Review the lessons below and try again.'}
            </p>

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
                          <X size={12} /> {q.q.slice(0, 60)}…
                          <ArrowRight size={12} />
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
                  <button className="btn btn--primary" onClick={() => { setPhase('intro'); setQi(0); setQuizState({ answers: {}, revealed: new Set() }); }}>
                    Try again
                  </button>
                  <Link className="btn" to={`/${courseId}`}>Back to course map</Link>
                </>
              )}
              <button className="btn btn--ghost" onClick={handleSkip}>Skip for now</button>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function GateQuestion({
  q, answered, revealed, onAnswer, onNext, isLast,
}: {
  q: QuizQuestion;
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
    <div className="gate-question">
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
                {revealed && corr && <Check size={14} className="gate-opt-icon" />}
                {revealed && sel && !corr && <X size={14} className="gate-opt-icon" />}
              </button>
            </li>
          );
        })}
      </ul>
      {revealed && (
        <div className="gate-explain">
          <p>{q.explain}</p>
          {q.teachAt && (
            <Link to={`/mern/${q.teachAt.lessonId}?s=${q.teachAt.step}`} className="gate-teach-link">
              <ArrowRight size={13} /> Review this in the lesson
            </Link>
          )}
        </div>
      )}
      <div className="gate-nav">
        {revealed && (
          <button className="btn btn--primary" onClick={onNext}>
            {isLast ? 'See results' : 'Next question'} <ArrowRight size={15} />
          </button>
        )}
        {!revealed && (
          <button className="btn btn--ghost" onClick={onNext}>Skip</button>
        )}
      </div>
    </div>
  );
}
