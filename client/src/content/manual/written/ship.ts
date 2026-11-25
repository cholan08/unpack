/**
 * Chapter: Put it online and keep it running (deploying & DevOps).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'Your app works. On your laptop, at `localhost:3000`, it’s perfect. You send the link to a friend — and their browser says *This site can’t be reached*.',
      'Between your laptop and a link anyone can open sits a lot of quiet machinery. The code must be kept somewhere safe, built into files a browser can run, placed on computers that stay on all night, connected to a real database, given a name and a padlock — and updated next week without anyone noticing a gap.',
      'How does code on your laptop become a product the whole world can use, and keep using while you change it?',
    ],
    predict: {
      q: 'Your app runs perfectly on your laptop. You put the same code on a server, and it crashes as it starts. What is the most likely reason?',
      options: [
        'The server is slower than your laptop',
        'Something your laptop has and the server doesn’t — a setting, a secret, a file, a version',
        'Servers can’t run JavaScript',
        'The code has to be rewritten for production',
      ],
      answer: 1,
      reveal:
        '“It works on my machine” almost always means the machine is part of the program: a `.env` file that was never copied, a database at `localhost`, a different Node version, a file path that only exists on your disk. Deploying well is mostly making those things explicit — config from the environment, a managed database, a pinned version, and the same build steps every time.',
    },
  },

  idea: {
    lede: 'Whether you deploy to a free static host or a fleet of servers, shipping does the same five jobs.',
    jobs: [
      {
        title: 'Keep every version',
        text: '[[git|Git]] records snapshots of your project, so you can see what changed, undo mistakes, and build features side by side.',
      },
      {
        title: 'Build what will run',
        text: 'Turn source code into what production runs: minified browser files with hashed names, and a server that starts with one command.',
      },
      {
        title: 'Give it a home',
        text: 'Static files go to a [[cdn|CDN]]; the API runs somewhere that keeps it alive; data lives in a managed database. Each gets its settings from [[env-var|environment variables]].',
      },
      {
        title: 'Give it a name and a padlock',
        text: 'A domain points to your app through DNS, and HTTPS — free and automatic on most hosts — keeps every connection private.',
      },
      {
        title: 'Ship again, safely',
        text: 'Every change passes the same automated checks ([[ci|CI]]) and the same deploy ([[cd|CD]]), with a way back in one step.',
      },
    ],
    picture:
      'Opening a restaurant. The recipes live in a binder that keeps every past version (Git). Prep turns raw ingredients into dishes ready to serve (the build). You rent a kitchen that stays open, with a separate storeroom (servers and a database), hang a sign with the address (a domain) and pass the hygiene inspection (HTTPS). And when the menu changes, every new dish is tasted the same way before it goes out — with last week’s menu ready if it flops (CI/CD and rollbacks).',
  },

  lessonNotes: {
    git: 'Job 1: commits as snapshots, branches as pointers, merges, conflicts and pull requests.',
    'build-tools': 'Job 2: what Vite does in development and for production — bundles, hashed names, source maps, and env variables baked in.',
    config: 'Job 3: the same code everywhere, with settings and secrets coming from the environment.',
    deploying: 'Jobs 3 and 4, end to end: static files on a CDN, the API as a running process, a managed database, a domain and HTTPS.',
    cicd: 'Job 5: checks on every push, deploys on every merge — and rollbacks.',
    containers: 'Job 3, made portable: an image that runs the same on your laptop and in production.',
  },

  options: {
    lede: 'Hosting ranges from “drag a folder here” to running your own machines. More control costs more of your time — start as high up this list as you can, and move down only when you must.',
    items: [
      {
        name: 'Static hosting',
        what: 'Upload built files; they are served from a CDN worldwide, with HTTPS and a preview link for every branch.',
        pickWhen: 'Frontends, sites and single-page apps — the React half of your app.',
        cost: 'No long-running server code (beyond small functions).',
        examples: 'Netlify, Vercel, Cloudflare Pages, GitHub Pages',
      },
      {
        name: 'A platform-as-a-service (PaaS)',
        what: 'Connect your repository; the platform builds and runs your server, restarts it if it crashes, and handles HTTPS and logs.',
        pickWhen: 'Your Express API, and most small-to-medium backends.',
        cost: 'Less control, and a higher price per unit than raw servers as you grow.',
        examples: 'Render, Railway, Fly.io, Heroku',
      },
      {
        name: 'A full-stack platform',
        what: 'One platform deploys a framework app: pages, API routes and functions together.',
        pickWhen: 'Next.js, Nuxt or SvelteKit apps.',
        cost: 'Your app takes the platform’s shape: functions, time limits, regions.',
        examples: 'Vercel, Netlify, Cloudflare',
        tools: ['nextjs'],
      },
      {
        name: 'Containers on a cloud',
        what: 'Package the app as a container image and run it on a managed container service.',
        pickWhen: 'Several services, special system needs, or a company cloud account.',
        cost: 'More to set up: images, registries, networking and scaling rules.',
        examples: 'Google Cloud Run, AWS ECS/Fargate, Azure Container Apps — Kubernetes for many services',
        tools: ['docker', 'kubernetes', 'google-cloud', 'aws', 'azure'],
      },
      {
        name: 'Your own server (VPS)',
        what: 'Rent a virtual machine and set up everything yourself: Node, a reverse proxy, TLS, updates, backups.',
        pickWhen: 'Learning what lies underneath, or keeping costs flat and predictable.',
        cost: 'You are the operations team: patches, uptime and backups are all yours.',
        examples: 'DigitalOcean, Hetzner, AWS EC2 — with Nginx and Docker',
        tools: ['nginx', 'aws'],
      },
    ],
    choose: [
      { when: 'Your first deploy, or any frontend', pick: 'Static hosting: Netlify, Vercel or Cloudflare Pages.' },
      { when: 'The Express API from this course', pick: 'A PaaS such as Render, Railway or Fly.io, with MongoDB Atlas.' },
      { when: 'A Next.js app', pick: 'A full-stack platform.' },
      { when: 'Several services, or a company cloud', pick: 'Containers on a managed service such as Cloud Run or ECS.' },
      { when: 'You want to understand what lies underneath', pick: 'One small VPS, set up by hand once.' },
    ],
  },

  modern: {
    lede: 'Deploying used to be a specialist’s job. Now a push to GitHub can put an app live with HTTPS in minutes, and AI writes your Dockerfile and pipeline. What remains is the part you can’t skip: knowing what your app needs to run, keeping secrets secret, and being able to undo a bad release.',
    defaults: [
      'Everything in Git except secrets; small commits; `main` always ready to deploy.',
      'Settings and secrets in the host’s environment variables, with an `.env.example` in the repo listing what is needed.',
      'CI on every push and pull request: install, type-check, test, build. A red check blocks the merge.',
      'Deploy automatically from `main`, with a preview deployment for every pull request.',
      'A health-check endpoint, logs you can search, and a one-click rollback.',
      'Pin the Node version (`engines` in package.json, an `.nvmrc`) so every machine runs the same thing.',
    ],
    aiGood: [
      'Writing Dockerfiles, compose files and CI workflows',
      'Explaining a failed build log, line by line',
      'Walking you through DNS records and a host’s settings',
      'Writing deploy checklists and runbooks',
      'Untangling Git trouble: a conflict, a bad merge, a lost commit',
    ],
    aiWrong: [
      { mistake: 'Commits `.env`, or puts secrets in the Dockerfile or the workflow file.', fix: 'Secrets go in the host’s or CI’s secret store. If one ever slipped into Git, rotate it.' },
      { mistake: 'Puts a secret in a `VITE_` variable for the frontend build.', fix: 'Build-time variables end up in the public bundle. Only public values there.' },
      { mistake: 'Suggests `git push --force` or `git reset --hard` to fix a problem.', fix: 'Know what they throw away. Prefer `git revert`, and never force-push a shared branch.' },
      { mistake: 'Writes a Dockerfile that copies `node_modules` and runs as root.', fix: '`npm ci` inside the image, a `.dockerignore`, and a non-root user.' },
      { mistake: 'Has the server listen on `localhost` or a fixed port.', fix: 'Listen on `process.env.PORT`, on all interfaces — the platform decides.' },
      { mistake: 'Skips tests in CI to make the pipeline green.', fix: 'A red pipeline is information. Fix the test or the code.' },
      { mistake: 'Assumes the deploy is fine because the build passed.', fix: 'Check the health endpoint and the logs after every deploy.' },
    ],
  },

  build: {
    title: 'Ship the bookmarks app',
    brief: 'Put the bookmarks app — API and React page — on the internet with a real database, HTTPS and a pipeline: every push is checked, every merge deploys itself, and a bad release can be rolled back.',
    byHand: [
      { title: 'Everything in Git', text: 'A repository with `client/` and `server/`, a `.gitignore` that excludes `node_modules`, `dist` and `.env`, and an `.env.example`. Push it to GitHub.', see: ['git', 2] },
      { title: 'Build the frontend', text: '`npm run build` produces `dist/`: minified files with hashed names. Open it and look at what the browser will actually receive.', see: ['build-tools', 3] },
      { title: 'Host the frontend', text: 'Connect the repo to a static host and point it at `client/`, with `npm run build` as the build command and `dist` as the output.', see: ['deploying', 3] },
      { title: 'Host the API', text: 'Connect the same repo to a PaaS for `server/`. It must listen on `process.env.PORT`; add `MONGO_URL` and the other secrets in the host’s settings.', see: ['deploying', 4] },
      { title: 'A real database', text: 'A MongoDB Atlas cluster with its own database user, allowing connections from your host.', see: ['deploying', 5] },
      { title: 'A name and a padlock', text: 'Use the host’s free subdomain or point your own domain, check HTTPS, and set CORS on the API to allow only your frontend’s address.', see: ['deploying', 7] },
      { title: 'Checks and automatic deploys', text: 'A GitHub Actions workflow runs install, type-check, tests and build on every push; the hosts deploy `main` by themselves. Break a test on a branch and watch the merge get blocked.', see: ['cicd', 3] },
    ],
    withAI: {
      lede: 'Now let your AI assistant set it up. The spec tells it where secrets may and may not go, and makes it explain every dashboard setting — so you understand what you clicked.',
      prompt: `Help me deploy my MERN "bookmarks" app (client/ is React + Vite, server/ is Express + Mongoose) with automatic checks and deploys.

Plan
- Frontend on Netlify (or Vercel), API on Render (or Railway), database on MongoDB Atlas.
- List every environment variable each part needs, and write a .env.example for each.

Files to write
- server: listen on process.env.PORT on all interfaces, a GET /health route, and CORS allowing only the frontend URL (read from an environment variable).
- client: read the API base URL from VITE_API_URL (a public value only).
- .github/workflows/ci.yml: on push and pull_request — Node version from .nvmrc, npm ci, type-check, tests and build, for both client and server.
- A .gitignore covering node_modules, dist and .env.

Rules
- No secrets in any committed file, workflow or VITE_ variable.
- Explain each setting I must change in the Netlify, Render and Atlas dashboards, step by step.
- Finish with a post-deploy checklist and how to roll back on each host.`,
    },
    verify: [
      'Open the live frontend on your phone over mobile data: it loads over **https://** and lists your bookmarks.',
      '`GET https://<your-api>/health` returns **200**.',
      'In the Network tab, API calls go to your API’s address, with no CORS errors.',
      'Search the repository and the built `dist/` for your database password: nothing.',
      'Push a commit with a failing test: the pull request shows a red check and can’t be merged.',
      'Merge a small text change: it is live within minutes, and you never touched a server.',
      'Roll back to the previous deploy in your host’s dashboard: the old version is live again.',
    ],
  },

  breakIt: [
    {
      title: 'Listening at home',
      lang: 'js',
      code: `const PORT = 3000;
app.listen(PORT, 'localhost', () => console.log(\`Listening on \${PORT}\`));`,
      err: [1, 2],
      answer:
        'On a platform, your app must listen on the port *it* hands you (`process.env.PORT`) and on all interfaces. `localhost` only accepts connections from inside the same machine, so the platform can’t reach your app and the deploy fails its health check. Use `app.listen(process.env.PORT ?? 3000)`.',
    },
    {
      title: 'Oops, the .env',
      lang: 'bash',
      code: `$ git add .
$ git commit -m "add database"
$ git rm --cached .env && git commit -m "remove .env"`,
      err: [1, 2],
      answer:
        '`git add .` committed `.env`, and removing it in a later commit doesn’t remove it from history — anyone with the repository can read it in the earlier commit. Change the password right away, and put `.env` in `.gitignore` *before* the first commit.',
    },
    {
      title: 'Baked into the bundle',
      lang: 'js',
      code: `// client/src/api.js
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'x-admin-key': import.meta.env.VITE_ADMIN_KEY },
});`,
      err: [4],
      answer:
        'Vite copies every `VITE_` variable into the built JavaScript, so the admin key ships to every visitor. The API URL is fine there — it is public anyway — but anything secret must stay on the server.',
      see: ['build-tools', 5],
    },
    {
      title: 'Fix it fast',
      lang: 'bash',
      code: `# the release is broken, quick!
$ git reset --hard HEAD~3
$ git push --force origin main`,
      err: [2, 3],
      answer:
        'This throws away three commits and rewrites shared history: teammates’ copies now disagree with GitHub, and work built on those commits gets lost or tangled. Roll back the *deploy* in your host first, then undo the change with `git revert <commit>`, which adds a new commit instead of erasing old ones.',
      see: ['cicd', 6],
    },
  ],

  explain: [
    'What does “it works on my machine” usually mean — and how do environment variables and containers fix it?',
    'What does a CI pipeline check, and why should a red check block a merge?',
    'Why doesn’t deleting `.env` in a later commit protect your secret?',
  ],

  deeper: [
    {
      q: 'What are blue-green and canary releases?',
      a: 'Ways to release without a gap. Blue-green runs the new version beside the old one and switches all traffic at once — and back, if needed. A canary sends a small share of users to the new version first, and widens it if nothing breaks.',
    },
    {
      q: 'What is infrastructure as code?',
      a: 'Describing servers, databases and networks in files (Terraform, Pulumi, CloudFormation) instead of clicking through dashboards, so environments can be reviewed, versioned and recreated exactly.',
    },
    {
      q: 'What is Kubernetes for?',
      a: 'Running many containers across many machines: it restarts what crashes, spreads the load, rolls out new versions and scales up and down. Powerful — and far more than one small app needs.',
    },
    {
      q: 'What does a reverse proxy do?',
      a: 'A server like Nginx sits in front of your app: it handles HTTPS, serves static files, compresses responses and forwards API requests to your Node process. Platforms run one for you.',
    },
    {
      q: 'What is a preview deployment?',
      a: 'A temporary, live copy of your app for every pull request, with its own link. Reviewers can click through a change before it is merged — the best kind of review for anything visual.',
    },
    {
      q: 'How do database changes fit into a deploy?',
      a: 'Change the database in steps that both the old and the new code can live with: add the new field first, deploy code that uses it, remove the old field later. Then a rollback never meets a database it doesn’t understand.',
    },
  ],

  next: [
    { q: 'Your app is live — how will you know when it breaks?', chapter: 'observe' },
    { q: 'How do teams change code every day without breaking it?', chapter: 'testing' },
    { q: 'What changes when ten thousand people use it?', chapter: 'scale' },
    { q: 'How do ten people work on the same code at once?', chapter: 'collaborate' },
  ],
};

export default writing;
