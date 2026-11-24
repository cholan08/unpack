import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, Check, Copy, Layers, Terminal } from 'lucide-react';
import { CAPSTONE_MILESTONES } from '@/content/courses/mern/capstone';
import { TutorPanel } from '@/player/TutorPanel';
import { useMentorPage } from '@/lib/mentor';
import './capstone.css';

const CHECKLIST_KEY = 'unpacked:capstone:checks';

function loadChecks(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveChecks(data: Record<string, boolean>) {
  try {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(data));
  } catch {}
}

export function CapstonePage() {
  const { milestoneId = 'm1' } = useParams();
  const [currentId, setCurrentId] = useState(milestoneId);
  const [checks, setChecks] = useState<Record<string, boolean>>(loadChecks);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Capstone: Build TaskFlow — Unpacked';
  }, []);

  const milestone = CAPSTONE_MILESTONES.find((m) => m.id === currentId) || CAPSTONE_MILESTONES[0];
  useMentorPage({ kind: 'capstone', title: 'TaskFlow Capstone', stepTitle: `Milestone ${milestone.num}: ${milestone.title}`, stepBody: milestone.goal });
  const nextMilestone = CAPSTONE_MILESTONES.find((m) => m.num === milestone.num + 1);
  const prevMilestone = CAPSTONE_MILESTONES.find((m) => m.num === milestone.num - 1);

  function toggleCheck(checkId: string) {
    const key = `${milestone.id}:${checkId}`;
    const next = { ...checks, [key]: !checks[key] };
    setChecks(next);
    saveChecks(next);
  }

  function copyCode(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 1500);
  }

  return (
    <>
      <main className="capstone wrap">
        {/* Header */}
        <div className="capstone-head">
          <span className="eyebrow">Capstone project</span>
          <h1 className="page-title">Build TaskFlow</h1>
          <p className="muted capstone-lede">
            Build a complete real-time collaborative task board from an empty folder across 10 milestones, putting every piece of the course together.
          </p>
        </div>

        {/* Milestone Rail */}
        <nav className="capstone-rail" aria-label="Milestones">
          {CAPSTONE_MILESTONES.map((m) => {
            const isDone = m.acceptanceChecks.every((c) => checks[`${m.id}:${c.id}`]);
            const isCurrent = m.id === milestone.id;
            return (
              <button
                key={m.id}
                className="capstone-step-btn"
                data-state={isDone ? 'done' : isCurrent ? 'current' : undefined}
                onClick={() => setCurrentId(m.id)}
              >
                <span className="capstone-step-n mono">{String(m.num).padStart(2, '0')}</span>
                <span className="capstone-step-title">{m.title}</span>
                {isDone && <Check size={13} className="capstone-check-icon" />}
              </button>
            );
          })}
        </nav>

        {/* Milestone Detail Card */}
        <article className="capstone-card">
          <div className="capstone-card-header">
            <div>
              <span className="eyebrow">Milestone {milestone.num} of 10</span>
              <h2 className="display">{milestone.title}</h2>
            </div>
            <Link to={`/mern/${milestone.lessonId}`} className="pill" style={{ color: 'inherit' }}>
              <Layers size={13} /> Review lesson
            </Link>
          </div>

          <p className="capstone-goal">{milestone.goal}</p>

          {/* Why this, not that */}
          <div className="capstone-why">
            <span className="eyebrow">Why this, not that</span>
            <p>{milestone.whyNotes}</p>
          </div>

          {/* Local Commands */}
          <div className="capstone-section">
            <span className="eyebrow">Local steps</span>
            <div className="capstone-commands">
              {milestone.commands.map((cmd, i) => (
                <div key={i} className="capstone-cmd-box">
                  <div className="capstone-cmd-head">
                    <span className="capstone-cmd-title">
                      <Terminal size={13} /> {cmd.title}
                    </span>
                    <button className="btn btn--sm btn--ghost" onClick={() => copyCode(cmd.cmd)}>
                      {copiedCmd === cmd.cmd ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedCmd === cmd.cmd ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="capstone-cmd-code">{cmd.cmd}</pre>
                </div>
              ))}
            </div>
          </div>

          {/* Acceptance Checklist */}
          <div className="capstone-section">
            <span className="eyebrow">Acceptance checklist</span>
            <div className="capstone-checks">
              {milestone.acceptanceChecks.map((c) => {
                const checked = !!checks[`${milestone.id}:${c.id}`];
                return (
                  <label key={c.id} className="capstone-check-item" data-checked={checked || undefined}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCheck(c.id)}
                    />
                    <span className="capstone-checkbox">{checked ? <Check size={13} /> : null}</span>
                    <div className="capstone-check-label">
                      <span>{c.label}</span>
                      {c.sampleOutput && (
                        <pre className="capstone-sample-output">{c.sampleOutput}</pre>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Socratic Tutor */}
          <div className="capstone-section">
            <TutorPanel
              lessonTitle="TaskFlow Capstone"
              stepTitle={`Milestone ${milestone.num}: ${milestone.title}`}
              stepBody={milestone.goal}
              lessonId={milestone.lessonId}
              courseId="mern"
              stepKey={milestone.id}
            />
          </div>

          {/* Navigation */}
          <div className="capstone-nav">
            {prevMilestone && (
              <button className="btn" onClick={() => setCurrentId(prevMilestone.id)}>
                <ArrowLeft size={15} /> Milestone {prevMilestone.num}
              </button>
            )}
            {nextMilestone ? (
              <button className="btn btn--primary" onClick={() => setCurrentId(nextMilestone.id)} style={{ marginLeft: 'auto' }}>
                Next: Milestone {nextMilestone.num} <ArrowRight size={15} />
              </button>
            ) : (
              <Link to="/mern" className="btn btn--primary" style={{ marginLeft: 'auto' }}>
                Complete course <Check size={15} />
              </Link>
            )}
          </div>
        </article>
      </main>
    </>
  );
}
