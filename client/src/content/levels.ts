/**
 * Levels as identity (docs/VISION.md §5): who the learner is becoming, said as what they can now
 * do — never as a percentage. Each level is earned with proof: a live link, or the chapters of a
 * Path stage finished (or tested out by passing their gate), or a problem brief shipped.
 *
 * A level's chapters come from its Path stage, so the requirement grows with the Manual. A level
 * once earned is kept (progress remembers it), so new chapters never take one away.
 */
export type LevelNeed =
  /** Every chapter of a Path stage that has something to finish (lessons or a gate). */
  | { kind: 'stage'; stage: string; except?: string[] }
  /** A live link saved for a chapter's build (`ships` in progress). */
  | { kind: 'ship'; id: string; label: string; href: string }
  /** A problem brief at this level of support, shipped. */
  | { kind: 'brief'; support: 'guided' | 'semi-guided' | 'spec' | 'open'; label: string };

export interface Level {
  n: number;
  name: string;
  /** "You can now …" — the identity, in the learner's terms. */
  canNow: string;
  /** What proves it, in one line. */
  proof: string;
  needs: LevelNeed[];
}

export const LEVELS: Level[] = [
  {
    n: 0,
    name: 'Curious',
    canNow: 'You want to know how the apps you use every day actually work.',
    proof: 'Where everyone starts.',
    needs: [],
  },
  {
    n: 1,
    name: 'First ship',
    canNow: 'You can put a page you made on the internet, with AI as your pair.',
    proof: 'A live link.',
    needs: [{ kind: 'ship', id: 'first-ship', label: 'Put your first page online', href: '/manual/first-ship' }],
  },
  {
    n: 2,
    name: 'Maker',
    canNow: 'You can build a small app that remembers things and knows who its users are.',
    proof: 'The chapters of “Make a small app”, finished or tested out.',
    needs: [{ kind: 'stage', stage: 'maker' }],
  },
  {
    n: 3,
    name: 'Builder',
    canNow: 'You can combine the building blocks into a whole product, and put it online.',
    proof: 'The chapters of “Build and ship a whole product”, and TaskFlow live.',
    needs: [
      { kind: 'stage', stage: 'builder', except: ['taskflow'] },
      { kind: 'ship', id: 'taskflow', label: 'Put your TaskFlow online', href: '/capstone/m10' },
    ],
  },
  {
    n: 4,
    name: 'Product builder',
    canNow: 'You can add files, live updates, search and AI to a product — and keep it fast and running.',
    proof: 'The chapters of “Add product powers”, and a semi-guided brief shipped.',
    needs: [
      { kind: 'stage', stage: 'product' },
      { kind: 'brief', support: 'semi-guided', label: 'Ship a semi-guided problem brief' },
    ],
  },
  {
    n: 5,
    name: 'Independent builder',
    canNow: 'You can take a vague problem from a real person and ship what solves it — on your own.',
    proof: 'An open brief: discovered, scoped, built, shipped and defended by you.',
    needs: [{ kind: 'brief', support: 'open', label: 'Ship an open problem brief' }],
  },
];
