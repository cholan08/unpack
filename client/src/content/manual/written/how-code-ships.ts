/**
 * Chapter: How code becomes a product (Part I · How things work).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'On your laptop, your app is a folder of text files and a terminal running `npm run dev`. For a stranger to use it, it has to become something else: files on a computer that never sleeps, a process that restarts when it crashes, settings that don’t live on your laptop, a name people can type.',
      'Every product you use went through that same transformation. Code isn’t a product until it has been packaged, built, configured and started somewhere reachable — and it has to happen the same way every time.',
      'What actually happens to your code on the way from your editor to the internet?',
    ],
    predict: {
      q: 'You run `npm run build` in a React + Vite project. What comes out in the `dist` folder?',
      options: [
        'Your source files, copied over',
        'A few HTML, CSS and JavaScript files — bundled, minified, with hashed names — ready for any web server',
        'A program users must install on their computers',
        'A Docker image',
      ],
      answer: 1,
      reveal:
        'A few plain files any web server can send. The build follows every `import`, bundles your code with the packages it uses, drops what is unused, minifies everything, and puts a content hash in each file name (`index-3f9a1c.js`) so browsers can cache it forever. Your JSX, your TypeScript and your `node_modules` never leave your machine — only what the browser needs does.',
    },
  },

  idea: {
    lede: 'Every piece of software — a web app, a phone app, a game — makes the same journey from source code to something people use.',
    jobs: [
      {
        title: 'Gather the pieces',
        text: 'Your code plus the packages it depends on, pinned to exact versions in a lockfile, so every machine installs exactly the same thing.',
      },
      {
        title: 'Build it',
        text: 'Turn source into what runs: compile TypeScript and JSX, bundle the [[esm|modules]], minify, hash the file names. The result is the *artifact*.',
      },
      {
        title: 'Keep settings outside',
        text: 'The same artifact runs everywhere. What differs per place — database address, keys, mode — comes from [[env-var|environment variables]].',
      },
      {
        title: 'Run it somewhere that stays on',
        text: 'Static files go to a web server or a [[cdn|CDN]]; a backend runs as a long-lived process that is restarted if it crashes.',
      },
      {
        title: 'Make it reachable',
        text: 'A domain name, HTTPS, and one port the outside world can reach — and nothing else left open.',
      },
    ],
    picture:
      'A bakery. The recipe and the bought ingredients are your code and packages, weighed exactly the same way every time (the lockfile). Baking turns them into bread you can’t turn back into flour (the build). The same bread goes to every shop, but each shop sets its own prices and hours (environment variables). It sits in a shop that is open all day (hosting), on a street with a name and a sign (the domain).',
  },

  lessonNotes: {
    modules: 'Job 1: modules, packages, `package.json` and `node_modules` — and what a bundler does with them.',
    'build-tools': 'Job 2: what Vite does in development and for production — hashed names, source maps, and environment variables baked in.',
    config: 'Job 3: the same code everywhere, with settings and secrets coming from the environment.',
    deploying: 'Jobs 4 and 5 for a real MERN app: static files on a CDN, the API as a process, the database, the domain and HTTPS.',
  },

  options: {
    lede: 'Different kinds of products are packaged in different shapes. Knowing the main ones tells you what “build” and “deploy” mean for each.',
    items: [
      {
        name: 'A static web build',
        what: 'HTML, CSS, JavaScript and assets, ready for any web server or CDN.',
        pickWhen: 'Frontends and websites — the client half of a React app.',
        cost: 'Nothing runs on a server, so anything private needs an API.',
        examples: 'Vite, Astro, a Next.js static export',
        tools: ['react'],
      },
      {
        name: 'A server process',
        what: 'Your backend code plus its `node_modules`, started with one command and kept running.',
        pickWhen: 'APIs and server-rendered apps.',
        cost: 'Something has to keep it running, restart it and update it.',
        examples: '`node server.js` on a PaaS; PM2 or systemd on your own server',
        tools: ['node', 'express'],
      },
      {
        name: 'A container image',
        what: 'Your app and everything it needs — runtime, libraries, files — sealed into one image that runs the same anywhere.',
        pickWhen: 'Several services, unusual system dependencies, or endless “works on my machine” problems.',
        cost: 'Images to build, store and keep patched.',
        examples: 'Docker, Podman',
        tools: ['docker'],
      },
      {
        name: 'Serverless functions',
        what: 'Single functions uploaded to a platform that runs them on demand.',
        pickWhen: 'Small APIs, webhooks, spiky traffic.',
        cost: 'Limits on time, memory and connections — and harder to run locally.',
        examples: 'Vercel and Netlify Functions, AWS Lambda, Cloudflare Workers',
        tools: ['aws'],
      },
      {
        name: 'Mobile and desktop apps',
        what: 'Signed app bundles, delivered through app stores or installers.',
        pickWhen: 'Products that live on phones or desktops.',
        cost: 'Store reviews, signing — and users stuck on old versions for a long time.',
        examples: 'Expo for React Native, Xcode, Android Studio, Electron, Tauri',
        tools: ['react-native', 'xcode', 'android-sdk'],
      },
    ],
    choose: [
      { when: 'A React frontend', pick: 'A static build on a CDN.' },
      { when: 'An Express API', pick: 'A server process on a PaaS.' },
      { when: 'Several services, or system dependencies', pick: 'Container images.' },
      { when: 'A few small endpoints or webhooks', pick: 'Serverless functions.' },
      { when: 'Something people install', pick: 'An app bundle, through the stores.' },
    ],
  },

  modern: {
    lede: 'Build tools and hosts now do most of this for you: Vite builds in seconds, platforms detect your framework, and AI writes the configuration. The understanding you still need is short — what goes into the artifact, what goes into the environment, and what must never be in either.',
    defaults: [
      'Commit the lockfile (`package-lock.json`), and install with `npm ci` in builds.',
      'One artifact for every environment; the only differences come from environment variables.',
      'Never put secrets in frontend build variables — they end up in the public bundle.',
      'Generate source maps, but give them to your error tracker instead of serving them publicly.',
      'Pin the runtime version (`engines`, an `.nvmrc`, or the image tag).',
      'Keep dependencies few, update them regularly, and check them with `npm audit`.',
    ],
    aiGood: [
      'Explaining what is in your `package.json` and lockfile',
      'Writing build and start scripts',
      'Reading a build error and finding its cause',
      'Working out what makes your bundle big',
      'Writing a Dockerfile or a platform’s config file',
    ],
    aiWrong: [
      { mistake: 'Deletes the lockfile to fix an install problem.', fix: 'Fix the conflict; the lockfile is what makes installs repeatable.' },
      { mistake: 'Installs a package for a one-line job.', fix: 'Check its size and upkeep; sometimes write the line yourself.' },
      { mistake: 'Commits `dist/` or `node_modules`.', fix: 'They are build outputs — `.gitignore` them.' },
      { mistake: 'Runs production with development settings or debug flags.', fix: 'Production gets production settings, from its environment.' },
      { mistake: 'Reads `process.env` in frontend code.', fix: 'In Vite it is `import.meta.env`, and only `VITE_` values — all of them public.' },
      { mistake: 'Uses `npm install` in CI, so versions drift.', fix: '`npm ci` installs exactly what the lockfile says.' },
    ],
  },

  build: {
    title: 'Build it, and look inside',
    brief: 'Take a small React + Express app from source code to a running production build on your own machine — and look at what each step produces, so “deploy” stops being magic.',
    byHand: [
      { title: 'Read the recipe', text: 'Open `package.json`: dependencies, devDependencies, scripts. Find one package in `node_modules` and its exact version in `package-lock.json`.', see: ['modules', 7] },
      { title: 'Install exactly', text: 'Delete `node_modules` and run `npm ci`. The same versions, every time.' },
      { title: 'Build the frontend', text: '`npm run build`, then open `dist/`: count the files, open the JavaScript to see your code minified, and note the hashed names.', see: ['build-tools', 4] },
      { title: 'See what is inside', text: 'Run a bundle visualiser (for example `rollup-plugin-visualizer`) and find the biggest package.', see: ['build-tools', 7] },
      { title: 'Settings from outside', text: 'Make the server read `PORT` and `MONGO_URL` from the environment, and start it twice with different values.', see: ['config', 3] },
      { title: 'Run it like production', text: 'Serve `dist/` with `npx vite preview` (or from Express), and start the API with `NODE_ENV=production`.' },
      { title: 'Compare', text: 'Open the dev and production versions side by side in DevTools: count requests, total size, and look for source code you recognise.', see: ['build-tools', 3] },
    ],
    withAI: {
      lede: 'Ask your AI assistant to explain *your* build, from *your* files — and to say when it is guessing.',
      prompt: `Explain my project's build to me using my own files. I'll paste:
1. package.json
2. vite.config (and tsconfig, if I have one)
3. the file list of dist/ after npm run build, with sizes

Tell me:
- what each script does, and which dependencies end up in the browser bundle
- why the file names in dist/ contain hashes
- which environment variables are read where, and which of them are public
- the three biggest things in my bundle, and how I could shrink them
- exactly what I would need to give a server to run this in production

Use only what is in my files. If you are guessing, say so.`,
    },
    verify: [
      'You can say which dependencies end up in the browser and which only run on the server or during the build.',
      '`npm ci` reinstalls exactly the versions in the lockfile.',
      '`dist/` holds a handful of files with hashed names — no `.tsx`, no `node_modules`.',
      'You found the single biggest package in your bundle.',
      'The same server code runs on two different ports without any code change.',
      'The production build makes fewer, smaller requests than the dev server.',
      'No secret appears anywhere in `dist/`.',
    ],
  },

  breakIt: [
    {
      title: 'Fixing an install error',
      lang: 'bash',
      code: `# npm install fails with a dependency conflict…
$ rm -rf node_modules package-lock.json
$ npm install --force`,
      err: [2, 3],
      answer:
        'Deleting the lockfile throws away the record of exactly which versions worked, and `--force` installs packages that said they don’t fit together. The build may pass today and break tomorrow, on another machine. Read the conflict, update the packages that disagree, and keep the lockfile.',
    },
    {
      title: 'Config in the code',
      lang: 'js',
      code: `const config = {
  mongoUrl: 'mongodb+srv://admin:hunter2@cluster0.example.mongodb.net/app',
  port: 3000,
};`,
      err: [2],
      answer:
        'The password is now in every copy of the code and in Git history forever — and your laptop and production share one database address. Read it from the environment (`process.env.MONGO_URL`), and keep a `.env.example` that lists the names, not the values.',
      see: ['config', 2],
    },
    {
      title: '`process.env` in React',
      lang: 'jsx',
      code: `// client/src/api.js — built with Vite
const API_URL = process.env.API_URL;`,
      err: [2],
      answer:
        'There is no `process` in the browser, so this crashes — or quietly gives `undefined`. Vite exposes build-time values as `import.meta.env`, and only those starting with `VITE_`, which are baked into the public bundle: `import.meta.env.VITE_API_URL`.',
      see: ['build-tools', 5],
    },
    {
      title: 'The dev server, in production',
      lang: 'docker',
      code: `FROM node:22
COPY . .
RUN npm install
CMD ["npm", "run", "dev"]`,
      err: [4],
      answer:
        'The dev server is made for one person editing code: unminified files, file watching, hot reload, extra checks. In production it is slow, hungry for memory, and may expose source code. Build once (`npm run build`), start the production server — and use `npm ci` instead of `npm install`.',
    },
  ],

  explain: [
    'What is the difference between your source code and the build output?',
    'Why does the lockfile matter, and what does `npm ci` do differently from `npm install`?',
    'Why should one build run in every environment, with only environment variables changing?',
  ],

  deeper: [
    {
      q: 'What is a monorepo?',
      a: 'One repository holding several projects — a client, a server, shared code — with tools that install and build them together. This very project uses npm workspaces for exactly that.',
    },
    {
      q: 'What does `^1.4.2` mean in package.json?',
      a: 'Semantic versioning: MAJOR.MINOR.PATCH. Patches fix bugs, minor versions add features, major versions may break things. `^1.4.2` allows any 1.x from 1.4.2 upward — which is why the lockfile pins the exact one.',
    },
    {
      q: 'What is a process manager?',
      a: 'A program that starts your server, restarts it when it crashes and collects its logs — PM2 or systemd on your own server, or the platform itself on a PaaS.',
    },
    {
      q: 'What is WebAssembly?',
      a: 'A compact binary format that browsers run at near-native speed, compiled from languages such as Rust, C++ or Go. It lets heavy software — image editors, games, even databases — run inside a web page.',
    },
    {
      q: 'Why are builds so much faster than they used to be?',
      a: 'Newer tools are written in fast, compiled languages — esbuild in Go, SWC, Rspack and Rolldown in Rust — and Vite skips bundling altogether while you develop.',
    },
    {
      q: 'What is an immutable artifact?',
      a: 'You build once, give the result a version, and deploy that exact thing to testing and then to production. If it breaks, you redeploy the previous artifact — nothing is rebuilt in a hurry.',
    },
  ],

  next: [
    { q: 'How do you put it online for real, and update it safely?', chapter: 'ship' },
    { q: 'How does a page travel to someone’s browser?', chapter: 'how-the-web-works' },
    { q: 'How do you know your change didn’t break anything?', chapter: 'testing' },
    { q: 'What changes when many people use it at once?', chapter: 'scale' },
  ],
};

export default writing;
