import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Check, Flame, Key, Lock, Target, Trophy, AlertTriangle } from 'lucide-react';
import { SiteFooter, SiteHeader } from './SiteHeader';
import { COURSES } from '@/content/registry';
import { useProgress, useGates, useDash, useSettings, saveTutorKey, setNoAiMode } from '@/lib/progress';
import './dashboard.css';

export function DashboardPage() {
  const course = COURSES[0];
  const progress = useProgress();
  const gates = useGates();
  const dash = useDash();
  const settings = useSettings();
  const [keyInput, setKeyInput] = useState(settings.tutorKey ?? '');
  const [showKeyModal, setShowKeyModal] = useState(false);

  useEffect(() => {
    document.title = 'Dashboard — Unpacked';
  }, []);

  if (!course) return null;

  // Stats
  const completedLessons = Object.keys(course.lessons).filter((id) => progress.lessons[`${course.id}/${id}`]?.done).length;
  const totalLessons = Object.keys(course.lessons).length;

  const passedGates = course.parts.filter((p) => gates[`${course.id}/${p.id}`]?.passed).length;

  // Next best action
  const resumeLessonKey = progress.last;
  const resumePart = course.parts.find((p) => p.lessons.some((l) => `${course.id}/${l.id}` === resumeLessonKey));
  const resumeLesson = resumeLessonKey ? course.lessons[resumeLessonKey.split('/')[1]] : null;
  const resumeStep = resumeLessonKey ? progress.lessons[resumeLessonKey]?.step : undefined;

  // Collect weak topics across all gate results
  const weakTopics: { id: string; partId: string; lessonId: string; step: number }[] = [];
  for (const [key, gate] of Object.entries(gates)) {
    if (gate.weakTopics) {
      const partId = key.split('/')[1];
      for (const [qid, teach] of Object.entries(gate.weakTopics)) {
        weakTopics.push({ id: qid, partId, ...teach });
      }
    }
  }

  function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    saveTutorKey(keyInput.trim());
    setShowKeyModal(false);
  }

  return (
    <>
      <SiteHeader />
      <main className="dash wrap">
        {/* Header */}
        <div className="dash-head">
          <div>
            <span className="eyebrow">Your learning progress</span>
            <h1 className="display">Dashboard</h1>
          </div>
          <div className="dash-head-actions">
            <button className="btn btn--sm" onClick={() => setShowKeyModal(true)}>
              <Key size={14} /> AI Tutor settings
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="dash-grid">
          <div className="dash-card">
            <div className="dash-card-icon" data-tone="warn">
              <Flame size={20} />
            </div>
            <div>
              <span className="dash-card-val">{dash.streakDays || 1} day</span>
              <span className="muted dash-card-label">Learning streak</span>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon" data-tone="client">
              <Target size={20} />
            </div>
            <div>
              <span className="dash-card-val">{completedLessons} / {totalLessons}</span>
              <span className="muted dash-card-label">Lessons completed</span>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon" data-tone="ok">
              <Trophy size={20} />
            </div>
            <div>
              <span className="dash-card-val">{passedGates} / {course.parts.length}</span>
              <span className="muted dash-card-label">Part gates passed</span>
            </div>
          </div>
        </div>

        {/* Next Best Action */}
        <section className="dash-action-section">
          <span className="eyebrow">Recommended next step</span>
          <div className="dash-action-card">
            <div>
              <h2 className="dash-action-title">
                {resumeLesson
                  ? `Continue: ${resumeLesson.title}`
                  : `Start Part 1: ${course.parts[0]?.title}`}
              </h2>
              <p className="muted dash-action-sub">
                {resumeLesson
                  ? `Pick up where you left off at step ${resumeStep || 1} in ${resumePart?.title}.`
                  : 'Begin with the fundamentals of how the web works.'}
              </p>
            </div>
            {resumeLesson ? (
              <Link
                to={`/${course.id}/${resumeLesson.id}${resumeStep ? `?s=${resumeStep}` : ''}`}
                className="btn btn--primary btn--lg"
              >
                Resume lesson <ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/start" className="btn btn--primary btn--lg">
                Start here <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </section>

        {/* Gates status */}
        <section className="dash-section">
          <div className="dash-section-head">
            <span className="eyebrow">Part Gates</span>
            <h2>Proof of understanding</h2>
          </div>
          <div className="dash-gates-grid">
            {course.parts.map((p) => {
              const g = gates[`${course.id}/${p.id}`];
              const isPassed = g?.passed;
              const isSkipped = g?.skipped;
              return (
                <div key={p.id} className="dash-gate-item" data-tone={p.tone} data-passed={isPassed || undefined}>
                  <div className="dash-gate-head">
                    <span className="mono eyebrow">Part {p.num}</span>
                    {isPassed ? (
                      <span className="badge badge--ok"><Check size={11} /> Passed</span>
                    ) : isSkipped ? (
                      <span className="badge badge--warn">Skipped</span>
                    ) : (
                      <span className="badge"><Lock size={11} /> Ready</span>
                    )}
                  </div>
                  <strong>{p.title}</strong>
                  {g?.bestScore !== undefined && (
                    <span className="muted" style={{ fontSize: '.8125rem' }}>
                      Best score: {Math.round(g.bestScore * 100)}% ({g.attempts} {g.attempts === 1 ? 'attempt' : 'attempts'})
                    </span>
                  )}
                  <Link to={`/${course.id}/gate/${p.id}`} className="btn btn--sm">
                    {isPassed ? 'Retake gate' : 'Take gate'} <ArrowRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Weak topics */}
        {weakTopics.length > 0 && (
          <section className="dash-section">
            <div className="dash-section-head">
              <span className="eyebrow">Topics to review</span>
              <h2>Areas for reinforcement</h2>
            </div>
            <ul className="dash-weak-list">
              {weakTopics.slice(0, 6).map((wt) => {
                const l = course.lessons[wt.lessonId];
                return (
                  <li key={wt.id}>
                    <Link to={`/${course.id}/${wt.lessonId}?s=${wt.step}`} className="dash-weak-item">
                      <AlertTriangle size={15} className="dash-weak-icon" />
                      <div>
                        <strong>{l?.title ?? wt.lessonId}</strong>
                        <span className="muted">Review step {wt.step} where this concept is unpacked</span>
                      </div>
                      <ArrowRight size={15} style={{ marginLeft: 'auto' }} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Key Settings Modal */}
        {showKeyModal && (
          <div className="modal-wrap" onClick={() => setShowKeyModal(false)}>
            <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <strong>AI Tutor settings</strong>
                <button className="btn btn--ghost btn--icon" onClick={() => setShowKeyModal(false)}>×</button>
              </div>
              <form onSubmit={handleSaveKey} className="dash-modal-form">
                <p className="muted" style={{ fontSize: '.875rem' }}>
                  Provide your own API key to enable the Socratic AI tutor. Your key is stored strictly in your browser (localStorage) and is never logged or saved on our servers.
                </p>
                <label className="dash-input-group">
                  <span>Anthropic / Model API Key</span>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="sk-ant-..."
                    className="dash-text-input"
                  />
                </label>
                <label className="dash-checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!settings.noAiMode}
                    onChange={(e) => setNoAiMode(e.target.checked)}
                  />
                  <span>No-AI Mode (disable tutor prompts for independent practice)</span>
                </label>
                <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" className="btn btn--ghost" onClick={() => setShowKeyModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn--primary">Save settings</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
