/**
 * Everything the command palette can find, built once from the content that is already loaded:
 * pages and topics, lessons, gates, glossary terms, common errors, Techpack snippets, Skill Pack
 * tools and notebooks. Commands depend on the moment (theme, progress…) and are built in the UI.
 */
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BookA,
  BookOpen,
  Bug,
  Code2,
  Compass,
  GitBranch,
  House,
  Layers,
  LayoutDashboard,
  Library,
  Lock,
  Map as MapIcon,
  NotebookPen,
  Repeat,
  Route,
  ShieldCheck,
  StickyNote,
  Text,
  Trophy,
} from 'lucide-react';
import type { Course, Tone } from '@/engine/types';
import { COURSES, lessonEntries, type LessonEntry } from '@/content/registry';
import { PILLARS, getPillar } from '@/content/pillars';
import { COMMON_ERRORS } from '@/content/courses/mern/commonErrors';
import { NOTEBOOKS, COVER_ID } from '@/content/notebooks/registry';
import { TECH_SHEETS } from '../techpack/data';
import { TOOL_INDEX } from '../skillpack/lookup';
import { SKILL_ICONS } from '../skillpack/icons';
import { PILLAR_ICON } from '../pillarIcons';
import { prepare, type Prepared } from './match';

export type Kind = 'command' | 'page' | 'lesson' | 'gate' | 'term' | 'error' | 'snippet' | 'tool' | 'notebook' | 'ask';

/** What the preview pane shows for an item (lessons draw their own, richer preview). */
export interface Info {
  eyebrow?: string;
  body?: string;
  /** shown in a monospace box, e.g. an error message */
  mono?: string;
  rows?: { label: string; text: string }[];
  code?: { text: string; lang?: string; note?: string };
}

export interface Item {
  /** Stable id, also what "Recent" remembers. */
  key: string;
  kind: Kind;
  title: string;
  sub?: string;
  /** Where Enter goes. Lessons work it out at the moment (resume vs cover). */
  href?: string;
  run?: () => void;
  icon: LucideIcon;
  /** A Skill Pack brand icon key, drawn instead of `icon`. */
  brand?: string;
  tone?: Tone;
  /** Second key of its "G then …" shortcut. */
  go?: string;
  /** A key combo shown on the row, e.g. ['Ctrl', 'J']. */
  keys?: string[];
  /** Extra words to match (aliases, summary, definition…). */
  hay?: string;
  /** Ranking nudge: navigation beats reference material at equal match quality. */
  boost: number;
  /** How much a match in `hay` counts (long prose matches by accident more often). */
  hayWeight?: number;
  lesson?: { course: Course; entry: LessonEntry };
  info?: Info;
  /** What Enter does, shown in the preview ("Open the lesson"…). */
  cta?: string;
}

export interface Entry {
  item: Item;
  p: Prepared;
}

export const GROUPS: { kind: Kind; label: string; limit: number }[] = [
  { kind: 'command', label: 'Commands', limit: 5 },
  { kind: 'page', label: 'Pages & topics', limit: 5 },
  { kind: 'lesson', label: 'Lessons', limit: 7 },
  { kind: 'gate', label: 'Gates', limit: 3 },
  { kind: 'term', label: 'Glossary', limit: 5 },
  { kind: 'error', label: 'Common errors', limit: 3 },
  { kind: 'snippet', label: 'Techpack', limit: 4 },
  { kind: 'tool', label: 'Skill Pack', limit: 4 },
  { kind: 'notebook', label: 'Notebooks', limit: 4 },
  { kind: 'ask', label: 'Ask the mentor', limit: 1 },
];

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** The site's own pages. `go` is the second key of the "G then …" shortcut (see Hotkeys.tsx). */
export function pageItems(course: Course | undefined): Item[] {
  const c = course?.id ?? 'mern';
  const page = (key: string, title: string, href: string, icon: LucideIcon, hay: string, body: string, go?: string): Item => ({
    key: `page:${key}`,
    kind: 'page',
    title,
    href,
    icon,
    hay,
    go,
    boost: 45,
    info: { eyebrow: 'Page', body },
    cta: `Go to ${title}`,
  });
  return [
    page('home', 'Home', '/', House, 'start hub welcome main', 'Your hub: the lesson to continue, progress by topic and what is due.', 'h'),
    page('start', 'Start Here', '/start', Compass, 'placement check quiz beginner new prerequisites where to begin', 'A 5-minute check that tells you where to begin.', 's'),
    page('me', 'Dashboard', '/me', LayoutDashboard, 'me progress stats streak profile settings ai tutor key no-ai mode', 'Everything you have done so far: streak, gates, topics, and the AI tutor settings.', 'd'),
    page('roadmap', 'Roadmap', `/${c}/roadmap`, Route, 'path map plan journey graph what to learn order', 'Every part and lesson on one map, with what builds on what.', 'r'),
    page('review', 'Review', '/review', Repeat, 'spaced repetition cards flashcards revise practice due remember', 'Short spaced-repetition cards from the lessons you finished.', 'v'),
    page('notes', 'My notes', '/handnote', StickyNote, 'handnote notepad notes write scribble', 'Your own handwritten notepad, saved in this browser.', 'n'),
    page('library', 'Library', '/library', Library, 'reference shelf resources everything', 'The reference shelf: course map, glossary, Techpack, Skill Pack, notebooks and errors.', 'l'),
    page('map', 'Course map', `/${c}`, MapIcon, 'syllabus table of contents all lessons parts curriculum', 'Every part and lesson of the course, with your progress.', 'm'),
    page('glossary', 'Glossary', `/${c}/glossary`, BookA, 'terms definitions dictionary words a-z', 'Every term used in the lessons, A to Z.'),
    page('techpack', 'Techpack', '/techpack', Code2, 'cheat sheets snippets reference code syntax', 'Quick-reference cheat sheets for every technology in the stack.'),
    page('skillpack', 'Skill Pack', '/skillpack', Layers, 'tools tech stack map frameworks libraries ecosystem', 'The full-stack tool map: what each tool is for and where it fits.'),
    page('notebooks', 'Notebooks', '/notebooks', NotebookPen, 'handwritten notes books shelf', 'Hand-drawn notebooks, one per subject.'),
    page('errors', 'Common errors', '/errors', AlertTriangle, 'troubleshooting debug bugs error messages fix stack trace', 'Real error messages, what they mean, and the lesson that explains each.', 'e'),
    page('capstone', 'Capstone: TaskFlow', '/capstone', Trophy, 'project build milestones final taskflow portfolio', 'Build and deploy a full MERN app, one milestone at a time.'),
  ];
}

function topicItems(course: Course | undefined): Item[] {
  return PILLARS.filter((p) => p.id !== 'start').map((p) => {
    const n = course ? lessonEntries(course).filter((e) => e.pillar === p.id && e.meta).length : 0;
    return {
      key: `topic:${p.id}`,
      kind: 'page' as const,
      title: p.label,
      sub: n ? `Topic · ${n} lessons` : 'Topic · coming soon',
      href: `/${p.id}`,
      icon: PILLAR_ICON[p.id],
      tone: p.tone,
      hay: `topic ${p.blurb}`,
      boost: 45,
      info: { eyebrow: 'Topic', body: p.blurb },
      cta: `Open ${p.label}`,
    };
  });
}

/** A brand icon only if the Skill Pack draws one (a few sheets use plain glyphs instead). */
const brandOf = (key: string) => (key in SKILL_ICONS ? key : undefined);
const SHEET_GLYPH: Record<string, LucideIcon> = { git: GitBranch, lock: Lock };

/** Each part of a course, opening the course map at that part: "react" → the whole React part. */
function partItems(course: Course): Item[] {
  const entries = lessonEntries(course);
  return course.parts.map((part) => {
    const n = entries.filter((e) => e.part.id === part.id && e.meta).length;
    return {
      key: `part:${course.id}/${part.id}`,
      kind: 'page' as const,
      title: part.title,
      sub: `Part ${part.num} · ${n} lessons · on the course map`,
      href: `/${course.id}#${part.id}`,
      icon: part.pillar ? PILLAR_ICON[part.pillar] : MapIcon,
      tone: part.tone,
      hay: `part ${part.num} ${part.blurb}`,
      boost: 42,
      info: {
        eyebrow: `Part ${part.num}`,
        body: part.why ?? part.blurb,
        rows: part.outcomes?.length ? [{ label: 'After this part you can', text: part.outcomes.join(' · ') }] : undefined,
      },
      cta: 'Open it on the course map',
    };
  });
}

function lessonItems(course: Course): Item[] {
  return lessonEntries(course)
    .filter((e) => e.meta)
    .map((e) => {
      const m = e.meta!;
      return {
        key: `lesson:${course.id}/${m.id}`,
        kind: 'lesson' as const,
        title: m.title,
        sub: `${e.part.num} · ${e.part.title} · ${m.minutes} min`,
        href: `/${course.id}/${m.id}`,
        icon: BookOpen,
        tone: e.part.tone,
        hay: `${m.summary} ${e.part.title} ${getPillar(e.pillar)?.label ?? ''} ${m.interactive ? 'try it sandbox interactive' : ''}`,
        boost: 40,
        lesson: { course, entry: e },
      };
    });
}

function gateItems(course: Course): Item[] {
  return course.parts.map((part) => ({
    key: `gate:${course.id}/${part.id}`,
    kind: 'gate' as const,
    title: `${part.title} gate`,
    sub: `Part ${part.num} · questions and a small coding task`,
    href: `/${course.id}/gate/${part.id}`,
    icon: ShieldCheck,
    tone: part.tone,
    hay: `gate quiz test exam check assessment part ${part.num} ${part.blurb}`,
    boost: 20,
    info: { eyebrow: `Part ${part.num} gate`, body: `${part.blurb} The gate checks it with a few questions and a small coding task.` },
    cta: 'Open the gate',
  }));
}

function termItems(course: Course): Item[] {
  return Object.entries(course.glossary).map(([k, g]) => ({
    key: `term:${course.id}#${k}`,
    kind: 'term' as const,
    title: g.term,
    sub: g.def,
    href: `/${course.id}/glossary#${k}`,
    icon: Text,
    tone: 'net' as const,
    hay: g.def,
    hayWeight: 0.6,
    boost: 12,
    info: { eyebrow: `Glossary · ${course.short}`, body: g.def },
    cta: 'Open in the glossary',
  }));
}

function errorItems(course: Course): Item[] {
  const TONE: Record<string, Tone> = { browser: 'client', react: 'client', express: 'server', mongo: 'data', auth: 'auth' };
  return COMMON_ERRORS.map((err) => {
    const lesson = course.lessons[err.lessonId];
    return {
      key: `error:${err.id}`,
      kind: 'error' as const,
      title: clip(err.error.split('\n')[0], 140),
      sub: lesson ? `${err.category} · explained in “${lesson.title}”, step ${err.step}` : err.category,
      href: `/${course.id}/${err.lessonId}?s=${err.step}`,
      icon: Bug,
      tone: TONE[err.category] ?? 'danger',
      hay: `${err.category} ${err.meaning} ${err.cause}`,
      hayWeight: 0.8,
      boost: 8,
      info: {
        eyebrow: `Common error · ${err.category}`,
        mono: err.error,
        rows: [
          { label: 'What it means', text: err.meaning },
          { label: 'Usual cause', text: err.cause },
          { label: 'The fix', text: err.solution },
        ],
      },
      cta: lesson ? `Open “${lesson.title}” at step ${err.step}` : 'Open the lesson',
    };
  });
}

function techpackItems(): Item[] {
  const out: Item[] = [];
  for (const sheet of TECH_SHEETS) {
    out.push({
      key: `sheet:${sheet.id}`,
      kind: 'snippet',
      title: `${sheet.name} cheat sheet`,
      sub: sheet.tagline,
      href: `/techpack#tp-${sheet.id}`,
      icon: SHEET_GLYPH[sheet.icon] ?? Code2,
      brand: brandOf(sheet.icon),
      tone: sheet.accent,
      hay: `techpack cheat sheet ${sheet.sections.map((s) => s.title).join(' ')}`,
      boost: 14,
      info: { eyebrow: 'Techpack', body: `${sheet.tagline}. ${sheet.sections.length} sections: ${sheet.sections.map((s) => s.title).join(', ')}.` },
      cta: 'Open the cheat sheet',
    });
    for (const sec of sheet.sections)
      for (const e of sec.entries)
        out.push({
          key: `snippet:${sheet.id}/${sec.title}/${e.title}`,
          kind: 'snippet',
          title: e.title,
          sub: `${sheet.name} › ${sec.title}`,
          href: `/techpack#tp-${sheet.id}`,
          icon: SHEET_GLYPH[sheet.icon] ?? Code2,
          brand: brandOf(sheet.icon),
          tone: sheet.accent,
          hay: `${sheet.name} ${sec.title} ${e.note ?? ''} ${e.code}`,
          hayWeight: 0.6,
          boost: 0,
          info: { eyebrow: `Techpack · ${sheet.name} › ${sec.title}`, code: { text: e.code, lang: e.lang, note: e.note } },
          cta: `Open the ${sheet.name} cheat sheet`,
        });
  }
  return out;
}

function toolItems(): Item[] {
  return [...TOOL_INDEX.values()].map(({ tool, places }) => {
    const where = places.map((p) => `${p.track.label} › ${p.group.title}`).join(' · ');
    return {
      key: `tool:${tool.id}`,
      kind: 'tool' as const,
      title: tool.name,
      sub: tool.sub ? `${tool.sub} · ${where}` : where,
      href: `/skillpack/${tool.id}`,
      icon: Layers,
      brand: brandOf(tool.icon),
      tone: places[0].track.accent,
      hay: `${where} ${tool.sub ?? ''} tool`,
      boost: 10,
      info: { eyebrow: 'Skill Pack', body: `${tool.name}${tool.sub ? ` (${tool.sub})` : ''} sits in ${where}. Its page says what it is for and how it fits the stack.` },
      cta: `Open ${tool.name}`,
    };
  });
}

function notebookItems(): Item[] {
  const out: Item[] = [];
  for (const book of NOTEBOOKS) {
    const written = book.pages.filter((p) => p.written && p.id !== COVER_ID);
    out.push({
      key: `notebook:${book.id}`,
      kind: 'notebook',
      title: book.name,
      sub: `Notebook · ${book.tagline}`,
      href: `/notebooks/${book.id}`,
      icon: NotebookPen,
      tone: getPillar(book.pillar)?.tone,
      hay: `notebook ${book.title} ${book.tagline} ${getPillar(book.pillar)?.label ?? ''}`,
      boost: 8,
      info: { eyebrow: `Notebook · ${book.pages.length - 1} pages`, body: book.tagline, rows: written.length ? [{ label: 'Written so far', text: written.map((p) => p.title).join(' · ') }] : undefined },
      cta: 'Open the notebook',
    });
    for (const page of written)
      out.push({
        key: `npage:${book.id}/${page.id}`,
        kind: 'notebook',
        title: page.title,
        sub: `${book.title} notebook · page ${page.num}`,
        href: `/notebooks/${book.id}/${page.id}`,
        icon: NotebookPen,
        tone: getPillar(book.pillar)?.tone,
        hay: `${book.title} ${(page.outline ?? []).join(' ')}`,
        hayWeight: 0.8,
        boost: 2,
        info: { eyebrow: `${book.name} · page ${page.num}`, rows: page.outline?.length ? [{ label: 'On this page', text: page.outline.join(' · ') }] : undefined },
        cta: 'Open the page',
      });
  }
  return out;
}

let cache: Entry[] | undefined;

/** Every static item, prepared for matching. Built on first use. */
export function staticEntries(): Entry[] {
  if (cache) return cache;
  const course = COURSES[0];
  const items: Item[] = [
    ...pageItems(course),
    ...topicItems(course),
    ...COURSES.flatMap((c) => [...partItems(c), ...lessonItems(c), ...gateItems(c), ...termItems(c)]),
    ...(course ? errorItems(course) : []),
    ...techpackItems(),
    ...toolItems(),
    ...notebookItems(),
  ];
  // keys must be unique (React rows, "Recent"): number any repeat instead of trusting the content
  const seen = new Map<string, number>();
  for (const item of items) {
    const n = seen.get(item.key) ?? 0;
    seen.set(item.key, n + 1);
    if (n) item.key = `${item.key}~${n}`;
  }
  cache = items.map((item) => ({ item, p: prepare(item.title, item.hay) }));
  return cache;
}
