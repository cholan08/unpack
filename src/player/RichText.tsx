import { createContext, Fragment, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { GlossaryEntry } from '@/engine/types';

/* ---------------- glossary context + floating tooltip ---------------- */
interface Tip {
  entry: GlossaryEntry;
  rect: DOMRect;
}
const GlossaryCtx = createContext<{ glossary: Record<string, GlossaryEntry>; show: (t: Tip | null) => void }>({
  glossary: {},
  show: () => {},
});

export function GlossaryProvider({ glossary, children }: { glossary: Record<string, GlossaryEntry>; children: ReactNode }) {
  const [tip, setTip] = useState<Tip | null>(null);
  useEffect(() => {
    if (!tip) return;
    const hide = () => setTip(null);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [tip]);
  return (
    <GlossaryCtx.Provider value={{ glossary, show: setTip }}>
      {children}
      {tip && createPortal(<TermTip tip={tip} />, document.body)}
    </GlossaryCtx.Provider>
  );
}

function TermTip({ tip }: { tip: Tip }) {
  const W = 300;
  const left = Math.max(12, Math.min(window.innerWidth - W - 12, tip.rect.left + tip.rect.width / 2 - W / 2));
  const above = tip.rect.top > 170;
  const style = above
    ? { left, bottom: window.innerHeight - tip.rect.top + 8, width: W }
    : { left, top: tip.rect.bottom + 8, width: W };
  return (
    <div className="term-tip" style={style} role="tooltip">
      <strong>{tip.entry.term}</strong>
      <span>{tip.entry.def}</span>
    </div>
  );
}

function Term({ k, children }: { k: string; children: ReactNode }) {
  const { glossary, show } = useContext(GlossaryCtx);
  const entry = glossary[k];
  const open = useCallback((e: { currentTarget: HTMLElement }) => entry && show({ entry, rect: e.currentTarget.getBoundingClientRect() }), [entry, show]);
  const close = useCallback(() => show(null), [show]);
  if (!entry) {
    if (import.meta.env.DEV) console.warn(`[content] unknown glossary term "${k}"`);
    return <>{children}</>;
  }
  return (
    <span
      className="term"
      tabIndex={0}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
      onClick={open}
      aria-label={`${entry.term}: ${entry.def}`}
    >
      {children}
    </span>
  );
}

/* ---------------- inline markup ----------------
   **bold**  *italic*  `code`  [[term]]  [[term|shown text]]  {tone:coloured text}
*/
const TOKEN = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[\[[^\]]+\]\]|\{(?:client|server|data|net|auth|danger|warn|ok|neutral):[^}]+\})/g;

export function Rich({ text }: { text: string }) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null;
        if (p.startsWith('**') && p.endsWith('**') && p.length > 4) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="ic">{p.slice(1, -1)}</code>;
        if (p.startsWith('[[') && p.endsWith(']]')) {
          const [k, shown] = p.slice(2, -2).split('|');
          return (
            <Term key={i} k={k.trim()}>
              {shown ?? k}
            </Term>
          );
        }
        if (p.startsWith('{') && p.endsWith('}') && p.includes(':')) {
          const idx = p.indexOf(':');
          return (
            <span key={i} className="tone-text" data-tone={p.slice(1, idx)}>
              {p.slice(idx + 1, -1)}
            </span>
          );
        }
        if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}
