/**
 * /build — the Build door: "I want to build ___" (docs/VISION.md §4).
 *
 * Describe a product in your own words, or start from an idea. What it does (features) decides the
 * chapters it needs; they are listed in reading order, each with the reason, its status and your
 * progress, and the first one to open. The build is kept in this browser, so Home and the chapter
 * pages can show "your build". `?idea=<id>`, `?q=<text>` and `?add=<feature>` start one from a link.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowRight, Bot, Check, Hammer, PencilRuler, X } from 'lucide-react';
import { CRAFT, FEATURES, IDEAS } from '@/content/doors';
import { chapterNum, getChapter } from '@/content/manual';
import { COURSES } from '@/content/registry';
import { useProgress, useSettings } from '@/lib/progress';
import { MENTOR_NAME, openMentorWith, useMentorPage } from '@/lib/mentor';
import { Ring } from '../ui';
import { StatusPill, chapterTone } from '../manual/shared';
import { prefetchLessonPage } from '../prefetch';
import { EMPTY_BUILD, buildName, planOf, setBuildState, toggleFeature, useBuildState, viewOf, type BuildState, type Plan, type PlanRow } from './model';
import '../manual/manual.css';
import './doors.css';

const course = COURSES[0];

export function BuildPage() {
  const progress = useProgress();
  const settings = useSettings();
  const s = useBuildState();
  const plan = useMemo(() => planOf(s, progress), [s, progress]);
  const [params, setParams] = useSearchParams();
  const input = useRef<HTMLInputElement>(null);

  // A link can start a build: ?idea=shop, ?q=a booking site, ?add=realtime (added to the build you have)
  useEffect(() => {
    const idea = IDEAS.find((i) => i.id === params.get('idea'));
    const q = params.get('q');
    const add = params.get('add')?.split(',').filter((id) => FEATURES.some((f) => f.id === id)) ?? [];
    if (!idea && q === null && !add.length) return;
    const base: BuildState = idea ? { ...EMPTY_BUILD, text: idea.phrase } : q !== null ? { ...EMPTY_BUILD, text: q } : s;
    setBuildState({
      ...base,
      adds: [...new Set([...base.adds, ...add])],
      removes: base.removes.filter((id) => !add.includes(id)),
    });
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.title = 'Build — Unpacked';
  }, []);
  const name = buildName(s, plan);
  useMentorPage({
    kind: 'build planner',
    title: `Build: planning ${name}`,
    stepTitle: `Features: ${plan.features.filter((f) => f.on).map((f) => f.feature.label).join('; ') || 'none yet'}`,
    stepBody: `Chapters it needs: ${plan.rows.map((r) => `${chapterNum(r.chapter.id)} ${r.chapter.title} (${r.status})`).join('; ')}`,
  });

  const set = (next: Partial<BuildState>) => setBuildState({ ...s, ...next });
  const on = plan.features.filter((f) => f.on);

  const ask = () =>
    openMentorWith(
      `I want to build ${name}. It should: ${on.map((f) => f.feature.label.toLowerCase()).join('; ') || 'just show a page'}.\n` +
        `Help me cut it down to a first version I could ship soon: what to keep, what to leave for later, and which of these chapters to read first — ` +
        plan.rows.map((r) => r.chapter.title).join(', ') +
        '.',
    );

  return (
    <main className="dr dr-build">
      <div className="wrap">
        <header className="dr-head">
          <span className="eyebrow" data-tone="warn">
            <Hammer size={14} /> Build
          </span>
          <div className="dr-ask">
            <h1 className="page-title">
              <label htmlFor="build-what">I want to build</label>
            </h1>
            <div className="dr-ask-field">
              <input
                id="build-what"
                ref={input}
                value={s.text}
                onChange={(e) => set({ text: e.target.value })}
                placeholder="a booking site for a salon"
                autoComplete="off"
                spellCheck={false}
                maxLength={140}
              />
              {s.text && (
                <button
                  className="btn btn--ghost btn--icon dr-ask-clear"
                  aria-label="Start again"
                  onClick={() => {
                    setBuildState(EMPTY_BUILD);
                    input.current?.focus();
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
          <p className="page-lede">
            Say it in your own words, or start from an idea. You’ll see what it needs to do, the chapters that teach each part, and where to start.
          </p>
        </header>

        <section className="dr-ideas" aria-label="Start from an idea">
          {IDEAS.map((idea) => {
            const Icon = idea.icon;
            return (
              <button
                key={idea.id}
                className="dr-idea"
                aria-pressed={plan.idea?.id === idea.id}
                title={idea.pitch}
                onClick={() => setBuildState({ ...EMPTY_BUILD, text: idea.phrase })}
              >
                <Icon size={15} /> {idea.title}
              </button>
            );
          })}
        </section>

        <div className="dr-build-grid">
          <section className="dr-features card" aria-labelledby="feat-h">
            <h2 id="feat-h" className="dr-h2">
              What should it do?
            </h2>
            {plan.idea && <p className="dr-small">{plan.idea.pitch}</p>}
            <ul>
              {plan.features.map((f) => {
                const Icon = f.feature.icon;
                const tag = f.on ? (f.byYou ? 'you added this' : f.fromWords ? 'from your words' : 'usual for this idea') : f.fromIdea || f.fromWords ? 'you took this out' : undefined;
                return (
                  <li key={f.feature.id}>
                    <button className="dr-feat" role="switch" aria-checked={f.on} onClick={() => setBuildState(toggleFeature(s, f))}>
                      <span className="dr-feat-box" aria-hidden>
                        {f.on && <Check size={13} strokeWidth={3} />}
                      </span>
                      <Icon size={16} className="dr-feat-ico" aria-hidden />
                      <span className="dr-feat-text">
                        {f.feature.label}
                        {tag && <span className="dr-feat-tag">{tag}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <PlanView plan={plan} name={name} ai={!settings.noAiMode} onAsk={ask} />
        </div>
      </div>
    </main>
  );
}

function PlanView({ plan, name, ai, onAsk }: { plan: Plan; name: string; ai: boolean; onAsk: () => void }) {
  const progress = useProgress();
  const study = plan.idea?.study;
  const studyLesson = study && 'lesson' in study ? course?.lessons[study.lesson] : undefined;
  const craft = CRAFT.flatMap((n) => {
    const c = getChapter(n.chapter);
    return c ? [{ ...viewOf(c, progress), why: n.why }] : [];
  });

  return (
    <section className="dr-plan" aria-labelledby="plan-h">
      <header className="dr-plan-head" aria-live="polite">
        <h2 id="plan-h" className="dr-h2">
          {plan.rows.length} chapters for <span className="dr-plan-name">{name}</span>
        </h2>
        <p className="dr-small">
          {plan.ready} ready to read{plan.planned > 0 && ` · ${plan.planned} still being written`}
          {plan.finished > 0 && ` · ${plan.finished} finished`}. In reading order: each one builds on the ones above it.
        </p>
        {plan.start && (
          <Link to={plan.start.href} className="btn btn--primary dr-plan-start">
            Start with chapter {chapterNum(plan.start.chapter.id)}: {plan.start.chapter.title} <ArrowRight size={15} />
          </Link>
        )}
      </header>

      <ol className="dr-rows">
        {plan.rows.map((r) => (
          <li key={r.chapter.id}>
            <PlanRowLink r={r} start={plan.start?.chapter.id === r.chapter.id} />
          </li>
        ))}
      </ol>

      <div className="dr-craft">
        <h3 className="mn-h3">
          <PencilRuler size={15} /> How you’ll work on it
        </h3>
        <div className="dr-craft-grid">
          {craft.map((c) => (
            <Link key={c.chapter.id} to={c.href} className="dr-craft-item" data-tone={chapterTone(c.chapter)} data-status={c.status}>
              <strong>{c.chapter.title}</strong>
              <span>{c.why}</span>
              <StatusPill c={c.chapter} />
            </Link>
          ))}
        </div>
      </div>

      {(studyLesson || (study && 'href' in study)) && (
        <Link
          to={studyLesson && course ? `/${course.id}/${studyLesson.id}` : (study as { href: string }).href}
          className="dr-study card"
          onMouseEnter={() => studyLesson && course && prefetchLessonPage(course, studyLesson.id)}
        >
          <span className="eyebrow">See one designed end to end</span>
          <strong>{studyLesson ? `${studyLesson.title} · ${studyLesson.minutes} min lesson` : (study as { label: string }).label}</strong>
          <ArrowRight size={16} className="mn-go" />
        </Link>
      )}

      {ai && (
        <button className="btn dr-ask-ai" onClick={onAsk}>
          <Bot size={15} /> Ask {MENTOR_NAME} to cut it down to a first version
        </button>
      )}
    </section>
  );
}

function PlanRowLink({ r, start }: { r: PlanRow; start: boolean }) {
  return (
    <Link to={r.href} className="dr-row" data-tone={chapterTone(r.chapter)} data-status={r.status} data-finished={r.finished || undefined}>
      <span className="dr-row-num mono">{String(chapterNum(r.chapter.id)).padStart(2, '0')}</span>
      <span className="mn-row-ico" aria-hidden>
        <r.chapter.glyph size={17} />
      </span>
      <span className="dr-row-text">
        <span className="dr-row-title">
          {r.chapter.title}
          {start && <span className="dr-row-start">Start here</span>}
        </span>
        <span className="dr-row-why">{r.why.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('. ')}.</span>
      </span>
      <span className="dr-row-side">
        {r.finished ? (
          <span className="dr-tick" title="Every lesson finished">
            <Check size={13} strokeWidth={3} />
          </span>
        ) : r.ready > 0 ? (
          <span className="mn-row-prog" title={`${r.done} of ${r.ready} lessons finished`}>
            <Ring pct={r.pct} size={20} stroke={2.4} />
            <span className="mono">
              {r.done}/{r.ready}
            </span>
          </span>
        ) : null}
        <StatusPill c={r.chapter} />
      </span>
    </Link>
  );
}
