import { useState, useCallback, useEffect } from 'react';
import { Play, RotateCcw, Lightbulb, ChevronDown, Check, X, Loader } from 'lucide-react';
import type { TrySpec } from '@/engine/types';
import './practice.css';

export interface RunResult {
  logs: string[];
  error?: string;
  results: { label: string; pass: boolean; message?: string }[];
}

/** Lazy-load CodeMirror editor */
const EditorPromise = import('./CodeEditor');
const RunnerPromise = import('./runner');

function LazyEditor({
  value,
  onChange,
  language,
}: {
  value: string;
  onChange: (v: string) => void;
  language: string;
}) {
  const [Editor, setEditor] = useState<React.ComponentType<{
    value: string;
    onChange: (v: string) => void;
    language: string;
  }> | null>(null);

  useEffect(() => {
    EditorPromise.then((m) => setEditor(() => m.CodeEditor));
  }, []);

  if (!Editor) {
    return (
      <textarea
        className="practice-fallback-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        aria-label="Code editor"
      />
    );
  }
  return <Editor value={value} onChange={onChange} language={language} />;
}

interface PracticePanelProps {
  step: TrySpec;
  stepKey: string | number;
}

export function PracticePanel({ step, stepKey }: PracticePanelProps) {
  const [code, setCode] = useState(step.starter);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [solutionShown, setSolutionShown] = useState(false);
  const [confirmSolution, setConfirmSolution] = useState(false);

  // Reset when step changes
  useEffect(() => {
    setCode(step.starter);
    setResult(null);
    setHintsShown(0);
    setSolutionShown(false);
    setConfirmSolution(false);
  }, [stepKey, step.starter]);

  const run = useCallback(async () => {
    setRunning(true);
    try {
      const { runCode } = await RunnerPromise;
      const r = await runCode(code, step.tests);
      setResult(r);
    } finally {
      setRunning(false);
    }
  }, [code, step.tests]);

  const reset = () => {
    setCode(step.starter);
    setResult(null);
    setHintsShown(0);
    setSolutionShown(false);
    setConfirmSolution(false);
  };

  const showHint = () => setHintsShown((n) => Math.min(n + 1, step.hints.length));

  const allPassed = result && result.results.length > 0 && result.results.every((r) => r.pass);

  return (
    <div className="practice-panel" data-beat="try">
      <div className="practice-prompt">
        <span className="beat-tag">Try it</span>
        <p>{step.prompt}</p>
      </div>

      <div className="practice-editor-wrap">
        <LazyEditor value={code} onChange={setCode} language={step.language ?? 'js'} />
      </div>

      <div className="practice-actions">
        <button className="btn btn--primary btn--sm" onClick={run} disabled={running} aria-label="Run code">
          {running ? <Loader size={14} className="spin" /> : <Play size={14} />}
          Run
        </button>
        <button className="btn btn--sm btn--ghost" onClick={reset} aria-label="Reset to starter code">
          <RotateCcw size={14} /> Reset
        </button>
        {step.hints.length > 0 && hintsShown < step.hints.length && (
          <button className="btn btn--sm btn--ghost" onClick={showHint} aria-label="Show next hint">
            <Lightbulb size={14} /> Hint {hintsShown + 1}/{step.hints.length}
          </button>
        )}
        {!solutionShown && (
          <button
            className="btn btn--sm btn--ghost practice-solution-btn"
            onClick={() => setConfirmSolution(true)}
            style={{ marginLeft: 'auto' }}
          >
            <ChevronDown size={14} /> Show solution
          </button>
        )}
      </div>

      {/* Hints */}
      {hintsShown > 0 && (
        <div className="practice-hints">
          {step.hints.slice(0, hintsShown).map((h, i) => (
            <div key={i} className="practice-hint">
              <Lightbulb size={13} />
              <span>Hint {i + 1}: {h}</span>
            </div>
          ))}
        </div>
      )}

      {/* Solution confirm */}
      {confirmSolution && !solutionShown && (
        <div className="practice-confirm">
          <p>Showing the solution means you won't get credit for solving it. Are you sure?</p>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn--sm btn--ghost" onClick={() => { setConfirmSolution(false); setSolutionShown(true); setCode(step.solution); }}>
              I'm stuck — show it
            </button>
            <button className="btn btn--sm" onClick={() => setConfirmSolution(false)}>Keep trying</button>
          </div>
        </div>
      )}

      {/* Console output */}
      {result && (
        <div className="practice-output">
          {result.logs.length > 0 && (
            <div className="practice-console">
              <span className="eyebrow">Console</span>
              <pre>{result.logs.join('\n')}</pre>
            </div>
          )}
          {result.error && (
            <div className="practice-error">
              <X size={13} /> {result.error}
            </div>
          )}

          {/* Test results */}
          {result.results.length > 0 && (
            <div className="practice-tests">
              <span className="eyebrow">Tests</span>
              <ul className="practice-test-list">
                {result.results.map((r, i) => (
                  <li key={i} className="practice-test-item" data-pass={r.pass || undefined}>
                    {r.pass ? <Check size={13} /> : <X size={13} />}
                    <span>{r.label}</span>
                    {!r.pass && r.message && <span className="practice-test-msg muted">{r.message}</span>}
                  </li>
                ))}
              </ul>
              {allPassed && (
                <div className="practice-pass">
                  <Check size={16} strokeWidth={2.5} /> All tests pass!
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
