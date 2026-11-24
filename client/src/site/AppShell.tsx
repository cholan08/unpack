/**
 * The app shell around every page except the lesson player (which is full screen).
 *  - Wide screens: a sidebar that is always there — what to do next, the main topics with
 *    their progress, your own path, and the reference shelf.
 *  - Narrow screens: a top bar; the same sidebar slides in as a drawer.
 * Routes render inside <AppLayout/> via <Outlet/>; pages only render their own content.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  BookA,
  BrainCircuit,
  Code2,
  Compass,
  Hammer,
  House,
  Layers,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  Monitor,
  NotebookPen,
  Repeat,
  Rocket,
  Route,
  Search,
  Server,
  Database,
  StickyNote,
  X,
  type LucideIcon,
} from 'lucide-react';
import { COURSES } from '@/content/registry';
import { MAIN_PILLARS, getPillar } from '@/content/pillars';
import type { PillarId, Tone } from '@/engine/types';
import { useDueReviews, useProgress } from '@/lib/progress';
import { useMediaQuery } from '@/lib/media';
import { useSearch } from './Search';
import { ThemeToggle } from './ThemeToggle';
import { continueTarget, statsFor } from './learner';
import { prefetchLessonPage } from './prefetch';
import { Glide, Logo, Ring } from './ui';

export const PILLAR_ICON: Record<PillarId, LucideIcon> = {
  start: Compass,
  frontend: Monitor,
  backend: Server,
  database: Database,
  devops: Rocket,
  aiml: BrainCircuit,
  projects: Hammer,
};

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
      <Link to="/start" className="side-next" data-kind="start">
        <span className="side-next-eyebrow">New here?</span>
        <span className="side-next-title">Start with a 5-minute check</span>
        <span className="side-next-sub">
          Find where to begin <ArrowRight size={13} />
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
  const progress = useProgress();
  const due = useDueReviews().length;
  const { open: openSearch } = useSearch();
  const course = COURSES[0];
  const ref = useRef<HTMLElement>(null);

  // Drawer: move focus in when it opens; Escape closes it.
  useEffect(() => {
    if (!drawer || !open) return;
    ref.current?.querySelector<HTMLElement>('.side-close')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer, open, onClose]);

  const projects = getPillar('projects')!;
  const p = statsFor('projects', progress);

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

      <button className="side-search" onClick={openSearch}>
        <Search size={15} />
        <span>Search lessons & terms</span>
        <kbd>/</kbd>
      </button>

      <ContinueCard />

      <nav className="side-nav" aria-label="Main">
        <Item to="/" icon={House} label="Home" active={pathname === '/'} />
        <Item to="/start" icon={Compass} label="Start Here" active={under(pathname, '/start')} />

        <h2 className="side-h">Topics</h2>
        {MAIN_PILLARS.map((t) => {
          const s = statsFor(t.id, progress);
          return (
            <Item
              key={t.id}
              to={`/${t.id}`}
              icon={PILLAR_ICON[t.id]}
              label={t.label}
              tone={t.tone}
              ring={s.pct}
              meta={s.ready ? `${s.done}/${s.ready}` : 'soon'}
              active={under(pathname, `/${t.id}`)}
              title={t.blurb}
            />
          );
        })}
        <Item
          to="/projects"
          icon={PILLAR_ICON.projects}
          label={projects.label}
          tone={projects.tone}
          ring={p.pct}
          meta={`${p.done}/${p.ready}`}
          active={under(pathname, '/projects', '/capstone')}
          title={projects.blurb}
        />

        <h2 className="side-h">Your path</h2>
        {course && <Item to={`/${course.id}/roadmap`} icon={Route} label="Roadmap" active={under(pathname, `/${course.id}/roadmap`)} />}
        <Item to="/me" icon={LayoutDashboard} label="Dashboard" active={under(pathname, '/me')} />
        <Item to="/review" icon={Repeat} label="Review" badge={due} active={under(pathname, '/review')} />
        <Item to="/handnote" icon={StickyNote} label="My notes" active={under(pathname, '/handnote')} />

        <h2 className="side-h">
          <Link to="/library" aria-current={pathname === '/library' ? 'page' : undefined}>
            Library
          </Link>
        </h2>
        {course && <Item to={`/${course.id}`} icon={MapIcon} label="Course map" active={pathname === `/${course.id}`} />}
        {course && <Item to={`/${course.id}/glossary`} icon={BookA} label="Glossary" active={under(pathname, `/${course.id}/glossary`)} />}
        <Item to="/techpack" icon={Code2} label="Techpack" active={under(pathname, '/techpack')} />
        <Item to="/skillpack" icon={Layers} label="Skill Pack" active={under(pathname, '/skillpack')} />
        <Item to="/notebooks" icon={NotebookPen} label="Notebooks" active={under(pathname, '/notebooks')} />
        <Item to="/errors" icon={AlertTriangle} label="Common errors" active={under(pathname, '/errors')} />
      </nav>

      <p className="side-foot">Your progress is saved in this browser only.</p>
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
            <button className="btn btn--ghost btn--icon" onClick={openSearch} aria-label="Search lessons and terms">
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
            <span>Unpacked — full-stack development, one animated diagram at a time.</span>
            <span>
              Press <kbd>/</kbd> to search · <kbd>?</kbd> in a lesson for shortcuts
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
