/**
 * Skill plans: what to learn in each main topic, in order. A topic page (/frontend … /aiml) draws
 * its plan from here as stages of skill tiles; the lesson-by-lesson list lives on the course map.
 *
 * Every link is optional and points at something the site already has:
 *   tool     → Skill Pack tool id (/skillpack/:id, ../skillpack/data.ts) — its full topic list
 *   lessons  → lesson ids in the MERN course (course.ts) — written ones count towards the skill
 *   notebook → notebook id (/notebooks/:id)
 *   sheet    → Techpack sheet id (/techpack#tp-:id)
 * `icon` is a Skill Pack brand mark (../skillpack/icons.tsx); `glyph` is a lucide icon for ideas
 * that have no logo. Skill ids are global: they key the learner's "I know this" ticks.
 */
import type { LucideIcon } from 'lucide-react';
import {
  Accessibility,
  Activity,
  ArrowLeftRight,
  Binary,
  Bot,
  Brain,
  CloudDownload,
  Cpu,
  Database,
  FileSearch,
  Fingerprint,
  FlaskConical,
  Gauge,
  GitBranch,
  KeyRound,
  ListOrdered,
  Lock,
  MessageSquareText,
  MousePointerClick,
  Network,
  Package,
  Radio,
  Rocket,
  Route,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Shapes,
  Sigma,
  Target,
  Terminal,
  Timer,
  Upload,
  Waypoints,
  Workflow,
  Zap,
  Filter,
  Layers,
  Globe,
} from 'lucide-react';
import type { PillarId } from '@/engine/types';

/** core: everyone needs it. extra: good to know, or an alternative to a core skill. */
export type SkillLevel = 'core' | 'extra';

export interface PlanSkill {
  id: string;
  name: string;
  /** One line: what it is for / what you learn. */
  what: string;
  level: SkillLevel;
  icon?: string;
  glyph?: LucideIcon;
  tool?: string;
  lessons?: string[];
  notebook?: string;
  sheet?: string;
}

export interface PlanStage {
  id: string;
  title: string;
  /** What you can do once the stage is done. */
  goal: string;
  /** Rough time at a few hours a day. */
  time: string;
  skills: PlanSkill[];
  /** A small build that proves the stage. */
  build: string;
}

export type PlanPillar = Extract<PillarId, 'frontend' | 'backend' | 'database' | 'devops' | 'aiml'>;

export const PLANS: Record<PlanPillar, PlanStage[]> = {
  /* ================================ Frontend ================================ */
  frontend: [
    {
      id: 'fe-web',
      title: 'The building blocks',
      goal: 'Build a static page that reads well and looks right on a phone and a laptop.',
      time: '3–4 weeks',
      build: 'A responsive landing page with a working, accessible contact form.',
      skills: [
        { id: 'fe-html', name: 'HTML', what: 'Structure and meaning: semantic tags, forms, media.', level: 'core', icon: 'html', tool: 'html', notebook: 'html' },
        { id: 'fe-css', name: 'CSS', what: 'Layout with Flexbox and Grid, responsive design, the cascade.', level: 'core', icon: 'css', tool: 'css', notebook: 'css' },
        { id: 'fe-render', name: 'How browsers render', what: 'From HTML and CSS to pixels, and what blocks the first paint.', level: 'core', glyph: Globe, lessons: ['rendering'] },
        { id: 'fe-a11y', name: 'Accessibility', what: 'Keyboard, screen readers, contrast: pages everyone can use.', level: 'core', glyph: Accessibility },
      ],
    },
    {
      id: 'fe-js',
      title: 'JavaScript, properly',
      goal: 'Make a page interactive in plain JavaScript, and predict what your code does before you run it.',
      time: '4–6 weeks',
      build: 'A to-do list in plain JavaScript that saves to localStorage.',
      skills: [
        { id: 'fe-js-core', name: 'JavaScript', what: 'Values vs references, scope and closures: the parts that cause bugs.', level: 'core', icon: 'javascript', tool: 'javascript', lessons: ['values-references', 'closures'], notebook: 'javascript', sheet: 'javascript' },
        { id: 'fe-async', name: 'Async JavaScript', what: 'The event loop, promises and async/await.', level: 'core', glyph: Timer, lessons: ['event-loop', 'promises'] },
        { id: 'fe-dom', name: 'DOM & events', what: 'Find elements, react to clicks and input, update the page.', level: 'core', glyph: MousePointerClick },
        { id: 'fe-modules', name: 'Modules', what: 'import / export, npm packages, and what a bundler does.', level: 'core', glyph: Package, lessons: ['modules'] },
      ],
    },
    {
      id: 'fe-react',
      title: 'React',
      goal: 'Build a multi-screen app from components that loads real data and handles every state.',
      time: '5–6 weeks',
      build: 'A movie search app on a public API, with loading, error and empty states.',
      skills: [
        { id: 'fe-react-core', name: 'React', what: 'Components, props, state, re-rendering, effects and lists.', level: 'core', icon: 'react', tool: 'react', lessons: ['components-props', 'react-rendering', 'use-effect', 'lists-keys', 'context'], notebook: 'react', sheet: 'react' },
        { id: 'fe-routing', name: 'Routing', what: 'Many screens in one page: links, URL params, protected routes.', level: 'core', glyph: Route, lessons: ['routing', 'protected-routes'] },
        { id: 'fe-fetch', name: 'Data fetching', what: 'Talk to your API, show every state honestly, cache what you load.', level: 'core', glyph: CloudDownload, lessons: ['data-fetching', 'api-from-react'] },
        { id: 'fe-vue', name: 'Vue.js', what: 'An alternative to React. Learn it when a job asks for it.', level: 'extra', icon: 'vue', tool: 'vue' },
        { id: 'fe-angular', name: 'Angular', what: 'The full, opinionated framework many large companies use.', level: 'extra', icon: 'angular', tool: 'angular' },
      ],
    },
    {
      id: 'fe-prod',
      title: 'Production-ready UI',
      goal: 'Ship a typed, styled, fast frontend that a team could keep working on.',
      time: '4–5 weeks',
      build: 'Rebuild your movie app in TypeScript with Tailwind, and make it score 90+ on Lighthouse.',
      skills: [
        { id: 'fe-ts', name: 'TypeScript', what: 'Types that catch mistakes before the browser does.', level: 'core', icon: 'typescript', tool: 'typescript', notebook: 'typescript' },
        { id: 'fe-tailwind', name: 'Tailwind CSS', what: 'Utility classes for fast, consistent styling.', level: 'core', icon: 'tailwind', tool: 'tailwind-css' },
        { id: 'fe-build', name: 'Build tools', what: 'Vite, bundling, env variables and production builds.', level: 'core', glyph: Layers, lessons: ['build-tools'] },
        { id: 'fe-perf', name: 'Performance', what: 'Measure first, then memoise, split code and lazy-load.', level: 'core', glyph: Gauge, lessons: ['memo'] },
        { id: 'fe-shadcn', name: 'shadcn/ui', what: 'Ready-made accessible components you copy into your app.', level: 'extra', icon: 'shadcn', tool: 'shadcn' },
        { id: 'fe-mui', name: 'Material UI', what: 'A complete component library, an alternative to shadcn/ui.', level: 'extra', icon: 'mui', tool: 'material-ui' },
      ],
    },
    {
      id: 'fe-next',
      title: 'Full-stack frameworks',
      goal: 'Render on the server for speed and SEO, and deploy a framework app.',
      time: '3–4 weeks',
      build: 'A Next.js blog with server-rendered pages, deployed to a real URL.',
      skills: [
        { id: 'fe-nextjs', name: 'Next.js', what: 'React with routing, server rendering and API routes built in.', level: 'core', icon: 'next', tool: 'nextjs', notebook: 'nextjs' },
        { id: 'fe-nuxt', name: 'NuxtJS', what: 'The same idea for Vue.', level: 'extra', icon: 'nuxt', tool: 'nuxt' },
      ],
    },
  ],

  /* ================================ Backend ================================ */
  backend: [
    {
      id: 'be-base',
      title: 'Server foundations',
      goal: 'Explain what happens between a click and a response, and run JavaScript on a server.',
      time: '2–3 weeks',
      build: 'A tiny Node server that returns JSON, with no framework.',
      skills: [
        { id: 'be-http', name: 'HTTP', what: 'Methods, status codes, headers, cookies and caching.', level: 'core', glyph: ArrowLeftRight, lessons: ['http', 'url-to-page'] },
        { id: 'be-node', name: 'Node.js', what: 'The runtime: the event loop on a server, files, streams, npm.', level: 'core', icon: 'node', tool: 'node', lessons: ['node-runtime'], notebook: 'nodejs', sheet: 'node' },
        { id: 'be-cs', name: 'Data structures & algorithms', what: 'Arrays, maps, trees and Big-O: the interview staple.', level: 'extra', glyph: Binary, notebook: 'dsa' },
      ],
    },
    {
      id: 'be-api',
      title: 'APIs with Express',
      goal: 'Design and build a REST API that validates input, fails clearly and keeps secrets out of the code.',
      time: '4–5 weeks',
      build: 'A REST API for notes, with validation and correct status codes.',
      skills: [
        { id: 'be-express', name: 'Express', what: 'Routing and the middleware pipeline.', level: 'core', icon: 'express', tool: 'express', lessons: ['middleware'], notebook: 'express', sheet: 'express' },
        { id: 'be-rest', name: 'REST API design', what: 'Resources, verbs, status codes and versioning.', level: 'core', glyph: Waypoints, lessons: ['rest-api'], notebook: 'rest-apis' },
        { id: 'be-errors', name: 'Validation & errors', what: 'Never trust input; one place to handle every failure.', level: 'core', glyph: ShieldAlert, lessons: ['validation', 'errors'] },
        { id: 'be-config', name: 'Config & secrets', what: 'Environment variables, .env files and per-environment config.', level: 'core', glyph: KeyRound, lessons: ['config'] },
        { id: 'be-cors', name: 'CORS', what: 'Why the browser blocks your API, and how to allow it safely.', level: 'core', glyph: Globe, lessons: ['cors'] },
      ],
    },
    {
      id: 'be-auth',
      title: 'Auth & security',
      goal: 'Let people sign up and log in, keep their data private, and stop the common attacks.',
      time: '3–4 weeks',
      build: 'Add sign-up, login and per-user data to your notes API.',
      skills: [
        { id: 'be-authn', name: 'Authentication', what: 'Who you are vs what you may do; storing passwords safely.', level: 'core', glyph: Fingerprint, lessons: ['authn-authz', 'hashing'], notebook: 'auth', sheet: 'auth' },
        { id: 'be-tokens', name: 'Sessions & JWT', what: 'Keeping a user logged in, end to end.', level: 'core', glyph: Lock, lessons: ['sessions-tokens', 'jwt-auth'] },
        { id: 'be-attacks', name: 'Web security', what: 'XSS, CSRF and injection, and how each one is stopped.', level: 'core', glyph: ShieldCheck, lessons: ['web-attacks'], notebook: 'web-security' },
        { id: 'be-rate', name: 'Rate limiting', what: 'Protect your API from floods and brute force.', level: 'core', glyph: Gauge, lessons: ['rate-limiting'] },
      ],
    },
    {
      id: 'be-more',
      title: 'Beyond request–response',
      goal: 'Push updates live, accept files, and hand slow work to the background.',
      time: '3–4 weeks',
      build: 'A chat room with live messages and image upload.',
      skills: [
        { id: 'be-ws', name: 'WebSockets', what: 'Real-time, two-way messages between browser and server.', level: 'core', glyph: Radio, lessons: ['websockets'] },
        { id: 'be-uploads', name: 'File uploads', what: 'Multipart forms, size limits and object storage.', level: 'core', glyph: Upload, lessons: ['uploads'] },
        { id: 'be-queues', name: 'Message queues', what: 'RabbitMQ or Kafka: do slow work outside the request.', level: 'extra', icon: 'rabbitmq', tool: 'rabbitmq' },
        { id: 'be-n8n', name: 'Automation with n8n', what: 'Connect APIs and services into workflows without much code.', level: 'extra', glyph: Workflow, notebook: 'n8n' },
      ],
    },
    {
      id: 'be-arch',
      title: 'Architecture & a second language',
      goal: 'Structure a growing backend, and talk through the design of a system at scale.',
      time: 'ongoing',
      build: 'Sketch the design of a URL shortener for a million users, then build the core of it.',
      skills: [
        { id: 'be-sysdesign', name: 'System design', what: 'Load balancers, caches, queues and trade-offs at scale.', level: 'core', glyph: Network, notebook: 'system-design' },
        { id: 'be-engineering', name: 'Backend engineering', what: 'Layers, services and the habits of maintainable backends.', level: 'core', glyph: Layers, notebook: 'backend-engineering' },
        { id: 'be-nest', name: 'NestJS', what: 'Structured, typed Node backends, Angular-style.', level: 'extra', icon: 'nest', tool: 'nestjs' },
        { id: 'be-python', name: 'Python + Django', what: 'The most common second backend stack.', level: 'extra', icon: 'django', tool: 'django' },
        { id: 'be-go', name: 'Go', what: 'Fast, simple services; popular for infrastructure.', level: 'extra', icon: 'go', tool: 'go' },
      ],
    },
  ],

  /* ================================ Database ================================ */
  database: [
    {
      id: 'db-base',
      title: 'How data is stored',
      goal: 'Model a real domain as tables and answer questions about it in SQL.',
      time: '3–4 weeks',
      build: 'Design tables for a library (books, members, loans) and write ten queries against them.',
      skills: [
        { id: 'db-dbms', name: 'DBMS concepts', what: 'Data models, keys, ER diagrams and normalisation.', level: 'core', glyph: Database, notebook: 'dbms' },
        { id: 'db-sql', name: 'SQL', what: 'SELECT, JOINs, GROUP BY and subqueries.', level: 'core', icon: 'postgres', tool: 'postgresql' },
        { id: 'db-mysql', name: 'MySQL', what: 'The other popular relational database.', level: 'extra', icon: 'mysql', tool: 'mysql' },
      ],
    },
    {
      id: 'db-mongo',
      title: 'MongoDB',
      goal: 'Store, query and model data as documents, with schemas in your Node app.',
      time: '3–4 weeks',
      build: 'Store and query a blog: posts, authors and comments.',
      skills: [
        { id: 'db-mongodb', name: 'MongoDB', what: 'Documents, collections, CRUD and query operators.', level: 'core', icon: 'mongodb', tool: 'mongodb', lessons: ['documents', 'crud'], notebook: 'mongodb', sheet: 'mongodb' },
        { id: 'db-mongoose', name: 'Mongoose', what: 'Schemas, models and validation from Node.', level: 'core', glyph: Shapes, lessons: ['mongoose'] },
        { id: 'db-model', name: 'Data modelling', what: 'Embed or reference? Shape documents for the way you read them.', level: 'core', glyph: Waypoints, lessons: ['embed-reference'] },
      ],
    },
    {
      id: 'db-fast',
      title: 'Fast and correct',
      goal: 'Keep queries fast as data grows, and keep data consistent when writes go wrong.',
      time: '3 weeks',
      build: 'A dashboard query over 100k orders that answers in under 50 ms.',
      skills: [
        { id: 'db-indexes', name: 'Indexes', what: 'Why a query is slow and the index that fixes it.', level: 'core', glyph: Zap, lessons: ['indexes'] },
        { id: 'db-aggregation', name: 'Aggregation', what: 'Group, join and reshape data inside the database.', level: 'core', glyph: Filter, lessons: ['aggregation'] },
        { id: 'db-tx', name: 'Transactions', what: 'All-or-nothing writes across documents.', level: 'core', glyph: ArrowLeftRight, lessons: ['transactions'] },
        { id: 'db-paging', name: 'Pagination', what: 'Offset vs cursor paging for long lists.', level: 'core', glyph: ListOrdered, lessons: ['pagination'] },
      ],
    },
    {
      id: 'db-scale',
      title: 'Caching & scale',
      goal: 'Take load off the database, and know which kind of database fits which job.',
      time: '3–4 weeks',
      build: 'Cache your slowest endpoint in Redis and measure the speed-up.',
      skills: [
        { id: 'db-redis', name: 'Redis', what: 'In-memory cache, sessions and counters.', level: 'core', icon: 'redis', tool: 'redis', lessons: ['caching'], notebook: 'redis' },
        { id: 'db-elastic', name: 'Elasticsearch', what: 'Full-text search and analytics.', level: 'extra', icon: 'elasticsearch', tool: 'elasticsearch' },
        { id: 'db-kafka', name: 'Kafka', what: 'Event streams between services.', level: 'extra', icon: 'kafka', tool: 'kafka' },
        { id: 'db-cassandra', name: 'Cassandra', what: 'Wide-column storage for huge write loads.', level: 'extra', icon: 'cassandra', tool: 'cassandra' },
        { id: 'db-neo4j', name: 'Neo4j', what: 'Graph data: friends of friends, recommendations.', level: 'extra', icon: 'neo4j', tool: 'neo4j' },
      ],
    },
  ],

  /* ================================ DevOps ================================ */
  devops: [
    {
      id: 'do-base',
      title: 'Work like a developer',
      goal: 'Use the terminal comfortably, version every change, and understand the network your app runs on.',
      time: '3 weeks',
      build: 'Put your projects on GitHub with a clean branch-and-pull-request history.',
      skills: [
        { id: 'do-git', name: 'Git', what: 'Snapshots, branches, merges and pull requests.', level: 'core', glyph: GitBranch, lessons: ['git'], notebook: 'git', sheet: 'git' },
        { id: 'do-linux', name: 'Linux & the terminal', what: 'Files, permissions, processes and SSH.', level: 'core', glyph: Terminal, notebook: 'linux' },
        { id: 'do-net', name: 'Networking', what: 'IP, DNS, ports, TCP and TLS.', level: 'core', glyph: Network, notebook: 'networks' },
        { id: 'do-os', name: 'Operating systems', what: 'Processes, threads, memory and scheduling.', level: 'extra', glyph: Cpu, notebook: 'os' },
      ],
    },
    {
      id: 'do-ci',
      title: 'Test & automate',
      goal: 'Catch bugs before users do, and have a machine check every push.',
      time: '2–3 weeks',
      build: 'A pipeline that runs your tests on every push and blocks a failing merge.',
      skills: [
        { id: 'do-testing', name: 'Testing', what: 'Unit, integration and end-to-end: the testing pyramid.', level: 'core', glyph: FlaskConical, lessons: ['testing'], notebook: 'testing' },
        { id: 'do-cicd', name: 'CI/CD', what: 'Pipelines that build, test and deploy on every change.', level: 'core', glyph: Workflow, lessons: ['cicd'], notebook: 'cicd' },
        { id: 'do-gha', name: 'GitHub Actions', what: 'The CI most projects start with.', level: 'core', icon: 'ghactions', tool: 'github-actions' },
        { id: 'do-jenkins', name: 'Jenkins', what: 'The self-hosted CI server many companies still run.', level: 'extra', icon: 'jenkins', tool: 'jenkins' },
      ],
    },
    {
      id: 'do-ship',
      title: 'Ship it',
      goal: 'Put a full-stack app on the internet, on your own domain, over HTTPS.',
      time: '3–4 weeks',
      build: 'Deploy your MERN app behind Nginx with HTTPS.',
      skills: [
        { id: 'do-deploy', name: 'Deploying', what: 'Build, environment config and hosting a MERN app.', level: 'core', glyph: Rocket, lessons: ['deploying'] },
        { id: 'do-nginx', name: 'Nginx', what: 'Reverse proxy, static files and TLS.', level: 'core', icon: 'nginx', tool: 'nginx' },
        { id: 'do-aws', name: 'AWS', what: 'EC2, S3, IAM and the core cloud services.', level: 'core', icon: 'aws', tool: 'aws', notebook: 'aws' },
        { id: 'do-azure', name: 'Azure', what: 'The same ideas on Microsoft’s cloud.', level: 'extra', icon: 'azure', tool: 'azure' },
        { id: 'do-gcp', name: 'Google Cloud', what: 'The same ideas on Google’s cloud.', level: 'extra', icon: 'gcloud', tool: 'google-cloud' },
      ],
    },
    {
      id: 'do-containers',
      title: 'Containers',
      goal: 'Run the same app the same way on any machine, and describe infrastructure as code.',
      time: '3–4 weeks',
      build: 'Run the whole stack with one docker compose up.',
      skills: [
        { id: 'do-docker', name: 'Docker', what: 'Images, containers, volumes and Compose.', level: 'core', icon: 'docker', tool: 'docker', lessons: ['containers'], notebook: 'docker' },
        { id: 'do-k8s', name: 'Kubernetes', what: 'Run and scale containers across many machines.', level: 'extra', icon: 'kubernetes', tool: 'kubernetes', notebook: 'kubernetes' },
        { id: 'do-terraform', name: 'Terraform', what: 'Cloud infrastructure written as code.', level: 'extra', icon: 'terraform', tool: 'terraform' },
      ],
    },
    {
      id: 'do-run',
      title: 'Keep it running',
      goal: 'Know when your app breaks before your users tell you, and find out why.',
      time: '2 weeks',
      build: 'A dashboard and an alert that fires when the error rate spikes.',
      skills: [
        { id: 'do-observe', name: 'Logging & monitoring', what: 'Structured logs, metrics, traces and alerts.', level: 'core', glyph: Activity, lessons: ['observability'] },
        { id: 'do-prometheus', name: 'Prometheus', what: 'Collect and query metrics.', level: 'extra', icon: 'prometheus', tool: 'prometheus' },
        { id: 'do-grafana', name: 'Grafana', what: 'Dashboards and alerts on top of your metrics.', level: 'extra', icon: 'grafana', tool: 'grafana' },
        { id: 'do-elk', name: 'ELK Stack', what: 'Search and visualise logs from every server.', level: 'extra', icon: 'elk', tool: 'elk' },
      ],
    },
  ],

  /* ================================ AI/ML ================================ */
  aiml: [
    {
      id: 'ai-base',
      title: 'Foundations',
      goal: 'Load, clean and explore a dataset in Python, and read the maths behind a model.',
      time: '4–6 weeks',
      build: 'Clean and chart a real public dataset in a notebook, and write up three findings.',
      skills: [
        { id: 'ai-python', name: 'Python', what: 'The language of data and ML.', level: 'core', icon: 'python', tool: 'python' },
        { id: 'ai-math', name: 'Maths for ML', what: 'Vectors, matrices, probability and basic statistics.', level: 'core', glyph: Sigma },
        { id: 'ai-numpy', name: 'NumPy', what: 'Fast arrays and vectorised maths.', level: 'core', icon: 'numpy' },
        { id: 'ai-pandas', name: 'pandas', what: 'Load, clean, join and summarise tables of data.', level: 'core', icon: 'pandas' },
        { id: 'ai-jupyter', name: 'Jupyter', what: 'Notebooks for exploring data step by step.', level: 'extra', icon: 'jupyter' },
      ],
    },
    {
      id: 'ai-ml',
      title: 'Machine learning',
      goal: 'Train a model on data, measure it honestly, and explain what it gets wrong.',
      time: '5–6 weeks',
      build: 'Predict house prices, then explain your error and what would reduce it.',
      skills: [
        { id: 'ai-concepts', name: 'How models learn', what: 'Supervised vs unsupervised, features, loss and training.', level: 'core', glyph: Brain, notebook: 'ai-fundamentals' },
        { id: 'ai-sklearn', name: 'scikit-learn', what: 'Regression, classification and clustering in a few lines.', level: 'core', icon: 'sklearn' },
        { id: 'ai-eval', name: 'Evaluating models', what: 'Train/test splits, overfitting, precision and recall.', level: 'core', glyph: Target },
      ],
    },
    {
      id: 'ai-dl',
      title: 'Deep learning',
      goal: 'Build and train a neural network, and reuse pre-trained models instead of starting from zero.',
      time: '6–8 weeks',
      build: 'Fine-tune a small pre-trained image or text classifier on your own data.',
      skills: [
        { id: 'ai-nn', name: 'Neural networks', what: 'Layers, activations, backpropagation and gradient descent.', level: 'core', glyph: Network },
        { id: 'ai-pytorch', name: 'PyTorch', what: 'The framework most research and new models use.', level: 'core', icon: 'pytorch' },
        { id: 'ai-hf', name: 'Hugging Face', what: 'Download, run and fine-tune pre-trained models.', level: 'core', icon: 'huggingface' },
        { id: 'ai-tf', name: 'TensorFlow', what: 'An alternative to PyTorch, common in production.', level: 'extra', icon: 'tensorflow' },
      ],
    },
    {
      id: 'ai-llm',
      title: 'AI in your app',
      goal: 'Add an LLM feature to a real app: prompts, your own data, and tools the model can call.',
      time: '4–5 weeks',
      build: 'A “chat with your docs” app using embeddings and retrieval (RAG).',
      skills: [
        { id: 'ai-llm-api', name: 'LLM APIs', what: 'Call a model from your backend: messages, streaming, tokens.', level: 'core', glyph: MessageSquareText, notebook: 'ai-fundamentals' },
        { id: 'ai-prompting', name: 'Prompt engineering', what: 'Clear instructions, examples and structured output.', level: 'core', glyph: FileSearch },
        { id: 'ai-embeddings', name: 'Embeddings & vector search', what: 'Turn text into vectors and find what is similar.', level: 'core', glyph: Shapes },
        { id: 'ai-rag', name: 'RAG', what: 'Ground answers in your own documents.', level: 'core', glyph: Database },
        { id: 'ai-agents', name: 'Agents & tool use', what: 'Let a model call your functions and APIs.', level: 'extra', glyph: Bot },
        { id: 'ai-vibe', name: 'Coding with AI', what: 'Use AI assistants well without losing control of your code.', level: 'extra', glyph: Cpu, notebook: 'vibe-coding' },
      ],
    },
    {
      id: 'ai-ship',
      title: 'Shipping AI',
      goal: 'Know whether your AI feature works, what it costs, and how it fails.',
      time: 'ongoing',
      build: 'An evaluation set of 50 questions for your RAG app, run on every change.',
      skills: [
        { id: 'ai-evals', name: 'Evals', what: 'Test sets and scoring for model output.', level: 'core', glyph: FlaskConical },
        { id: 'ai-safety', name: 'Cost, latency & safety', what: 'Caching, smaller models, guardrails and prompt injection.', level: 'core', glyph: Scale },
        { id: 'ai-mlops', name: 'MLOps', what: 'Versioning data and models, deploying and monitoring them.', level: 'extra', glyph: Workflow },
      ],
    },
  ],
};

export const getPlan = (id: PillarId): PlanStage[] | undefined => (PLANS as Partial<Record<PillarId, PlanStage[]>>)[id];
