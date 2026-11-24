/** Small presentational pieces shared by every page. Styles: site.css (`ui-` prefix) and base.css. */
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { motion, type Transition } from 'motion/react';
import { usePrefersReducedMotion } from '@/lib/media';

/** The feel of every gliding highlight: quick, settles without wobble. */
export const GLIDE: Transition = { type: 'spring', stiffness: 520, damping: 42, mass: 0.85 };

/**
 * A highlight that glides to wherever it is rendered next. Render one inside the *active* item of a
 * group (sidebar link, tab, step…) with the same `id`; when another item becomes active, the
 * highlight slides from the old one to the new one instead of blinking. Style it with `className`
 * (it is absolutely positioned behind the item's content). Instant when the OS asks for less motion.
 */
export function Glide({ id, className }: { id: string; className?: string }) {
  const reduced = usePrefersReducedMotion();
  return <motion.span layoutId={id} className={className} aria-hidden transition={reduced ? { duration: 0 } : GLIDE} />;
}

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="logo" aria-label="Unpacked — home">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="9" className="logo-bg" />
        <path d="M8 11h7v10H8z" fill="none" stroke="var(--client)" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M17 11h7v10h-7z" fill="none" stroke="var(--server)" strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx="16" cy="16" r="2.4" fill="var(--data)" />
      </svg>
      <span>Unpacked</span>
    </Link>
  );
}

/**
 * Progress ring. Colour comes from --tone (set data-tone on it or a parent).
 * `pct` is 0..1. Children are drawn in the middle (an icon, or a number).
 */
export function Ring({ pct, size = 18, stroke = 2.5, children, label }: { pct: number; size?: number; stroke?: number; children?: ReactNode; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, pct));
  return (
    <span className="ui-ring" style={{ width: size, height: size }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ui-ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="ui-ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={`${p > 0 ? Math.max(c * p, stroke) : 0} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <span className="ui-ring-in">{children}</span>}
    </span>
  );
}

/** The header every page opens with: eyebrow, title, one-line lede, actions on the right. */
export function PageHead({
  eyebrow,
  title,
  lede,
  actions,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="page-head-text">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="page-title">{title}</h1>
        {lede && <p className="page-lede">{lede}</p>}
        {children}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export const fmtHours = (minutes: number) => (minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 6) / 10} h`);
