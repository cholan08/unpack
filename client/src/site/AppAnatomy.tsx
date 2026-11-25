/**
 * "How one app works" — the whole stack on one page, for someone who has never seen it.
 *
 * It follows ONE click ("Add todo: Buy milk") through the real layers: the person, the frontend,
 * the network, the backend (router → middleware → logic → model), the database — and back. Each
 * step lights up the boxes and wires involved, shows the plain-words story, and the real code
 * that does it. Below it, the supporting cast: frameworks, tools, DevOps and AI.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  Boxes,
  Braces,
  Database,
  Layers,
  LayoutTemplate,
  Pause,
  Play,
  Rocket,
  Route,
  Server,
  ShieldCheck,
  Sparkles,
  Cog,
  User,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import type { Tone } from '@/engine/types';
import { CodeLines } from '@/lib/highlight';
import { usePrefersReducedMotion } from '@/lib/media';
import './appAnatomy.css';

type NodeId = 'user' | 'ui' | 'state' | 'call' | 'router' | 'mw' | 'logic' | 'model' | 'db';
type LinkId = 'uf' | 'fb' | 'bd';
type Dir = 'req' | 'res';

interface Step {
  title: string;
  /** Which layer this happens in, for the badge. */
  where: { label: string; tone: Tone };
  /** The story in everyday words. */
  plain: string;
  /** The real code (or wire format) behind it. */
  code: string;
  lang: string;
  nodes: NodeId[];
  links: [LinkId, Dir][];
}

const STEPS: Step[] = [
  {
    title: 'You click “Add”',
    where: { label: 'Person', tone: 'neutral' },
    plain: 'It starts with a person. You type “Buy milk” into a page and press a button. Everything below exists to answer that one click.',
    code: `<input value={title} onChange={…} />\n<button onClick={() => addTodo(title)}>\n  Add\n</button>`,
    lang: 'jsx',
    nodes: ['user', 'ui'],
    links: [['uf', 'req']],
  },
  {
    title: 'The page reacts instantly',
    where: { label: 'Frontend · in your browser', tone: 'client' },
    plain: 'The frontend is the code that runs in your browser. It shows the new item straight away, then packs the data up and asks the server to save it.',
    code: `async function addTodo(title) {\n  setTodos([...todos, { title }]);   // show it now\n  await fetch('/api/todos', {\n    method: 'POST',\n    body: JSON.stringify({ title }),\n  });\n}`,
    lang: 'jsx',
    nodes: ['ui', 'state', 'call'],
    links: [],
  },
  {
    title: 'The request crosses the network',
    where: { label: 'Network · HTTP', tone: 'net' },
    plain: 'The browser sends a small text message over the internet: what you want (POST /api/todos), who you are (a token), and the data (the title).',
    code: `POST /api/todos HTTP/1.1\nAuthorization: Bearer eyJhbGciOi…\nContent-Type: application/json\n\n{ "title": "Buy milk" }`,
    lang: 'http',
    nodes: ['call'],
    links: [['fb', 'req']],
  },
  {
    title: 'The server’s front door',
    where: { label: 'Backend · Express', tone: 'server' },
    plain: 'The backend is a program that is always running on a computer. Its router reads the address and picks the right handler. Before that handler runs, middleware checks the guest list: logged in? valid data?',
    code: `app.post(\n  '/api/todos',\n  requireAuth,          // who are you?\n  validate(todoSchema), // is the data sane?\n  createTodo,           // do the work\n);`,
    lang: 'js',
    nodes: ['router', 'mw'],
    links: [],
  },
  {
    title: 'Your logic runs',
    where: { label: 'Backend · business logic', tone: 'server' },
    plain: 'This is where your app’s rules live: tidy the title, attach the owner, decide what is allowed. It is ordinary code — the part you write.',
    code: `async function createTodo(req, res) {\n  const title = req.body.title.trim();\n  const todo = await Todo.create({\n    title,\n    owner: req.user.id,\n  });\n  res.status(201).json(todo);\n}`,
    lang: 'js',
    nodes: ['logic'],
    links: [],
  },
  {
    title: 'Ask the database to save it',
    where: { label: 'Database · MongoDB', tone: 'data' },
    plain: 'The server never keeps data in its own memory — it would vanish on a restart. A model translates your object into a database command, and the database writes it to disk.',
    code: `// Mongoose turns Todo.create(…) into:\ndb.todos.insertOne({\n  title: "Buy milk",\n  owner: "u_42",\n  done: false,\n})`,
    lang: 'js',
    nodes: ['model', 'db'],
    links: [['bd', 'req']],
  },
  {
    title: 'The database answers',
    where: { label: 'Database · MongoDB', tone: 'data' },
    plain: 'Saved. The database hands back the stored item, now with its own permanent id.',
    code: `{\n  _id: "65f2a9…",   // the database made this\n  title: "Buy milk",\n  done: false,\n}`,
    lang: 'js',
    nodes: ['db', 'model'],
    links: [['bd', 'res']],
  },
  {
    title: 'The response travels back',
    where: { label: 'Network · HTTP', tone: 'net' },
    plain: 'The server replies with a status (201 means “created”) and the saved item as JSON. The request is finished; the server goes back to waiting for the next one.',
    code: `HTTP/1.1 201 Created\nContent-Type: application/json\n\n{ "_id": "65f2a9…", "title": "Buy milk", "done": false }`,
    lang: 'http',
    nodes: ['logic'],
    links: [['fb', 'res']],
  },
  {
    title: 'The screen updates',
    where: { label: 'Frontend · React', tone: 'client' },
    plain: 'The frontend swaps its guess for the real saved item. React notices the state changed and redraws only what is different — and you see “Buy milk” on the list.',
    code: `const saved = await res.json();\nsetTodos((list) =>\n  list.map((t) => (t.pending ? saved : t)),\n);\n// React re-renders the list`,
    lang: 'jsx',
    nodes: ['state', 'ui', 'user'],
    links: [['uf', 'res']],
  },
];

/* ---------------- the diagram ---------------- */

interface NodeDef {
  icon: typeof Server;
  name: string;
  text: string;
  tag?: string;
}

const NODES: Record<Exclude<NodeId, 'user'>, NodeDef> = {
  ui: { icon: LayoutTemplate, name: 'Screen', text: 'Buttons, lists and forms, built from small components.', tag: 'React' },
  state: { icon: Braces, name: 'State', text: 'What the page remembers right now, like the todo list.' },
  call: { icon: Zap, name: 'API call', text: 'Sends a request to the server and waits for the reply.', tag: 'fetch' },
  router: { icon: Route, name: 'Router', text: 'Reads the address and picks the handler.', tag: 'Express' },
  mw: { icon: ShieldCheck, name: 'Middleware', text: 'Checks before the work: logged in? valid data?' },
  logic: { icon: Cog, name: 'Business logic', text: 'Your rules, in plain code.', tag: 'Node.js' },
  model: { icon: Layers, name: 'Model', text: 'Describes the data and talks to the database.', tag: 'Mongoose' },
  db: { icon: Database, name: 'Database', text: 'Keeps every record safe on disk.', tag: 'MongoDB' },
};

function Node({ id, on }: { id: Exclude<NodeId, 'user'>; on: boolean }) {
  const n = NODES[id];
  const I = n.icon;
  return (
    <li className="an-node" data-on={on || undefined}>
      <span className="an-node-ic">
        <I size={15} strokeWidth={2.1} />
      </span>
      <span className="an-node-tx">
        <strong>
          {n.name}
          {n.tag && <em className="mono">{n.tag}</em>}
        </strong>
        <span>{n.text}</span>
      </span>
    </li>
  );
}

/** The wires between two layers: one lane going out (request), one coming back (response). */
function Wire({ id, label, sub, dirs }: { id: LinkId; label: string; sub: string; dirs: Dir[] }) {
  return (
    <div className="an-wire" data-wire={id} aria-hidden>
      <span className="an-wire-lbl mono">{label}</span>
      <span className="an-lane" data-dir="req" data-on={dirs.includes('req') || undefined}>
        <i />
      </span>
      <span className="an-lane" data-dir="res" data-on={dirs.includes('res') || undefined}>
        <i />
      </span>
      <span className="an-wire-sub">{sub}</span>
    </div>
  );
}

function Zone({
  tone,
  title,
  kicker,
  where,
  to,
  active,
  children,
}: {
  tone: Tone;
  title: string;
  kicker: string;
  where: string;
  to: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <section className="an-zone" data-tone={tone} data-active={active || undefined}>
      <header>
        <span className="an-zone-k">{kicker}</span>
        <h3>{title}</h3>
        <span className="an-zone-w">{where}</span>
      </header>
      <ul>{children}</ul>
      <Link to={to} className="an-zone-go">
        Learn {title.toLowerCase()} <ArrowRight size={13} />
      </Link>
    </section>
  );
}

/* ---------------- the supporting cast ---------------- */

const CAST: {
  tone: Tone;
  icon: typeof Server;
  title: string;
  lede: string;
  to: string;
  items: [string, string][];
}[] = [
  {
    tone: 'client',
    icon: Boxes,
    title: 'Frameworks',
    lede: 'A ready-made skeleton. It decides the structure; you fill in the logic.',
    to: '/frontend',
    items: [
      ['React', 'draws the screen from state'],
      ['Express', 'receives requests and routes them'],
      ['Mongoose', 'shapes and checks database data'],
    ],
  },
  {
    tone: 'neutral',
    icon: Wrench,
    title: 'Tools',
    lede: 'Helpers you use while building. They are not part of the running app.',
    to: '/frontend',
    items: [
      ['npm', 'installs other people’s code'],
      ['Vite', 'bundles your files for the browser'],
      ['DevTools', 'lets you watch every request'],
    ],
  },
  {
    tone: 'net',
    icon: Rocket,
    title: 'DevOps',
    lede: 'Everything that gets the code to users and keeps it alive.',
    to: '/devops',
    items: [
      ['Git', 'remembers every version of your code'],
      ['Docker', 'packs the app so it runs anywhere'],
      ['CI/CD & hosting', 'test, deploy and run it online'],
    ],
  },
  {
    tone: 'ai',
    icon: Sparkles,
    title: 'AI / ML',
    lede: 'An optional extra brain your backend can call, like any other service.',
    to: '/aiml',
    items: [
      ['LLM API', 'the server asks a model a question'],
      ['Embeddings', 'turn meaning into searchable numbers'],
      ['Vector search', 'find “similar”, not just “equal”'],
    ],
  },
];

/* ---------------- section ---------------- */

export function AppAnatomy() {
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const root = useRef<HTMLElement>(null);
  const touched = useRef(false); // once the learner takes over, never auto-start again
  const step = STEPS[i];

  // Start playing the first time the section scrolls into view — unless the learner prefers reduced motion.
  useEffect(() => {
    const el = root.current;
    if (!el || reduced || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !touched.current) {
          setPlaying(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setI((n) => (n + 1) % STEPS.length), 6500);
    return () => clearTimeout(t);
  }, [playing, i]);

  const go = (n: number) => {
    touched.current = true;
    setPlaying(false);
    setI((n + STEPS.length) % STEPS.length);
  };
  const toggle = () => {
    touched.current = true;
    setPlaying((p) => !p);
  };

  const on = (id: NodeId) => step.nodes.includes(id);
  const dirs = (id: LinkId): Dir[] => step.links.filter(([l]) => l === id).map(([, d]) => d);
  const zoneOn = (ids: NodeId[]) => ids.some(on);

  return (
    <section className="wrap hm-sec an" ref={root} aria-labelledby="an-h">
      <div className="sec-head">
        <h2 id="an-h">How one app works, start to finish</h2>
        <p>Follow a single click through every layer.</p>
      </div>

      <div className="an-board card">
        <div className="an-diagram" data-step={i}>
          {/* the person */}
          <div className="an-user" data-on={on('user') || undefined}>
            <span className="an-user-ic">
              <User size={20} strokeWidth={2.1} />
            </span>
            <strong>You</strong>
            <span>click, type, look at the screen</span>
          </div>

          <Wire id="uf" label="screen" sub="what you see" dirs={dirs('uf')} />

          <Zone tone="client" kicker="Layer 1" title="Frontend" where="runs in your browser" to="/frontend" active={zoneOn(['ui', 'state', 'call'])}>
            <Node id="ui" on={on('ui')} />
            <Node id="state" on={on('state')} />
            <Node id="call" on={on('call')} />
          </Zone>

          <Wire id="fb" label="HTTP" sub="requests · JSON" dirs={dirs('fb')} />

          <Zone tone="server" kicker="Layer 2" title="Backend" where="runs on a server" to="/backend" active={zoneOn(['router', 'mw', 'logic', 'model'])}>
            <Node id="router" on={on('router')} />
            <Node id="mw" on={on('mw')} />
            <Node id="logic" on={on('logic')} />
            <Node id="model" on={on('model')} />
          </Zone>

          <Wire id="bd" label="query" sub="read · write" dirs={dirs('bd')} />

          <Zone tone="data" kicker="Layer 3" title="Database" where="stores data on disk" to="/database" active={zoneOn(['db'])}>
            <Node id="db" on={on('db')} />
            <li className="an-docs" data-on={on('db') || undefined} aria-label="Example records">
              <span className="an-docs-h mono">todos</span>
              <span className="mono">{'{ title: "Learn MERN" }'}</span>
              <span className="mono">{'{ title: "Call mom" }'}</span>
              <span className="mono an-doc-new">{'{ title: "Buy milk" }'}</span>
            </li>
          </Zone>
        </div>

        {/* the story of the current step. Every step is laid out in the same grid cell and only the
            current one is shown, so the box is always as tall as the tallest step and the page below
            it never jumps when the step changes. */}
        <div className="an-story" data-tone={step.where.tone}>
          <div className="an-story-copy">
            <span className="an-story-k">
              <i aria-hidden />
              Step {i + 1} of {STEPS.length} · {step.where.label}
            </span>
            <div className="an-stack" aria-live="polite">
              {STEPS.map((s, n) => (
                <div key={s.title} className="an-story-tx" data-on={n === i || undefined} aria-hidden={n !== i || undefined}>
                  <h3>{s.title}</h3>
                  <p>{s.plain}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="an-code an-stack">
            {STEPS.map((s, n) => (
              <div key={s.title} className="an-code-step" data-on={n === i || undefined} aria-hidden={n !== i || undefined}>
                <CodeLines code={s.code} lang={s.lang} numbers={false} />
              </div>
            ))}
          </div>
        </div>

        <div className="an-ctl">
          <button type="button" className="btn btn--sm btn--icon" onClick={() => go(i - 1)} aria-label="Previous step">
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="btn btn--sm" onClick={toggle} aria-pressed={playing}>
            {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="btn btn--sm btn--icon" onClick={() => go(i + 1)} aria-label="Next step">
            <ChevronRight size={16} />
          </button>
          <ol className="an-dots" aria-label="Steps">
            {STEPS.map((s, n) => (
              <li key={s.title}>
                <button type="button" onClick={() => go(n)} data-on={n === i || undefined} data-done={n < i || undefined} aria-label={`Step ${n + 1}: ${s.title}`} aria-current={n === i || undefined}>
                  {playing && n === i && !reduced && <b key={i} className="an-dot-fill" aria-hidden />}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="an-cast-head">
        <span className="eyebrow">Around the app</span>
        <p>
          The diagram is the app itself. These are the things that <strong>build it, shape it and ship it</strong>.
        </p>
      </div>
      <div className="an-cast">
        {CAST.map((c) => {
          const I = c.icon;
          return (
            <Link key={c.title} to={c.to} className="an-card spot" data-tone={c.tone}>
              <span className="an-card-ic">
                <I size={17} strokeWidth={2.1} />
              </span>
              <h3>{c.title}</h3>
              <p>{c.lede}</p>
              <dl>
                {c.items.map(([k, v]) => (
                  <div key={k}>
                    <dt className="mono">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
