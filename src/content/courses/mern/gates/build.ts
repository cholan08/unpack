import type { PartGate } from '@/engine/types';

export default {
  partId: 'build',
  passMark: 0.7,
  questions: [
    {
      id: 'build-q1',
      kind: 'mcq',
      q: 'In full-stack MERN architecture, why should the database model avoid storing derived values that can be computed easily at query or render time?',
      options: [
        'MongoDB disallows storing numbers',
        'Storing derived data creates synchronization bugs where the source and derived values fall out of sync on updates',
        'Because derived values cannot be indexed',
        'Because JSON does not support calculations',
      ],
      answer: 1,
      explain: 'Single source of truth prevents inconsistency. Store canonical data, and compute totals or display formatting as needed.',
      teachAt: { lessonId: 'design-todo', step: 2 },
    },
    {
      id: 'build-q2',
      kind: 'mcq',
      q: 'What is Optimistic UI in React applications?',
      options: [
        'Assuming all network requests will always succeed forever',
        'Immediately updating client-side UI assuming server success, then rolling back only if the server returns an error',
        'A design system color palette',
        'A browser flag that ignores HTTP 500 errors',
      ],
      answer: 1,
      explain: 'Optimistic UI makes apps feel instant by updating the screen immediately on user action before network round-trips complete.',
      teachAt: { lessonId: 'design-todo', step: 5 },
    },
    {
      id: 'build-q3',
      kind: 'mcq',
      q: 'Why should payment webhooks (e.g. Stripe checkout.session.completed) verify cryptographic webhook signatures?',
      options: [
        'To compress JSON request payloads',
        'To prove the webhook request genuinely originated from the payment provider and was not forged by an attacker',
        'Because Express requires all bodies to be signed',
        'To bypass HTTPS certificates',
      ],
      answer: 1,
      explain: 'Webhook endpoints are public; signature verification guarantees the event actually came from the provider and wasn’t tampered with.',
      teachAt: { lessonId: 'design-cart', step: 5 },
    },
  ],
  challenge: {
    id: 'build-challenge',
    prompt: 'Implement a slugify(title) function that converts a post title into a URL-friendly slug (lowercase, alphanumeric + single hyphens, no leading/trailing hyphens).',
    starter: `function slugify(title) {\n  // Turn "Hello, World! 2026" into "hello-world-2026"\n}`,
    language: 'js',
    solution: `function slugify(title) {\n  return title\n    .toLowerCase()\n    .replace(/[^a-z0-9]+/g, '-')\n    .replace(/^-+|-+$/g, '');\n}`,
    tests: [
      { label: 'converts title into slug', run: 'slugify("Hello, World! 2026") === "hello-world-2026"' },
      { label: 'handles multiple spaces and special characters', run: 'slugify("  React & Node.js Guide...  ") === "react-node-js-guide"' },
    ],
    hints: [
      'Use .toLowerCase() first.',
      'Replace all non-alphanumeric character sequences with "-" using regex /[^a-z0-9]+/g.',
      'Trim hyphens from start and end with /^-+|-+$/g.',
    ],
  },
} satisfies PartGate;
