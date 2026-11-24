import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'nextjs',
  title: 'Next.js',
  name: 'Next.js',
  tagline: 'The React framework: file-based routing, server rendering, Server Components, data caching and deployment.',
  color: 'purple',
  pillar: 'frontend',
  order: 60,
  cover: {
    big: 'NEXT.JS',
    full: 'Next.js',
    cloud: ['React,', 'plus routing,', 'servers', 'and SEO'],
    art: {
      topLeft: iconArt('server', 'Next', 'purple'),
      topRight: flowArt(['Request', 'Server render', 'HTML', 'Hydrate'], 'purple'),
      left: codeArt(['app/', '  page.tsx', '  layout.tsx', '  blog/[slug]/page.tsx'], 'Routes'),
      centre: hubArt('Next.js', ['SSR', 'SSG', 'ISR', 'CSR'], 'box', 'purple'),
    },
    side: { title: 'Render', items: ['Server Comp.', 'Client Comp.', 'Streaming', 'Caching'] },
    why: { title: 'Why Next.js ?', items: ['SEO-friendly React', 'File-based routing', 'Full stack in one app', 'Fast by default'] },
    footer: 'Render where it makes sense!',
  },
  pages: [
    pg('introduction', 'Introduction to Next.js', 'Why a React framework', 'App Router vs Pages Router', 'Project structure', 'dev, build, start'),
    pg('routing', 'File-based Routing', 'page, layout, loading, error files', 'Dynamic segments', 'Route groups', 'Link and navigation'),
    pg('rendering', 'Rendering Strategies', 'CSR, SSR, SSG, ISR', 'Server vs Client Components', "The 'use client' boundary", 'Streaming with Suspense'),
    pg('data', 'Data Fetching & Caching', 'fetch in Server Components', 'Caching and revalidation', 'Server Actions', 'Mutations'),
    pg('route-handlers', 'Route Handlers & Middleware', 'route.ts API handlers', 'Middleware', 'Edge vs Node runtime', 'Cookies and headers'),
    pg('styling-assets', 'Styling, Images & Metadata', 'CSS Modules and Tailwind', 'next/image', 'next/font', 'Metadata and SEO'),
    pg('auth-deploy', 'Auth & Deployment', 'Auth.js and sessions overview', 'Environment variables', 'Deploying to Vercel', 'Self-hosting'),
    revision('SSR vs SSG vs ISR', 'Server vs Client Components', 'Next.js vs plain React'),
  ],
});
