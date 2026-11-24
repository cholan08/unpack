/** /skillpack/:toolId — every topic in one tool, top to bottom, laid out like the Skill Pack itself. */
import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { NotFound } from './NotFound';
import { SkillIcon } from './skillpack/icons';
import { neighbours, TOOL_INDEX, toolHref } from './skillpack/lookup';
import { topicIcon } from './skillpack/topicIcon';
import { TOOL_TOPICS, topicCount } from './skillpack/topics';
import './skillpack.css';

const pad = (n: number) => String(n).padStart(2, '0');

export function SkillToolPage() {
  const { toolId = '' } = useParams();
  const entry = TOOL_INDEX.get(toolId);
  const sections = TOOL_TOPICS[toolId];

  useEffect(() => {
    if (entry) document.title = `${entry.tool.name} topics — Skill Pack — Unpacked`;
  }, [entry]);

  if (!entry || !sections) return <NotFound />;

  const { tool, places } = entry;
  const { prev, next } = neighbours(toolId);
  const total = topicCount(toolId);
  let n = 0; // running topic number across sections

  return (
    <main className={`sk-page sk-${places[0].track.accent}`}>
      <section className="sk-hero wrap">
        <Link to="/skillpack" className="skt-back">
          <ArrowLeft size={15} aria-hidden />
          Skill Pack
        </Link>
        <div className="skt-hero">
          <span className="skt-logo">
            <SkillIcon name={tool.icon} size={46} />
          </span>
          <div className="skt-hero-text">
            <span className="sk-kicker">{places.map((p) => `${p.track.label} · ${p.group.title}`).join('  /  ')}</span>
            <h1 className="display sk-title skt-title">{tool.name}</h1>
          </div>
        </div>
        <p className="sk-lede">
          {sections.length} sections, {total} topics. Learn them top to bottom.
        </p>
        <nav className="sk-jump" aria-label={`${tool.name} sections`}>
          {sections.map((s, i) => (
            <a key={s.title} href={`#s-${i + 1}`} className="sk-chip">
              <span className="sk-chip-n">{pad(i + 1)}</span>
              {s.title}
              <span className="sk-chip-count">{s.topics.length}</span>
            </a>
          ))}
        </nav>
      </section>

      {sections.map((s, si) => (
        <section key={s.title} id={`s-${si + 1}`} className="sk-group skt-section wrap" aria-labelledby={`s-${si + 1}-h`}>
          <div className="sk-group-head">
            <h2 id={`s-${si + 1}-h`}>
              <span className="sk-group-n">{pad(si + 1)}</span>
              {s.title}
            </h2>
            <span className="sk-group-note">{s.topics.length} topics</span>
          </div>
          <ol className="sk-grid skt-grid">
            {s.topics.map((t) => {
              n += 1;
              return (
                <li key={t} className="sk-tile skt-topic">
                  <span className="skt-ico">{topicIcon(t, s.title, toolId)}</span>
                  <span className="sk-tile-text">
                    <span className="sk-tile-name">{t}</span>
                    <span className="sk-tile-sub">Topic {pad(n)}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <nav className="skt-pager wrap" aria-label="Other tools">
        {prev ? (
          <Link to={toolHref(prev.id)} className="sk-tile skt-step">
            <ArrowLeft size={16} aria-hidden />
            <span className="sk-tile-ico">
              <SkillIcon name={prev.icon} />
            </span>
            <span className="sk-tile-text">
              <span className="sk-tile-sub">Previous</span>
              <span className="sk-tile-name">{prev.name}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={toolHref(next.id)} className="sk-tile skt-step skt-step--next">
            <span className="sk-tile-text">
              <span className="sk-tile-sub">Next</span>
              <span className="sk-tile-name">{next.name}</span>
            </span>
            <span className="sk-tile-ico">
              <SkillIcon name={next.icon} />
            </span>
            <ArrowRight size={16} aria-hidden />
          </Link>
        )}
      </nav>
    </main>
  );
}
