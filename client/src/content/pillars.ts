/**
 * The site's structure: everything belongs to one of the main topics (pillars) — Frontend,
 * Backend, Database, DevOps and AI/ML — plus the way in (Start Here) and the way out (Projects).
 * Adding a topic here adds its page (/<id>), its sidebar entry and its card everywhere.
 * Lessons get their pillar in course.ts — on the part, or per lesson when a part mixes topics.
 */
import type { PillarId, Tone } from '@/engine/types';

export interface Pillar {
  id: PillarId;
  label: string;
  /** The diagrams' “where it runs” colour, so a topic looks the same everywhere. */
  tone: Tone;
  /** One line: what lives in this topic. */
  blurb: string;
  /** One of the main topics. `start` and `projects` are the way in and the way out. */
  main: boolean;
}

// A Record, so leaving a pillar out (or adding an unknown one) is a compile error. Order = reading order.
const DEFS: Record<PillarId, Omit<Pillar, 'id'>> = {
  start: {
    label: 'Start Here',
    tone: 'neutral',
    main: false,
    blurb: 'The map of the whole stack, and how one page load travels across it.',
  },
  frontend: {
    label: 'Frontend',
    tone: 'client',
    main: true,
    blurb: 'Everything that runs on the user’s device: JavaScript, the browser and React.',
  },
  backend: {
    label: 'Backend',
    tone: 'server',
    main: true,
    blurb: 'Everything that runs on your server: Node, Express, APIs, auth and security.',
  },
  database: {
    label: 'Database',
    tone: 'data',
    main: true,
    blurb: 'Where the data lives: documents, queries, modelling, indexes, and keeping it fast.',
  },
  devops: {
    label: 'DevOps',
    tone: 'net',
    main: true,
    blurb: 'Getting code to users and keeping it running: Git, tests, deploys, containers, monitoring.',
  },
  aiml: {
    label: 'AI/ML',
    tone: 'ai',
    main: true,
    blurb: 'How machines learn from data, and how to build AI into your app: models, LLM APIs, embeddings and vector search.',
  },
  projects: {
    label: 'Projects',
    tone: 'warn',
    main: false,
    blurb: 'Whole features built across the stack, end to end.',
  },
};

export const PILLARS: Pillar[] = (Object.keys(DEFS) as PillarId[]).map((id) => ({ id, ...DEFS[id] }));

/** Frontend, Backend, Database, DevOps. */
export const MAIN_PILLARS = PILLARS.filter((p) => p.main);

export const getPillar = (id: string | undefined) => PILLARS.find((p) => p.id === id);
