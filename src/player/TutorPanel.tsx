import { useState } from 'react';
import { Bot, Check, Key, Loader, Send, Sparkles, X, AlertCircle } from 'lucide-react';
import { useSettings, saveExplainBack } from '@/lib/progress';
import './tutor.css';

interface TutorPanelProps {
  lessonTitle: string;
  stepTitle: string;
  stepBody: string;
  code?: string;
  errors?: string;
  lessonId: string;
  courseId: string;
  stepKey: string | number;
}

export function TutorPanel({
  lessonTitle,
  stepTitle,
  stepBody,
  code,
  errors,
  lessonId,
  courseId,
  stepKey,
}: TutorPanelProps) {
  const settings = useSettings();
  const [open, setOpen] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<{ role: 'user' | 'tutor'; text: string }[]>([]);
  const [explainBackInput, setExplainBackInput] = useState('');
  const [explainResult, setExplainResult] = useState<{ result: string; feedback: string } | null>(null);

  if (settings.noAiMode) {
    return (
      <div className="tutor-no-ai-banner" title="No-AI mode is active in settings">
        <AlertCircle size={14} /> No-AI Mode Active
      </div>
    );
  }

  async function askTutor(level = hintLevel) {
    setLoading(true);
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tutor-key': settings.tutorKey || '',
        },
        body: JSON.stringify({
          lessonTitle,
          stepTitle,
          stepBody,
          code,
          errors,
          hintLevel: level,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setConversation((c) => [...c, { role: 'tutor', text: data.reply }]);
    } catch (err: any) {
      setConversation((c) => [
        ...c,
        {
          role: 'tutor',
          text: `⚠️ ${err.message || 'Could not connect to tutor server.'} Make sure your API key is configured in Dashboard settings.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function submitExplainBack(e: React.FormEvent) {
    e.preventDefault();
    if (!explainBackInput.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tutor-key': settings.tutorKey || '',
        },
        body: JSON.stringify({
          lessonTitle,
          stepTitle,
          stepBody,
          mode: 'grade-explain-back',
          explainBack: explainBackInput,
        }),
      });

      const data = await res.json();
      let parsed = { result: 'pass', feedback: 'Good job!' };
      try {
        parsed = JSON.parse(data.reply);
      } catch {
        parsed = { result: 'pass', feedback: data.reply };
      }

      setExplainResult(parsed);
      saveExplainBack({
        lessonId,
        courseId,
        stepKey: String(stepKey),
        result: parsed.result === 'pass' ? 'pass' : 'needs-work',
        ts: Date.now(),
      });
    } catch (err: any) {
      setExplainResult({ result: 'needs-work', feedback: 'Could not grade at this time.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`tutor-widget ${open ? 'tutor-widget--open' : ''}`}>
      {!open ? (
        <button className="tutor-launcher btn btn--sm" onClick={() => setOpen(true)} aria-label="Open AI Tutor">
          <Bot size={15} />
          <span>Ask Tutor</span>
        </button>
      ) : (
        <div className="tutor-card">
          <div className="tutor-header">
            <div className="tutor-title">
              <Bot size={16} />
              <strong>Socratic AI Tutor</strong>
            </div>
            <button className="btn btn--ghost btn--icon" onClick={() => setOpen(false)} aria-label="Close tutor">
              <X size={15} />
            </button>
          </div>

          <div className="tutor-body">
            {!settings.tutorKey && (
              <div className="tutor-key-hint">
                <Key size={13} />
                <span>Add an API key in <a href="/me">Dashboard settings</a> to unlock real LLM answers. Demo responses are active.</span>
              </div>
            )}

            {conversation.length === 0 ? (
              <div className="tutor-intro">
                <Sparkles size={20} className="tutor-sparkle" />
                <p>I'm your Socratic guide. I'll give hints and mental models rather than doing your homework for you.</p>
                <div className="tutor-level-picker">
                  <span className="eyebrow">Choose hint ladder level:</span>
                  <div className="tutor-level-btns">
                    <button className="btn btn--sm" data-active={hintLevel === 1 || undefined} onClick={() => setHintLevel(1)}>
                      1. Nudge
                    </button>
                    <button className="btn btn--sm" data-active={hintLevel === 2 || undefined} onClick={() => setHintLevel(2)}>
                      2. Diagram
                    </button>
                    <button className="btn btn--sm" data-active={hintLevel === 3 || undefined} onClick={() => setHintLevel(3)}>
                      3. Scaffold
                    </button>
                    <button className="btn btn--sm btn--ghost" data-active={hintLevel === 4 || undefined} onClick={() => setHintLevel(4)}>
                      4. Solution
                    </button>
                  </div>
                </div>
                <button className="btn btn--primary" onClick={() => askTutor()} disabled={loading}>
                  {loading ? <Loader size={14} className="spin" /> : <Send size={14} />}
                  Ask for guidance
                </button>
              </div>
            ) : (
              <div className="tutor-chat-messages">
                {conversation.map((msg, i) => (
                  <div key={i} className={`tutor-msg tutor-msg--${msg.role}`}>
                    <pre>{msg.text}</pre>
                  </div>
                ))}
                {loading && <div className="tutor-loading"><Loader size={14} className="spin" /> Thinking...</div>}
              </div>
            )}

            {/* Explain-back section */}
            <div className="tutor-explain-back">
              <span className="eyebrow">Explain it back:</span>
              <p className="muted" style={{ fontSize: '.8125rem', margin: '0 0 .5rem' }}>
                Solidify your understanding. Explain why this concept or fix works in your own words.
              </p>
              <form onSubmit={submitExplainBack} className="tutor-explain-form">
                <textarea
                  value={explainBackInput}
                  onChange={(e) => setExplainBackInput(e.target.value)}
                  placeholder="In my own words, this works because..."
                  rows={2}
                  className="tutor-explain-textarea"
                />
                <button type="submit" className="btn btn--sm btn--primary" disabled={loading || !explainBackInput.trim()}>
                  Submit explanation
                </button>
              </form>
              {explainResult && (
                <div className={`tutor-explain-result tutor-explain-result--${explainResult.result}`}>
                  {explainResult.result === 'pass' ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{explainResult.feedback}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
