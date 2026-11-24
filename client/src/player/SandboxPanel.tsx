import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useId } from 'react';
import { formatControl, fromSlider, sliderSpan, toSlider } from '@/engine/sandbox';
import type { Control, ControlValue, Sandbox, SandboxResult, Values } from '@/engine/types';
import { Rich } from './RichText';

type Range = Extract<Control, { kind: 'range' }>;

function RangeControl({ c, value, set }: { c: Range; value: number; set: (v: number) => void }) {
  const id = useId();
  const text = formatControl(c, value);
  const pos = toSlider(c, value);
  const lo = c.log ? 0 : c.min;
  const hi = c.log ? sliderSpan : c.max;
  return (
    <div className="sb-row sb-range">
      <label htmlFor={id} className="sb-label">
        {c.label}
        <output htmlFor={id} className="sb-value">
          {text}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={c.log ? 0 : c.min}
        max={c.log ? sliderSpan : c.max}
        step={c.log ? 1 : (c.step ?? 1)}
        value={pos}
        aria-valuetext={text}
        onChange={(e) => set(fromSlider(c, Number(e.target.value)))}
        style={{ '--fill': `${((pos - lo) / (hi - lo)) * 100}%` } as React.CSSProperties}
      />
    </div>
  );
}

function ToggleControl({ c, value, set }: { c: Extract<Control, { kind: 'toggle' }>; value: boolean; set: (v: boolean) => void }) {
  return (
    <div className="sb-row sb-toggle">
      <span className="sb-label">{c.label}</span>
      <button className="sb-switch" role="switch" aria-checked={value} aria-label={c.label} onClick={() => set(!value)}>
        <i />
        <span>{value ? 'on' : 'off'}</span>
      </button>
    </div>
  );
}

function ChoiceControl({ c, value, set }: { c: Extract<Control, { kind: 'choice' }>; value: string; set: (v: string) => void }) {
  const idx = c.options.findIndex((o) => o.value === value);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    e.stopPropagation(); // arrows pick an option here, not the next lesson step
    const next = (idx + (e.key === 'ArrowRight' ? 1 : -1) + c.options.length) % c.options.length;
    set(c.options[next].value);
    (e.currentTarget.children[next] as HTMLElement | undefined)?.focus();
  };
  return (
    <div className="sb-row sb-choice-row">
      <span className="sb-label">{c.label}</span>
      <div className="sb-choice" role="radiogroup" aria-label={c.label} onKeyDown={onKey}>
        {c.options.map((o) => (
          <button key={o.value} role="radio" aria-checked={o.value === value} tabIndex={o.value === value ? 0 : -1} onClick={() => set(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SandboxPanel({
  sandbox,
  values,
  result,
  onChange,
  onReset,
  changed,
}: {
  sandbox: Sandbox;
  values: Values;
  result: SandboxResult;
  onChange: (id: string, v: ControlValue) => void;
  onReset: () => void;
  changed: boolean;
}) {
  return (
    <section className="sandbox" aria-label="Try it: interactive diagram">
      <div className="sandbox-head">
        <SlidersHorizontal size={16} aria-hidden />
        <span className="eyebrow">Interactive</span>
        <button className="sandbox-reset" onClick={onReset} disabled={!changed} aria-label="Reset to the starting values">
          <RotateCcw size={13} /> Reset
        </button>
      </div>
      {sandbox.intro && (
        <p className="sandbox-intro">
          <Rich text={sandbox.intro} />
        </p>
      )}
      <div className="sandbox-controls">
        {sandbox.controls.map((c) =>
          c.kind === 'range' ? (
            <RangeControl key={c.id} c={c} value={Number(values[c.id])} set={(v) => onChange(c.id, v)} />
          ) : c.kind === 'toggle' ? (
            <ToggleControl key={c.id} c={c} value={values[c.id] === true} set={(v) => onChange(c.id, v)} />
          ) : (
            <ChoiceControl key={c.id} c={c} value={String(values[c.id])} set={(v) => onChange(c.id, v)} />
          ),
        )}
      </div>
      {result.note && (
        <p className="sandbox-note" data-tone={result.tone ?? 'neutral'} aria-live="polite">
          <Rich text={result.note} />
        </p>
      )}
    </section>
  );
}
