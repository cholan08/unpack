import { box, browser, chip, defineLesson, defineSandbox, flow, fmt, link, patch, range, toggle, zone } from '@/content/dsl';
import type { FlowSpec, LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: browser left, the internet in between, origin server right ---------- */
const blank: ScreenLine[] = [{ t: 'spinner', text: 'Waiting for todo-app.com…' }];
const skeleton: ScreenLine[] = [{ t: 'h', text: 'My todos' }, { t: 'skeleton', n: 3 }];
const loaded: ScreenLine[] = [
  { t: 'h', text: 'My todos' },
  { t: 'item', text: 'Buy milk' },
  { t: 'item', text: 'Learn MERN' },
  { t: 'item', text: 'Call mom' },
];

const net = zone(505, 300, 270, 540, 'Internet', { tone: 'net', icon: 'globe' });
const web = browser(150, 300, { w: 230, h: 190, url: 'todo-app.com', screen: blank });
const dns = box(505, 110, 'DNS resolver', { sub: 'name → number', icon: 'search', tone: 'net', w: 210 });
const origin = box(860, 300, 'todo-app.com', { sub: '93.184.216.34', icon: 'server', tone: 'server', w: 200 });
const cdn = box(505, 480, 'CDN edge', { sub: 'a copy near you', icon: 'cloud', tone: 'net', w: 200 });
const lock = chip(505, 245, 'TLS 1.3 · encrypted', { tone: 'auth', icon: 'lock' });

const base = { net, web, origin };
const toOrigin = link('web', 'origin');

const RTT = 'one round trip';

/* ---------- sandbox: move the server, slow it down, add a CDN, come back later ---------- */
const sandbox = defineSandbox({
  intro: 'Move the server nearer or further, change how long it thinks, then try a CDN and a return visit. Which change moves the **total** most?',
  controls: [
    range('rtt', 'Round trip to the server', { min: 5, max: 300, value: 60, step: 5, unit: 'ms' }),
    range('think', 'Server thinking time', { min: 0, max: 400, value: 40, step: 10, unit: 'ms' }),
    toggle('cdn', 'JS and CSS from a CDN (5 ms away)'),
    toggle('repeat', 'Return visit (DNS and files cached)'),
  ],
  compute: (v) => {
    const rtt = Number(v.rtt);
    const think = Number(v.think);
    const useCdn = v.cdn === true;
    const repeat = v.repeat === true;
    const dnsMs = repeat ? 0 : 20;
    const html = rtt + think;
    const assets = repeat ? 0 : (useCdn ? 15 : rtt) + 40; // the trip(s), then ~40 ms to download
    const boot = 80; // parse and run the bundle
    const total = dnsMs + rtt + rtt + html + assets + boot + (rtt + think);
    const trips = 4 + (!repeat && !useCdn ? 1 : 0); // TCP, TLS, HTML, (bundle), API
    const waiting = trips * rtt;
    const pace = Math.min(2, Math.max(0.6, 70 / rtt)); // a far server → slow packets
    const every = 6 / Math.min(1, pace);
    const nodes: Record<string, NodeSpec> = {
      ...base,
      lock,
      origin: { ...origin, badge: { text: `${rtt} ms away`, tone: rtt > 150 ? 'warn' : 'neutral' } },
      web: { ...web, screen: loaded, badge: repeat ? { text: 'files from cache', tone: 'ok' } : undefined },
      ...(repeat ? {} : { dns }),
      ...(useCdn ? { cdn: { ...cdn, state: repeat ? 'dim' : 'active' } } : {}),
    };
    const links: LinkSpec[] = [toOrigin, ...(repeat ? [] : [link('web', 'dns')]), ...(useCdn ? [link('web', 'cdn')] : [])];
    const flows: FlowSpec[] = [
      ...(repeat ? [] : [flow(['web', 'dns'], { label: 'DNS', back: 'res', every })]),
      flow(['web', 'origin'], { label: 'GET /', back: 'res', backLabel: 'HTML', every, offset: 0.6, speed: pace, dwell: think / 400 + 0.1 }),
      ...(repeat
        ? []
        : [useCdn
            ? flow(['web', 'cdn'], { label: 'app.js', back: 'res', every, offset: every * 0.35, speed: 2 })
            : flow(['web', 'origin'], { label: 'app.js', back: 'res', every, offset: every * 0.35, speed: pace })]),
      flow(['web', 'origin'], { kind: 'req', label: 'GET /api/todos', back: 'res', backLabel: 'JSON', every, offset: every * 0.6, speed: pace, dwell: think / 400 + 0.1 }),
    ];
    const extra = [
      think >= 200 ? ` The server’s ${think} ms counts twice: once for the HTML, once for the API.` : '',
      useCdn && !repeat ? ` The CDN saves ${rtt + 40 - 55} ms on the bundle — more the further away your users are.` : '',
      repeat ? ' A return visit skips the DNS lookup and the bundle download entirely.' : '',
    ].join('');
    return {
      scene: { nodes, links, flows },
      metrics: { dns: dnsMs, tcp: rtt, tls: rtt, http: html, total },
      tone: total < 400 ? 'ok' : total < 800 ? 'warn' : 'danger',
      note: `**${fmt(total)} ms** until the list appears. ${trips} round trips × ${rtt} ms = **${fmt(waiting)} ms** of it (${Math.round((waiting / total) * 100)}%) is just waiting on distance.${extra}`,
    };
  },
});

export default defineLesson({
  metrics: [
    { id: 'dns', label: 'DNS', unit: 'ms', better: 'lower' },
    { id: 'tcp', label: 'TCP', unit: 'ms', better: 'lower' },
    { id: 'tls', label: 'TLS', unit: 'ms', better: 'lower' },
    { id: 'http', label: 'HTTP', unit: 'ms', better: 'lower' },
    { id: 'total', label: 'Total so far', unit: 'ms', better: 'lower' },
  ],
  legend: { data: 'handshake' },
  goals: [
    { text: 'How DNS turns a name into an address', step: 3 },
    { text: 'Why a connection costs round trips', step: 4 },
    { text: 'What TLS (the S in HTTPS) adds', step: 5 },
    { text: 'What an HTTP request and response look like', step: 6 },
    { text: 'Where the time goes, and how CDNs help', step: 8 },
    { text: 'Run the stopwatch with your own numbers', step: 9 },
  ],
  steps: [
    {
      short: 'Enter',
      beat: 'setup',
      title: 'You type an address and press Enter',
      body: [
        'Between pressing Enter and seeing your todos, the browser talks to several machines, some of them thousands of kilometres away.',
        'Let’s follow it hop by hop and keep a stopwatch running. In this example the server is **60 ms** away — that’s how long one trip there *and back* takes.',
      ],
      metrics: { dns: null, tcp: null, tls: null, http: null, total: 0 },
      scene: { nodes: base, links: [toOrigin] },
    },
    {
      short: 'Names',
      beat: 'problem',
      title: 'The internet doesn’t understand names',
      body: [
        'Networks route traffic by number — an [[ip|IP address]] like `93.184.216.34` — not by names like `todo-app.com`.',
        'Before it can send a single byte to the server, the browser has to find out which number that name stands for.',
      ],
      metrics: { dns: null, tcp: null, tls: null, http: null, total: 0 },
      scene: {
        nodes: patch(base, { origin: { label: '???', sub: 'where is it?', state: 'ghost' } }),
        links: [link('web', 'origin', { state: 'off' })],
      },
    },
    {
      short: 'DNS',
      beat: 'technique',
      title: 'DNS: look the name up',
      body: [
        'The browser asks a [[dns|DNS]] resolver — usually run by your internet provider — *“where is todo-app.com?”* The resolver answers with the IP address.',
        'Answers are cached at every level (browser, operating system, resolver), so on a repeat visit this step usually costs nothing.',
      ],
      metrics: { dns: 20, tcp: null, tls: null, http: null, total: 20 },
      scene: {
        nodes: { ...base, dns: { ...dns, state: 'active' } },
        links: [toOrigin, link('web', 'dns')],
        flows: [flow(['web', 'dns'], { label: 'todo-app.com?', back: 'res', backLabel: '93.184.216.34', every: 3.2 })],
      },
    },
    {
      short: 'TCP',
      beat: 'technique',
      title: 'TCP: open a connection',
      body: [
        'Now the browser opens a [[tcp|TCP]] connection to that address with a three-way handshake: *SYN* (“can we talk?”), *SYN-ACK* (“yes”), *ACK* (“great”).',
        'No page data moves yet, and it already cost **' + RTT + '** — 60 ms.',
      ],
      callout: { kind: 'insight', text: 'Distance sets a hard floor on [[latency]]: light in fibre needs ~100 ms just to go London → Sydney → London.' },
      metrics: { dns: 20, tcp: 60, tls: null, http: null, total: 80 },
      scene: {
        nodes: { ...base, dns: { ...dns, state: 'dim' } },
        links: [toOrigin, link('web', 'dns', { state: 'off' })],
        flows: [
          flow(['web', 'origin'], { kind: 'data', label: 'SYN', every: 5.4 }),
          flow(['origin', 'web'], { kind: 'data', label: 'SYN-ACK', every: 5.4, offset: 1.75 }),
          flow(['web', 'origin'], { kind: 'data', label: 'ACK', every: 5.4, offset: 3.5 }),
        ],
      },
    },
    {
      short: 'TLS',
      beat: 'technique',
      title: 'TLS: agree on encryption',
      body: [
        'It’s an `https://` address, so before any HTTP the two sides set up [[tls|TLS]]. The server sends its **certificate** — proof, signed by a trusted authority, that it really is todo-app.com — and both sides agree on keys.',
        'From now on nobody in between (café Wi-Fi, your ISP) can read or change the traffic. TLS 1.3 costs one more round trip.',
      ],
      metrics: { dns: 20, tcp: 60, tls: 60, http: null, total: 140 },
      scene: {
        nodes: { ...base, lock: { ...lock, state: 'active' } },
        links: [toOrigin],
        flows: [
          flow(['web', 'origin'], { kind: 'auth', label: 'hello + keys', every: 4.2 }),
          flow(['origin', 'web'], { kind: 'auth', label: 'certificate + keys', every: 4.2, offset: 1.9 }),
        ],
      },
    },
    {
      short: 'HTTP',
      beat: 'technique',
      title: 'HTTP: finally, ask for the page',
      body: [
        'Over the encrypted connection the browser sends an HTTP [[request]]: a method, a path and some headers. The server replies with a [[status-code|status code]], headers, and the HTML.',
        'That’s another round trip, plus whatever time the server spends thinking.',
      ],
      code: {
        lang: 'http',
        file: 'request → response',
        code: `GET / HTTP/1.1
Host: todo-app.com
Accept: text/html

HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Cache-Control: no-cache

<!doctype html>
<div id="root"></div>
<script type="module" src="/assets/app-4f9c.js"></script>`,
        hl: [1, 5],
      },
      check: {
        q: 'Server 60 ms away, a first visit over HTTPS. Before the first byte of HTML arrives, about how many round trips have happened (ignoring DNS)?',
        options: ['One', 'Two', 'Three', 'Ten'],
        answer: 2,
        explain: 'TCP handshake, TLS handshake, then the HTTP request itself: three round trips ≈ 180 ms before the server’s answer even starts.',
      },
      metrics: { dns: 20, tcp: 60, tls: 60, http: 100, total: 240 },
      scene: {
        nodes: { ...base, lock, origin: { ...origin, state: 'active' }, web: { ...web, screen: skeleton } },
        links: [toOrigin],
        flows: [flow(['web', 'origin'], { label: 'GET /', back: 'res', backLabel: '200 · index.html', every: 4.2, dwell: 0.4 })],
      },
    },
    {
      short: 'More requests',
      beat: 'technique',
      title: 'The HTML asks for more',
      body: [
        'A React app’s first HTML is nearly empty: a `<div id="root">` and a `<script>` tag. The browser now downloads the JavaScript bundle and CSS (over the same connection), runs React — and React fetches the data from your [[api|API]].',
        'Only after that last response does the list appear. Each “and then” is another round trip.',
      ],
      metrics: { dns: 20, tcp: 60, tls: 60, http: 100, total: 520 },
      scene: {
        nodes: { ...base, lock, web: { ...web, screen: loaded } },
        links: [toOrigin],
        flows: [
          flow(['web', 'origin'], { label: 'GET app.js', back: 'res', backLabel: '180 KB', every: 5.2 }),
          flow(['web', 'origin'], { label: 'GET app.css', back: 'res', backLabel: '12 KB', every: 5.2, offset: 0.4 }),
          flow(['web', 'origin'], { kind: 'req', label: 'GET /api/todos', back: 'res', backLabel: 'JSON', every: 5.2, offset: 2.6 }),
        ],
      },
    },
    {
      short: 'Where time goes',
      beat: 'insight',
      title: 'Where the time goes — and how to win it back',
      body: [
        'Look at the stopwatch: most of the half second is **waiting on round trips**, not downloading bytes or running code.',
        'So the big wins are about distance and trip count: put static files on a [[cdn|CDN]] near users, cache aggressively, reuse connections, and avoid chains of “load this, then that, then that”.',
      ],
      changes: ['+ CDN edge serves app.js and app.css from nearby (5 ms away)', '~ Only the API call still travels to the origin'],
      metrics: { dns: 20, tcp: 60, tls: 60, http: 100, total: 330 },
      scene: {
        nodes: { ...base, lock, cdn: { ...cdn, state: 'active' }, web: { ...web, screen: loaded } },
        links: [toOrigin, link('web', 'cdn')],
        flows: [
          flow(['web', 'cdn'], { label: 'app.js', back: 'res', backLabel: '5 ms', every: 4.4, speed: 1.6 }),
          flow(['web', 'origin'], { label: 'GET /api/todos', back: 'res', backLabel: 'JSON', every: 4.4, offset: 1 }),
        ],
      },
    },
    {
      short: 'Try it',
      beat: 'try',
      title: 'Your stopwatch',
      body: ['Every number on the stopwatch comes from four things you can change here. Move them and watch the page load replay.'],
      sandbox,
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'The journey of a page load',
      body: [
        '{net:DNS} turns the name into an IP address (usually cached).',
        '{net:TCP} opens a connection (1 round trip); {auth:TLS} encrypts it (1 more).',
        '{server:HTTP} asks for the page; a React app then asks for JS, CSS and API data.',
        'Latency × round trips dominates. Fewer trips and shorter distances beat faster servers.',
      ],
      metrics: { dns: 20, tcp: 60, tls: 60, http: 100, total: 330 },
      scene: {
        nodes: { ...base, dns, lock, cdn, web: { ...web, screen: loaded } },
        links: [toOrigin, link('web', 'dns'), link('web', 'cdn')],
        flows: [
          flow(['web', 'dns'], { label: 'DNS', back: 'res', every: 5 }),
          flow(['web', 'origin'], { label: 'GET /', back: 'res', every: 5, offset: 1.4 }),
          flow(['web', 'cdn'], { label: 'assets', back: 'res', every: 5, offset: 3 }),
        ],
      },
    },
  ],
});
