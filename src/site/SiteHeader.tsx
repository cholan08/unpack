import { Link, NavLink } from 'react-router';
import { Search } from 'lucide-react';
import { useSearch } from './Search';
import { COURSES } from '@/content/registry';
import { ThemeToggle } from './ThemeToggle';

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
  return (
    <header className="site-header">
      <div className="wrap site-header-in">
        <Logo />
        <nav className="site-nav" aria-label="Main">
          {COURSES.map((c) => (
            <NavLink key={c.id} to={`/${c.id}`} end>
              {c.short}
            </NavLink>
          ))}
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
