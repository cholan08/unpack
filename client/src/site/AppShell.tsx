/**
 * The app shell around every page except the lesson player (which is full screen).
 *  - Wide screens: a sidebar that is always there, kept short on purpose (docs/VISION.md §2: three
 *    doors, not fourteen) — what to do next, the Manual and its doors, your own path, and the shelf.
 *  - Narrow screens: a top bar; the same sidebar slides in as a drawer.
 * Routes render inside <AppLayout/> via <Outlet/>; pages only render their own content.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Hammer,
  House,
  LayoutDashboard,
  Library,
  Menu,
  Repeat,
  Route,
  Search,
  StickyNote,
  Telescope,
  X,
  type LucideIcon,
} from 'lucide-react';
import { COURSES } from '@/content/registry';
import { PILLARS } from '@/content/pillars';
import type { Tone } from '@/engine/types';
import { useDueReviews, useProgress } from '@/lib/progress';
import { useMediaQuery } from '@/lib/media';
import { useSearch } from './Search';
import { ThemeToggle } from './ThemeToggle';
import { continueTarget } from './learner';
import { prefetchLessonPage } from './prefetch';
import { PILLAR_ICON } from './pillarIcons';
import { Glide, Logo, Ring } from './ui';
import { goHint, MOD_KEY } from './Hotkeys';
import { MAKER } from './AboutPage';

// kept here too: pages import the topic icons from the shell
export { PILLAR_ICON };

const under = (path: string, ...roots: string[]) => roots.some((r) => path === r || path.startsWith(`${r}/`));

/* ---------------- nav item ---------------- */

function Item({
  to,
  icon: Icon,
  label,
  active,
  tone,
  ring,
  meta,
  badge,
  title,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  tone?: Tone;
  /** 0..1: draws the icon inside a progress ring */
  ring?: number;
  meta?: ReactNode;
  badge?: number;
  title?: string;
}) {
  // "G then D" style shortcut, shown on hover where the item has no meta of its own
  const hint = goHint(to);
  return (
    <Link to={to} className="side-item" data-tone={tone} aria-current={active ? 'page' : undefined} title={title}>
      {/* one highlight for the whole sidebar: it glides from the old page's item to the new one */}
      {active && <Glide id="side-active" className="side-glide" />}
      {ring !== undefined ? (
        <Ring pct={ring} size={22} stroke={2.2}>
          <Icon size={11} strokeWidth={2.4} />
        </Ring>
      ) : (
        <span className="side-ico">
          <Icon size={16} strokeWidth={2} />
        </span>
      )}
      <span className="side-label">{label}</span>
      {badge ? (
        <span className="side-badge" aria-label={`${badge} due`}>
          {badge}
        </span>
      ) : meta !== undefined ? (
        <span className="side-meta">{meta}</span>
      ) : hint ? (
        <span className="side-keys" aria-hidden>
          <kbd>G</kbd>
          <kbd>{hint.toUpperCase()}</kbd>
        </span>
      ) : null}
    </Link>
  );
}

/* ---------------- continue card ---------------- */

function ContinueCard() {
  const progress = useProgress();
  const t = continueTarget(progress);
  if (!t) return null;
  if (t.kind === 'start')
    return (
      <Link to={t.href} className="side-next" data-kind="start">
        <span className="side-next-eyebrow">New here?</span>
        <span className="side-next-title">Start from zero</span>
        <span className="side-next-sub">
          Follow the path <ArrowRight size={13} />
        </span>
      </Link>
    );
  const warm = () => t.lesson && prefetchLessonPage(t.course, t.lesson.id);
  const pct = t.step && t.total ? t.step / t.total : 0;
  return (
    <Link to={t.href} className="side-next" data-kind={t.kind} data-tone={t.part?.tone} onMouseEnter={warm} onFocus={warm}>
      <span className="side-next-eyebrow">{t.kind === 'resume' ? 'Continue' : 'Up next'}</span>
      <span className="side-next-title">{t.lesson!.title}</span>
      {t.kind === 'resume' && t.total ? (
        <span className="side-next-progress">
          <span className="bar bar--sm">
            <i style={{ width: `${pct * 100}%` }} />
          </span>
          <span className="mono">
            {t.step}/{t.total}
          </span>
        </span>
      ) : (
        <span className="side-next-sub">
          {t.part ? `${t.part.num} · ${t.part.title}` : ''} <ArrowRight size={13} />
        </span>
      )}
    </Link>
  );
}

/* ---------------- sidebar ---------------- */

function Sidebar({ open, onClose, drawer }: { open: boolean; onClose: () => void; drawer: boolean }) {
  const { pathname } = useLocation();
  const due = useDueReviews().length;
  const { open: openSearch } = useSearch();
  const c = COURSES[0]?.id ?? 'mern';
  const ref = useRef<HTMLElement>(null);

  // Drawer: move focus in when it opens; Escape closes it.
  useEffect(() => {
    if (!drawer || !open) return;
    ref.current?.querySelector<HTMLElement>('.side-close')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer, open, onClose]);

  // The shelf holds the reference pages and the topic pages (topics are a filter now, not the way in).
  const topics = PILLARS.filter((p) => p.id !== 'start').map((p) => `/${p.id}`);
  const onShelf = pathname === `/${c}` || under(pathname, '/library', '/techpack', '/skillpack', '/notebooks', '/errors', `/${c}/glossary`, ...topics);

  return (
    <motion.aside
      ref={ref}
      layoutScroll
      id="site-nav"
      className="side"
      data-open={open || undefined}
      aria-label="Site"
      aria-hidden={drawer && !open ? true : undefined}
    >
      <div className="side-top">
        <Logo />
        {drawer ? (
          <button className="btn btn--ghost btn--icon side-close" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        ) : (
          <ThemeToggle />
        )}
      </div>

      <button className="side-search" onClick={() => openSearch()} aria-keyshortcuts="/ Control+K Meta+K">
        <Search size={15} />
        <span>Search or jump to…</span>
        <kbd>{MOD_KEY === '⌘' ? '⌘K' : '/'}</kbd>
      </button>

      <ContinueCard />

      <nav className="side-nav" aria-label="Main">
        <Item to="/" icon={House} label="Home" active={pathname === '/'} />

        <h2 className="side-h">The Manual</h2>
        <Item to="/manual" icon={BookOpen} label="All chapters" active={under(pathname, '/manual', '/capstone')} title="Every problem a product meets, one chapter each" />
        <Item to="/explore" icon={Telescope} label="Explore" tone="net" active={under(pathname, '/explore')} title="How does ___ work? A feed of curiosity questions" />
        <Item to="/build" icon={Hammer} label="Build" tone="warn" active={under(pathname, '/build')} title="I want to build ___ — the chapters it needs" />

        <h2 className="side-h">Your path</h2>
        <Item to="/path" icon={Route} label="Path" tone="ok" active={under(pathname, '/path', '/start', `/${c}/roadmap`)} title="Teach me from zero — the guided route" />
        <Item to="/me" icon={LayoutDashboard} label="Dashboard" active={under(pathname, '/me')} />
        <Item to="/review" icon={Repeat} label="Review" badge={due} active={under(pathname, '/review')} />
        <Item to="/handnote" icon={StickyNote} label="My notes" active={under(pathname, '/handnote')} />

        <h2 className="side-h">The shelf</h2>
        <Item
          to="/library"
          icon={Library}
          label="Library"
          active={onShelf}
          title="Course map, glossary, Techpack, Skill Pack, notebooks, common errors and the topic pages"
        />
      </nav>

      <p className="side-foot">
        Your progress is saved in this browser only. <Link to="/about">Why Unpacked?</Link>
      </p>
    </motion.aside>
  );
}

/* ---------------- frame ---------------- */

/** The shell around any content (used by the layout route, and by 404s outside it). */
export function AppFrame({ children }: { children: ReactNode }) {
  const drawer = !useMediaQuery('(min-width: 1080px)');
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { open: openSearch } = useSearch();

  // close the drawer on navigation, or when the screen grows past the breakpoint
  useEffect(() => setOpen(false), [pathname, drawer]);
  // no page scroll behind an open drawer
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="app">
      {drawer && (
        <header className="topbar">
          <button className="btn btn--ghost btn--icon" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="site-nav">
            <Menu size={19} />
          </button>
          <Logo />
          <div className="topbar-tools">
            <button className="btn btn--ghost btn--icon" onClick={() => openSearch()} aria-label="Search or jump to">
              <Search size={18} />
            </button>
            <ThemeToggle />
          </div>
        </header>
      )}
      <Sidebar open={open} onClose={() => setOpen(false)} drawer={drawer} />
      {drawer && open && <div className="side-scrim" onClick={() => setOpen(false)} aria-hidden />}
      <div className="app-main">
        {/* pages render their own <main> */}
        <div className="app-content">{children}</div>
        <footer className="app-foot">
          <div className="wrap app-foot-in">
            <span>
              Unpacked — full-stack development, one animated diagram at a time.{' '}
              <span className="made-by">
                Built by&nbsp;<Link to="/about">{MAKER.name}</Link>
              </span>
            </span>
            <span>
              Press <kbd>/</kbd> to search or jump anywhere · <kbd>?</kbd> for shortcuts
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <AppFrame>
      <Outlet />
    </AppFrame>
  );
}
