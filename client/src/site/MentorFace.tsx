import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/lib/media';

/**
 * The mentor's face: a little package-shaped robot (an "unpacked" box with a screen for a face).
 * Pure SVG + CSS (see mentor.css). The mood decides the eyes and mouth; the page decides the mood.
 *   idle      blinks, and (with `track`) the eyes follow the cursor
 *   thinking  looks up and to the side while a reply is on its way
 *   happy     closed-eye smile, shown briefly after a reply or on hover
 *   oops      worried brows and a flat mouth, when a request failed
 * Decorative: the name next to it is the accessible label.
 */
export type MentorMood = 'idle' | 'thinking' | 'happy' | 'oops';

/** Pupils may move this many SVG units from centre. */
const LOOK_RANGE = 1.9;

export function MentorFace({ size = 32, mood = 'idle', track = false }: { size?: number; mood?: MentorMood; track?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const reduced = usePrefersReducedMotion();
  const following = track && !reduced && (mood === 'idle' || mood === 'happy');

  // The eyes follow the pointer, a little, when the face is calm.
  useEffect(() => {
    const el = ref.current;
    if (!el || !following) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, dist / 180); // looks all the way only when the cursor is some distance away
      el.style.setProperty('--lx', String((dx / dist) * LOOK_RANGE * reach));
      el.style.setProperty('--ly', String((dy / dist) * LOOK_RANGE * reach));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      el.style.removeProperty('--lx');
      el.style.removeProperty('--ly');
    };
  }, [following]);

  return (
    <svg ref={ref} className="face" data-mood={mood} width={size} height={size} viewBox="0 0 64 64" aria-hidden focusable="false">
      {/* antenna */}
      <path d="M32 14V8" className="face-mast" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="32" cy="6" r="3.4" className="face-bulb" />
      {/* ears */}
      <rect x="1.5" y="29" width="6" height="13" rx="3" className="face-ear" />
      <rect x="56.5" y="29" width="6" height="13" rx="3" className="face-ear" />
      {/* head + shine */}
      <rect x="6" y="13" width="52" height="46" rx="16" className="face-head" />
      <path d="M13 24c2-6 8-9 14-9h10c6 0 12 3 14 9-6-3-12-4-19-4s-13 1-19 4z" className="face-shine" />
      {/* screen */}
      <rect x="12" y="20" width="40" height="33" rx="11" className="face-plate" />
      <circle cx="18" cy="43" r="3.2" className="face-blush" />
      <circle cx="46" cy="43" r="3.2" className="face-blush" />

      {/* eyes */}
      <g className="face-look">
        <g data-m="idle thinking oops" className="face-eyes">
          <g className="face-eye" style={{ transformOrigin: '24px 34px' }}>
            <ellipse cx="24" cy="34" rx="3.5" ry="4.4" className="face-ink" />
            <circle cx="22.9" cy="32.4" r="1.15" className="face-glint" />
          </g>
          <g className="face-eye" style={{ transformOrigin: '40px 34px' }}>
            <ellipse cx="40" cy="34" rx="3.5" ry="4.4" className="face-ink" />
            <circle cx="38.9" cy="32.4" r="1.15" className="face-glint" />
          </g>
        </g>
        <g data-m="happy">
          <path d="M20 35.5q4-7 8 0" className="face-stroke" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d="M36 35.5q4-7 8 0" className="face-stroke" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        </g>
      </g>
      {/* worried brows */}
      <g data-m="oops">
        <path d="M19.5 29l9-2.6" className="face-stroke" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M44.5 29l-9-2.6" className="face-stroke" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      {/* mouth */}
      <path data-m="idle" d="M26.5 44q5.5 5 11 0" className="face-stroke" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <path data-m="happy" d="M24.5 41.5q7.5 11 15 0z" className="face-ink" />
      <ellipse data-m="thinking" cx="32" cy="46" rx="2.6" ry="2.3" className="face-ink" />
      <path data-m="oops" d="M26.5 47q5.5-4 11 0" className="face-stroke" strokeWidth="2.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}
