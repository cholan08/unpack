import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, ArrowRight, Check, Flame, KeyRound, Repeat, ShieldCheck, StickyNote, Trophy, X } from 'lucide-react';
import { COURSES } from '@/content/registry';
import { MAIN_PILLARS } from '@/content/pillars';
import { useProgress, useGates, useDash, useDueReviews, useSettings, saveTutorKey, setNoAiMode } from '@/lib/progress';
import { PILLAR_ICON } from './AppShell';
import { continueTarget, courseDone, statsFor } from './learner';
import { PageHead, Ring, fmtHours } from './ui';
import './dashboard.css';

export function DashboardPage() {
  const course = COURSES[0];
  const progress = useProgress();
  const gates = useGates();
  const dash = useDash();
  const due = useDueReviews();
  const settings = useSettings();
  const [keyInput, setKeyInput] = useState(settings.tutorKey ?? '');
  const [showKeyModal, setShowKeyModal] = useState(false);

  useEffect(() => {
    document.title = 'Dashboard — Unpacked';
  }, []);

  if (!course) return null;

  const c = courseDone(course, progress);
  const passedGates = course.parts.filter((p) => gates[`${course.id}/${p.id}`]?.passed).length;
  const t = continueTarget(progress);
  const active = dash.lastActiveDate ? dash.streakDays || 1 : 0;

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
    <main className="wrap dash">
      <PageHead
        eyebrow="You"
        title="Dashboard"
        lede="Everything you've done so far, and what to do next. It all lives in this browser."
        actions={
          <>
            <Link className="btn" to="/handnote">
              <StickyNote size={15} /> My notes
            </Link>
            <button className="btn" onClick={() => setShowKeyModal(true)}>
              <KeyRound size={15} /> AI tutor
            </button>
          </>
        }
      />

      {/* at a glance */}
      <div className="dash-stats">
        <div className="card dash-stat" data-tone="ok">
          <Ring pct={c.pct} size={44} stroke={4}>
            <Check size={16} strokeWidth={2.6} />
          </Ring>
          <div className="stat">
            <strong>
              {c.done}
              <small>/{c.ready}</small>
            </strong>
            <span>lessons done</span>
          </div>
        </div>
        <div className="card dash-stat" data-tone="client">
          <span className="dash-stat-icon">
            <Trophy size={18} />
          </span>
          <div className="stat">
            <strong>
              {passedGates}
              <small>/{course.parts.length}</small>
            </strong>
            <span>part gates passed</span>
          </div>
        </div>
        <div className="card dash-stat" data-tone="server">
          <span className="dash-stat-icon">
            <Flame size={18} />
          </span>
          <div className="stat">
            <strong>{active}</strong>
            <span>day streak</span>
          </div>
        </div>
        <Link to="/review" className="card dash-stat" data-tone="auth">
          <span className="dash-stat-icon">
            <Repeat size={18} />
          </span>
          <div className="stat">
            <strong>{due.length}</strong>
            <span>{due.length === 1 ? 'card to review' : 'cards to review'}</span>
          </div>
          <ArrowRight size={15} className="dash-stat-go" />
        </Link>
      </div>

      <div className="dash-two">
        {/* next step */}
        <section className="dash-sec">
          <div className="sec-head">
            <h2>Next step</h2>
          </div>
          {t && t.kind !== 'start' ? (
            <Link to={t.href} className="card dash-next" data-tone={t.part?.tone}>
              <span className="eyebrow">
                {t.kind === 'resume' ? 'Continue' : 'Up next'} · {t.part?.num} {t.part?.title}
              </span>
              <strong>{t.lesson!.title}</strong>
              <span className="dash-next-sum">{t.lesson!.summary}</span>
              {t.kind === 'resume' && t.total ? (
                <span className="dash-next-bar">
                  <span className="bar">
                    <i style={{ width: `${((t.step ?? 0) / t.total) * 100}%` }} />
                  </span>
                  <span className="mono">
                    {t.step}/{t.total}
                  </span>
                </span>
              ) : null}
              <span className="btn btn--primary">
                {t.kind === 'resume' ? `Resume at step ${t.step}` : 'Start lesson'} <ArrowRight size={15} />
              </span>
            </Link>
          ) : (
            <Link to="/start" className="card dash-next">
              <span className="eyebrow">New here</span>
              <strong>Start with a 5-minute check</strong>
              <span className="dash-next-sum">A few questions place you in the right part of the course — or start from Part 1.</span>
              <span className="btn btn--primary">
                Start here <ArrowRight size={15} />
              </span>
            </Link>
          )}
        </section>

        {/* by topic */}
        <section className="dash-sec">
          <div className="sec-head">
            <h2>By topic</h2>
          </div>
          <ul className="card dash-topics">
            {MAIN_PILLARS.map((p) => {
              const s = statsFor(p.id, progress);
              const I = PILLAR_ICON[p.id];
              return (
                <li key={p.id} data-tone={p.tone}>
                  <Link to={`/${p.id}`}>
                    <Ring pct={s.pct} size={34} stroke={3}>
                      <I size={14} strokeWidth={2.3} />
                    </Ring>
                    <span className="dash-topic-text">
                      <strong>{p.label}</strong>
                      <span className="bar bar--sm">
                        <i style={{ width: `${s.pct * 100}%` }} />
                      </span>
                    </span>
                    <span className="dash-topic-n mono">
                      {s.done}/{s.ready}
                    </span>
                    <span className="dash-topic-time">{fmtHours(s.minutes)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* weak topics */}
      {weakTopics.length > 0 && (
        <section className="dash-sec">
          <div className="sec-head">
            <h2>Worth another look</h2>
            <p>From questions you missed in a gate.</p>
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
                      <span className="muted">Step {wt.step} explains it</span>
                    </div>
                    <ArrowRight size={15} style={{ marginLeft: 'auto' }} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* gates */}
      <section className="dash-sec">
        <div className="sec-head">
          <h2>Part gates</h2>
          <p>Questions and a small coding task at the end of each part: proof you can do it, not just that you watched it.</p>
        </div>
        <ol className="card dash-gates">
          {course.parts.map((p) => {
            const g = gates[`${course.id}/${p.id}`];
            const state = g?.passed ? 'passed' : g?.skipped ? 'skipped' : g?.attempts ? 'tried' : 'open';
            return (
              <li key={p.id} data-tone={p.tone} data-state={state}>
                <span className="dash-gate-num mono">{p.num}</span>
                <span className="dash-gate-title">{p.title}</span>
                <span className="dash-gate-state">
                  {state === 'passed' ? (
                    <span className="badge badge--ok">
                      <Check size={11} strokeWidth={3} /> Passed
                    </span>
                  ) : state === 'skipped' ? (
                    <span className="badge badge--warn">Skipped</span>
                  ) : state === 'tried' ? (
                    <span className="badge">Not yet</span>
                  ) : (
                    <span className="badge">Not taken</span>
                  )}
                  {g?.attempts ? (
                    <span className="dash-gate-score mono">
                      best {Math.round(g.bestScore * 100)}% · {g.attempts}×
                    </span>
                  ) : null}
                </span>
                <Link to={`/${course.id}/gate/${p.id}`} className="btn btn--sm">
                  <ShieldCheck size={13} /> {state === 'passed' ? 'Retake' : 'Take gate'}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Key Settings Modal */}
      {showKeyModal && (
        <div className="modal-wrap" onClick={() => setShowKeyModal(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="AI tutor settings" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <strong>AI tutor settings</strong>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowKeyModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveKey} className="dash-modal-form">
              <p className="muted" style={{ fontSize: '.875rem' }}>
                Provide your own API key to enable the Socratic AI tutor. Your key is stored strictly in your browser (localStorage) and is never logged or saved on our servers.
              </p>
              <label className="dash-input-group">
                <span>Anthropic / Model API Key</span>
                <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="sk-ant-..." className="dash-text-input" />
              </label>
              <label className="dash-checkbox-label">
                <input type="checkbox" checked={!!settings.noAiMode} onChange={(e) => setNoAiMode(e.target.checked)} />
                <span>No-AI Mode (disable tutor prompts for independent practice)</span>
              </label>
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setShowKeyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Save settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
