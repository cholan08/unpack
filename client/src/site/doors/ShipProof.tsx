/**
 * "It's live — here's the link": the proof that a build was shipped (docs/VISION.md §5).
 * Used at the end of a chapter's Build it section (first ship) and of a problem brief. The link is
 * kept in this browser with the learner's progress; levels read it.
 */
import { useRef, useState, type FormEvent } from 'react';
import { Check, ExternalLink, Globe, Rocket } from 'lucide-react';
import { removeShip, saveShip, useShips } from '@/lib/progress';
import { confetti } from '@/lib/confetti';
import { toast } from '@/lib/toast';
import { usePrefersReducedMotion } from '@/lib/media';
import './doors.css';

export function ShipProof({ id, label, hint, done }: { id: string; label: string; hint: string; done?: string }) {
  const ship = useShips()[id];
  const reduced = usePrefersReducedMotion();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [bad, setBad] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const first = !ship;
    if (!saveShip(id, draft)) {
      setBad(true);
      return;
    }
    setBad(false);
    setEditing(false);
    setDraft('');
    toast(first ? (done ?? 'Saved. It’s live — that counts.') : 'Link updated');
    if (first && !reduced) {
      const r = button.current?.getBoundingClientRect();
      confetti(r ? { x: r.left + r.width / 2, y: r.top } : { x: window.innerWidth / 2, y: window.innerHeight * 0.6 });
    }
  };

  if (ship && !editing)
    return (
      <div className="dr-ship card" data-state="shipped">
        <span className="dr-ship-ico" aria-hidden>
          <Check size={18} strokeWidth={3} />
        </span>
        <div className="dr-ship-text">
          <span className="eyebrow">Shipped · {new Date(ship.at).toLocaleDateString()}</span>
          <a href={ship.url} target="_blank" rel="noopener noreferrer" className="dr-ship-link">
            {ship.url.replace(/^https:\/\//, '').replace(/\/$/, '')} <ExternalLink size={13} />
          </a>
        </div>
        <div className="dr-ship-acts">
          <button className="btn btn--sm btn--ghost" onClick={() => setEditing(true)}>
            Change
          </button>
          <button className="btn btn--sm btn--ghost" onClick={() => removeShip(id)}>
            Remove
          </button>
        </div>
      </div>
    );

  return (
    <form className="dr-ship card" onSubmit={submit} data-state="open">
      <span className="dr-ship-ico" aria-hidden>
        <Rocket size={18} />
      </span>
      <div className="dr-ship-text">
        <label htmlFor={`ship-${id}`} className="dr-ship-label">
          {label}
        </label>
        <p className="dr-ship-hint">{hint}</p>
        <div className="dr-ship-row">
          <span className="dr-ship-field">
            <Globe size={15} aria-hidden />
            <input
              id={`ship-${id}`}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setBad(false);
              }}
              placeholder="https://your-page.netlify.app"
              inputMode="url"
              autoComplete="url"
              spellCheck={false}
              aria-invalid={bad || undefined}
              aria-describedby={bad ? `ship-${id}-bad` : undefined}
            />
          </span>
          <button ref={button} type="submit" className="btn btn--primary btn--sm" disabled={!draft.trim()}>
            {ship ? 'Update' : 'It’s live'}
          </button>
          {ship && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
          )}
        </div>
        {bad && (
          <p className="dr-ship-bad" id={`ship-${id}-bad`} role="alert">
            That needs to be a public <code>https://</code> link anyone can open — not localhost, and not a file on your computer.
          </p>
        )}
      </div>
    </form>
  );
}
