/** /library — reference material for the whole stack, in one place. */
import { useEffect } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, ArrowRight, BookA, Code2, Layers, Map, NotebookPen, type LucideIcon } from 'lucide-react';
import type { Tone } from '@/engine/types';
import { COURSES, lessonEntries } from '@/content/registry';
import { NOTEBOOKS } from '@/content/notebooks/registry';
import { COMMON_ERRORS } from '@/content/courses/mern/commonErrors';
import { SKILL_TRACKS } from './skillpack/data';
import { TECH_SHEETS } from './techpack/data';
import { PageHead } from './ui';
import './topic.css';

interface Shelf {
  to: string;
  icon: LucideIcon;
  title: string;
  sub: string;
  count: string;
  tone: Tone;
}

function shelves(): { title: string; items: Shelf[] }[] {
  const learn: Shelf[] = [];
  for (const c of COURSES) {
    learn.push({ to: `/${c.id}`, icon: Map, title: 'Course map', sub: `${c.short}: every lesson, in course order.`, count: `${lessonEntries(c).length} lessons · ${c.parts.length} parts`, tone: 'client' });
    learn.push({ to: `/${c.id}/glossary`, icon: BookA, title: 'Glossary', sub: 'Every term used in the lessons, A to Z.', count: `${Object.keys(c.glossary).length} terms`, tone: 'net' });
  }
  const tools = SKILL_TRACKS.reduce((n, t) => n + t.groups.reduce((m, g) => m + g.tools.length, 0), 0);
  return [
    { title: 'Find your way', items: learn },
    {
      title: 'Copy & look up',
      items: [
        { to: '/techpack', icon: Code2, title: 'Techpack', sub: 'Copy-ready snippets for the things you write every day.', count: `${TECH_SHEETS.length} sheets`, tone: 'server' },
        { to: '/errors', icon: AlertTriangle, title: 'Common errors', sub: 'Error messages you will meet, what they mean and how to fix them.', count: `${COMMON_ERRORS.length} errors`, tone: 'danger' },
        { to: '/skillpack', icon: Layers, title: 'Skill Pack', sub: 'The full-stack toolbox, grouped by layer.', count: `${tools} tools · ${SKILL_TRACKS.length} tracks`, tone: 'data' },
      ],
    },
    {
      title: 'Revise',
      items: [
        { to: '/notebooks', icon: NotebookPen, title: 'Notebooks', sub: 'Handwritten, exam-style study notes with diagrams.', count: `${NOTEBOOKS.length} ${NOTEBOOKS.length === 1 ? 'notebook' : 'notebooks'}`, tone: 'warn' },
      ],
    },
  ];
}

export function LibraryPage() {
  useEffect(() => {
    document.title = 'Library — Unpacked';
  }, []);
  return (
    <main className="wrap library">
      <PageHead eyebrow="Reference" title="Library" lede="Look things up, copy a snippet, revise before an exam or an interview. Everything here works alongside the lessons." />
      {shelves().map((s) => (
        <section key={s.title} className="lib-sec">
          <h2 className="lib-h">{s.title}</h2>
          <div className="lib-grid">
            {s.items.map(({ to, icon: Icon, title, sub, count, tone }) => (
              <Link key={to} to={to} className="lib-item card" data-tone={tone}>
                <span className="lib-icon">
                  <Icon size={20} strokeWidth={2.1} aria-hidden />
                </span>
                <span className="lib-text">
                  <strong>{title}</strong>
                  <span>{sub}</span>
                </span>
                <span className="lib-count mono">{count}</span>
                <ArrowRight size={16} className="lib-go" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
