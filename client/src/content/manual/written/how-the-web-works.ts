/**
 * Chapter: How a web page reaches you (Part I · How things work).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You type a few letters, press Enter, and about a second later a whole page is there: text, pictures, a login button that works. It feels instant, so it feels simple.',
      'In that second your computer asked a stranger for directions, opened a line to a machine that may be on another continent, agreed on a secret code with it, asked for one file — and then for thirty more. Then it turned all of that text into pixels.',
      'Every product you will ever build lives inside that one second. So where does the time actually go?',
    ],
    predict: {
      q: 'You open a site hosted on the other side of the world for the first time. Which part of the wait is usually the biggest?',
      options: [
        'The server thinking about your request',
        'The data travelling back and forth across the network',
        'Your browser drawing the page',
        'Your computer reading the HTML file',
      ],
      answer: 1,
      reveal:
        'Travel. Even at the speed of light in fibre, crossing an ocean takes tens of milliseconds — and a first visit needs several round trips before the first byte of HTML arrives: one to look up the name, one to open the connection, one or two to agree on encryption, one for the request itself. Most servers answer in a few milliseconds. That is why the fixes that matter most — a [[cdn|CDN]], caching, fewer requests — are about *distance*, not faster code.',
    },
  },

  idea: {
    lede: 'Strip away the frameworks and every web page — a blog, a bank, a game — reaches you through the same five steps.',
    jobs: [
      {
        title: 'Find the machine',
        text: 'Names are for people. [[dns|DNS]] turns `shop.example.com` into an [[ip|IP address]], the number computers use to find each other.',
      },
      {
        title: 'Open a safe line',
        text: '[[tcp|TCP]] opens a connection that delivers bytes in order and resends lost ones. [[tls|TLS]] encrypts it, so nobody on the way can read or change it — the S in [[https|HTTPS]].',
      },
      {
        title: 'Ask, and get an answer',
        text: 'The browser sends a [[request]]: a method, a path, headers. The [[server]] runs code, maybe asks a database, and sends a [[response]]: a [[status-code|status code]], headers and a body.',
      },
      {
        title: 'Fetch what the page needs',
        text: 'The HTML names everything else — stylesheets, scripts, images, fonts. Each one is another request, often to a [[cdn|CDN]] close to you.',
      },
      {
        title: 'Turn text into pixels',
        text: 'The browser builds the [[dom|DOM]] from the HTML, applies the CSS, works out the layout and paints. JavaScript can then change the page without asking for a new one.',
      },
    ],
    picture:
      'Dinner at a restaurant you have never been to. You look up the address (DNS), drive there and get a table (TCP), agree with the waiter on a private code so nobody can overhear your order (TLS), and order from the menu (HTTP). The kitchen cooks — that is the server and the database — and the plates arrive one by one: the main dish first (the HTML), then the sides it comes with (CSS, scripts, images). You arrange it all on the table (rendering). Most of the evening is spent on the road, not in the kitchen.',
  },

  lessonNotes: {
    'mern-map': 'Start with the whole map: what each layer of a web app is for, and why data has to live on a server.',
    'url-to-page': 'Steps 1 to 4 with a stopwatch: DNS, TCP, TLS and HTTP. Ends with a sandbox where you move the server further away.',
    http: 'Step 3 up close: methods, headers, bodies, caching and cookies — the language every web app speaks.',
    rendering: 'Step 5: how HTML and CSS become pixels, and what keeps a page blank for longer than it should.',
    'request-journey': 'The same round trip inside your own app: a click in React, through Express and MongoDB, and back.',
  },

  options: {
    lede: 'There are four common ways to get a page onto a screen. They differ in one question: *who builds the HTML, and when?*',
    items: [
      {
        name: 'Static files',
        what: 'The HTML is written (or generated) once, ahead of time, and the same files go to everyone — usually from a CDN.',
        pickWhen: 'The content is the same for every visitor: a portfolio, documentation, a blog, a landing page.',
        cost: 'Nothing personal or live unless you add JavaScript and an API.',
        examples: 'Plain HTML, Astro, Hugo — hosted on Netlify, Vercel, Cloudflare Pages or GitHub Pages',
        tools: ['html', 'css'],
      },
      {
        name: 'Server-rendered pages',
        what: 'Each request runs code on the server, which builds the HTML for that visitor and sends it complete.',
        pickWhen: 'Every visitor sees different data and the page must show it straight away — to search engines too.',
        cost: 'The server works on every page view, and every click loads a whole new page unless you add JavaScript.',
        examples: 'Django, Ruby on Rails, Laravel, Express with a template engine',
        tools: ['django', 'ruby-on-rails', 'laravel'],
      },
      {
        name: 'Single-page apps (SPA)',
        what: 'The server sends one almost-empty HTML page plus a JavaScript bundle. The browser builds every screen and fetches data from an API as [[json|JSON]].',
        pickWhen: 'An app people use for a long time with lots of interaction: dashboards, editors, tools behind a login.',
        cost: 'A blank screen until the JavaScript has loaded, and more work for search engines and slow phones.',
        examples: 'React with Vite (this course’s stack), Vue, Angular',
        tools: ['react', 'vue', 'angular'],
      },
      {
        name: 'Hybrid frameworks',
        what: 'The first view is rendered on the server (or ahead of time), then the browser takes over like a SPA. Each page can pick what fits it.',
        pickWhen: 'You want a fast first view *and* app-like interaction, from one codebase.',
        cost: 'More to understand — what runs where — and a host that can run the server part.',
        examples: 'Next.js, Nuxt, SvelteKit, React Router in framework mode',
        tools: ['nextjs', 'nuxt'],
      },
    ],
    choose: [
      { when: 'A personal page, docs or a landing page', pick: 'Static files on a CDN. Fast, free to host, almost nothing to break.' },
      { when: 'A content site that must rank in search and show live data', pick: 'Server rendering, or a hybrid framework.' },
      { when: 'An app people log into and use for hours', pick: 'A single-page app talking to an API — what this course builds with React and Express.' },
      { when: 'Marketing pages and the app in one codebase', pick: 'A hybrid framework such as Next.js.' },
    ],
  },

  modern: {
    lede: 'Today a beginner can put a page on a global CDN in minutes, and an AI assistant can explain any request in the browser’s Network tab. What it won’t do on its own is notice that your page makes forty requests where four would do. Knowing the round trip is how *you* notice.',
    defaults: [
      'Serve everything over HTTPS. Hosting platforms set it up for free, automatically.',
      'Put static files — HTML, CSS, scripts, images — on a CDN, close to your users.',
      'Cache files that never change for a long time, with a content hash in their name; never cache the HTML page itself for long.',
      'Load scripts with `defer` (or `type="module"`) so they don’t hold up the page.',
      'Send less: compress and size images, split JavaScript, lazy-load what is below the first screen.',
      'Test on a real phone over a slow network, not only on your laptop’s fast connection.',
    ],
    aiGood: [
      'Explaining a request or response from the Network tab, header by header',
      'Reading a waterfall and pointing out what blocks the first paint',
      'Walking you through domains, DNS records and HTTPS on a host',
      'Writing the HTML and CSS of a page from a description',
    ],
    aiWrong: [
      { mistake: 'Says a slow page needs a faster server, when the time is spent travelling.', fix: 'Open the Network tab first: count round trips and bytes before touching any code.' },
      { mistake: 'Puts a plain `<script>` in the `<head>`, so the page waits for it.', fix: 'Add `defer`, or use `type="module"`.' },
      { mistake: 'Pulls in a whole library from a CDN for one small function.', fix: 'Check what it adds to the page; often a few lines of your own do the job.' },
      { mistake: 'Promises a DNS change “should work now” while the old record is still cached.', fix: 'DNS changes spread as caches expire (the record’s TTL). Check with `nslookup` or an online DNS lookup.' },
      { mistake: 'Calls an `http://` API from an `https://` page.', fix: 'Browsers block that mixed content. HTTPS everywhere.' },
      { mistake: 'Sets long cache headers on everything, so users keep an old version after a deploy.', fix: 'Long caching only for hashed files; `Cache-Control: no-cache` for the HTML.' },
    ],
  },

  build: {
    title: 'Watch your own page travel',
    brief: 'Build the smallest possible website — one HTML page, one stylesheet, one image, served by a few lines of Node — then follow every byte of its journey in the browser. No framework, nothing hidden. Then put it on the real internet.',
    byHand: [
      { title: 'Write the page', text: 'In a `public` folder: an `index.html` that links `style.css` and shows an `<img>`. Open the file straight from disk — it works, but only on your computer, and nothing travels.' },
      { title: 'Serve it', text: 'A few lines of Node with Express: `app.use(express.static(\'public\'))` and `app.listen(3000)`. Open `http://localhost:3000` — now every file arrives over HTTP, even if only across your own machine.', see: ['http', 1] },
      { title: 'Open the Network tab', text: 'DevTools → Network, tick *Disable cache*, reload. Find the requests: the HTML first, then the CSS and the image it asked for.', see: ['url-to-page', 7] },
      { title: 'Read one request', text: 'Click the HTML request. Find the method, the status code, the `Content-Type` header and the size. Every web product you build speaks this same language.', see: ['http', 3] },
      { title: 'Watch caching work', text: 'Untick *Disable cache* and reload. The CSS and image come back as `304 Not Modified` or straight from the browser’s cache, at almost no cost.', see: ['http', 5] },
      { title: 'Block the page on purpose', text: 'Add a plain `<script>` in the `<head>` that loops for two seconds. Reload: the page stays blank. Add `defer` and reload again.', see: ['rendering', 3] },
      { title: 'Put it online', text: 'Deploy the `public` folder to a static host (Netlify, Vercel or Cloudflare Pages) and open the link on your phone, over mobile data. That is your page, crossing the real internet.' },
    ],
    withAI: {
      lede: 'Now let an AI assistant build a richer page — then use what you just learned to check its work. A good prompt is a **spec**: what to build, the rules, and what you will check.',
      prompt: `Build a one-page personal website in plain HTML, CSS and a little JavaScript (no framework, no build step).

Content
- My name, one paragraph about me, three projects as cards, and a contact link.

Rules
- One index.html, one style.css, one script.js, and images in /images.
- Load script.js with defer. No external libraries or CDN scripts.
- Every <img> has width, height and alt; images below the first screen use loading="lazy"; each image is under 200 KB.
- It must look right on a 360px-wide phone and on a laptop.

Then, for each file, explain when the browser requests it and what would happen to the page if that request failed.`,
    },
    verify: [
      'Network tab with the cache disabled: you can say why each request is there.',
      'The HTML arrives with status **200** and `Content-Type: text/html`.',
      'Reload with the cache on: the CSS and images come back as **304** or *(memory cache)* / *(disk cache)*.',
      'No request is red, and the Console has no errors.',
      'The first load transfers less than **1 MB** in total.',
      'Throttle the network to *Slow 4G* and reload: the text appears before the images finish.',
      'The live link opens on your phone over **https://**, with no warning in the address bar.',
    ],
  },

  breakIt: [
    {
      title: 'A script in the head',
      lang: 'html',
      code: `<head>
  <title>Shop</title>
  <link rel="stylesheet" href="/style.css">
  <script src="/analytics.js"></script>
</head>`,
      err: [4],
      answer:
        'A plain `<script>` stops the HTML parser until the file has downloaded *and* run. If `analytics.js` is slow, the whole page stays blank. Add `defer` (it runs after the HTML is parsed, in order) — or `async` for scripts that don’t touch the page.',
      see: ['rendering', 3],
    },
    {
      title: 'Cache it all, for a year',
      lang: 'js',
      code: `app.use(express.static('public', { maxAge: '1y' }));`,
      err: [1],
      answer:
        'Every file — `index.html` included — may now stay in browsers’ caches for a year. After your next deploy, returning visitors keep the old HTML, which points at the old scripts. Cache files with a hash in their name (`app.3f9a1c.js`) for a long time, and send `Cache-Control: no-cache` for the HTML.',
      see: ['http', 5],
    },
    {
      title: 'An API on the side',
      lang: 'js',
      code: `// this page is served from https://myshop.app
const res = await fetch('http://api.myshop.app/products');
const products = await res.json();`,
      err: [2],
      answer:
        'An `https://` page may not load data from `http://`. The browser blocks it as *mixed content*, because anyone on the network could read or change that reply. Serve the API over HTTPS too.',
    },
  ],

  explain: [
    'Explain to a friend what happens between pressing Enter and seeing a page — in five steps, with no jargon.',
    'Why does a site hosted on the other side of the world feel slower, even when its server is fast?',
    'What does a CDN do, and why does it make pages faster?',
  ],

  deeper: [
    {
      q: 'How does DNS find an address it has never seen before?',
      a: 'Your resolver asks a root server where `.com` is, asks the `.com` servers where `example.com`’s name servers are, then asks those. Every answer is cached for its TTL — which is why lookups are usually instant, and why DNS changes take time to spread.',
    },
    {
      q: 'What is HTTP/3, and why does it run on UDP?',
      a: 'HTTP/3 runs on QUIC, a protocol built on UDP that does the connection and encryption handshakes together and stops one lost packet from holding up every other file. Fewer round trips — most noticeable on shaky mobile networks.',
    },
    {
      q: 'How can a CDN have a copy of my site in every city?',
      a: 'It runs servers in hundreds of locations. The first visitor near one of them makes that server fetch your file from your own server (the origin); everyone nearby after that gets the copy, until it expires.',
    },
    {
      q: 'Why is the second visit so much faster than the first?',
      a: 'The name is already looked up, the connection may be reused, and unchanged files come straight from the browser’s cache. Only what changed travels again.',
    },
    {
      q: 'Does the browser just wait while a script blocks it?',
      a: 'Not entirely. A *preload scanner* reads ahead in the HTML and starts downloading the images, styles and scripts it finds, even while the main parser is stuck.',
    },
    {
      q: 'What does “the server” look like, physically?',
      a: 'Usually a virtual machine or a container in a data centre: a slice of a much bigger computer, rented by the hour, and often one of several behind a load balancer.',
    },
  ],

  next: [
    { q: 'When your app asks for “my orders”, what is on the other end?', chapter: 'answer-requests' },
    { q: 'Where does the data actually live?', chapter: 'how-data-is-stored' },
    { q: 'How does a button change the page without loading a new one?', chapter: 'interact' },
    { q: 'How do you put your own app on the internet?', chapter: 'ship' },
  ],
};

export default writing;
