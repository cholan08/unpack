/**
 * Chapter: How the internet moves data (Part I · How things work).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You press Send on a photo. In under a second it is on a phone on another continent. On the way it was cut into hundreds of small pieces, each found its own route through machines owned by dozens of companies, some pieces were lost and sent again — and the photo arrived whole, in order, unread by anyone in between.',
      'Nobody is in charge of the internet. It is thousands of independent networks that agreed on a few simple rules for addresses, routes and delivery. Those rules are why it works — and why it is sometimes slow.',
      'How does a message cross an ocean in a fraction of a second, and find the one computer it was meant for?',
    ],
    predict: {
      q: 'Why does a site hosted in another country load slower than one in your own city, even on fast broadband?',
      options: [
        'The faraway server is slower',
        'Distance: every round trip has to travel there and back, and a page needs several',
        'Foreign websites are bigger',
        'Traffic between countries is limited on purpose',
      ],
      answer: 1,
      reveal:
        'Distance. Signals in fibre travel at about two-thirds of the speed of light — fast, but a round trip across an ocean still takes tens of milliseconds, and loading a page needs several (DNS, connection, encryption, the request). Bandwidth is how *much* you can send at once; [[latency]] is how long each trip takes. Faster broadband raises bandwidth; only moving closer — with a [[cdn|CDN]] — cuts latency.',
    },
  },

  idea: {
    lede: 'Email, video calls, web pages, games — everything on the internet travels by the same five rules.',
    jobs: [
      {
        title: 'Every machine has an address',
        text: 'An [[ip|IP address]] identifies a machine on the network; a port identifies a program on it. `93.184.215.14:443` means “that machine, its web server”.',
      },
      {
        title: 'Names point to addresses',
        text: '[[dns|DNS]] is the internet’s directory: it turns names people remember into IP addresses, and every answer is cached for a while.',
      },
      {
        title: 'Data travels in packets',
        text: 'Messages are cut into small packets. Routers pass each one along toward its destination, and different packets can take different paths.',
      },
      {
        title: 'Delivery is made reliable',
        text: '[[tcp|TCP]] numbers the packets, resends lost ones and puts them back in order, so your app sees one clean stream. Calls and games often prefer speed to perfection and use UDP instead.',
      },
      {
        title: 'Conversations stay private',
        text: '[[tls|TLS]] encrypts the connection and proves the server is who it says, using a certificate. That is the padlock in [[https|HTTPS]].',
      },
    ],
    picture:
      'Posting a book abroad, one page per envelope. Each envelope carries the full address (IP and port), which you first look up in a directory (DNS). Post offices pass envelopes along whichever road is open (routing), so they arrive in any order. Your friend numbers the pages, asks again for any that went missing, and binds the book in order (TCP). And every envelope is sealed with a lock only your friend can open (TLS).',
  },

  lessonNotes: {
    'url-to-page': 'All five rules in one page load — DNS, TCP, TLS and HTTP — with a stopwatch, and a sandbox where you move the server further away.',
    http: 'What travels inside the connection: requests and responses, headers, caching, cookies, and HTTP/1.1 versus 2 versus 3.',
  },

  options: {
    lede: 'You rarely choose how packets are routed, but you do choose the protocol your app speaks on top. Each one trades something for something else.',
    items: [
      {
        name: 'HTTP over TCP (HTTP/1.1, HTTP/2)',
        what: 'Requests and responses over a reliable connection; HTTP/2 carries many at once over a single connection.',
        pickWhen: 'Almost everything on the web: pages, APIs, files.',
        cost: 'One lost packet can briefly hold up everything behind it on that connection.',
        examples: 'Every browser and server: Express, Nginx',
        tools: ['express', 'nginx'],
      },
      {
        name: 'HTTP/3 over QUIC',
        what: 'The newest HTTP, on a UDP-based protocol that handles losses stream by stream and combines the connection and encryption handshakes.',
        pickWhen: 'Turned on at your CDN or host — it helps most on phones and patchy networks.',
        cost: 'Mostly handled for you; some networks block UDP, and browsers fall back to HTTP/2.',
        examples: 'All major browsers; Cloudflare and most CDNs',
      },
      {
        name: 'WebSockets',
        what: 'A long-lived, two-way connection over TCP, opened from an HTTP request.',
        pickWhen: 'Chat, live updates, multiplayer.',
        cost: 'Long-lived connections to manage and scale.',
        examples: 'Socket.IO, ws',
      },
      {
        name: 'UDP and WebRTC',
        what: 'Packets without delivery guarantees — for when late data is worse than lost data. WebRTC builds browser-to-browser audio, video and data on top.',
        pickWhen: 'Voice and video calls, real-time games.',
        cost: 'You handle losses yourself, and direct connections need helper servers (STUN/TURN) to get past home routers.',
        examples: 'WebRTC, game-networking libraries',
      },
      {
        name: 'Private networks',
        what: 'Machines connect securely as if on one network, without being exposed to the internet.',
        pickWhen: 'Databases and internal services that should never be public.',
        cost: 'Setup, and managing who has access.',
        examples: 'Cloud VPCs, Tailscale, WireGuard',
      },
    ],
    choose: [
      { when: 'A website or an API', pick: 'HTTPS — over HTTP/2 or HTTP/3, which your host or CDN usually turns on for you.' },
      { when: 'Live, two-way updates', pick: 'WebSockets.' },
      { when: 'Voice, video or a fast-paced game', pick: 'WebRTC or another UDP-based protocol.' },
      { when: 'A database or internal service', pick: 'A private network — never open to the internet.' },
    ],
  },

  modern: {
    lede: 'You will rarely configure a router, and hosting platforms handle certificates, HTTP/3 and CDNs with a checkbox. But when something breaks — a domain that won’t resolve, a timeout, a certificate warning, a page that is slow only abroad — the fix starts with knowing which of the five rules failed. AI can diagnose it with you, if you can describe the symptom precisely.',
    defaults: [
      'HTTPS everywhere, with certificates renewed automatically by your host or Let’s Encrypt.',
      'Serve people from nearby: a CDN for static files, and a server region close to most of your users.',
      'Fewer round trips: reuse connections, use HTTP/2 or HTTP/3, avoid chains of redirects.',
      'Keep databases and internal services on a private network, never on a public address.',
      'Lower a DNS record’s TTL a day before you change it, so the change spreads quickly.',
      'Know the diagnostic tools: `ping`, `nslookup` or `dig`, `traceroute`, and the browser’s Network tab.',
    ],
    aiGood: [
      'Explaining what a DNS record, a port or a certificate error means',
      'Walking through a diagnosis: is it DNS, the connection, TLS or the app?',
      'Reading `traceroute` or `dig` output with you',
      'Setting up DNS records for a domain and its email',
      'Explaining networking words in plain language',
    ],
    aiWrong: [
      { mistake: 'Says a DNS change is live while resolvers still cache the old record.', fix: 'Changes spread as the old TTL runs out; check from several networks.' },
      { mistake: 'Opens a database port to every address to fix a connection error.', fix: 'Allow only your app’s addresses, or use a private network.' },
      { mistake: 'Turns off certificate checks to silence a TLS error.', fix: 'Fix the certificate or the hostname — never turn verification off.' },
      { mistake: 'Blames the server for slowness that is really distance.', fix: 'Compare from different regions, and look at round-trip times first.' },
      { mistake: 'Mixes up bandwidth and latency.', fix: 'Big files need bandwidth; many small requests need low latency.' },
      { mistake: 'Hardcodes an IP address instead of a hostname.', fix: 'Use names. Addresses change.' },
    ],
  },

  build: {
    title: 'Trace a real journey',
    brief: 'No app this time. You will take one real page load apart with the tools network engineers use, and draw its journey — from a name, to an address, to a route across the world, to an encrypted conversation.',
    byHand: [
      { title: 'Find the address', text: 'Run `nslookup example.com` (or `dig example.com`). Note the IP address and, with `dig`, the record’s TTL.', see: ['url-to-page', 3] },
      { title: 'Measure the distance', text: '`ping` a site near you and one on another continent, and compare the round-trip times. That difference is latency — mostly physics.', see: ['url-to-page', 8] },
      { title: 'Follow the route', text: 'Run `tracert` (Windows) or `traceroute` (Mac, Linux) to the far site and count the hops. Notice where the times jump — often where the route crosses an ocean.' },
      { title: 'Watch the connection', text: 'In DevTools → Network, add the *Protocol* and *Connection ID* columns and load a site. How many requests share one connection? Is it h2 or h3?', see: ['http', 7] },
      { title: 'Check the padlock', text: 'Click the padlock in the address bar and open the certificate: who issued it, for which names, and until when.', see: ['url-to-page', 5] },
      { title: 'Time it', text: 'Open one request’s *Timing* tab: DNS lookup, connecting, TLS, waiting for the server, downloading. Which slice is biggest?', see: ['url-to-page', 9] },
      { title: 'Draw it', text: 'On paper: your device → your router → your provider → … → the server, with the times you measured at each step.' },
    ],
    withAI: {
      lede: 'Use your AI assistant as a lab partner: you run the commands, it helps you read them — but only after you have guessed.',
      prompt: `I'm learning how the internet works. Be my lab partner, not my lecturer.

I will paste the output of these, one at a time:
1. nslookup (or dig) example.com
2. ping to a nearby site and to a site on another continent
3. tracert / traceroute to the far site
4. the Timing tab of one request in my browser's Network panel

For each one, first ask me what I think it shows. Then explain what each line means,
point out the most interesting number, and connect it to one of: IP addresses, DNS,
packets and routing, TCP, or TLS. Keep each explanation under 120 words.`,
    },
    verify: [
      'You found a site’s IP address and the TTL of its DNS record.',
      'You can explain in one sentence why the faraway ping is longer.',
      'You can point to the hop where the route crossed an ocean or a continent.',
      'You know whether a site you use every day speaks HTTP/2 or HTTP/3.',
      'You read a certificate’s issuer and expiry date.',
      'You can name the biggest slice of one request’s timing, and what would shrink it.',
      'Your drawing has a real, measured number at every step.',
    ],
  },

  breakIt: [
    {
      title: 'Open to the world',
      lang: 'bash',
      code: `# database firewall rule, added to fix "connection refused"
allow inbound tcp 27017 from 0.0.0.0/0`,
      err: [2],
      answer:
        '`0.0.0.0/0` means every address on the internet. Bots scan for open database ports all day, and an exposed database is found within hours. Allow only your app servers’ addresses — or keep the database on a private network.',
    },
    {
      title: 'Silencing the certificate',
      lang: 'bash',
      code: `# "unable to verify the first certificate"? Just turn it off:
NODE_TLS_REJECT_UNAUTHORIZED=0 node server.js`,
      err: [2],
      answer:
        'This makes Node accept *any* certificate on every outgoing HTTPS call, so anyone between you and the other server can read and change the traffic — the whole point of TLS, gone. Fix the cause instead: a valid certificate, the right hostname, or your own internal certificate authority trusted explicitly.',
    },
    {
      title: 'A fixed address',
      lang: 'js',
      code: `const API = 'http://142.250.74.46:8080/api';`,
      err: [1],
      answer:
        'An IP address changes when the server moves or scales — and this is plain `http`, so anyone on the network path can read and change the traffic. Use a hostname over HTTPS (`https://api.myapp.com`), and let DNS do its job.',
    },
    {
      title: 'Moving the domain',
      lang: 'text',
      code: `10:00  Point myapp.com's A record at the new server (TTL 86400)
10:05  Shut down the old server`,
      err: [1, 2],
      answer:
        'The old record had a 24-hour TTL, so many resolvers keep sending people to the old server for up to a day — which you just switched off. Lower the TTL (to 300 seconds, say) a day ahead, then change the record, and keep the old server running until the traffic has moved.',
    },
  ],

  explain: [
    'What is the difference between an IP address and a domain name — and how does one become the other?',
    'Why does TCP exist, if packets can already cross the internet on their own?',
    'What is the difference between bandwidth and latency? Which one does a CDN improve?',
  ],

  deeper: [
    {
      q: 'What is IPv6, and why do we need it?',
      a: 'IPv4 has about 4.3 billion addresses — not enough for every phone and device. IPv6 has so many that every device can have its own. Both run side by side today.',
    },
    {
      q: 'How do home routers share one public address?',
      a: 'With NAT: the router gives your devices private addresses and rewrites their traffic to use its single public address, remembering which reply belongs to which device.',
    },
    {
      q: 'What is BGP?',
      a: 'The protocol networks use to tell each other which addresses they can reach — how the internet finds routes between thousands of independent networks. When it is misconfigured, large parts of the internet can disappear for hours.',
    },
    {
      q: 'How do continents stay connected?',
      a: 'Mostly through fibre-optic cables on the ocean floor — a few hundred of them carry nearly all traffic between continents. Satellites carry a small share.',
    },
    {
      q: 'How does a certificate prove who a server is?',
      a: 'A certificate authority checks that the requester controls the domain, then signs a certificate tying the domain to the server’s public key. Your browser trusts a list of authorities and checks that signature on every connection.',
    },
    {
      q: 'What is a firewall?',
      a: 'A set of rules about which traffic may enter or leave a network or a machine — by address, port and protocol. Cloud providers call theirs security groups.',
    },
  ],

  next: [
    { q: 'What happens in the second between pressing Enter and seeing a page?', chapter: 'how-the-web-works' },
    { q: 'What is on the other end of an API call?', chapter: 'answer-requests' },
    { q: 'How do live updates reach you instantly?', chapter: 'realtime' },
    { q: 'How do big apps feel fast all over the world?', chapter: 'fast' },
  ],
};

export default writing;
