import { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { Search } from 'lucide-react';
import { useSearch } from './Search';
import { COURSES } from '@/content/registry';
import { ThemeToggle } from './ThemeToggle';
import { usePrefersReducedMotion } from '@/lib/media';

/**
 * Magnetic side-nav: tabs near the cursor slide out (closest one most) and
 * get a pointer-following glow. Writes --pull (0..1) and --mx/--my per tab;
 * the look lives in notebook.css. Home page, wide screens only.
 */
function useMagneticNav(enabled: boolean) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = ref.current;
    if (!enabled || !nav) return;
    const wide = window.matchMedia('(min-width: 1101px)');
    let frame = 0;
    let x = -1e4;
    let y = -1e4;
    const links = () => Array.from(nav.querySelectorAll<HTMLAnchorElement>('a'));
    const reset = () => links().forEach((a) => a.style.setProperty('--pull', '0'));
    const paint = () => {
      frame = 0;
      if (!wide.matches) return reset();
      for (const a of links()) {
        const r = a.getBoundingClientRect();
        const dy = (y - (r.top + r.height / 2)) / 46;
        const dx = Math.max(0, r.left - x);
        const pull = Math.exp(-dy * dy) * Math.max(0, 1 - dx / 240);
        a.style.setProperty('--pull', pull.toFixed(3));
        a.style.setProperty('--mx', `${x - r.left}px`);
        a.style.setProperty('--my', `${y - r.top}px`);
      }
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onLeave = () => {
      x = y = -1e4;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      reset();
    };
  }, [enabled]);
  return ref;
}

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Unpacked — home">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" className="logo-bg" />
        <path d="M8 11h7v10H8z" fill="none" stroke="var(--client)" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M17 11h7v10h-7z" fill="none" stroke="var(--server)" strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx="16" cy="16" r="2.4" fill="var(--data)" />
      </svg>
      <span>Unpacked</span>
    </Link>
  );
}

export function SiteHeader() {
  const { open } = useSearch();
  const reduced = usePrefersReducedMotion();
  const navRef = useMagneticNav(useLocation().pathname === '/' && !reduced);
  return (
    <header className="site-header">
      <div className="wrap site-header-in">
        <Logo />
        <nav ref={navRef} className="site-nav" aria-label="Main">
          <NavLink to="/start">Start Here</NavLink>
          {COURSES.map((c) => (
            <NavLink key={c.id} to={`/${c.id}`} end>
              {c.short}
            </NavLink>
          ))}
          {COURSES[0] && <NavLink to={`/${COURSES[0].id}/roadmap`}>Roadmap</NavLink>}
          <NavLink to="/skillpack">Skill Pack</NavLink>
          <NavLink to="/techpack">Techpack</NavLink>
          <NavLink to="/notebooks">Notebooks</NavLink>
          <NavLink to="/handnote">Handnote</NavLink>
          <NavLink to="/capstone">Capstone</NavLink>
          <NavLink to="/review">Review</NavLink>
          <NavLink to="/errors">Errors</NavLink>
          <NavLink to="/me">Dashboard</NavLink>
          {COURSES[0] && <NavLink to={`/${COURSES[0].id}/glossary`}>Glossary</NavLink>}
        </nav>
        <button className="search-btn" onClick={open} aria-label="Search lessons and terms">
          <Search size={15} />
          <span>Search</span>
          <kbd>⌘K</kbd>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer-in">
        <Logo />
        <p className="muted">Full-stack development, one animated diagram at a time. Progress is stored only in your browser.</p>
      </div>
    </footer>
  );
}
