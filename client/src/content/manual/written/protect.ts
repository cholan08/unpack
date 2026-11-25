/**
 * Chapter: Control access and stay safe (authorization & security).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You log in to a shop and open your order: `/orders/1042`. Out of curiosity you change it to `/orders/1043`. Should you be looking at a stranger’s name and address now?',
      'On a surprising number of real sites, people have. Being logged in only proves *who you are*. Every request still has to answer a second question: *may this person do this, to this thing?* And while honest users click buttons, others send requests your buttons never would — scripts hidden in comments, forged requests from other sites, a thousand password guesses a minute.',
      'How does an app decide what each person may do — and stay standing when someone tries to break it?',
    ],
    predict: {
      q: 'Your app hides the Delete button from everyone except admins. Is deleting safe now?',
      options: [
        'Yes — normal users can’t see the button',
        'Only if the frontend also checks the user’s role',
        'No — anyone can send the delete request directly, so the server must check',
        'Yes, as long as the user has to be logged in',
      ],
      answer: 2,
      reveal:
        'No. A button is just a picture of a request. Anyone can open DevTools or use `curl` and send `DELETE /api/posts/7` themselves. Hiding it is good *design*; the **server** checking the user’s role and ownership on every request is the *security*. Two checks, every time: who are you — and may you do this?',
    },
  },

  idea: {
    lede: 'Every app that holds anything worth protecting does the same five jobs, whatever it is built with.',
    jobs: [
      {
        title: 'Check permission on every request',
        text: 'After *who are you* ([[authentication]]) comes *may you do this* ([[authorization]]): a role check, and an ownership check — is this record yours?',
      },
      {
        title: 'Never trust input',
        text: 'Validate everything that comes in, keep only the fields you expect, and never let input become code — not in a page, not in a query.',
      },
      {
        title: 'Show text as text',
        text: 'Whatever users write is displayed as text, never run as code. That single habit stops most [[xss|XSS]].',
      },
      {
        title: 'Refuse forged requests',
        text: 'Cookies travel with requests made by other sites too. [[same-site|SameSite]] cookies and origin checks make sure a request really came from your app ([[csrf|CSRF]]).',
      },
      {
        title: 'Limit, hide and watch',
        text: 'Rate-limit anything that can be abused, keep secrets out of the code and out of the browser, and log what happens so you notice when something is wrong.',
      },
    ],
    picture:
      'An office building. The badge at the entrance proves who you are (authentication). Then every door checks whether *your* badge opens *that* room (authorization) — a “Staff only” sign on a door stops nobody. Parcels are scanned before they come in (validation). And if someone tries a hundred badges on one door in a minute, the door locks and security gets a call (rate limits and logs).',
  },

  lessonNotes: {
    'authn-authz': 'Job 1: who you are versus what you may do — roles, ownership, 401 versus 403, and why hiding a button isn’t security.',
    'web-attacks': 'Jobs 3 and 4: stored XSS, CSRF and injection, and the defaults that stop each one.',
    'protected-routes': 'Job 1 on both sides: the server is the real gate; the frontend only decides what to show.',
    validation: 'Job 2: validate every input at the edge, keep only what you expect, and stop NoSQL injection.',
    'rate-limiting': 'Job 5: limit each client, so one script can’t flood your API or guess passwords all day.',
    config: 'Job 5: secrets in environment variables — never in Git, and never in the frontend.',
  },

  options: {
    lede: 'Security has no single tool. The big design choice is *how you decide permissions*; the last option is the set of defaults every app turns on regardless.',
    items: [
      {
        name: 'Roles (RBAC)',
        what: 'Users get roles — admin, editor, member — and each role allows a set of actions.',
        pickWhen: 'Most products: a few kinds of users with clearly different powers.',
        cost: 'Roles multiply as the product grows, and roles alone can’t express “only your own”.',
        examples: 'A `role` field plus a `requireRole(\'admin\')` middleware; CASL; built into most auth services',
      },
      {
        name: 'Ownership and attributes (ABAC)',
        what: 'Decisions use facts about the user and the record: is it yours, is it in your team, is it published?',
        pickWhen: 'Any app where people have their own data — nearly all of them — usually together with roles.',
        cost: 'The rules spread through the code unless you keep them in one place.',
        examples: 'Scoped queries (`{ owner: req.user.id }`), policy functions, CASL',
      },
      {
        name: 'Rules inside the database',
        what: 'The database itself filters rows by the current user, so even a check you forgot in your code can’t leak data.',
        pickWhen: 'Backend-as-a-service apps, or whenever the client talks to the database directly.',
        cost: 'The rules are easy to get subtly wrong — and must be tested like code.',
        examples: 'PostgreSQL Row Level Security (used by Supabase), Firebase Security Rules',
        tools: ['postgresql'],
      },
      {
        name: 'A permissions service (ReBAC)',
        what: 'Permissions as a graph of users, teams, folders and documents, answered by a dedicated service.',
        pickWhen: 'Google-Docs-style sharing: nested teams, inherited access, “shared with you”.',
        cost: 'Another service to run, and to keep in step with your data.',
        examples: 'OpenFGA, SpiceDB, Oso, Permit.io',
      },
      {
        name: 'Security defaults — always on',
        what: 'Input validation, output escaping, SameSite cookies, security headers, rate limits, secrets management, dependency updates.',
        pickWhen: 'Every app, from the first day.',
        cost: 'A little setup — far less than one incident.',
        examples: 'Zod, helmet, express-rate-limit, a Content Security Policy, Dependabot and `npm audit`',
        tools: ['express'],
      },
    ],
    choose: [
      { when: 'A few kinds of users with clearly different powers', pick: 'Roles, checked by middleware on the server.' },
      { when: 'People with their own data', pick: 'Ownership checks in every query — on top of roles.' },
      { when: 'The client talks straight to the database (Supabase, Firebase)', pick: 'Database rules (Row Level Security or Security Rules) — and tests for them.' },
      { when: 'Sharing, teams and nested folders', pick: 'A relationship-based permissions service.' },
      { when: 'Any app at all', pick: 'The always-on defaults: validation, escaping, SameSite cookies, security headers, rate limits.' },
    ],
  },

  modern: {
    lede: 'AI-generated code works on the happy path — the one where every user is honest. Security lives on the other paths, and attackers now use AI too, to find and try them faster. Your job is to ask “what if someone sends something else?” for every route, and to check the answers yourself.',
    defaults: [
      'Deny by default: every API route needs a logged-in user unless you explicitly mark it public.',
      'Check role *and* ownership on the server for every read, change and delete.',
      'Validate all input with a schema; render user content as text; never build queries from raw input.',
      'Cookies `httpOnly`, `secure` and `sameSite`; security headers (for example with `helmet`) and a Content Security Policy.',
      'Rate-limit login, sign-up, password reset and anything expensive.',
      'Secrets in environment variables, nothing secret in frontend code, and dependencies kept up to date (Dependabot, `npm audit`).',
    ],
    aiGood: [
      'Reviewing a route when you ask “how could this be abused?”',
      'Writing authorization middleware and policy functions',
      'Writing tests where user B tries to read and change user A’s data',
      'Explaining an attack — XSS, CSRF, injection — using your own code',
      'Setting up security headers and a Content Security Policy',
    ],
    aiWrong: [
      { mistake: 'Checks that the user is logged in, but not that the record is theirs.', fix: 'Scope every query by owner, and test it with a second user ([[idor|IDOR]]).' },
      { mistake: 'Trusts a `role` or `userId` sent by the client.', fix: 'Take identity only from the verified session or token.' },
      { mistake: 'Enforces permissions only in the interface.', fix: 'The server checks every request; the interface just hides what you can’t do.' },
      { mistake: 'Renders user HTML with `dangerouslySetInnerHTML` or `innerHTML`.', fix: 'Render it as text; if HTML is truly needed, sanitise it (DOMPurify).' },
      { mistake: 'Builds SQL or MongoDB queries from raw input.', fix: 'Parameterised queries, and input whose types are checked first.' },
      { mistake: 'Puts API keys in frontend code or in `VITE_` variables.', fix: 'Everything in the bundle is public. Secrets stay on the server.' },
      { mistake: 'Answers `403` for records the user may not see, confirming they exist.', fix: 'Return `404` for records outside the user’s reach.' },
      { mistake: 'Silences a CORS error by allowing every origin.', fix: 'Allow only your own frontend’s origin.' },
    ],
  },

  build: {
    title: 'Team notes, hardened',
    brief: 'Take *Members-only notes* from *Know who the user is* and make it survive people who don’t play nice: members see only their own notes, admins can moderate, notes can’t run scripts, and the API holds up against floods of requests.',
    byHand: [
      { title: 'Deny by default', text: 'Mount `requireAuth` on the whole `/api` router, and list the few public routes explicitly.', see: ['authn-authz', 2] },
      { title: 'Scope by owner', text: 'Every read, update and delete uses `{ _id, owner: req.user.id }`. Someone else’s note returns 404.', see: ['authn-authz', 4] },
      { title: 'Add roles', text: 'A `role` field (`member` or `admin`) and `requireRole(\'admin\')` on moderation routes: 401 when not logged in, 403 when logged in but not allowed.', see: ['authn-authz', 5] },
      { title: 'Validate and pick', text: 'A schema for note bodies. Save only `title` and `text` — never an `owner` or `role` sent by the client.', see: ['validation', 5] },
      { title: 'Text stays text', text: 'Render notes as `{note.text}` in React, never with `dangerouslySetInnerHTML`. Try saving `<img src=x onerror=alert(1)>`.', see: ['web-attacks', 3] },
      { title: 'Refuse forged requests', text: 'The session cookie uses `sameSite: \'lax\'`, and changing requests whose `Origin` isn’t your site are rejected.', see: ['web-attacks', 5] },
      { title: 'Limit the floods', text: '`express-rate-limit` on login (5 a minute) and on creating notes (30 a minute). Clients get 429 and a `Retry-After` header.', see: ['rate-limiting', 2] },
    ],
    withAI: {
      lede: 'Now let your AI assistant harden it. The spec lists the attacks it must handle — and asks it to write the tests where one user attacks another.',
      prompt: `Harden my Express + MongoDB "Members-only notes" API and its React client.

Access control
- requireAuth on the whole /api router; public routes listed explicitly (only /api/login and /api/signup).
- Every note query is scoped by owner: { _id, owner: req.user.id }. Notes the user may not see return 404, not 403.
- Users have a role ('member' | 'admin'). Admin routes use requireRole('admin'): 401 if not logged in, 403 if logged in without the role.
- Identity comes only from the verified session — never from a userId or role in the request.

Input and output
- Validate every body with Zod and save only title and text.
- React renders note text as text; no dangerouslySetInnerHTML anywhere.

Abuse
- Session cookie: httpOnly, secure, sameSite=lax. Reject POST/PATCH/DELETE whose Origin header isn't my site.
- helmet() for security headers.
- Rate limits: /api/login 5 per minute per IP, POST /api/notes 30 per minute per user; respond 429 with Retry-After.

Then write tests where Ben tries to read, edit and delete Ana's note, and a member tries an admin route.`,
    },
    verify: [
      'Log in as Ben and request one of Ana’s notes by its id: **404**.',
      'As Ben, PATCH Ana’s note: **404** — and her note is unchanged.',
      'As a member, call an admin route: **403**. Logged out: **401**.',
      'Create a note with `"owner": "<Ana’s id>"` in the body: it still belongs to you.',
      'Save a note containing `<img src=x onerror=alert(1)>`: it shows as text, and nothing pops up.',
      'Send six logins within a minute: the sixth gets **429** with a `Retry-After` header.',
      'Search the built frontend (`dist/`) for your secrets: nothing found.',
    ],
  },

  breakIt: [
    {
      title: 'Admins only',
      lang: 'jsx',
      code: `// client
{user.role === 'admin' && <button onClick={() => remove(post.id)}>Delete</button>}

// server
app.delete('/api/posts/:id', requireAuth, deletePost);`,
      err: [5],
      answer:
        'The button is hidden, but the route only checks that *someone* is logged in. Any member can send `DELETE /api/posts/7` from the console. Put the check where it counts: `app.delete(\'/api/posts/:id\', requireAuth, requireRole(\'admin\'), deletePost)`.',
      see: ['authn-authz', 6],
    },
    {
      title: 'Whose note is it?',
      lang: 'js',
      code: `app.post('/api/notes', requireAuth, async (req, res) => {
  const note = await Note.create({ ...req.body });
  res.status(201).json(note);
});`,
      err: [2],
      answer:
        'The client chooses `owner` — so anyone can create notes in someone else’s account, or set any other field. Take identity from the session and pick the fields yourself: `Note.create({ title, text, owner: req.user.id })`, after validating.',
      see: ['validation', 5],
    },
    {
      title: 'Comments with formatting',
      lang: 'jsx',
      code: `function Comment({ comment }) {
  return <p dangerouslySetInnerHTML={{ __html: comment.text }} />;
}`,
      err: [2],
      answer:
        'Whatever someone typed now runs in every visitor’s browser: `<img src=x onerror=…>` can read the page and act as them. That is stored [[xss|XSS]]. Render `{comment.text}` as text; if you truly need formatting, sanitise with DOMPurify and keep a strict Content Security Policy.',
      see: ['web-attacks', 2],
    },
    {
      title: 'A key in the app',
      lang: 'js',
      code: `// src/api.js — a React app built with Vite
await fetch('https://api.payments.example/v1/charges', {
  method: 'POST',
  headers: { Authorization: \`Bearer \${import.meta.env.VITE_PAYMENTS_SECRET}\` },
  body: JSON.stringify({ amount: 4900 }),
});`,
      err: [4],
      answer:
        'Every `VITE_` variable is copied into the JavaScript bundle. Anyone can open DevTools, read the secret, and charge whatever they like. Secrets stay on the server: the browser calls *your* API, and your server calls the payment provider.',
      see: ['config', 5],
    },
  ],

  explain: [
    'What is the difference between authentication and authorization — and why does every request need both?',
    'Why isn’t hiding a button enough to protect an action?',
    'How does stored XSS work, and which single habit prevents most of it?',
  ],

  deeper: [
    {
      q: 'What is a Content Security Policy?',
      a: 'A response header that tells the browser which scripts, styles and connections the page may use. Even if an attacker manages to inject a script, a strict [[csp|CSP]] stops it from running — a second wall behind escaping.',
    },
    {
      q: 'What is the OWASP Top 10?',
      a: 'A regularly updated list of the most common web security risks. Broken access control — the subject of this chapter — has been at the top in recent editions. It makes a good checklist for reviewing your own app.',
    },
    {
      q: 'How do I test my own app’s security?',
      a: 'Write tests where one user attacks another’s data, run `npm audit` and a dependency scanner, poke your own API from DevTools, and point an automated scanner such as OWASP ZAP at a test deployment.',
    },
    {
      q: 'What is the principle of least privilege?',
      a: 'Give every user, service and key only the access it needs: a read-only database user for reports, a payment key that can charge but not refund. When something leaks, less is exposed.',
    },
    {
      q: 'What is a supply-chain attack?',
      a: 'An attack through code you install: a compromised npm package, or a look-alike name. Lock versions, review new dependencies, and let automated tools keep updates flowing.',
    },
    {
      q: 'How do teams notice an attack in progress?',
      a: 'Logs and alerts: a spike in failed logins, bursts of 403s and 404s from one address, unusually large exports. Security without monitoring means you hear about a breach from your users.',
    },
  ],

  next: [
    { q: 'How does the server know who is asking in the first place?', chapter: 'identity' },
    { q: 'What happens when a million requests arrive at once?', chapter: 'scale' },
    { q: 'How would you notice an attack at 3 a.m.?', chapter: 'observe' },
    { q: 'How do you prove that user B can never see user A’s data?', chapter: 'testing' },
  ],
};

export default writing;
