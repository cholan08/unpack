/**
 * A soft glow that follows the pointer across cards. Give a card the `spot` class (styles in
 * site.css); one passive listener for the whole app sets --mx/--my on the card under the pointer.
 * Skipped on touch screens, where there is no hover to follow.
 */
let installed = false;

export function installSpotlight() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let current: HTMLElement | null = null;
  window.addEventListener(
    'pointermove',
    (e) => {
      const el = e.target instanceof Element ? (e.target.closest('.spot') as HTMLElement | null) : null;
      if (el !== current) {
        current?.removeAttribute('data-spot');
        current = el;
        el?.setAttribute('data-spot', '');
      }
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    },
    { passive: true },
  );
  // leaving the window: let the glow fade
  document.addEventListener('pointerleave', () => {
    current?.removeAttribute('data-spot');
    current = null;
  });
}
