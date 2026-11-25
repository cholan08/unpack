/**
 * Chapter: Know who the user is (authentication).
 * The model chapter: every other chapter follows this order and this voice (docs/PLAN-MANUAL.md).
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You log in to a site once. You close the tab, come back tomorrow, and you are still logged in. It feels like the site *remembers* you.',
      'But the web has no memory. Every request your browser sends arrives at the server as a **stranger**: no name, no history, just “give me /my-orders”. The server has never met you before — every single time.',
      'So something must be carrying the proof that it is you, on every request. What, and where?',
    ],
    predict: {
      q: 'After you log in, where is the fact “this is Ana” kept?',
      options: [
        'On the server only — it recognises your computer',
        'In the browser only — it tells the server who you are',
        'Both: the server checks your password once, then gives your browser a pass to show on every request',
        'Nowhere — your password is sent with every request',
      ],
      answer: 2,
      reveal:
        'Both. You prove who you are **once**, with something only you have: a password, a code, a passkey. The server then hands your browser a **pass** — a random session id or a signed token, usually in a [[cookie]] — and the browser shows that pass with every request. The server checks the pass, not your password. Recognising your computer would fail the moment two people share a network; sending the password every time would give it a thousand chances to be stolen.',
    },
  },

  idea: {
    lede: 'Forget frameworks for a moment. Every login system ever built — a bank, a game, a school portal — does the same four jobs.',
    jobs: [
      {
        title: 'Prove it once',
        text: 'The user shows something only they have: a password they know, a code sent to their phone or email, a passkey on their device, or an account at Google or GitHub that vouches for them.',
      },
      {
        title: 'Keep the secret safe',
        text: 'If you store passwords, store only a slow, salted [[hash]] of each one — never the password itself. Databases leak; a leaked hash should be useless to whoever took it.',
      },
      {
        title: 'Hand over a pass',
        text: 'After a good login, the server gives the browser a pass: a random **session id** it can look up, or a signed **token** that carries the user’s id. The pass travels in a cookie that the page’s JavaScript can’t read.',
      },
      {
        title: 'Check the pass, every time',
        text: 'Every request that needs a user goes through one gate on the server that checks the pass and attaches the user to the request. Passes expire, and logging out kills them.',
      },
    ],
    picture:
      'A hotel. The front desk checks your ID **once** and gives you a key card. Every door checks the card, not your ID. The card stops working when you check out, and if you lose it the desk can cancel it. A **session** is a card the desk can cancel at any moment; a **JWT** is a card that works until the date printed on it — which is why you keep that date close.',
  },

  lessonNotes: {
    'authn-authz': 'Start here: the difference between *who you are* and *what you may do*, and where each check lives.',
    hashing: 'Job 2. Why databases leak, and how salt and slow hashing make a stolen password list useless.',
    'sessions-tokens': 'Job 3. The two kinds of pass — a note the server keeps, or a signed token you carry — and what each one costs.',
    'jwt-auth': 'The whole flow with tokens, end to end: log in, sign, store, send, verify, expire.',
    'protected-routes': 'Job 4 on both sides. The server is the real gate; the frontend only decides what to show.',
  },

  options: {
    lede: 'There are six common ways to give a product a login. They are not rivals: real products often combine two — a managed service *plus* Sign in with Google, for example.',
    items: [
      {
        name: 'Build it yourself, with sessions',
        what: 'Your server checks the password (hashed with bcrypt or Argon2), stores a session in the database or [[redis|Redis]], and sends a random id in an httpOnly cookie.',
        pickWhen: 'You are learning, or you have one web app on one domain and want full control.',
        cost: 'You own every part: password resets, rate limits, account recovery, breach response.',
        examples: 'express-session, or a few dozen lines of your own',
        tools: ['express', 'redis'],
      },
      {
        name: 'Build it yourself, with tokens (JWT)',
        what: 'After login the server signs a short-lived token holding the user’s id. Any server with the key can check it without a lookup.',
        pickWhen: 'Several servers or services must check the user without sharing a session store, or a mobile app calls your API.',
        cost: 'A token can’t be taken back before it expires, so you need short expiry and refresh tokens — more moving parts than sessions.',
        examples: 'jsonwebtoken, jose',
      },
      {
        name: 'An auth library',
        what: 'A library inside your app runs the flows — sign-up, login, sessions, social login, reset emails — while the users stay in your own database.',
        pickWhen: 'You want the flows done right, and your user data must stay in your database.',
        cost: 'You still host it, update it and secure it yourself.',
        examples: 'Passport.js for Express; Auth.js and Better Auth for TypeScript apps',
      },
      {
        name: 'A managed auth service',
        what: 'A company runs login for you: ready-made sign-in screens, social logins, multi-factor, passkeys and user management. Your app receives a verified user.',
        pickWhen: 'You want to ship fast and safely, or you need multi-factor, passkeys or company single sign-on (SSO).',
        cost: 'A monthly bill as you grow, your users’ accounts live with them, and moving away later is real work.',
        examples: 'Clerk, Auth0, Firebase Authentication, Supabase Auth, Amazon Cognito',
      },
      {
        name: 'Sign in with Google, GitHub or Apple',
        what: 'Another company vouches for the user through the OAuth 2.0 and OpenID Connect standards. You never see a password.',
        pickWhen: 'Your users already have those accounts. Almost always worth offering.',
        cost: 'You depend on the provider, and you still need your own session once the user comes back to you.',
        examples: 'Usually switched on through a library or a managed service, not written by hand',
      },
      {
        name: 'Passwordless: magic links and passkeys',
        what: 'No password at all: a one-time link or code by email, or a **passkey** — a key pair kept on the user’s device and unlocked with a fingerprint, face or PIN.',
        pickWhen: 'You want fewer forgotten passwords and real protection against phishing. Passkeys work in every major browser and phone.',
        cost: 'Email links depend on email arriving; passkeys need a recovery path for people who lose their device.',
        examples: 'WebAuthn for passkeys; most libraries and services above support both',
      },
    ],
    choose: [
      { when: 'You are learning how auth works', pick: 'Build it yourself with sessions — once, by hand. Then don’t hand-roll it for a real product.' },
      { when: 'You are building a real product and want to ship', pick: 'A managed service or a mature library, with Sign in with Google and passkeys switched on.' },
      { when: 'User data must stay in your own database', pick: 'An auth library: Passport.js, Auth.js or Better Auth.' },
      { when: 'A mobile app or several services need to check the user', pick: 'Short-lived tokens plus refresh tokens, issued by a library or service.' },
      { when: 'Business customers ask to log in with their company account', pick: 'A managed service that supports SSO (SAML or OpenID Connect).' },
    ],
  },

  modern: {
    lede: 'Today you rarely write a login system from scratch, and an AI assistant can wire one up in minutes. That makes *understanding* more important, not less: auth is where small mistakes become headlines — and the mistakes look exactly like working code.',
    defaults: [
      'Use a proven library or service for real products. Never invent your own crypto or token format.',
      'Offer Sign in with Google (or wherever your users already are) and passkeys. Keep passwords only if your users need them.',
      'Keep the pass in an `httpOnly`, `secure`, `sameSite` cookie — not in localStorage.',
      'Hash passwords with bcrypt or Argon2, and rate-limit login, sign-up and password-reset routes.',
      'Check the user on the **server** for every protected request. The frontend only decides what to show.',
      'Keep secrets in environment variables — never in the code, never in the repository.',
    ],
    aiGood: [
      'Wiring a library or service into your routes and pages',
      'Sign-up and login forms, with loading and error states',
      'The `requireAuth` middleware and the route guards',
      'Explaining an auth error or a redirect loop',
      'Tests like “logged out gets 401” and “another user’s note gets 404”',
    ],
    aiWrong: [
      { mistake: 'Stores the token in localStorage, where any injected script can read it.', fix: 'Ask for an httpOnly, secure, sameSite cookie.' },
      { mistake: 'Hashes passwords with a fast hash (SHA-256, MD5) — or not at all.', fix: 'bcrypt (cost 10–12) or Argon2. Always.' },
      { mistake: 'Decodes the token instead of verifying it, so anyone can forge one.', fix: '`jwt.verify` with your secret, and an expiry on every token.' },
      { mistake: 'Hardcodes the secret, or commits the `.env` file.', fix: 'Read it from an environment variable; put `.env` in `.gitignore`.' },
      { mistake: 'Answers “no such user” and “wrong password” differently, telling attackers which emails exist.', fix: 'One answer for both: “Email or password is incorrect.”' },
      { mistake: 'Hides the button but leaves the API route open.', fix: '`requireAuth` on every protected API route.' },
      { mistake: 'Checks that you are logged in, but not that the record is *yours* ([[idor|IDOR]]).', fix: 'Scope every query by owner: `{ _id, owner: req.user.id }`.' },
      { mistake: 'Leaves login open to unlimited guesses.', fix: 'Rate-limit login and reset per account and per IP.' },
    ],
  },

  build: {
    title: 'Members-only notes',
    brief: 'A tiny app where people sign up, log in, write notes only they can see, and log out. Small enough to finish in an evening; real enough to contain every job in this chapter.',
    byHand: [
      { title: 'A user with a hashed password', text: 'A `User` with a unique `email` and a `passwordHash`. On sign-up, hash with bcrypt (cost 12) and store only the hash.', see: ['hashing', 3] },
      { title: 'Log in once', text: '`POST /login` finds the user and checks the password with `bcrypt.compare`. A wrong email and a wrong password get the same answer.', see: ['hashing', 8] },
      { title: 'Hand over the pass', text: 'On success, create a session (or sign a 15-minute token) and send it in an `httpOnly`, `secure`, `sameSite: \'lax\'` cookie.', see: ['jwt-auth', 7] },
      { title: 'One gate on the server', text: 'A `requireAuth` middleware reads the cookie, checks the pass and sets `req.user`. No valid pass: 401.', see: ['authn-authz', 2] },
      { title: 'Only your notes', text: '`GET /notes` and `GET /notes/:id` query with `owner: req.user.id`, so nobody reads a note by guessing its id.', see: ['authn-authz', 4] },
      { title: 'Guard the screens', text: 'In React, a guard sends logged-out visitors to `/login` and back afterwards — but only once it knows who they are.', see: ['protected-routes', 4] },
      { title: 'Log out', text: '`POST /logout` deletes the session (or clears the cookie), and the client forgets the user.', see: ['sessions-tokens', 4] },
    ],
    withAI: {
      lede: 'Now build it again with your AI assistant. A good prompt is a **spec**: what to build, the rules it must follow, and how you will check it. Copy this, then read every line that comes back before you run it.',
      prompt: `Build "Members-only notes": an Express + MongoDB (Mongoose) API and a React (Vite) client.

Features
- Sign up and log in with email + password; log out.
- Logged-in users can create, list, read and delete their own notes.

Security rules (do not skip any)
- Hash passwords with bcrypt, cost 12. Never store or log the plain password.
- Keep the session in an httpOnly, secure, sameSite=lax cookie. Do not use localStorage.
- Same answer for an unknown email and a wrong password: "Email or password is incorrect."
- A requireAuth middleware on every /notes route; respond 401 without a valid session.
- Scope every notes query by owner: { owner: req.user.id }. Another user's note returns 404.
- Rate-limit /login and /signup to 5 attempts per minute per IP.
- Read secrets from environment variables. Include a .env.example, not a .env.

Before each file, explain in two sentences what it does and why.`,
    },
    verify: [
      'Open `/notes` while logged out: you get **401**, not data.',
      'Log in as Ana, take the id of one of Ben’s notes, and request it: **404**.',
      'Look in the database: the password field is a long `$2b$12$…` hash, not the password.',
      'DevTools → Application → Cookies: the session cookie is marked **HttpOnly**, **Secure** and **SameSite=Lax**.',
      'Type `document.cookie` in the console: the session cookie is **not** in the output.',
      'Enter a wrong password six times quickly: **429 Too Many Requests**.',
      'Search the project for your secret: it appears only in `.env`, and `.env` is in `.gitignore`.',
    ],
  },

  breakIt: [
    {
      title: 'Where the token lives',
      lang: 'js',
      code: `const res = await fetch('/api/login', { method: 'POST', body: JSON.stringify(form) });
const { token } = await res.json();
localStorage.setItem('token', token);`,
      err: [3],
      answer:
        'Any script on the page can read localStorage. One XSS bug — a comment that runs code, a compromised npm package — sends the token to an attacker, who can then use it from anywhere. Let the server set it in an `httpOnly` cookie instead.',
      see: ['jwt-auth', 7],
    },
    {
      title: 'Checking the token',
      lang: 'js',
      code: `function requireAuth(req, res, next) {
  const token = req.cookies.token;
  req.user = jwt.decode(token);
  if (!req.user) return res.sendStatus(401);
  next();
}`,
      err: [3],
      answer:
        '`jwt.decode` only *reads* the token; it never checks the signature. Anyone can write `{ "sub": "admin" }`, encode it and walk in. Use `jwt.verify(token, process.env.JWT_SECRET)` inside a try/catch.',
      see: ['jwt-auth', 6],
    },
    {
      title: 'A helpful error message',
      lang: 'js',
      code: `const user = await User.findOne({ email });
if (!user) return res.status(404).json({ error: 'No account with that email' });
const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) return res.status(401).json({ error: 'Wrong password' });`,
      err: [2, 4],
      answer:
        'The two answers tell an attacker which emails have accounts — the first step of targeted guessing and phishing. Answer both cases the same way: `401` and “Email or password is incorrect.”',
    },
    {
      title: 'Reading a note',
      lang: 'js',
      code: `app.get('/api/notes/:id', requireAuth, async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.sendStatus(404);
  res.json(note);
});`,
      err: [2],
      answer:
        'The user is logged in, but nobody checked that the note is *theirs*. Change the id in the URL and you can read anyone’s notes — an [[idor|IDOR]] bug, one of the most common real breaches. Query by owner: `Note.findOne({ _id: req.params.id, owner: req.user.id })`.',
      see: ['authn-authz', 4],
    },
  ],

  explain: [
    'Explain to a friend why a website can’t simply recognise your computer, and what it uses instead.',
    'A JWT can’t be logged out before it expires. Why is that a problem, and what do real apps do about it?',
    'Why should a password hash be *slow*? Isn’t fast always better?',
  ],

  deeper: [
    {
      q: 'How does “Sign in with Google” work without your app ever seeing the password?',
      a: 'Your app sends the user to Google; Google logs them in and sends them back with a short-lived code; your server trades that code with Google for proof of who they are. That is OAuth 2.0, with OpenID Connect on top for identity.',
    },
    {
      q: 'What is a refresh token?',
      a: 'A long-lived token whose only job is to get new short-lived access tokens. Access tokens last minutes, so a stolen one dies soon; the refresh token can be revoked when the user logs out.',
    },
    {
      q: 'How do passkeys work?',
      a: 'Your device creates a key pair for each site. The site keeps the public key; the private key never leaves your device and signs a fresh challenge when you unlock it. There is no shared secret to steal or to type into a fake site.',
    },
    {
      q: 'What is multi-factor authentication?',
      a: 'Asking for two different kinds of proof — something you know (a password) plus something you have (a phone code or a security key) — so one stolen secret is not enough.',
    },
    {
      q: 'How does “log out of all devices” work?',
      a: 'With sessions: delete every session row for that user. With tokens: revoke the user’s refresh tokens (or bump a version number stored in each token), so every device is out once its short access token expires.',
    },
    {
      q: 'What is the weakest part of most login systems?',
      a: 'Account recovery. “Forgot password” emails and support desks are often easier to fool than the login itself, so they need the same care: single-use links that expire, rate limits, and a notification to the real owner.',
    },
  ],

  next: [
    { q: 'Now you know who they are — what are they allowed to do?', chapter: 'protect' },
    { q: 'How do you keep someone logged in across ten servers?', chapter: 'scale' },
    { q: 'How do you let them upload a profile photo?', chapter: 'files' },
    { q: 'How does an app send them a “reset your password” email?', chapter: 'notify' },
  ],
};

export default writing;
