import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'web-development',
  title: 'Web Dev',
  name: 'Web Development',
  tagline: 'The big picture: how the web works, what frontend and backend do, and the path from first page to job-ready.',
  color: 'green',
  pillar: 'start',
  order: 10,
  cover: {
    big: 'WEB DEV',
    full: 'Web Development',
    cloud: ['Browser,', 'server,', 'database,', 'and the wire'],
    art: {
      topLeft: iconArt('laptop', 'Web'),
      topRight: flowArt(['Browser', 'DNS', 'Server', 'Database']),
      left: codeArt(['GET / HTTP/1.1', 'Host: unpacked.dev', '', 'HTTP/1.1 200 OK'], 'HTTP'),
      centre: hubArt('Website', ['Frontend\n(UI)', 'Backend\n(logic)', 'Database\n(data)', 'Hosting\n(deploy)'], 'pc'),
    },
    side: { title: 'Stack', items: ['HTML / CSS', 'JavaScript', 'Node / APIs', 'Database'] },
    why: { title: 'Why Web Dev ?', items: ['Build what anyone can open', 'Huge job market', 'Instant feedback', 'Works on every device'] },
    footer: 'Ship it, then improve it!',
  },
  pages: [
    pg('introduction', 'Introduction to Web Development', 'Website vs web app', 'Frontend, backend and full stack', 'Roles: developer, designer, DevOps', 'Tools: editor, browser, terminal'),
    pg('how-web-works', 'How the Web Works', 'Client–server model', 'Anatomy of a URL', 'DNS → TCP → TLS → HTTP', 'What happens when you type a URL'),
    pg('http', 'HTTP Basics', 'Request and response structure', 'Methods: GET, POST, PUT, PATCH, DELETE', 'Status code families (1xx–5xx)', 'Headers, cookies and caching'),
    pg('browsers', 'Browsers & Rendering', 'HTML → DOM, CSS → CSSOM', 'Render tree, layout, paint', 'Why JavaScript can block rendering', 'A tour of DevTools'),
    pg('frontend', 'Frontend Development', 'What HTML, CSS and JavaScript each do', 'Frameworks: React, Vue, Angular', 'Responsive design', 'Accessibility basics'),
    pg('backend', 'Backend Development', 'Servers, APIs and business logic', 'Languages: Node, Python, Java, Go', 'Databases: SQL vs NoSQL', 'Authentication overview'),
    pg('stacks', 'Tech Stacks & Architecture', 'MERN, MEAN, LAMP, JAMstack', 'Static vs dynamic sites', 'Monolith vs microservices', 'How to choose a stack'),
    pg('hosting', 'Domains, Hosting & Deployment', 'Domain names and DNS records', 'Shared, VPS, cloud and serverless hosting', 'Vercel, Netlify, Render', 'HTTPS and certificates'),
    pg('tooling', 'Developer Tooling', 'Git and GitHub', 'npm and package managers', 'Build tools: Vite and bundlers', 'Linting and formatting'),
    pg('performance', 'Web Performance & SEO', 'Core Web Vitals: LCP, INP, CLS', 'Images, caching and CDNs', 'Lazy loading', 'SEO basics: meta tags, sitemaps'),
    pg('roadmap', 'Learning Roadmap & Career', 'Beginner → job-ready path', 'Portfolio projects', 'Reading docs and debugging', 'Preparing for interviews'),
    revision('Frontend vs backend', 'Static vs dynamic', 'HTTP vs HTTPS'),
  ],
});
