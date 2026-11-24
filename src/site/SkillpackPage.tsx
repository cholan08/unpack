import { useEffect } from 'react';
import { SiteFooter, SiteHeader } from './SiteHeader';
import { SKILL_TRACKS } from './skillpack/data';
import { SkillIcon } from './skillpack/icons';
import './skillpack.css';

const pad = (n: number) => String(n).padStart(2, '0');
const toolCount = (t: (typeof SKILL_TRACKS)[number]) => t.groups.reduce((n, g) => n + g.tools.length, 0);

export function SkillpackPage() {
  useEffect(() => {
    document.title = 'Skill Pack — Unpacked';
  }, []);

  const total = SKILL_TRACKS.reduce((n, t) => n + toolCount(t), 0);

  return (
    <>
      <SiteHeader />
      <main className="sk-page">
        <section className="sk-hero wrap">
          <span className="sk-kicker">Full stack developer</span>
          <h1 className="display sk-title">
            Skill<em>pack</em>
          </h1>
          <p className="sk-lede">
            The full-stack toolbox, grouped by layer: {SKILL_TRACKS.length} tracks, {total} tools.
          </p>
          <nav className="sk-jump" aria-label="Skill Pack tracks">
            {SKILL_TRACKS.map((t, i) => (
              <a key={t.id} href={`#${t.id}`} className={`sk-chip sk-${t.accent}`}>
                <span className="sk-chip-n">{pad(i + 1)}</span>
                {t.label}
                <span className="sk-chip-count">{toolCount(t)}</span>
              </a>
            ))}
          </nav>
        </section>

        {SKILL_TRACKS.map((track, ti) => (
          <section key={track.id} id={track.id} className={`sk-track wrap sk-${track.accent}`}>
            <header className="sk-track-head">
              <h2 className="display sk-track-title">
                {track.head[0]}
                <em>{track.head[1]}</em>
              </h2>
              <span className="sk-track-pager">
                {ti + 1}/{SKILL_TRACKS.length}
              </span>
            </header>

            {track.groups.map((g, gi) => (
              <div key={g.title} className="sk-group">
                <div className="sk-group-head">
                  <h3>
                    <span className="sk-group-n">{pad(gi + 1)}</span>
                    {g.title}
                  </h3>
                  {g.note && <span className="sk-group-note">{g.note}</span>}
                </div>
                <ul className="sk-grid">
                  {g.tools.map((tool) => (
                    <li key={tool.name} className="sk-tile">
                      <span className="sk-tile-ico">
                        <SkillIcon name={tool.icon} />
                      </span>
                      <span className="sk-tile-text">
                        <span className="sk-tile-name">{tool.name}</span>
                        {tool.sub && <span className="sk-tile-sub">{tool.sub}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
